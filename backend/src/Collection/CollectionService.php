<?php

namespace App\Collection;

use App\Card\Card;
use App\Card\CardType;
use App\Cinema\Character\Character;
use App\Cinema\Movie\Movie;
use App\Cinema\Person\Person;
use App\Cinema\Series\Series;
use App\Inventory\UserCard;
use App\User\User;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Calcule la progression d'une collection selon la hiérarchie du jeu :
 *
 *   Acteur -> Films/Séries -> Personnages
 *
 * Une collection ne contient que des entités cinéma qui existent réellement
 * comme Card (collectibles) : si une entité n'a pas encore été transformée
 * en carte, elle n'apparaît pas et ne compte pas dans le total.
 */
class CollectionService
{
    private const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

    public function __construct(private EntityManagerInterface $em) {}

    public function getPersonCollection(User $user, Person $person): array
    {
        $characters = $this->em->createQueryBuilder()
            ->select('c', 'm', 's')
            ->from(Character::class, 'c')
            ->leftJoin('c.movie', 'm')
            ->leftJoin('c.series', 's')
            ->where('c.actor = :person')
            ->setParameter('person', $person)
            ->getQuery()
            ->getResult();

        $movies = [];
        $series = [];
        foreach ($characters as $character) {
            if ($movie = $character->getMovie()) {
                $movies[$movie->getId()] = $movie;
            }
            if ($s = $character->getSeries()) {
                $series[$s->getId()] = $s;
            }
        }

        $items = [];
        foreach ($movies as $movie) {
            $items[] = [
                'type' => CardType::MOVIE,
                'entityId' => $movie->getId(),
                'name' => $movie->getTitle(),
                'imageUrl' => $this->image($movie->getPosterPath()),
                'typeEmoji' => '🎬',
                'typeLabel' => 'Film',
            ];
        }
        foreach ($series as $s) {
            $items[] = [
                'type' => CardType::SERIES,
                'entityId' => $s->getId(),
                'name' => $s->getName(),
                'imageUrl' => $this->image($s->getPosterPath()),
                'typeEmoji' => '📺',
                'typeLabel' => 'Série',
            ];
        }

        return $this->buildCollectionResponse(
            $user,
            array_merge(
                [
                    'type' => 'person',
                    'id' => $person->getId(),
                    'name' => $person->getName(),
                    'imageUrl' => $this->image($person->getProfilePath()),
                    'typeEmoji' => '👤',
                    'typeLabel' => 'Acteur',
                    'subtitle' => 'Acteur',
                    'description' => $person->getBiography(),
                ],
                $this->resolveSelfCard($user, CardType::PERSON, $person->getId()),
            ),
            $items,
        );
    }

    public function getMovieCollection(User $user, Movie $movie): array
    {
        $characters = $this->em->createQueryBuilder()
            ->select('c', 'a')
            ->from(Character::class, 'c')
            ->leftJoin('c.actor', 'a')
            ->where('c.movie = :movie')
            ->setParameter('movie', $movie)
            ->getQuery()
            ->getResult();

        return $this->buildCollectionResponse(
            $user,
            array_merge(
                [
                    'type' => 'movie',
                    'id' => $movie->getId(),
                    'name' => $movie->getTitle(),
                    'imageUrl' => $this->image($movie->getPosterPath()),
                    'typeEmoji' => '🎬',
                    'typeLabel' => 'Film',
                    'subtitle' => 'Film' . ($movie->getReleaseDate() ? ' • ' . $movie->getReleaseDate()->format('Y') : ''),
                    'description' => $movie->getOverview(),
                ],
                $this->resolveSelfCard($user, CardType::MOVIE, $movie->getId()),
            ),
            $this->charactersToItems($characters),
        );
    }

    public function getSeriesCollection(User $user, Series $series): array
    {
        $characters = $this->em->createQueryBuilder()
            ->select('c', 'a')
            ->from(Character::class, 'c')
            ->leftJoin('c.actor', 'a')
            ->where('c.series = :series')
            ->setParameter('series', $series)
            ->getQuery()
            ->getResult();

        return $this->buildCollectionResponse(
            $user,
            array_merge(
                [
                    'type' => 'series',
                    'id' => $series->getId(),
                    'name' => $series->getName(),
                    'imageUrl' => $this->image($series->getPosterPath()),
                    'typeEmoji' => '📺',
                    'typeLabel' => 'Série',
                    'subtitle' => 'Série' . ($series->getFirstAirDate() ? ' • ' . $series->getFirstAirDate()->format('Y') : ''),
                    'description' => $series->getOverview(),
                ],
                $this->resolveSelfCard($user, CardType::SERIES, $series->getId()),
            ),
            $this->charactersToItems($characters),
        );
    }

