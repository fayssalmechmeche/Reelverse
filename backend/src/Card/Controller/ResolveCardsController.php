<?php

namespace App\Card\Controller;

use App\Cinema\Character\Character;
use App\Cinema\Movie\Movie;
use App\Cinema\Person\Person;
use App\Cinema\Series\Series;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;

#[AsController]
class ResolveCardsController
{
    private const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

    private const TYPE_META = [
        'person' => ['emoji' => '👤', 'label' => 'Acteur'],
        'movie' => ['emoji' => '🎬', 'label' => 'Film'],
        'series' => ['emoji' => '📺', 'label' => 'Série'],
        'character' => ['emoji' => '🎭', 'label' => 'Personnage'],
    ];

    public function __construct(
        private EntityManagerInterface $em,
    ) {}

    #[Route('/api/cards/resolve', name: 'api_cards_resolve', methods: ['POST'])]
    public function __invoke(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true) ?? [];
        $cards = is_array($data['cards'] ?? null) ? $data['cards'] : [];

        if (count($cards) === 0) {
            return new JsonResponse([]);
        }

        // Regroupe les entityId par type pour ne faire qu'un seul findBy() par type,
        // au lieu d'une requête par carte
        $idsByType = ['person' => [], 'movie' => [], 'series' => [], 'character' => []];
        foreach ($cards as $card) {
            $type = $card['type'] ?? null;
            $entityId = $card['entityId'] ?? null;
            if (isset($idsByType[$type]) && is_int($entityId)) {
                $idsByType[$type][] = $entityId;
            }
        }

        $peopleById = $this->indexById(
            $idsByType['person'] ? $this->em->getRepository(Person::class)->findBy(['id' => array_unique($idsByType['person'])]) : []
        );
        $moviesById = $this->indexById(
            $idsByType['movie'] ? $this->em->getRepository(Movie::class)->findBy(['id' => array_unique($idsByType['movie'])]) : []
        );
        $seriesById = $this->indexById(
            $idsByType['series'] ? $this->em->getRepository(Series::class)->findBy(['id' => array_unique($idsByType['series'])]) : []
        );
        $charactersById = $this->indexById(
            $idsByType['character'] ? $this->resolveCharacters(array_unique($idsByType['character'])) : []
        );

        $result = [];
        foreach ($cards as $card) {
            $type = $card['type'] ?? null;
            $entityId = $card['entityId'] ?? null;
            $meta = self::TYPE_META[$type] ?? null;
            if (!$meta) {
                continue;
            }

            $resolved = match ($type) {
                'person' => $this->resolvePerson($peopleById[$entityId] ?? null, $meta),
                'movie' => $this->resolveMovie($moviesById[$entityId] ?? null, $meta),
                'series' => $this->resolveSeries($seriesById[$entityId] ?? null, $meta),
                'character' => $this->resolveCharacter($charactersById[$entityId] ?? null, $meta),
                default => null,
            };

            if ($resolved !== null) {
                $result[] = array_merge(['type' => $type, 'entityId' => $entityId], $resolved);
            }
        }

        return new JsonResponse($result);
    }

    private function resolveCharacters(array $ids): array
    {
        // Jointures pour ne pas déclencher un lazy-load par personnage (acteur/film/série)
        return $this->em->createQueryBuilder()
            ->select('c', 'a', 'm', 's')
            ->from(Character::class, 'c')
            ->leftJoin('c.actor', 'a')
            ->leftJoin('c.movie', 'm')
            ->leftJoin('c.series', 's')
            ->where('c.id IN (:ids)')
            ->setParameter('ids', $ids)
            ->getQuery()
            ->getResult();
    }

    private function indexById(array $entities): array
    {
        $indexed = [];
        foreach ($entities as $entity) {
            $indexed[$entity->getId()] = $entity;
        }
        return $indexed;
    }

    private function resolvePerson(?Person $person, array $meta): ?array
    {
        if (!$person) {
            return null;
        }
        return [
            'name' => $person->getName(),
            'subtitle' => $meta['label'],
            'imageUrl' => $person->getProfilePath() ? self::TMDB_IMAGE_BASE . $person->getProfilePath() : null,
            'typeEmoji' => $meta['emoji'],
            'typeLabel' => $meta['label'],
        ];
    }

    private function resolveMovie(?Movie $movie, array $meta): ?array
    {
        if (!$movie) {
            return null;
        }
        return [
            'name' => $movie->getTitle(),
            'subtitle' => $meta['label'],
            'imageUrl' => $movie->getPosterPath() ? self::TMDB_IMAGE_BASE . $movie->getPosterPath() : null,
            'typeEmoji' => $meta['emoji'],
            'typeLabel' => $meta['label'],
        ];
    }

    private function resolveSeries(?Series $series, array $meta): ?array
    {
        if (!$series) {
            return null;
        }
        return [
            'name' => $series->getName(),
            'subtitle' => $meta['label'],
            'imageUrl' => $series->getPosterPath() ? self::TMDB_IMAGE_BASE . $series->getPosterPath() : null,
            'typeEmoji' => $meta['emoji'],
            'typeLabel' => $meta['label'],
        ];
    }

    private function resolveCharacter(?Character $character, array $meta): ?array
    {
        if (!$character) {
            return null;
        }
        // Image du personnage (TheTVDB) si on en a une, sinon la photo de l'acteur
        $actor = $character->getActor();
        $work = $character->getMovie()?->getTitle() ?? $character->getSeries()?->getName();

        return [
            'name' => $character->getName(),
            'subtitle' => $work ?? $meta['label'],
            'imageUrl' => $character->getImageUrl()
                ?: ($actor->getProfilePath() ? self::TMDB_IMAGE_BASE . $actor->getProfilePath() : null),
            'typeEmoji' => $meta['emoji'],
            'typeLabel' => $meta['label'],
        ];
    }
}
