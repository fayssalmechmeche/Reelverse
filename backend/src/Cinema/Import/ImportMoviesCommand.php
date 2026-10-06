<?php

namespace App\Cinema\Import;

use App\Cinema\Movie\Movie;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(
    name: 'app:import:movies',
    description: 'Importe les films depuis TMDB, année par année, avec un seuil de votes minimum'
)]
class ImportMoviesCommand extends Command
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
            ->addOption('min-votes', null, InputOption::VALUE_REQUIRED, 'Nombre minimum de votes TMDB (années passées)', '500')
            ->addOption('from-year', null, InputOption::VALUE_REQUIRED, 'Première année importée', '1960')
            ->addOption('max-pages', null, InputOption::VALUE_REQUIRED, 'Pages max par année (20 films par page)', '25')
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

        $repo = $this->em->getRepository(Movie::class);
        $created = 0;
        $updated = 0;

        // On va jusqu'à l'année prochaine pour inclure les films à venir.
        for ($year = $fromYear; $year <= $currentYear + 1; $year++) {
            // Les films récents ou à venir n'ont pas encore beaucoup de votes :
            // pas de seuil, mais un nombre de pages limité (tri par popularité).
            $recent = $year >= $currentYear;
            $query = [
                'language' => 'fr-FR',
                'sort_by' => 'popularity.desc',
                'include_adult' => 'false',
                'primary_release_year' => $year,
                'vote_count.gte' => $recent ? 0 : $minVotes,
            ];

            $yearCount = 0;
            $yearPages = $recent ? min($maxPages, 8) : $maxPages;

            if ($dryRun) {
                // Une seule requête par année : TMDB renvoie le total correspondant au filtre.
                $data = $this->tmdb->get('discover/movie', $query + ['page' => 1]);
                $yearCount = min((int) ($data['total_results'] ?? 0), $yearPages * 20);
                $estimated += $yearCount;
                $output->writeln(sprintf('%d : ~%d films', $year, $yearCount));
                continue;
            }

            foreach ($this->tmdb->discover('discover/movie', $query, $yearPages) as $results) {
                $results = array_values(array_filter(
                    $results,
                    fn(array $r) => !empty($r['poster_path']) && !empty($r['title'])
                ));

                $existing = [];
                foreach ($repo->findBy(['tmdbId' => array_column($results, 'id')]) as $movie) {
                    $existing[$movie->getTmdbId()] = $movie;
                }

                foreach ($results as $result) {
                    $movie = $existing[$result['id']] ?? null;
                    $movie === null ? $created++ : $updated++;
                    $movie ??= new Movie();

                    $movie->setTmdbId($result['id']);
                    $movie->setTitle($result['title']);
                    $movie->setPosterPath($result['poster_path']);
                    $movie->setPopularity($result['popularity'] ?? null);
                    $movie->setVoteCount($result['vote_count'] ?? null);
                    $movie->setOverview(!empty($result['overview']) ? $result['overview'] : null);

                    if (!empty($result['release_date'])) {
                        $movie->setReleaseDate(new \DateTimeImmutable($result['release_date']));
                    }

                    $this->em->persist($movie);
                    $yearCount++;
                }

                $this->em->flush();
                $this->em->clear();
            }

            $output->writeln(sprintf('%d : %d films', $year, $yearCount));
        }

        if ($dryRun) {
            $output->writeln(sprintf('Estimation : environ %d films (avant retrait de ceux sans affiche).', $estimated));

            return Command::SUCCESS;
        }

        $output->writeln(sprintf('Terminé : %d films créés, %d mis à jour.', $created, $updated));

        return Command::SUCCESS;
    }
}
