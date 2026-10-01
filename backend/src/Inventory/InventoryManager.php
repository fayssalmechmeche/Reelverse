<?php

namespace App\Inventory;

use App\Card\Card;
use App\User\User;
use Doctrine\ORM\EntityManagerInterface;

class InventoryManager
{
    public function __construct(private EntityManagerInterface $em) {}

    public function addCard(User $user, Card $card, int $quantity = 1): UserCard
    {
        $repo = $this->em->getRepository(UserCard::class);
        $userCard = $repo->findOneBy(['user' => $user, 'card' => $card]);

        if (!$userCard) {
            $userCard = new UserCard();
            $userCard->setUser($user);
            $userCard->setCard($card);
        }

        $userCard->addQuantity($quantity);
        $this->em->persist($userCard);

        return $userCard;
    }
}
