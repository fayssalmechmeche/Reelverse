<?php

namespace App\Cinema\Import;

use App\Cinema\Character\Character;
use App\Cinema\Movie\Movie;
use App\Cinema\Series\Series;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(
    name: 'app:import:tvdb-characters',
    description: 'Récupère l\'image des personnages sur TheTVDB (reprenable, les titres les plus populaires d\'abord)',
)]
class ImportTvdbCharactersCommand extends Command
{
    private const CHUNK_SIZE = 20;
    private const ARTWORK_BASE = 'https://artworks.thetvdb.com';

    public function __construct(
        private TmdbApi $tmdb,
        private TvdbApi $tvdb,
        private EntityManagerInterface $em,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('type', 't', InputOption::VALUE_REQUIRED, 'movie, series ou all', 'all')
            ->addOption('limit', 'l', InputOption::VALUE_REQUIRED, 'Nombre max de titres à traiter par type (0 = tous)', '0')
            ->addOption('force', null, InputOption::VALUE_NONE, 'Retraite aussi les titres déjà synchronisés')
            ->addOption('dry-run', null, InputOption::VALUE_NONE, 'Affiche les correspondances sans rien écrire');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        if (!$this->tvdb->isConfigured()) {
            $output->writeln('<error>TVDB_API_KEY est vide : renseigne-la dans l\'environnement.</error>');

            return Command::FAILURE;
        }

        $this->em->getConnection()->getConfiguration()->setMiddlewares([]);

        $type = (string) $input->getOption('type');
        $options = [
            'limit' => max(0, (int) $input->getOption('limit')),
            'force' => (bool) $input->getOption('force'),
            'dryRun' => (bool) $input->getOption('dry-run'),
        ];

        if ($type === 'all' || $type === 'movie') {
            $this->importFor(Movie::class, 'movie', $options, $output);
        }
        if ($type === 'all' || $type === 'series') {
            $this->importFor(Series::class, 'series', $options, $output);
        }

        return Command::SUCCESS;
    }

    private function importFor(string $class, string $kind, array $options, OutputInterface $output): void
    {
        $dql = sprintf('SELECT t.id FROM %s t %s ORDER BY t.popularity DESC, t.id ASC', $class, $options['force'] ? '' : 'WHERE t.tvdbSyncedAt IS NULL');
        $query = $this->em->createQuery($dql);
        if ($options['limit'] > 0) {
            $query->setMaxResults($options['limit']);
        }

        $ids = array_map('intval', array_column($query->getArrayResult(), 'id'));
        $total = count($ids);
        $output->writeln(sprintf('%s : %d titres à traiter.', $kind, $total));

        $done = $withMatch = $matched = $failures = 0;

        foreach (array_chunk($ids, self::CHUNK_SIZE) as $chunk) {
            foreach ($chunk as $id) {
                $title = $this->em->find($class, $id);
                if (!$title) {
                    continue;
                }

                try {
                    $count = $this->processTitle($title, $kind, $options['dryRun'], $output);
                    if (!$options['dryRun']) {
                        $title->setTvdbSyncedAt(new \DateTimeImmutable());
                    }
                    if ($count > 0) {
                        $withMatch++;
                        $matched += $count;
                    }
                } catch (\Throwable $e) {
                    // Pas de marqueur : le titre sera retenté au prochain lancement.
                    $failures++;
                    $output->writeln(sprintf('<comment>Échec titre %d : %s</comment>', $id, $e->getMessage()));
                }

                usleep(150_000);
            }

            if (!$options['dryRun']) {
                $this->em->flush();
            }
            $this->em->clear();

            $done += count($chunk);
            $output->writeln(sprintf('%s : %d/%d titres, %d avec images, %d images trouvées', $kind, $done, $total, $withMatch, $matched));
        }

        if ($failures > 0) {
            $output->writeln(sprintf('<comment>%d titres en échec : relance la commande pour les reprendre.</comment>', $failures));
        }
    }

    /** @return int Nombre de personnages pour lesquels une image a été trouvée. */
    private function processTitle(Movie|Series $title, string $kind, bool $dryRun, OutputInterface $output): int
    {
        /** @var Character[] $characters */
        $characters = $this->em->createQueryBuilder()
            ->select('c', 'a')
            ->from(Character::class, 'c')
            ->join('c.actor', 'a')
            ->where($kind === 'movie' ? 'c.movie = :t' : 'c.series = :t')
            ->setParameter('t', $title)
            ->getQuery()
            ->getResult();

        if ($characters === []) {
            return 0;
        }

        $tvdbId = $this->resolveTvdbId($title, $kind);
        if ($tvdbId === null) {
            return 0;
        }

        $data = $this->tvdb->get(($kind === 'movie' ? 'movies' : 'series') . "/$tvdbId/extended");
        [$tvdbCharacters, $actorPhotos] = $this->extractCharacters($data['data']['characters'] ?? []);
        if ($dryRun || $output->isVerbose()) {
            $output->writeln(sprintf('  [%s] %d images de personnage, %d photos d\'acteur ignorées', $title instanceof Movie ? $title->getTitle() : $title->getName(), count($tvdbCharacters), $actorPhotos));
        }
        if ($tvdbCharacters === []) {
            return 0;
        }

        $used = [];
        $found = 0;
        foreach ($characters as $character) {
            $image = $this->match($character, $tvdbCharacters, $used);
            if ($image === null) {
                continue;
            }

            $found++;
            if ($dryRun || $output->isVerbose()) {
                $output->writeln(sprintf('  %s (%s) => %s', $character->getName(), $character->getActor()->getName(), $image));
            }
            if (!$dryRun) {
                $character->setImageUrl($image);
            }
        }

        return $found;
    }

