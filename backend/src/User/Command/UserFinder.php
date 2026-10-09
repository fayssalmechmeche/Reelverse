<?php

namespace App\User\Command;

use App\User\User;
use Doctrine\ORM\EntityManagerInterface;

class UserFinder
{
    public function __construct(private EntityManagerInterface $em) {}

    public function find(string $query): ?User
    {
        return $this->em->createQuery(
            'SELECT u FROM ' . User::class . ' u WHERE LOWER(u.email) = :q OR LOWER(u.username) = :q'
        )
            ->setParameter('q', mb_strtolower(trim($query)))
            ->setMaxResults(1)
            ->getOneOrNullResult();
    }
}
