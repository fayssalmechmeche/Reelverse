<?php

declare(strict_types=1);

namespace App\Wishlist\Repository;

use App\User\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use App\Wishlist\WishlistItem;

class WishlistItemRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, WishlistItem::class);
    }

    /** @return WishlistItem[] */
    public function findAllForUser(User $user): array
    {
        return $this->createQueryBuilder('w')
            ->andWhere('w.user = :user')
            ->setParameter('user', $user)
            ->orderBy('w.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findOneForUserAndCard(User $user, int $cardId): ?WishlistItem
    {
        return $this->createQueryBuilder('w')
            ->andWhere('w.user = :user')
            ->andWhere('w.card = :cardId')
            ->setParameter('user', $user)
            ->setParameter('cardId', $cardId)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /** @return int[] identifiants de cartes */
    public function findCardIdsForUser(User $user): array
    {
        $rows = $this->createQueryBuilder('w')
            ->select('c.id as cardId')
            ->join('w.card', 'c')
            ->andWhere('w.user = :user')
            ->setParameter('user', $user)
            ->getQuery()
            ->getScalarResult();

        return array_map(static fn(array $row): int => (int) $row['cardId'], $rows);
    }
}
