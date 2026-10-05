<?php

namespace App\Cinema\Import;

use App\Cinema\Series\Series;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

#[AsCommand(name: 'app:import:series', description: 'Importe les séries populaires depuis TMDB')]
class ImportSeriesCommand extends Command
{
    public function __construct(
        private HttpClientInterface $tmdbClient,
        private EntityManagerInterface $em,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $repo = $this->em->getRepository(Series::class);
        $count = 0;
        $totalPages = 50;

        for ($page = 1; $page <= $totalPages; $page++) {
            $response = $this->tmdbClient->request('GET', 'tv/popular', [
                'query' => ['language' => 'fr-FR', 'page' => $page],
            ]);

            $data = $response->toArray();

            foreach ($data['results'] as $result) {
                $series = $repo->findOneBy(['tmdbId' => $result['id']]) ?? new Series();

                $series->setTmdbId($result['id']);
                $series->setName($result['name']);
                $series->setPosterPath($result['poster_path'] ?? null);
                $series->setPopularity($result['popularity'] ?? null);
                $series->setVoteCount($result['vote_count'] ?? null);
                $series->setOverview(!empty($result['overview']) ? $result['overview'] : null);

                if (!empty($result['first_air_date'])) {
                    $series->setFirstAirDate(new \DateTimeImmutable($result['first_air_date']));
                }

                $this->em->persist($series);
                $count++;
            }

            $this->em->flush();
        }

        $output->writeln("$count séries importées.");

        return Command::SUCCESS;
    }
}