    /**
     * Fiche d'un personnage : la carte du personnage en en-tête (avec ses actions),
     * des liens vers l'acteur et l'œuvre, et les autres personnages de la même œuvre.
     */
    public function getCharacterCollection(User $user, Character $character): array
    {
        $actor = $character->getActor();
        $movie = $character->getMovie();
        $series = $character->getSeries();

        $links = [];
        $titleName = null;
        if ($actor) {
            $links[] = [
                'emoji' => '👤',
                'label' => 'Joué par ' . $actor->getName(),
                'path' => '/people/' . $actor->getId(),
            ];
        }
        if ($movie) {
            $titleName = $movie->getTitle();
            $links[] = ['emoji' => '🎬', 'label' => $movie->getTitle(), 'path' => '/movies/' . $movie->getId()];
        } elseif ($series) {
            $titleName = $series->getName();
            $links[] = ['emoji' => '📺', 'label' => $series->getName(), 'path' => '/series/' . $series->getId()];
        }

        $siblings = [];
        if ($movie || $series) {
            $siblings = $this->em->createQueryBuilder()
                ->select('c', 'a')
                ->from(Character::class, 'c')
                ->leftJoin('c.actor', 'a')
                ->where($movie ? 'c.movie = :title' : 'c.series = :title')
                ->andWhere('c.id != :self')
                ->setParameter('title', $movie ?? $series)
                ->setParameter('self', $character->getId())
                ->getQuery()
                ->getResult();
        }

        return $this->buildCollectionResponse(
            $user,
            array_merge(
                [
                    'type' => 'character',
                    'id' => $character->getId(),
                    'name' => $character->getName(),
                    'imageUrl' => $character->getImageUrl() ?: $this->image($actor?->getProfilePath()),
                    'typeEmoji' => '🎭',
                    'typeLabel' => 'Personnage',
                    'subtitle' => 'Personnage' . ($titleName ? ' • ' . $titleName : ''),
                    'description' => null,
                    'links' => $links,
                ],
                $this->resolveSelfCard($user, CardType::CHARACTER, $character->getId()),
            ),
            $this->charactersToItems($siblings),
        );
    }

    /** @param Character[] $characters */
    private function charactersToItems(array $characters): array
    {
        $items = [];
        foreach ($characters as $character) {
            $actor = $character->getActor();
            $items[] = [
                'type' => CardType::CHARACTER,
                'entityId' => $character->getId(),
                'name' => $character->getName(),
                'imageUrl' => $character->getImageUrl() ?: $this->image($actor?->getProfilePath()),
                'typeEmoji' => '🎭',
                'typeLabel' => 'Personnage',
                // Permet au front de naviguer Personnage -> Acteur (le graphe du jeu)
                'actorId' => $actor?->getId(),
            ];
        }
        return $items;
    }

