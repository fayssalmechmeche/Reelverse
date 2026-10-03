<?php

namespace App\Card;

use Doctrine\ORM\EntityManagerInterface;

class RandomCardDrawer
{
    public function __construct(
        private EntityManagerInterface $em,
    ) {}

    public function pickRandomCard(Rarity $rarity, array $excludeIds = []): ?Card
    {
        $qb = $this->em->getRepository(Card::class)->createQueryBuilder('c')
            ->where('c.rarity = :rarity')
            ->setParameter('rarity', $rarity);

        if (!empty($excludeIds)) {
            $qb->andWhere('c.id NOT IN (:excluded)')
                ->setParameter('excluded', $excludeIds);
        }

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
