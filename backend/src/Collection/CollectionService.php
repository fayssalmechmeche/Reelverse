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
                ],
                $this->resolveSelfCard($user, CardType::SERIES, $series->getId()),
            ),
            $this->charactersToItems($characters),
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
                'imageUrl' => $this->image($actor?->getProfilePath()),
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
     * l'afficher en en-tête de la page de collection.
     *
     * @return array{rarity: ?string, owned: bool, quantity: int}
     */
    private function resolveSelfCard(User $user, CardType $type, int $entityId): array
    {
        $card = $this->em->getRepository(Card::class)->findOneBy([
            'type' => $type,
            'entityId' => $entityId,
        ]);

        if (!$card) {
            return ['rarity' => null, 'owned' => false, 'quantity' => 0];
        }

        $userCard = $this->em->getRepository(UserCard::class)->findOneBy([
            'user' => $user,
            'card' => $card,
        ]);

        $quantity = $userCard?->getQuantity() ?? 0;

        return [
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
