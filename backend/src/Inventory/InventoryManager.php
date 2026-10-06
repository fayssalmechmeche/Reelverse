<?php

namespace App\Inventory;

use App\Achievement\CardAcquisitionLog;
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

        // Première obtention (ou retour après une revente totale) : carte "nouvelle"
        if ($userCard->getQuantity() === 0 && $quantity > 0) {
            $userCard->setIsNew(true);
        }

        $userCard->addQuantity($quantity);
        $this->em->persist($userCard);

        $log = new CardAcquisitionLog();
        $log->setUser($user);
        $log->setCard($card);
        $log->setQuantity($quantity);
        $this->em->persist($log);

        return $userCard;
    }
}
