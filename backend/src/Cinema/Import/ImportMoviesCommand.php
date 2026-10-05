<?php

namespace App\Cinema\Import;

use App\Cinema\Movie\Movie;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

#[AsCommand(name: 'app:import:movies', description: 'Importe les films populaires depuis TMDB')]
class ImportMoviesCommand extends Command
{
    public function __construct(
        private HttpClientInterface $tmdbClient,
        private EntityManagerInterface $em,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $repo = $this->em->getRepository(Movie::class);
        $count = 0;
        $totalPages = 50; // à ajuster selon combien tu veux importer (20 films/page)

        for ($page = 1; $page <= $totalPages; $page++) {
            $response = $this->tmdbClient->request('GET', 'movie/popular', [
                'query' => ['language' => 'fr-FR', 'page' => $page],
            ]);

            $data = $response->toArray();

            foreach ($data['results'] as $result) {
                $movie = $repo->findOneBy(['tmdbId' => $result['id']]) ?? new Movie();

                $movie->setTmdbId($result['id']);
                $movie->setTitle($result['title']);
                $movie->setPosterPath($result['poster_path'] ?? null);
                $movie->setPopularity($result['popularity'] ?? null);
                $movie->setVoteCount($result['vote_count'] ?? null);
                $movie->setOverview(!empty($result['overview']) ? $result['overview'] : null);

                if (!empty($result['release_date'])) {
                    $movie->setReleaseDate(new \DateTimeImmutable($result['release_date']));
                }

                $this->em->persist($movie);
                $count++;
            }

            $this->em->flush();
        }

        $output->writeln("$count films importés.");

        return Command::SUCCESS;
    }
}
