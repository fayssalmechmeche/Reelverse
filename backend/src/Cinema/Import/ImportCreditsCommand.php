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
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

#[AsCommand(
    name: 'app:import:credits',
    description: 'Importe les crédits (acteurs + personnages) des films et séries qui n\'en ont pas encore'
)]
class ImportCreditsCommand extends Command
{
    public function __construct(
        private HttpClientInterface $tmdbClient,
        private TmdbApi $tmdb,
        private EntityManagerInterface $em,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('max-cast', null, InputOption::VALUE_REQUIRED, 'Nombre max de rôles gardés par titre (ordre du générique)', '8')
            ->addOption('batch', null, InputOption::VALUE_REQUIRED, 'Nombre de titres traités en parallèle', '20')
            ->addOption('min-person-popularity', null, InputOption::VALUE_REQUIRED, 'Popularité TMDB minimum pour garder un acteur (0 = tous)', '0')
            ->addOption('limit', null, InputOption::VALUE_REQUIRED, 'Nombre max de titres à traiter par type (0 = tous)', '0');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $this->em->getConnection()->getConfiguration()->setMiddlewares([]);

        $options = [
            'maxCast' => max(1, (int) $input->getOption('max-cast')),
            'batch' => max(1, (int) $input->getOption('batch')),
            'minPopularity' => max(0.0, (float) $input->getOption('min-person-popularity')),
            'limit' => max(0, (int) $input->getOption('limit')),
        ];

        $this->importFor(Movie::class, 'movie', 'movie', $options, $output);
        $this->importFor(Series::class, 'tv', 'series', $options, $output);

        return Command::SUCCESS;
    }

    /**
     * Seuls les titres sans aucun personnage sont traités : on peut donc
     * relancer la commande après une interruption, elle reprend là où elle s'est arrêtée.
     * (Un titre sans casting sur TMDB sera simplement revérifié à chaque lancement.)
     */
    private function importFor(string $entityClass, string $endpoint, string $relationField, array $options, OutputInterface $output): void
    {
        $query = $this->em->createQuery(sprintf(
            'SELECT t.id FROM %s t
             WHERE NOT EXISTS (SELECT 1 FROM %s c WHERE c.%s = t)
             ORDER BY t.popularity DESC, t.id ASC',
            $entityClass,
            Character::class,
            $relationField
        ));

        if ($options['limit'] > 0) {
            $query->setMaxResults($options['limit']);
        }

        $titleIds = array_map('intval', array_column($query->getArrayResult(), 'id'));
        $total = count($titleIds);

        $output->writeln(sprintf('%s : %d titres à traiter.', $endpoint, $total));

        $done = 0;
        $charactersCreated = 0;
        $failures = 0;

        foreach (array_chunk($titleIds, $options['batch']) as $chunk) {
            $titles = [];
            foreach ($this->em->getRepository($entityClass)->findBy(['id' => $chunk]) as $title) {
                $titles[$title->getId()] = $title;
            }

            // Toutes les requêtes du lot partent en parallèle (les réponses sont lues ensuite).
            $responses = [];
            foreach ($titles as $id => $title) {
                $responses[$id] = $this->tmdbClient->request('GET', "$endpoint/{$title->getTmdbId()}/credits");
            }

            $creditsByTitle = [];
            foreach ($responses as $id => $response) {
                try {
                    $creditsByTitle[$id] = $response->toArray();
                } catch (\Throwable) {
                    // Échec (429, réseau...) : une nouvelle tentative avec attente, titre par titre.
                    try {
                        $creditsByTitle[$id] = $this->tmdb->get("$endpoint/{$titles[$id]->getTmdbId()}/credits");
                    } catch (\Throwable $e) {
                        $failures++;
                        $output->writeln(sprintf('<comment>Échec pour le titre %d : %s</comment>', $id, $e->getMessage()));
                    }
                }
            }

            // Prépare la liste des rôles gardés et des acteurs concernés pour ce lot.
            $rolesByTitle = [];
            $castByPerson = [];
            foreach ($creditsByTitle as $id => $data) {
                $roles = [];
                // On parcourt tout le générique et on s'arrête à max-cast rôles utilisables :
                // un acteur sans photo est ignoré et ne prend pas de place dans le plafond.
                foreach ($data['cast'] ?? [] as $member) {
                    if (count($roles) >= $options['maxCast']) {
                        break;
                    }

                    $characterName = trim((string) ($member['character'] ?? ''));
                    if ($characterName === '' || empty($member['name']) || empty($member['profile_path'])) {
                        continue;
                    }
                    if (($member['popularity'] ?? 0) < $options['minPopularity']) {
                        continue;
                    }

                    $roles[] = ['member' => $member, 'character' => mb_substr($characterName, 0, 255)];
                    $castByPerson[$member['id']] = $member;
                }
                $rolesByTitle[$id] = $roles;
            }

            // Un seul SELECT pour retrouver les acteurs déjà en base.
            $persons = [];
            if ($castByPerson !== []) {
                foreach ($this->em->getRepository(Person::class)->findBy(['tmdbId' => array_keys($castByPerson)]) as $person) {
                    $persons[$person->getTmdbId()] = $person;
                }
            }

            foreach ($castByPerson as $tmdbPersonId => $member) {
                $person = $persons[$tmdbPersonId] ?? new Person();
                $person->setTmdbId($tmdbPersonId);
                $person->setName(mb_substr($member['name'], 0, 255));
                $person->setProfilePath($member['profile_path'] ?? $person->getProfilePath());
                $person->setPopularity($member['popularity'] ?? $person->getPopularity());
                $this->em->persist($person);
                $persons[$tmdbPersonId] = $person;
            }

            foreach ($rolesByTitle as $id => $roles) {
                $seen = [];
                foreach ($roles as $role) {
                    $key = $role['member']['id'] . '|' . mb_strtolower($role['character']);
                    if (isset($seen[$key])) {
                        continue;
                    }
                    $seen[$key] = true;

                    $character = new Character();
                    $character->setName($role['character']);
                    $character->setActor($persons[$role['member']['id']]);
                    if ($relationField === 'movie') {
                        $character->setMovie($titles[$id]);
                    } else {
                        $character->setSeries($titles[$id]);
                    }
                    $this->em->persist($character);
                    $charactersCreated++;
                }
            }

            $this->em->flush();
            $this->em->clear();

            $done += count($chunk);
            $output->writeln(sprintf('%s : %d/%d titres, %d personnages créés', $endpoint, $done, $total, $charactersCreated));
        }

        if ($failures > 0) {
            $output->writeln(sprintf('<comment>%d titres en échec : relance la commande pour les reprendre.</comment>', $failures));
        }
    }
}
