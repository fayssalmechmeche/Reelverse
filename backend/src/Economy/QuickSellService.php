<?php

namespace App\Economy;

use App\Economy\Wallet\WalletService;
use App\Inventory\UserCard;
use App\User\User;
use Doctrine\DBAL\LockMode;
use Doctrine\ORM\EntityManagerInterface;

class QuickSellService
{
    public function __construct(
        private EntityManagerInterface $em,
        private QuickSellPricing $pricing,
        private WalletService $wallet,
    ) {}

    public function sell(User $user, int $userCardId, int $quantity = 1): int
    {
        if ($quantity < 1) {
            throw new \InvalidArgumentException('La quantité doit être au moins 1.');
        }

        return $this->em->wrapInTransaction(function () use ($user, $userCardId, $quantity) {
            // Chargement AVEC verrou : la quantité lue est celle d'après toute vente concurrente.
            // (EntityManager::lock() seul ne relit pas l'entité et laisserait passer une double vente.)
            $userCard = $this->em->find(UserCard::class, $userCardId, LockMode::PESSIMISTIC_WRITE);

            if (!$userCard || $userCard->getUser()->getId() !== $user->getId()) {
                throw new \DomainException('Carte introuvable dans votre inventaire.');
            }

            $rarity = $userCard->getCard()->getRarity();
            $unitPrice = $this->pricing->priceFor($rarity);
            $totalPrice = $unitPrice * $quantity;

            $userCard->removeQuantity($quantity); // lève déjà une exception si quantité insuffisante

            $this->wallet->credit((int) $user->getId(), $totalPrice);

            $this->em->flush();

            return $totalPrice;
        });
    }
}
