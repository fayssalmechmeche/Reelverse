<?php

namespace App\Pack;

use App\Card\Card;
use App\Card\Rarity;
use Doctrine\ORM\EntityManagerInterface;

class PackOpener
{
    public function __construct(
        private EntityManagerInterface $em,
        private PackDrawConfig $config,
    ) {}

    /**
     * @return Card[] les cartes tirées (5, sans doublon dans ce pack)
     */
    public function open(PackStock $stock): array
    {
        $stock->sync(new \DateTimeImmutable());
        $stock->consumeOne();

        $drawn = [];
        $usedIds = [];

        while (count($drawn) < PackDrawConfig::CARDS_PER_PACK) {
            $rarity = $this->config->drawRarity();
            $card = $this->pickRandomCard($rarity, $usedIds);

            if ($card === null) {
                continue; // aucune carte dispo pour cette rareté, on retire une autre rareté
            }

            $drawn[] = $card;
            $usedIds[] = $card->getId();
        }

        $this->em->flush();

        return $drawn;
    }

    private function pickRandomCard(Rarity $rarity, array $excludeIds): ?Card
    {
        $qb = $this->em->getRepository(Card::class)->createQueryBuilder('c')
            ->where('c.rarity = :rarity')
            ->setParameter('rarity', $rarity);

        if (!empty($excludeIds)) {
            $qb->andWhere('c.id NOT IN (:excluded)')
                ->setParameter('excluded', $excludeIds);
        }

        // Tirage aléatoire côté base : on compte, on prend un offset random
        $count = (clone $qb)->select('COUNT(c.id)')->getQuery()->getSingleScalarResult();

        if ($count === 0) {
            return null;
        }

        $randomOffset = random_int(0, $count - 1);

        return $qb->setFirstResult($randomOffset)
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }
}