    /**
     * @param array{type: string, id: int, name: string, imageUrl: ?string} $entity
     * @param list<array{type: CardType, entityId: int, name: string, imageUrl: ?string, typeEmoji: string, typeLabel: string}> $items
     */
    private function buildCollectionResponse(User $user, array $entity, array $items): array
    {
        if (count($items) === 0) {
            return ['entity' => $entity, 'items' => [], 'ownedCount' => 0, 'totalCount' => 0];
        }

        // Regroupe par type pour ne faire qu'une requête par type de carte
        $byTypeAndEntityId = [];
        foreach ($items as $item) {
            $byTypeAndEntityId[$item['type']->value][$item['entityId']] = $item;
        }

        // Ne garder que les entités qui existent réellement comme cartes
        $cards = [];
        foreach ($byTypeAndEntityId as $type => $byEntityId) {
            foreach (
                $this->em->getRepository(Card::class)->findBy([
                    'type' => $type,
                    'entityId' => array_keys($byEntityId),
                ]) as $card
            ) {
                $cards[] = $card;
            }
        }

        if (count($cards) === 0) {
            return ['entity' => $entity, 'items' => [], 'ownedCount' => 0, 'totalCount' => 0];
        }

        $userCards = $this->em->getRepository(UserCard::class)->createQueryBuilder('uc')
            ->where('uc.user = :user AND uc.card IN (:cards)')
            ->setParameter('user', $user)
            ->setParameter('cards', $cards)
            ->getQuery()
            ->getResult();

        $quantityByCardId = [];
        foreach ($userCards as $uc) {
            $quantityByCardId[$uc->getCard()->getId()] = $uc->getQuantity();
        }

        $result = [];
        $ownedCount = 0;
        foreach ($cards as $card) {
            $item = $byTypeAndEntityId[$card->getType()->value][$card->getEntityId()] ?? null;
            if (!$item) {
                continue;
            }

            $quantity = $quantityByCardId[$card->getId()] ?? 0;
            $owned = $quantity > 0;
            if ($owned) {
                $ownedCount++;
            }

            $result[] = [
                'type' => $item['type']->value,
                'entityId' => $item['entityId'],
                'name' => $item['name'],
                'imageUrl' => $item['imageUrl'],
                'typeEmoji' => $item['typeEmoji'],
                'typeLabel' => $item['typeLabel'],
                'rarity' => $card->getRarity()->value,
                'owned' => $owned,
                'quantity' => $quantity,
                'actorId' => $item['actorId'] ?? null,
            ];
        }

        // Cartes possédées d'abord, puis ordre alphabétique
        usort($result, fn($a, $b) => ($b['owned'] <=> $a['owned']) ?: strcmp($a['name'], $b['name']));

        return [
            'entity' => $entity,
            'items' => $result,
            'ownedCount' => $ownedCount,
            'totalCount' => count($result),
        ];
    }

    /**
     * Résout la carte (rareté + possession) de l'entité elle-même, pour
     * l'afficher en en-tête de la page de collection avec ses actions
     * (wishlist, à échanger, marché, vente rapide).
     *
     * @return array{cardId: ?int, userCardId: ?int, rarity: ?string, owned: bool, quantity: int}
     */
    private function resolveSelfCard(User $user, CardType $type, int $entityId): array
    {
        $card = $this->em->getRepository(Card::class)->findOneBy([
            'type' => $type,
            'entityId' => $entityId,
        ]);

        if (!$card) {
            return ['cardId' => null, 'userCardId' => null, 'rarity' => null, 'owned' => false, 'quantity' => 0];
        }

        $userCard = $this->em->getRepository(UserCard::class)->findOneBy([
            'user' => $user,
            'card' => $card,
        ]);

        $quantity = $userCard?->getQuantity() ?? 0;

        return [
            'cardId' => $card->getId(),
            'userCardId' => $userCard?->getId(),
            'rarity' => $card->getRarity()->value,
            'owned' => $quantity > 0,
            'quantity' => $quantity,
        ];
    }

    private function image(?string $path): ?string
    {
        return $path ? self::TMDB_IMAGE_BASE . $path : null;
    }

    /**
     * À appeler chaque fois qu'un joueur obtient une carte : détermine quelle(s)
     * collection(s) cette carte peut faire passer à 100%, et mémorise la
     * complétion si c'est le cas (une seule fois par collection).
     *
     * - Carte MOVIE/SERIES : peut compléter la collection "acteur" de chaque
     *   acteur ayant un personnage dans ce film/cette série.
     * - Carte CHARACTER : peut compléter la collection "film"/"série" du
     *   personnage (ses items sont les personnages, dont celui-ci).
     * - Carte PERSON : n'entre dans aucune liste d'items de collection, donc
     *   n'a aucun effet de complétion.
     */
    public function recordCompletionsForCard(User $user, Card $card): void
    {
        switch ($card->getType()) {
            case CardType::MOVIE:
                $movie = $this->em->getRepository(Movie::class)->find($card->getEntityId());
                if ($movie) {
                    foreach ($this->actorsAppearingIn($movie) as $person) {
                        $this->recordIfComplete($user, 'person', $person->getId(), fn() => $this->getPersonCollection($user, $person));
                    }
                }
                break;

            case CardType::SERIES:
                $series = $this->em->getRepository(Series::class)->find($card->getEntityId());
                if ($series) {
                    foreach ($this->actorsAppearingIn($series) as $person) {
                        $this->recordIfComplete($user, 'person', $person->getId(), fn() => $this->getPersonCollection($user, $person));
                    }
                }
                break;

            case CardType::CHARACTER:
                $character = $this->em->getRepository(Character::class)->find($card->getEntityId());
                if ($character?->getMovie()) {
                    $movie = $character->getMovie();
                    $this->recordIfComplete($user, 'movie', $movie->getId(), fn() => $this->getMovieCollection($user, $movie));
                }
                if ($character?->getSeries()) {
                    $series = $character->getSeries();
                    $this->recordIfComplete($user, 'series', $series->getId(), fn() => $this->getSeriesCollection($user, $series));
                }
                break;

            case CardType::PERSON:
                // Aucun effet : les cartes PERSON ne sont jamais des items d'une collection.
                break;
        }
    }

