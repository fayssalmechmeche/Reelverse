<?php

namespace App\Shop;

use App\Card\Card;
use App\Economy\Wallet\Wallet;
use App\Inventory\InventoryManager;
use App\Pack\PackDrawConfig;
use App\User\User;
use Doctrine\ORM\EntityManagerInterface;

class ShopService
{
    public function __construct(
        private EntityManagerInterface $em,
        private InventoryManager $inventory,
        private ShopPricing $pricing,
        private PackDrawConfig $drawConfig,
        private ShopGenerator $shopGenerator,
    ) {}

    public function buy(User $user, int $shopCardId): ShopCard
    {
        $shopCard = $this->getOwnedShopCard($user, $shopCardId);

        if ($shopCard->isSold()) {
            throw new \DomainException('Cette carte a déjà été vendue.');
        }

        $wallet = $this->em->getRepository(Wallet::class)->findOneBy(['user' => $user]);
        if (!$wallet) {
            throw new \DomainException('Wallet introuvable pour l\'utilisateur.');
        }
        $wallet->debit($shopCard->getPrice());

        $shopCard->markAsSold();
        $this->inventory->addCard($user, $shopCard->getCard());

        $this->em->flush();

        return $shopCard;
    }

    public function refresh(User $user, int $shopCardId): ShopCard
    {
        $oldShopCard = $this->getOwnedShopCard($user, $shopCardId);

        if ($oldShopCard->isSold()) {
            throw new \DomainException('Impossible de refresh une carte déjà vendue.');
        }

        if ($oldShopCard->isRefreshed()) {
            throw new \DomainException('Cette carte a déjà été refresh aujourd\'hui.');
        }

        $wallet = $this->em->getRepository(Wallet::class)->findOneBy(['user' => $user]);
        if (!$wallet) {
            throw new \DomainException('Wallet introuvable pour l\'utilisateur.');
        }
        $wallet->debit($this->pricing->refreshCost());

        // L'ancienne disparaît (marquée vendue + refreshed, donc plus jamais refreshable)
        $oldShopCard->markAsSold();
        $oldShopCard->markAsRefreshed();

        // Une nouvelle carte est générée à la même place, même rareté tirée au hasard,
        // le prix des autres cartes du shop ne change pas (seul le prix du refresh est payé)
        $rarity = $this->drawConfig->drawRarity();
        $existingIds = array_map(
            fn($sc) => $sc->getCard()->getId(),
            $oldShopCard->getShop()->getShopCards()->toArray()
        );
        $newCard = $this->shopGenerator->pickRandomCard($rarity, $existingIds);

        if ($newCard !== null) {
            $newShopCard = new ShopCard();
            $newShopCard->setCard($newCard);
            $newShopCard->setPrice($this->pricing->priceFor($rarity));
            $newShopCard->markAsRefreshed(); // la nouvelle ne peut plus être re-refreshed non plus aujourd'hui
            $oldShopCard->getShop()->addShopCard($newShopCard);
            $this->em->persist($newShopCard);
        }

        $this->em->flush();

        return $newShopCard ?? $oldShopCard;
    }

    private function getOwnedShopCard(User $user, int $shopCardId): ShopCard
    {
        $shopCard = $this->em->getRepository(ShopCard::class)->find($shopCardId);

        if (!$shopCard || $shopCard->getShop()->getUser()->getId() !== $user->getId()) {
            throw new \DomainException('Carte introuvable.');
        }

        return $shopCard;
    }
}
