<?php

namespace App\Card\Import;

use App\Card\Card;
use App\Card\CardType;
use App\Card\RarityCalculator;
use App\Cinema\Movie\Movie;
use App\Cinema\Person\Person;
use App\Cinema\Series\Series;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(name: 'app:cards:generate', description: 'Génère les cartes (avec rareté) pour toutes les entités cinéma existantes')]
class GenerateCardsCommand extends Command
{
    public function __construct(
        private EntityManagerInterface $em,
        private RarityCalculator $rarityCalculator,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $this->em->getConnection()->getConfiguration()->setMiddlewares([]);
        $this->generateForMovies($output);
        $this->generateForSeries($output);
        $this->generateForPeople($output);

        return Command::SUCCESS;
    }

    private function generateForMovies(OutputInterface $output): void
    {
        $repo = $this->em->getRepository(Movie::class);
        $cardRepo = $this->em->getRepository(Card::class);
        $ids = array_map(fn($m) => $m->getId(), $repo->findAll());
        $count = 0;

        foreach ($ids as $movieId) {
            $movie = $repo->find($movieId);
            if (!$movie) continue;

            $card = $cardRepo->findOneBy(['type' => CardType::MOVIE, 'entityId' => $movie->getId()]) ?? new Card();
            $card->setType(CardType::MOVIE);
            $card->setEntityId($movie->getId());
            $card->setRarity($this->rarityCalculator->calculateForTitle($movie->getPopularity() ?? 0, $movie->getVoteCount()));
            $this->em->persist($card);
            $count++;
        }

        $this->em->flush();
        $this->em->clear();
        $output->writeln("$count cartes Movie générées.");
    }

    private function generateForSeries(OutputInterface $output): void
    {
        $repo = $this->em->getRepository(Series::class);
        $cardRepo = $this->em->getRepository(Card::class);
        $ids = array_map(fn($s) => $s->getId(), $repo->findAll());
        $count = 0;

        foreach ($ids as $seriesId) {
            $series = $repo->find($seriesId);
            if (!$series) continue;

            $card = $cardRepo->findOneBy(['type' => CardType::SERIES, 'entityId' => $series->getId()]) ?? new Card();
            $card->setType(CardType::SERIES);
            $card->setEntityId($series->getId());
            $card->setRarity($this->rarityCalculator->calculateForTitle($series->getPopularity() ?? 0, $series->getVoteCount()));
            $this->em->persist($card);
            $count++;
        }

        $this->em->flush();
        $this->em->clear();
        $output->writeln("$count cartes Series générées.");
    }

    private function generateForPeople(OutputInterface $output): void
    {
        $repo = $this->em->getRepository(Person::class);
        $cardRepo = $this->em->getRepository(Card::class);
        $ids = array_map(fn($p) => $p->getId(), $repo->findAll());
        $count = 0;

        foreach ($ids as $personId) {
            $person = $repo->find($personId);
            if (!$person) continue;

            $card = $cardRepo->findOneBy(['type' => CardType::PERSON, 'entityId' => $person->getId()]) ?? new Card();
            $card->setType(CardType::PERSON);
            $card->setEntityId($person->getId());
            $card->setRarity($this->rarityCalculator->calculateForPerson($person->getPopularity() ?? 0));
            $this->em->persist($card);
            $count++;
        }

        $this->em->flush();
        $this->em->clear();
        $output->writeln("$count cartes Person générées.");
    }
}