    public function countCompletedCollections(User $user): int
    {
        return (int) $this->em->getRepository(UserCompletedCollection::class)->count(['user' => $user]);
    }

    /**
     * Liste les collections (acteur/film/série) déjà complétées à 100% par
     * ce joueur, les plus récentes d'abord, pour l'onglet "Collections 100%".
     */
    public function listCompletedCollections(User $user): array
    {
        $completions = $this->em->getRepository(UserCompletedCollection::class)->findBy(
            ['user' => $user],
            ['completedAt' => 'DESC'],
        );

        $result = [];
        foreach ($completions as $completion) {
            $entity = match ($completion->getType()) {
                'person' => $this->em->getRepository(Person::class)->find($completion->getEntityId()),
                'movie' => $this->em->getRepository(Movie::class)->find($completion->getEntityId()),
                'series' => $this->em->getRepository(Series::class)->find($completion->getEntityId()),
                default => null,
            };

            if (!$entity) {
                continue;
            }

            $result[] = match ($completion->getType()) {
                'person' => [
                    'type' => 'person',
                    'entityId' => $entity->getId(),
                    'name' => $entity->getName(),
                    'imageUrl' => $this->image($entity->getProfilePath()),
                    'typeEmoji' => '👤',
                    'typeLabel' => 'Acteur',
                    'completedAt' => $completion->getCompletedAt()->format(\DateTimeInterface::ATOM),
                ],
                'movie' => [
                    'type' => 'movie',
                    'entityId' => $entity->getId(),
                    'name' => $entity->getTitle(),
                    'imageUrl' => $this->image($entity->getPosterPath()),
                    'typeEmoji' => '🎬',
                    'typeLabel' => 'Film',
                    'completedAt' => $completion->getCompletedAt()->format(\DateTimeInterface::ATOM),
                ],
                'series' => [
                    'type' => 'series',
                    'entityId' => $entity->getId(),
                    'name' => $entity->getName(),
                    'imageUrl' => $this->image($entity->getPosterPath()),
                    'typeEmoji' => '📺',
                    'typeLabel' => 'Série',
                    'completedAt' => $completion->getCompletedAt()->format(\DateTimeInterface::ATOM),
                ],
            };
        }

        return $result;
    }