    private function resolveTvdbId(Movie|Series $title, string $kind): ?int
    {
        if ($kind === 'series') {
            $ids = $this->tmdb->get("tv/{$title->getTmdbId()}/external_ids");

            return !empty($ids['tvdb_id']) ? (int) $ids['tvdb_id'] : null;
        }

        $ids = $this->tmdb->get("movie/{$title->getTmdbId()}/external_ids");
        $imdbId = $ids['imdb_id'] ?? null;
        if (!is_string($imdbId) || $imdbId === '') {
            return null;
        }

        $result = $this->tvdb->get('search/remoteid/' . rawurlencode($imdbId));
        foreach ($result['data'] ?? [] as $entry) {
            if (isset($entry['movie']['id'])) {
                return (int) $entry['movie']['id'];
            }
        }

        return null;
    }

    /**
     * Ne garde que les personnages TVDB qui ont une vraie image de personnage.
     * TVDB renvoie souvent la photo de l'acteur à la place : on l'écarte, car on
     * a déjà la photo TMDB et elle n'apporterait rien.
     *
     * @return array{0: list<array{name: string, person: string, image: string}>, 1: int} [personnages, nombre de photos d'acteur ignorées]
     */
    private function extractCharacters(array $raw): array
    {
        $result = [];
        $actorPhotos = 0;
        foreach ($raw as $c) {
            $image = (string) ($c['image'] ?? '');
            $name = trim((string) ($c['name'] ?? ''));
            if ($image === '' || $name === '') {
                continue;
            }
            if (!str_starts_with($image, 'http')) {
                $image = self::ARTWORK_BASE . '/' . ltrim($image, '/');
            }
            if (mb_strlen($image) > 500) {
                continue;
            }
            if ($this->isActorPhoto($image, (string) ($c['personImgURL'] ?? ''))) {
                $actorPhotos++;
                continue;
            }

            $result[] = [
                'name' => $this->normalize($name),
                'person' => $this->normalize((string) ($c['personName'] ?? '')),
                'image' => $image,
            ];
        }

        return [$result, $actorPhotos];
    }

    private function isActorPhoto(string $image, string $personImage): bool
    {
        if ($personImage !== '' && basename((string) parse_url($personImage, PHP_URL_PATH)) === basename((string) parse_url($image, PHP_URL_PATH))) {
            return true;
        }

        return (bool) preg_match('#/(actors?|person|people)/#i', (string) parse_url($image, PHP_URL_PATH));
    }

    /**
     * Ordre de confiance : même acteur dans la même œuvre, puis nom de
     * personnage identique, puis nom contenu (seulement s'il est sans ambiguïté).
     *
     * @param list<array{name: string, person: string, image: string}> $candidates
     * @param array<string, true> $used images déjà attribuées dans cette œuvre
     */
    private function match(Character $character, array $candidates, array &$used): ?string
    {
        $name = $this->normalize($character->getName());
        $actor = $this->normalize($character->getActor()->getName());
        $free = array_values(array_filter($candidates, fn(array $c) => !isset($used[$c['image']])));

        $pick = null;

        if ($actor !== '') {
            $byActor = array_values(array_filter($free, fn(array $c) => $c['person'] === $actor));
            if (count($byActor) === 1) {
                $pick = $byActor[0];
            } elseif (count($byActor) > 1) {
                foreach ($byActor as $c) {
                    if ($this->namesOverlap($name, $c['name'])) {
                        $pick = $c;
                        break;
                    }
                }
            }
        }

        if ($pick === null && $name !== '') {
            foreach ($free as $c) {
                if ($c['name'] === $name) {
                    $pick = $c;
                    break;
                }
            }
        }

        if ($pick === null && mb_strlen($name) >= 4) {
            $loose = array_values(array_filter($free, fn(array $c) => mb_strlen($c['name']) >= 4 && $this->namesOverlap($name, $c['name'])));
            if (count($loose) === 1) {
                $pick = $loose[0];
            }
        }

        if ($pick === null) {
            return null;
        }

        $used[$pick['image']] = true;

        return $pick['image'];
    }

    private function namesOverlap(string $a, string $b): bool
    {
        if ($a === '' || $b === '') {
            return false;
        }

        return $a === $b || str_contains($a, $b) || str_contains($b, $a);
    }

    private function normalize(string $value): string
    {
        $value = mb_strtolower($value);
        $value = (string) preg_replace('/\([^)]*\)/u', ' ', $value); // (voice), (uncredited)...

        if (function_exists('transliterator_transliterate')) {
            $value = transliterator_transliterate('Any-Latin; Latin-ASCII; Lower()', $value) ?: $value;
        } else {
            $value = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value) ?: $value;
        }

        $value = (string) preg_replace('/[^a-z0-9]+/', ' ', $value);

        return trim($value);
    }
}
