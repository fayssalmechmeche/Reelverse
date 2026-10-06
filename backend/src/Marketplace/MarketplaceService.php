<?php

namespace App\Marketplace;

use App\Card\Card;
use App\Economy\Wallet\WalletService;
use App\Inventory\InventoryManager;
use App\Inventory\UserCard;
use App\User\User;
use Doctrine\DBAL\LockMode;
use Doctrine\ORM\EntityManagerInterface;
use App\Achievement\AchievementChecker;

class MarketplaceService
{
    private const TAX_PERCENT = 5;
    public const MAX_PRICE = 10_000_000;
    public const MAX_ACTIVE_LISTINGS = 50;

    public function __construct(
        private EntityManagerInterface $em,
        private InventoryManager $inventory,
        private AchievementChecker $achievementChecker,
        private WalletService $wallet,
    ) {}

    public function createListing(User $seller, int $cardId, int $price): MarketplaceListing
    {
        if ($price < 1 || $price > self::MAX_PRICE) {
            throw new \InvalidArgumentException(sprintf('Le prix doit être compris entre 1 et %d.', self::MAX_PRICE));
        }

        return $this->em->wrapInTransaction(function () use ($seller, $cardId, $price) {
            $card = $this->em->getRepository(Card::class)->find($cardId);
            if (!$card) {
                throw new \DomainException('Carte introuvable.');
            }

            $userCard = $this->em->getRepository(UserCard::class)->findOneBy(['user' => $seller, 'card' => $card]);

            // Relecture avec verrou : empêche deux mises en vente simultanées du même exemplaire.
            if ($userCard) {
                $this->em->refresh($userCard, LockMode::PESSIMISTIC_WRITE);
            }

            if (!$userCard || $userCard->getQuantity() < 1) {
                throw new \DomainException('Vous ne possédez pas cette carte.');
            }

            $active = $this->em->getRepository(MarketplaceListing::class)->count([
                'seller' => $seller,
                'sold' => false,
                'cancelled' => false,
            ]);
            if ($active >= self::MAX_ACTIVE_LISTINGS) {
                throw new \DomainException(sprintf('Vous ne pouvez pas avoir plus de %d annonces actives.', self::MAX_ACTIVE_LISTINGS));
            }

            $userCard->removeQuantity(1);

            $listing = new MarketplaceListing();
            $listing->setSeller($seller);
            $listing->setCard($card);
            $listing->setPrice($price);

            $this->em->persist($listing);
            $this->em->flush();

            return $listing;
        });
    }

    public function cancelListing(User $seller, int $listingId): void
    {
        $this->em->wrapInTransaction(function () use ($seller, $listingId) {
            $listing = $this->em->find(MarketplaceListing::class, $listingId, LockMode::PESSIMISTIC_WRITE);

            if (!$listing) {
                throw new \DomainException('Annonce introuvable.');
            }

            if ($listing->getSeller()->getId() !== $seller->getId()) {
                throw new \DomainException('Cette annonce ne vous appartient pas.');
            }

            if (!$listing->isActive()) {
                throw new \DomainException('Cette annonce n\'est plus active.');
            }

            $listing->cancel();
            // La carte revient simplement à son propriétaire : pas une nouvelle obtention.
            $this->inventory->addCard($seller, $listing->getCard(), 1, false);

            $this->em->flush();
        });
    }

    public function buy(User $buyer, int $listingId): MarketplaceListing
    {
        return $this->em->wrapInTransaction(function () use ($buyer, $listingId) {
            // Chargement AVEC verrou : un achat concurrent attend ici, puis voit l'annonce vendue.
            $listing = $this->em->find(MarketplaceListing::class, $listingId, LockMode::PESSIMISTIC_WRITE);

            if (!$listing) {
                throw new \DomainException('Annonce introuvable.');
            }

            if (!$listing->isActive()) {
                throw new \DomainException('Cette annonce n\'est plus disponible.');
            }

            $seller = $listing->getSeller();
            if ($seller->getId() === $buyer->getId()) {
                throw new \DomainException('Vous ne pouvez pas acheter votre propre annonce.');
            }

            $price = $listing->getPrice();
            $tax = (int) floor($price * self::TAX_PERCENT / 100);
            $sellerEarning = $price - $tax;

            $buyerId = (int) $buyer->getId();
            $sellerId = (int) $seller->getId();

            // Les deux mises à jour de solde se font toujours dans le même ordre (id croissant),
            // pour éviter un blocage mutuel quand deux joueurs s'achètent l'un à l'autre.
            if ($buyerId < $sellerId) {
                $this->wallet->debit($buyerId, $price);
                $this->wallet->credit($sellerId, $sellerEarning);
            } else {
                $this->wallet->credit($sellerId, $sellerEarning);
                $this->wallet->debit($buyerId, $price);
            }

            $listing->markAsSold();
            $this->inventory->addCard($buyer, $listing->getCard(), 1);
            $this->achievementChecker->onCardsObtained($buyer, [$listing->getCard()]);

            $this->em->flush();

            return $listing;
        });
    }
}
