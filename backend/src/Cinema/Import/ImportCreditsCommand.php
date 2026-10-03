<?php

namespace App\Cinema\Import;

use App\Cinema\Character\Character;
use App\Cinema\Movie\Movie;
use App\Cinema\Person\Person;
use App\Cinema\Series\Series;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

#[AsCommand(name: 'app:import:credits', description: 'Importe les crédits (acteurs + personnages) des films et séries déjà en base')]
class ImportCreditsCommand extends Command
{
    private const MAX_CAST_PER_TITLE = 15;

    public function __construct(
        private HttpClientInterface $tmdbClient,
        private EntityManagerInterface $em,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $this->em->getConnection()->getConfiguration()->setMiddlewares([]);

        $this->importFor(Movie::class, 'movie', $output);
        $this->importFor(Series::class, 'tv', $output);

        return Command::SUCCESS;
    }

    private function importFor(string $entityClass, string $tmdbEndpoint, OutputInterface $output): void
    {
        $titleRepo = $this->em->getRepository($entityClass);
        $personRepo = $this->em->getRepository(Person::class);
        $characterRepo = $this->em->getRepository(Character::class);

        $titleIds = array_map(
            fn($title) => $title->getId(),
            $titleRepo->findAll()
        );

        $relationField = $entityClass === Movie::class ? 'movie' : 'series';

        foreach ($titleIds as $titleId) {
            $title = $titleRepo->find($titleId);

            if (!$title) {
                continue;
            }

            $response = $this->tmdbClient->request('GET', "$tmdbEndpoint/{$title->getTmdbId()}/credits");
            $data = $response->toArray();

            $cast = array_slice($data['cast'] ?? [], 0, self::MAX_CAST_PER_TITLE);

            $personCache = []; // cache local : tmdbId => Person, pour ce titre

            foreach ($cast as $castMember) {
                if (empty($castMember['character'])) {
                    continue;
                }

                $tmdbPersonId = $castMember['id'];

                if (isset($personCache[$tmdbPersonId])) {
                    $person = $personCache[$tmdbPersonId];
                } else {
                    $person = $personRepo->findOneBy(['tmdbId' => $tmdbPersonId]) ?? new Person();
                    $person->setTmdbId($tmdbPersonId);
                    $person->setName($castMember['name']);
                    $person->setProfilePath($castMember['profile_path'] ?? null);
                    $person->setPopularity($castMember['popularity'] ?? null);
                    $this->em->persist($person);
                    $personCache[$tmdbPersonId] = $person;
                }

                $existing = $characterRepo->findOneBy([
                    'actor' => $person,
                    $relationField => $title,
                    'name' => $castMember['character'],
                ]);

                if (!$existing) {
                    $character = new Character();
                    $character->setName($castMember['character']);
                    $character->setActor($person);
                    if ($relationField === 'movie') {
                        $character->setMovie($title);
                    } else {
                        $character->setSeries($title);
                    }
                    $this->em->persist($character);
                }
            }

            $this->em->flush();
            $this->em->clear();

            $output->writeln("Crédits importés pour : {$this->getTitleLabel($title)}");
        }
    }

    private function getTitleLabel(Movie|Series $title): string
    {
        return $title instanceof Movie ? $title->getTitle() : $title->getName();
    }
}
