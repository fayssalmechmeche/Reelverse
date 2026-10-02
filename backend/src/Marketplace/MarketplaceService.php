<?php

namespace App\Marketplace;

use App\Card\Card;
use App\Economy\Wallet\Wallet;
use App\Inventory\InventoryManager;
use App\Inventory\UserCard;
use App\User\User;
use Doctrine\DBAL\LockMode;
use Doctrine\ORM\EntityManagerInterface;

class MarketplaceService
{
    private const TAX_PERCENT = 5;

    public function __construct(
        private EntityManagerInterface $em,
        private InventoryManager $inventory,
    ) {}

    public function createListing(User $seller, int $cardId, int $price): MarketplaceListing
    {
        if ($price < 1) {
            throw new \InvalidArgumentException('Le prix doit être positif.');
        }

        $this->em->wrapInTransaction(function () use ($seller, $cardId, $price) {
            $card = $this->em->getRepository(Card::class)->find($cardId);
            if (!$card) {
                throw new \DomainException('Carte introuvable.');
            }

            $userCard = $this->em->getRepository(UserCard::class)->findOneBy(['user' => $seller, 'card' => $card]);

            // Verrou pessimiste : empêche une double mise en vente simultanée de la même ligne d'inventaire
            if ($userCard) {
                $this->em->lock($userCard, LockMode::PESSIMISTIC_WRITE);
            }

            if (!$userCard || $userCard->getQuantity() < 1) {
                throw new \DomainException('Vous ne possédez pas cette carte.');
            }

            $userCard->removeQuantity(1);

            $listing = new MarketplaceListing();
            $listing->setSeller($seller);
            $listing->setCard($card);
            $listing->setPrice($price);

            $this->em->persist($listing);
            $this->em->flush();
        });

        return $this->em->getRepository(MarketplaceListing::class)->findOneBy(['seller' => $seller], ['createdAt' => 'DESC']);
    }

    public function cancelListing(User $seller, int $listingId): void
    {
        $this->em->wrapInTransaction(function () use ($seller, $listingId) {
            $listing = $this->em->getRepository(MarketplaceListing::class)->find($listingId);

            if (!$listing) {
                throw new \DomainException('Annonce introuvable.');
            }

            $this->em->lock($listing, LockMode::PESSIMISTIC_WRITE);

            if ($listing->getSeller()->getId() !== $seller->getId()) {
                throw new \DomainException('Cette annonce ne vous appartient pas.');
            }

            if (!$listing->isActive()) {
                throw new \DomainException('Cette annonce n\'est plus active.');
            }

            $listing->cancel();
            $this->inventory->addCard($seller, $listing->getCard(), 1);

            $this->em->flush();
        });
    }

    public function buy(User $buyer, int $listingId): MarketplaceListing
    {
        return $this->em->wrapInTransaction(function () use ($buyer, $listingId) {
            $listing = $this->em->getRepository(MarketplaceListing::class)->find($listingId);

            if (!$listing) {
                throw new \DomainException('Annonce introuvable.');
            }

            // Verrou pessimiste : la ligne est bloquée le temps de la transaction,
            // un achat concurrent sur la même annonce attendra puis échouera proprement
            $this->em->lock($listing, LockMode::PESSIMISTIC_WRITE);

            if (!$listing->isActive()) {
                throw new \DomainException('Cette annonce n\'est plus disponible.');
            }

            if ($listing->getSeller()->getId() === $buyer->getId()) {
                throw new \DomainException('Vous ne pouvez pas acheter votre propre annonce.');
            }

            $buyerWallet = $this->em->getRepository(Wallet::class)->findOneBy(['user' => $buyer]);
            if (!$buyerWallet) {
                throw new \DomainException('Wallet introuvable pour l\'acheteur.');
            }
            $buyerWallet->debit($listing->getPrice());

            $tax = (int) floor($listing->getPrice() * self::TAX_PERCENT / 100);
            $sellerEarning = $listing->getPrice() - $tax;

            $sellerWallet = $this->em->getRepository(Wallet::class)->findOneBy(['user' => $listing->getSeller()]);
            if (!$sellerWallet) {
                throw new \DomainException('Wallet introuvable pour le vendeur.');
            }
            $sellerWallet->credit($sellerEarning);

            $listing->markAsSold();
            $this->inventory->addCard($buyer, $listing->getCard(), 1);

            $this->em->flush();

            return $listing;
        });
    }
}
