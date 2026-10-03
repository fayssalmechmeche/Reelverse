<?php

declare(strict_types=1);

namespace App\Wishlist\Repository;

use App\User\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use App\Wishlist\SaleListItem;

class SaleListItemRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, SaleListItem::class);
    }

    /** @return SaleListItem[] */
    public function findAllForUser(User $user): array
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.user = :user')
            ->setParameter('user', $user)
            ->orderBy('s.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findOneForUserAndCard(User $user, int $cardId): ?SaleListItem
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.user = :user')
            ->andWhere('s.card = :cardId')
            ->setParameter('user', $user)
            ->setParameter('cardId', $cardId)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /** @return int[] identifiants de cartes */
    public function findCardIdsForUser(User $user): array
    {
        $rows = $this->createQueryBuilder('s')
            ->select('c.id as cardId')
            ->join('s.card', 'c')
            ->andWhere('s.user = :user')
            ->setParameter('user', $user)
            ->getQuery()
            ->getScalarResult();

        return array_map(static fn(array $row): int => (int) $row['cardId'], $rows);
    }
}
