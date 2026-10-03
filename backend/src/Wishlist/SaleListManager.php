<?php

declare(strict_types=1);

namespace App\Wishlist;

use App\Card\Card;
use App\User\User;
use Doctrine\ORM\EntityManagerInterface;
use App\Wishlist\Repository\SaleListItemRepository;

class SaleListManager
{
    public function __construct(
        private EntityManagerInterface $em,
        private SaleListItemRepository $repository,
    ) {}

    public function add(User $user, Card $card): void
    {
        if ($this->repository->findOneForUserAndCard($user, $card->getId()) !== null) {
            return;
        }

        $this->em->persist(new SaleListItem($user, $card));
        $this->em->flush();
    }

    public function remove(User $user, int $cardId): void
    {
        $item = $this->repository->findOneForUserAndCard($user, $cardId);
        if ($item === null) {
            return;
        }

        $this->em->remove($item);
        $this->em->flush();
    }

    /** @return SaleListItem[] */
    public function listForUser(User $user): array
    {
        return $this->repository->findAllForUser($user);
    }

    /** @return int[] */
    public function cardIdsForUser(User $user): array
    {
        return $this->repository->findCardIdsForUser($user);
    }
}
