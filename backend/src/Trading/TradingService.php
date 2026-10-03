<?php

namespace App\Trading;

use App\Card\Card;
use App\Inventory\InventoryManager;
use App\Inventory\UserCard;
use App\Social\FriendshipService;
use App\User\User;
use Doctrine\DBAL\LockMode;
use Doctrine\ORM\EntityManagerInterface;
use App\Achievement\AchievementChecker;

class TradingService
{
    public function __construct(
        private EntityManagerInterface $em,
        private InventoryManager $inventory,
        private FriendshipService $friendshipService,
        private AchievementChecker $achievementChecker,
    ) {}

    /**
     * @param int[] $proposerCardIds
     * @param int[] $recipientCardIds
     */
    public function propose(User $proposer, User $recipient, array $proposerCardIds, array $recipientCardIds): Trade
    {
        if ($proposer->getId() === $recipient->getId()) {
            throw new \DomainException('Vous ne pouvez pas échanger avec vous-même.');
        }

        if (!$this->friendshipService->areFriends($proposer, $recipient)) {
            throw new \DomainException('Les échanges ne sont possibles qu\'entre amis.');
        }

        if (empty($proposerCardIds) && empty($recipientCardIds)) {
            throw new \DomainException('L\'échange doit contenir au moins une carte.');
        }

        $this->assertOwnership($proposer, $proposerCardIds);
        $this->assertOwnership($recipient, $recipientCardIds);

        $trade = new Trade();
        $trade->setProposer($proposer);
        $trade->setRecipient($recipient);

        foreach ($proposerCardIds as $cardId) {
            $item = new TradeItem();
            $item->setOwner($proposer);
            $item->setCard($this->em->getRepository(Card::class)->find($cardId));
            $trade->addItem($item);
        }

        foreach ($recipientCardIds as $cardId) {
            $item = new TradeItem();
            $item->setOwner($recipient);
            $item->setCard($this->em->getRepository(Card::class)->find($cardId));
            $trade->addItem($item);
        }

        $this->em->persist($trade);
        $this->em->flush();

        return $trade;
    }

    public function accept(User $user, int $tradeId): Trade
    {
        return $this->em->wrapInTransaction(function () use ($user, $tradeId) {
            $trade = $this->em->getRepository(Trade::class)->find($tradeId);

            if (!$trade || $trade->getRecipient()->getId() !== $user->getId()) {
                throw new \DomainException('Échange introuvable.');
            }

            if ($trade->getStatus() !== TradeStatus::PENDING) {
                throw new \DomainException('Cet échange n\'est plus en attente.');
            }

            if ($trade->isExpired()) {
                $trade->setStatus(TradeStatus::EXPIRED);
                $this->em->flush();
                throw new \DomainException('Cet échange a expiré.');
            }

            // Revérification stricte de la possession de CHAQUE carte, au moment T de l'acceptation,
            // avec verrou pessimiste pour empêcher qu'une carte soit vendue entre la lecture et l'écriture
            foreach ($trade->getItems() as $item) {
                $userCard = $this->em->getRepository(UserCard::class)->findOneBy([
                    'user' => $item->getOwner(),
                    'card' => $item->getCard(),
                ]);

                if ($userCard) {
                    $this->em->lock($userCard, LockMode::PESSIMISTIC_WRITE);
                }

                if (!$userCard || $userCard->getQuantity() < 1) {
                    $trade->setStatus(TradeStatus::CANCELLED);
                    $this->em->flush();
                    throw new \DomainException('Une des cartes de l\'échange n\'est plus disponible. Échange annulé.');
                }
            }

            // Toutes les cartes sont confirmées disponibles : on échange réellement
            foreach ($trade->getItems() as $item) {
                $userCard = $this->em->getRepository(UserCard::class)->findOneBy([
                    'user' => $item->getOwner(),
                    'card' => $item->getCard(),
                ]);
                $userCard->removeQuantity(1);

                $newOwner = $item->getOwner()->getId() === $trade->getProposer()->getId()
                    ? $trade->getRecipient()
                    : $trade->getProposer();

                $this->inventory->addCard($newOwner, $item->getCard(), 1);
                $this->achievementChecker->onCardsObtained($newOwner, [$item->getCard()->getRarity()]);
            }

            $trade->setStatus(TradeStatus::ACCEPTED);
            $this->em->flush();

            return $trade;
        });
    }

    public function cancel(User $user, int $tradeId): void
    {
        $trade = $this->em->getRepository(Trade::class)->find($tradeId);

        if (!$trade || !$trade->involves($user)) {
            throw new \DomainException('Échange introuvable.');
        }

        if ($trade->getStatus() !== TradeStatus::PENDING) {
            throw new \DomainException('Cet échange ne peut plus être annulé.');
        }

        $trade->setStatus(TradeStatus::CANCELLED);
        $this->em->flush();
    }

    private function assertOwnership(User $user, array $cardIds): void
    {
        foreach ($cardIds as $cardId) {
            $card = $this->em->getRepository(Card::class)->find($cardId);
            if (!$card) {
                throw new \DomainException("Carte $cardId introuvable.");
            }

            $userCard = $this->em->getRepository(UserCard::class)->findOneBy(['user' => $user, 'card' => $card]);
            if (!$userCard || $userCard->getQuantity() < 1) {
                throw new \DomainException("Vous ne possédez pas la carte $cardId.");
            }
        }
    }
}
