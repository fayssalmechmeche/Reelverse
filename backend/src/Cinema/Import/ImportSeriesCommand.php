<?php

namespace App\Cinema\Import;

use App\Cinema\Series\Series;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(
    name: 'app:import:series',
    description: 'Importe les séries depuis TMDB, année par année, avec un seuil de votes minimum'
)]
class ImportSeriesCommand extends Command
{
    public function __construct(
        private TmdbApi $tmdb,
        private EntityManagerInterface $em,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('min-votes', null, InputOption::VALUE_REQUIRED, 'Nombre minimum de votes TMDB (années passées)', '300')
            ->addOption('from-year', null, InputOption::VALUE_REQUIRED, 'Première année importée', '1970')
            ->addOption('max-pages', null, InputOption::VALUE_REQUIRED, 'Pages max par année (20 séries par page)', '15')
            ->addOption('dry-run', null, InputOption::VALUE_NONE, 'Compte seulement ce qui serait importé, sans rien écrire en base');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $this->em->getConnection()->getConfiguration()->setMiddlewares([]);

        $minVotes = max(0, (int) $input->getOption('min-votes'));
        $fromYear = (int) $input->getOption('from-year');
        $maxPages = max(1, (int) $input->getOption('max-pages'));
        $dryRun = (bool) $input->getOption('dry-run');
        $currentYear = (int) date('Y');
        $estimated = 0;

        $repo = $this->em->getRepository(Series::class);
        $created = 0;
        $updated = 0;

        for ($year = $fromYear; $year <= $currentYear + 1; $year++) {
            $recent = $year >= $currentYear;
            $query = [
                'language' => 'fr-FR',
                'sort_by' => 'popularity.desc',
                'include_adult' => 'false',
                'first_air_date_year' => $year,
                'vote_count.gte' => $recent ? 0 : $minVotes,
            ];

            $yearCount = 0;
            $yearPages = $recent ? min($maxPages, 5) : $maxPages;

            if ($dryRun) {
                // Une seule requête par année : TMDB renvoie le total correspondant au filtre.
                $data = $this->tmdb->get('discover/tv', $query + ['page' => 1]);
                $yearCount = min((int) ($data['total_results'] ?? 0), $yearPages * 20);
                $estimated += $yearCount;
                $output->writeln(sprintf('%d : ~%d séries', $year, $yearCount));
                continue;
            }

            foreach ($this->tmdb->discover('discover/tv', $query, $yearPages) as $results) {
                $results = array_values(array_filter(
                    $results,
                    fn(array $r) => !empty($r['poster_path']) && !empty($r['name'])
                ));

                $existing = [];
                foreach ($repo->findBy(['tmdbId' => array_column($results, 'id')]) as $series) {
                    $existing[$series->getTmdbId()] = $series;
                }

                foreach ($results as $result) {
                    $series = $existing[$result['id']] ?? null;
                    $series === null ? $created++ : $updated++;
                    $series ??= new Series();

                    $series->setTmdbId($result['id']);
                    $series->setName($result['name']);
                    $series->setPosterPath($result['poster_path']);
                    $series->setPopularity($result['popularity'] ?? null);
                    $series->setVoteCount($result['vote_count'] ?? null);
                    $series->setOverview(!empty($result['overview']) ? $result['overview'] : null);

                    if (!empty($result['first_air_date'])) {
                        $series->setFirstAirDate(new \DateTimeImmutable($result['first_air_date']));
                    }

                    $this->em->persist($series);
                    $yearCount++;
                }

                $this->em->flush();
                $this->em->clear();
            }

            $output->writeln(sprintf('%d : %d séries', $year, $yearCount));
        }

        if ($dryRun) {
            $output->writeln(sprintf('Estimation : environ %d séries (avant retrait de ceux sans affiche).', $estimated));

            return Command::SUCCESS;
        }

        $output->writeln(sprintf('Terminé : %d séries créées, %d mises à jour.', $created, $updated));

        return Command::SUCCESS;
    }
}
