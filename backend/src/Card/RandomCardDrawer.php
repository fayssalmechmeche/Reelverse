<?php

namespace App\Card;

use Doctrine\ORM\EntityManagerInterface;
use Symfony\Contracts\Cache\CacheInterface;
use Symfony\Contracts\Cache\ItemInterface;

/**
 * Tire une carte au hasard parmi une rareté, sans doublon avec $excludeIds.
 *
 * Les ids de chaque rareté sont gardés en cache (une liste d'entiers : quelques
 * centaines de Ko même pour 100 000 cartes). Un tirage = un choix aléatoire
 * en mémoire + une lecture par clé primaire, au lieu d'un COUNT suivi d'un
 * OFFSET qui ralentit avec la taille de la table.
 */
class RandomCardDrawer
{
    private const CACHE_TTL = 600; // 10 minutes : un import apparait au plus tard apres ce delai
    private const MAX_RANDOM_TRIES = 25;

    /** @var array<string, int[]> copie en memoire pour la duree de la requete */
    private array $idsByRarity = [];

    public function __construct(
        private EntityManagerInterface $em,
        private CacheInterface $cache,
    ) {}

    public function pickRandomCard(Rarity $rarity, array $excludeIds = []): ?Card
    {
        $ids = $this->idsFor($rarity);
        $total = count($ids);

        if ($total === 0) {
            return null;
        }

        $excluded = array_flip($excludeIds);
        $pickedId = null;

        // Cas courant : on tire au hasard et on recommence si la carte est exclue.
        for ($try = 0; $try < self::MAX_RANDOM_TRIES; $try++) {
            $candidate = $ids[random_int(0, $total - 1)];
            if (!isset($excluded[$candidate])) {
                $pickedId = $candidate;
                break;
            }
        }

        // Rareté presque épuisée (peu de cartes) : on filtre explicitement.
        if ($pickedId === null) {
            $remaining = array_values(array_filter($ids, fn(int $id) => !isset($excluded[$id])));
            if ($remaining === []) {
                return null;
            }
            $pickedId = $remaining[random_int(0, count($remaining) - 1)];
        }

        return $this->em->find(Card::class, $pickedId);
    }

    /** @return int[] */
    private function idsFor(Rarity $rarity): array
    {
        $key = $rarity->value;

        return $this->idsByRarity[$key] ??= $this->cache->get(
            'card_ids_' . $key,
            function (ItemInterface $item) use ($rarity): array {
                $item->expiresAfter(self::CACHE_TTL);

                $ids = $this->em->createQueryBuilder()
                    ->select('c.id')
                    ->from(Card::class, 'c')
                    ->where('c.rarity = :rarity')
                    ->setParameter('rarity', $rarity)
                    ->getQuery()
                    ->getSingleColumnResult();

                return array_map('intval', $ids);
            }
        );
    }
}
