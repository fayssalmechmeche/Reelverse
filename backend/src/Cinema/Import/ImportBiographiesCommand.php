<?php

namespace App\Cinema\Import;

use App\Cinema\Person\Person;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

#[AsCommand(
    name: 'app:import:biographies',
    description: 'Importe les biographies des acteurs depuis TMDB (reprenable, les plus populaires d\'abord)',
)]
class ImportBiographiesCommand extends Command
{
    private const BATCH_SIZE = 50;

    private ?string $lastError = null;

    public function __construct(
        private HttpClientInterface $tmdbClient,
        private EntityManagerInterface $em,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('limit', 'l', InputOption::VALUE_REQUIRED, 'Nombre maximum d\'acteurs à traiter (par défaut : tous ceux sans biographie récupérée)');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $this->em->getConnection()->getConfiguration()->setMiddlewares([]);

        $limit = $input->getOption('limit') !== null ? (int) $input->getOption('limit') : null;
        $processed = 0;
        $withBio = 0;

        while ($limit === null || $processed < $limit) {
            $batchSize = $limit === null ? self::BATCH_SIZE : min(self::BATCH_SIZE, $limit - $processed);

            /** @var Person[] $persons */
            $persons = $this->em->createQueryBuilder()
                ->select('p')
                ->from(Person::class, 'p')
                ->where('p.biographyFetchedAt IS NULL')
                ->orderBy('p.popularity', 'DESC')
                ->setMaxResults($batchSize)
                ->getQuery()
                ->getResult();

            if (!$persons) {
                break;
            }

            $batchDone = 0;

            foreach ($persons as $person) {
                $bio = $this->fetchBiography($person->getTmdbId());

                // Une erreur réseau (null) n'est pas marquée comme "récupérée" : elle sera retentée au prochain lancement.
                if ($bio === false) {
                    continue;
                }

                $person->setBiography($bio !== '' ? $bio : null);
                $person->setBiographyFetchedAt(new \DateTimeImmutable());

                if ($bio !== '') {
                    $withBio++;
                }
                $processed++;
                $batchDone++;

                usleep(30000); // ~30 req/s, sous la limite TMDB
            }

            $this->em->flush();
            $this->em->clear();

            $output->writeln("$processed acteurs traités ($withBio avec biographie).");

            // Si tout le lot a échoué (réseau), on s'arrête pour éviter une boucle infinie.
            if ($batchDone === 0) {
                $output->writeln('<error>Aucune biographie récupérée, arrêt.</error>');
                $output->writeln('<error>Dernière erreur : ' . ($this->lastError ?? 'inconnue') . '</error>');
                return Command::FAILURE;
            }
        }

        $output->writeln("Terminé : $processed acteurs traités, $withBio avec biographie.");

        return Command::SUCCESS;
    }

    /** @return string|false texte (vide si aucune biographie), ou false en cas d'erreur à retenter */
    private function fetchBiography(int $tmdbId): string|false
    {
        try {
            $fr = trim((string) ($this->tmdbClient->request('GET', "person/$tmdbId", [
                'query' => ['language' => 'fr-FR'],
            ])->toArray()['biography'] ?? ''));

            if ($fr !== '') {
                return $fr;
            }

            // Repli en anglais quand la biographie française n'existe pas.
            return trim((string) ($this->tmdbClient->request('GET', "person/$tmdbId", [
                'query' => ['language' => 'en-US'],
            ])->toArray()['biography'] ?? ''));
        } catch (\Throwable $e) {
            // 404 : la personne n'existe plus côté TMDB, on la marque comme traitée.
            if (
                $e instanceof \Symfony\Contracts\HttpClient\Exception\ClientExceptionInterface
                && $e->getResponse()->getStatusCode() === 404
            ) {
                return '';
            }

            $this->lastError = get_class($e) . ' : ' . $e->getMessage();

            return false;
        }
    }
}
