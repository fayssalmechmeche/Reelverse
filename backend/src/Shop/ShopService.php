<?php

namespace App\Shop;

use App\Card\RandomCardDrawer;
use App\Economy\Wallet\Wallet;
use App\Inventory\InventoryManager;
use App\Pack\PackDrawConfig;
use App\User\User;
use Doctrine\ORM\EntityManagerInterface;
use App\Achievement\AchievementChecker;

class ShopService
{
    public function __construct(
        private EntityManagerInterface $em,
        private InventoryManager $inventory,
        private ShopPricing $pricing,
        private PackDrawConfig $drawConfig,
        private RandomCardDrawer $drawer,
        private AchievementChecker $achievementChecker,
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
        $this->achievementChecker->onCardsObtained($user, [$shopCard->getCard()->getRarity()]);

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

        $oldShopCard->markAsSold();
        $oldShopCard->markAsRefreshed();

        $rarity = $this->drawConfig->drawRarity();
        $existingIds = array_map(
            fn($sc) => $sc->getCard()->getId(),
            $oldShopCard->getShop()->getShopCards()->toArray()
        );
        $newCard = $this->drawer->pickRandomCard($rarity, $existingIds);

        if ($newCard !== null) {
            $newShopCard = new ShopCard();
            $newShopCard->setCard($newCard);
            $newShopCard->setPrice($this->pricing->priceFor($rarity));
            $newShopCard->markAsRefreshed();
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
