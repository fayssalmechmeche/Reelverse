<?php

namespace App\Card\Import;

use App\Card\Card;
use App\Card\CardType;
use App\Card\Rarity;
use App\Card\RarityCalculator;
use App\Cinema\Character\Character;
use App\Cinema\Movie\Movie;
use App\Cinema\Person\Person;
use App\Cinema\Series\Series;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(
    name: 'app:cards:generate',
    description: 'Génère les cartes manquantes (films, séries, acteurs, personnages) avec leur rareté'
)]
class GenerateCardsCommand extends Command
{
    private const BATCH_SIZE = 500;

    public function __construct(
        private EntityManagerInterface $em,
        private RarityCalculator $rarityCalculator,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('refresh-rarity', null, InputOption::VALUE_NONE, 'Recalcule aussi la rareté des cartes déjà existantes')
            ->addOption('no-characters', null, InputOption::VALUE_NONE, 'Ne génère pas les cartes personnage');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $this->em->getConnection()->getConfiguration()->setMiddlewares([]);

        $refresh = (bool) $input->getOption('refresh-rarity');

        $this->process(CardType::MOVIE, $this->movieRows(), $refresh, $output);
        $this->process(CardType::SERIES, $this->seriesRows(), $refresh, $output);
        $this->process(CardType::PERSON, $this->personRows(), $refresh, $output);

        if (!$input->getOption('no-characters')) {
            $this->process(CardType::CHARACTER, $this->characterRows(), $refresh, $output);
        }

        $this->printSummary($output);

        return Command::SUCCESS;
    }

    /** @return iterable<int, Rarity> entityId => rareté */
    private function movieRows(): iterable
    {
        $rows = $this->em->createQuery(sprintf('SELECT m.id, m.popularity FROM %s m', Movie::class))->toIterable();
        foreach ($rows as $row) {
            yield (int) $row['id'] => $this->rarityCalculator->calculateForMovie((float) ($row['popularity'] ?? 0));
        }
    }

    /** @return iterable<int, Rarity> */
    private function seriesRows(): iterable
    {
        $rows = $this->em->createQuery(sprintf('SELECT s.id, s.popularity FROM %s s', Series::class))->toIterable();
        foreach ($rows as $row) {
            yield (int) $row['id'] => $this->rarityCalculator->calculateForSeries((float) ($row['popularity'] ?? 0));
        }
    }

    /** @return iterable<int, Rarity> */
    private function personRows(): iterable
    {
        $rows = $this->em->createQuery(sprintf('SELECT p.id, p.popularity FROM %s p', Person::class))->toIterable();
        foreach ($rows as $row) {
            yield (int) $row['id'] => $this->rarityCalculator->calculateForPerson((float) ($row['popularity'] ?? 0));
        }
    }

    /**
     * La rareté d'un personnage suit la popularité de son acteur.
     *
     * @return iterable<int, Rarity>
     */
    private function characterRows(): iterable
    {
        $rows = $this->em->createQuery(sprintf(
            'SELECT ch.id, a.popularity FROM %s ch JOIN ch.actor a',
            Character::class
        ))->toIterable();
        foreach ($rows as $row) {
            yield (int) $row['id'] => $this->rarityCalculator->calculateForPerson((float) ($row['popularity'] ?? 0));
        }
    }

    /** @param iterable<int, Rarity> $rows */
    private function process(CardType $type, iterable $rows, bool $refresh, OutputInterface $output): void
    {
        // Rareté actuelle de toutes les cartes de ce type, en une seule requête (entityId => rareté).
        $existing = [];
        $existingRows = $this->em->createQuery('SELECT c.entityId, c.rarity FROM ' . Card::class . ' c WHERE c.type = :type')
            ->setParameter('type', $type->value)
            ->toIterable();
        foreach ($existingRows as $row) {
            $existing[(int) $row['entityId']] = $row['rarity'] instanceof Rarity ? $row['rarity'] : Rarity::from($row['rarity']);
        }

        $created = 0;
        $toRefresh = []; // rareté => [entityId, ...]
        $pending = 0;

        foreach ($rows as $entityId => $rarity) {
            if (!isset($existing[$entityId])) {
                $card = new Card();
                $card->setType($type);
                $card->setEntityId($entityId);
                $card->setRarity($rarity);
                $this->em->persist($card);
                $created++;
                $pending++;

                if ($pending >= self::BATCH_SIZE) {
                    $this->em->flush();
                    $this->em->clear();
                    $pending = 0;
                }
            } elseif ($refresh && $existing[$entityId] !== $rarity) {
                $toRefresh[$rarity->value][] = $entityId;
            }
        }

        $this->em->flush();
        $this->em->clear();

        $updated = 0;
        foreach ($toRefresh as $rarityValue => $ids) {
            foreach (array_chunk($ids, 1000) as $chunk) {
                $this->em->createQuery('UPDATE ' . Card::class . ' c SET c.rarity = :rarity WHERE c.type = :type AND c.entityId IN (:ids)')
                    ->setParameter('rarity', $rarityValue)
                    ->setParameter('type', $type->value)
                    ->setParameter('ids', $chunk)
                    ->execute();
                $updated += count($chunk);
            }
        }

        $output->writeln(sprintf('%s : %d cartes créées, %d raretés mises à jour.', $type->value, $created, $updated));
    }

    private function printSummary(OutputInterface $output): void
    {
        $rows = $this->em->getConnection()->fetchAllAssociative(
            'SELECT type, rarity, COUNT(*) AS total FROM card GROUP BY type, rarity ORDER BY type, rarity'
        );

        $output->writeln('');
        $output->writeln('Répartition actuelle (type / rareté / total) :');
        foreach ($rows as $row) {
            $output->writeln(sprintf('  %-10s %-10s %d', $row['type'], $row['rarity'], $row['total']));
        }
    }
}
