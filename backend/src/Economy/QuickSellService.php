<?php

namespace App\Economy;

use App\Economy\Wallet\Wallet;
use App\Inventory\UserCard;
use App\User\User;
use Doctrine\DBAL\LockMode;
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

        return $this->em->wrapInTransaction(function () use ($user, $userCardId, $quantity) {
            $userCard = $this->em->getRepository(UserCard::class)->find($userCardId);

            if (!$userCard || $userCard->getUser()->getId() !== $user->getId()) {
                throw new \DomainException('Carte introuvable dans votre inventaire.');
            }

            // Verrou pessimiste : empêche deux ventes simultanées de consommer la même quantité
            $this->em->lock($userCard, LockMode::PESSIMISTIC_WRITE);

            $rarity = $userCard->getCard()->getRarity();
            $unitPrice = $this->pricing->priceFor($rarity);
            $totalPrice = $unitPrice * $quantity;

            $userCard->removeQuantity($quantity); // lève déjà une exception si quantité insuffisante

            $wallet = $this->em->getRepository(Wallet::class)->findOneBy(['user' => $user]);
            if (!$wallet) {
                throw new \DomainException('Wallet introuvable.');
            }
            $wallet->credit($totalPrice);

            $this->em->flush();

            return $totalPrice;
        });
    }
}
