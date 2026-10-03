<?php

declare(strict_types=1);

namespace App\Wishlist;

use App\Card\Card;
use App\User\User;
use Doctrine\ORM\EntityManagerInterface;
use App\Wishlist\Repository\WishlistItemRepository;

class WishlistManager
{
    public function __construct(
        private EntityManagerInterface $em,
        private WishlistItemRepository $repository,
    ) {}

    public function add(User $user, Card $card): void
    {
        if ($this->repository->findOneForUserAndCard($user, $card->getId()) !== null) {
            return; // déjà dans la wishlist : idempotent
        }

        $this->em->persist(new WishlistItem($user, $card));
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

    /** @return WishlistItem[] */
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
