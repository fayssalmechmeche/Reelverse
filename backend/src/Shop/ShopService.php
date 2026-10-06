<?php

namespace App\Shop;

use App\Card\RandomCardDrawer;
use App\Economy\Wallet\WalletService;
use App\Inventory\InventoryManager;
use App\Pack\PackDrawConfig;
use App\User\User;
use Doctrine\DBAL\LockMode;
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
        private WalletService $wallet,
    ) {}

    public function buy(User $user, int $shopCardId): ShopCard
    {
        return $this->em->wrapInTransaction(function () use ($user, $shopCardId) {
            // Ligne verrouillée ET relue : un double clic ou une requête parallèle
            // attend ici, puis voit la carte déjà vendue.
            $shopCard = $this->getOwnedShopCard($user, $shopCardId);

            if ($shopCard->isSold()) {
                throw new \DomainException('Cette carte a déjà été vendue.');
            }

            $this->wallet->debit((int) $user->getId(), $shopCard->getPrice());

            $shopCard->markAsSold();
            $this->inventory->addCard($user, $shopCard->getCard());
            $this->achievementChecker->onCardsObtained($user, [$shopCard->getCard()]);

            $this->em->flush();

            return $shopCard;
        });
    }

    public function refresh(User $user, int $shopCardId): ShopCard
    {
        return $this->em->wrapInTransaction(function () use ($user, $shopCardId) {
            $oldShopCard = $this->getOwnedShopCard($user, $shopCardId);

            if ($oldShopCard->isSold()) {
                throw new \DomainException('Impossible de refresh une carte déjà vendue.');
            }

            if ($oldShopCard->isRefreshed()) {
                throw new \DomainException('Cette carte a déjà été refresh aujourd\'hui.');
            }

            $this->wallet->debit((int) $user->getId(), $this->pricing->refreshCost());

            $rarity = $this->drawConfig->drawRarity();
            $existingIds = array_map(
                fn($sc) => $sc->getCard()->getId(),
                $oldShopCard->getShop()->getShopCards()->toArray()
            );
            $newCard = $this->drawer->pickRandomCard($rarity, $existingIds);

            if ($newCard === null) {
                // L'exception annule la transaction : le débit est remboursé.
                throw new \DomainException('Aucune carte disponible pour le refresh.');
            }

            // On remplace la carte en place (même ligne), au lieu d'en ajouter une nouvelle :
            // le document précise que la carte refresh "disparaît" et une nouvelle apparaît "à sa place".
            $oldShopCard->setCard($newCard);
            $oldShopCard->setPrice($this->pricing->priceFor($rarity));
            $oldShopCard->markAsRefreshed();

            $this->em->flush();

            return $oldShopCard;
        });
    }

    /** À appeler dans une transaction : charge la ligne avec un verrou d'écriture. */
    private function getOwnedShopCard(User $user, int $shopCardId): ShopCard
    {
        $shopCard = $this->em->find(ShopCard::class, $shopCardId, LockMode::PESSIMISTIC_WRITE);

        if (!$shopCard || $shopCard->getShop()->getUser()->getId() !== $user->getId()) {
            throw new \DomainException('Carte introuvable.');
        }

        return $shopCard;
    }
}
