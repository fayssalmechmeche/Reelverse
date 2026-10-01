<?php

namespace App\Economy;

use App\Economy\Wallet\Wallet;
use App\Inventory\UserCard;
use App\User\User;
use Doctrine\ORM\EntityManagerInterface;

class QuickSellService
{
    public function __construct(
        private EntityManagerInterface $em,
        private QuickSellPricing $pricing,
    ) {}

    public function sell(User $user, int $userCardId, int $quantity = 1): int
    {
        if ($quantity < 1) {
            throw new \InvalidArgumentException('La quantité doit être au moins 1.');
        }

        $userCard = $this->em->getRepository(UserCard::class)->find($userCardId);

        if (!$userCard || $userCard->getUser()->getId() !== $user->getId()) {
            throw new \DomainException('Carte introuvable dans votre inventaire.');
        }

        $rarity = $userCard->getCard()->getRarity();
        $unitPrice = $this->pricing->priceFor($rarity);
        $totalPrice = $unitPrice * $quantity;

        $userCard->removeQuantity($quantity); // lève déjà une exception si quantité insuffisante

        $wallet = $this->em->getRepository(Wallet::class)->findOneBy(['user' => $user]);
        $wallet->credit($totalPrice);

        $this->em->flush();

        return $totalPrice;
    }
}