    /**
     * Liste la progression (ownedCount/totalCount) de toutes les collections
     * Acteur / Film / Série dans lesquelles ce joueur possède déjà au moins
     * une carte, pour l'onglet "Collections" de la Vitrine.
     *
     * On ne recalcule que les collections "candidates" (déduites des cartes
     * Film/Série possédées pour les Acteurs, et des cartes Personnage
     * possédées pour les Films/Séries), afin d'éviter de parcourir tout le
     * catalogue à chaque appel.
     */
    public function listCollectionsProgress(User $user): array
    {
        $ownedMovieAndSeriesUserCards = $this->em->getRepository(UserCard::class)->createQueryBuilder('uc')
            ->select('uc', 'c')
            ->join('uc.card', 'c')
            ->where('uc.user = :user')
            ->andWhere('uc.quantity > 0')
            ->andWhere('c.type IN (:types)')
            ->setParameter('user', $user)
            ->setParameter('types', [CardType::MOVIE->value, CardType::SERIES->value])
            ->getQuery()
            ->getResult();

        /** @var array<int, Person> $candidatePersons */
        $candidatePersons = [];
        foreach ($ownedMovieAndSeriesUserCards as $userCard) {
            $card = $userCard->getCard();
            $entity = $card->getType() === CardType::MOVIE
                ? $this->em->getRepository(Movie::class)->find($card->getEntityId())
                : $this->em->getRepository(Series::class)->find($card->getEntityId());
            if (!$entity) {
                continue;
            }
            foreach ($this->actorsAppearingIn($entity) as $person) {
                $candidatePersons[$person->getId()] = $person;
            }
        }

        $ownedCharacterUserCards = $this->em->getRepository(UserCard::class)->createQueryBuilder('uc')
            ->select('uc', 'c')
            ->join('uc.card', 'c')
            ->where('uc.user = :user')
            ->andWhere('uc.quantity > 0')
            ->andWhere('c.type = :type')
            ->setParameter('user', $user)
            ->setParameter('type', CardType::CHARACTER->value)
            ->getQuery()
            ->getResult();

        /** @var array<int, Movie> $candidateMovies */
        $candidateMovies = [];
        /** @var array<int, Series> $candidateSeries */
        $candidateSeries = [];
        foreach ($ownedCharacterUserCards as $userCard) {
            $character = $this->em->getRepository(Character::class)->find($userCard->getCard()->getEntityId());
            if (!$character) {
                continue;
            }
            if ($movie = $character->getMovie()) {
                $candidateMovies[$movie->getId()] = $movie;
            }
            if ($series = $character->getSeries()) {
                $candidateSeries[$series->getId()] = $series;
            }
        }

        $result = [];

        foreach ($candidatePersons as $person) {
            $c = $this->getPersonCollection($user, $person);
            if ($c['ownedCount'] > 0) {
                $result[] = [
                    'type' => 'person',
                    'entityId' => $person->getId(),
                    'name' => $person->getName(),
                    'imageUrl' => $this->image($person->getProfilePath()),
                    'typeEmoji' => '👤',
                    'typeLabel' => 'Acteur',
                    'unitLabel' => 'œuvres',
                    'ownedCount' => $c['ownedCount'],
                    'totalCount' => $c['totalCount'],
                ];
            }
        }

        foreach ($candidateMovies as $movie) {
            $c = $this->getMovieCollection($user, $movie);
            if ($c['ownedCount'] > 0) {
                $result[] = [
                    'type' => 'movie',
                    'entityId' => $movie->getId(),
                    'name' => $movie->getTitle(),
                    'imageUrl' => $this->image($movie->getPosterPath()),
                    'typeEmoji' => '🎬',
                    'typeLabel' => 'Film',
                    'unitLabel' => 'personnages',
                    'ownedCount' => $c['ownedCount'],
                    'totalCount' => $c['totalCount'],
                ];
            }
        }

        foreach ($candidateSeries as $series) {
            $c = $this->getSeriesCollection($user, $series);
            if ($c['ownedCount'] > 0) {
                $result[] = [
                    'type' => 'series',
                    'entityId' => $series->getId(),
                    'name' => $series->getName(),
                    'imageUrl' => $this->image($series->getPosterPath()),
                    'typeEmoji' => '📺',
                    'typeLabel' => 'Série',
                    'unitLabel' => 'personnages',
                    'ownedCount' => $c['ownedCount'],
                    'totalCount' => $c['totalCount'],
                ];
            }
        }

        // Progression la plus avancée d'abord, puis ordre alphabétique
        usort($result, function (array $a, array $b) {
            $pctA = $a['totalCount'] > 0 ? $a['ownedCount'] / $a['totalCount'] : 0;
            $pctB = $b['totalCount'] > 0 ? $b['ownedCount'] / $b['totalCount'] : 0;
            return ($pctB <=> $pctA) ?: strcmp($a['name'], $b['name']);
        });

        return $result;
    }

    /** @return Person[] */
    private function actorsAppearingIn(Movie|Series $entity): array
    {
        $field = $entity instanceof Movie ? 'movie' : 'series';

        $characters = $this->em->createQueryBuilder()
            ->select('c', 'a')
            ->from(Character::class, 'c')
            ->leftJoin('c.actor', 'a')
            ->where("c.$field = :entity")
            ->setParameter('entity', $entity)
            ->getQuery()
            ->getResult();

        $actors = [];
        foreach ($characters as $character) {
            if ($actor = $character->getActor()) {
                $actors[$actor->getId()] = $actor;
            }
        }

        return array_values($actors);
    }

    private function recordIfComplete(User $user, string $type, int $entityId, callable $resolveCollection): void
    {
        $already = $this->em->getRepository(UserCompletedCollection::class)->findOneBy([
            'user' => $user,
            'type' => $type,
            'entityId' => $entityId,
        ]);

        if ($already) {
            return;
        }

        $collection = $resolveCollection();
        if ($collection['totalCount'] > 0 && $collection['ownedCount'] === $collection['totalCount']) {
            $completed = new UserCompletedCollection();
            $completed->setUser($user)->setType($type)->setEntityId($entityId);
            $this->em->persist($completed);
            $this->em->flush();
        }
    }
}
