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
    /** Nombre maximum de cartes (exemplaires compris) de chaque côté d'un échange. */
    public const MAX_CARDS_PER_SIDE = 50;
    /** Nombre maximum d'échanges en attente envoyés par un même joueur. */
    public const MAX_PENDING_TRADES = 20;

    public function __construct(
        private EntityManagerInterface $em,
        private InventoryManager $inventory,
        private FriendshipService $friendshipService,
        private AchievementChecker $achievementChecker,
    ) {}

    /**
     * Une même carte peut apparaître plusieurs fois dans une liste : c'est la quantité proposée.
     *
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

        if (count($proposerCardIds) > self::MAX_CARDS_PER_SIDE || count($recipientCardIds) > self::MAX_CARDS_PER_SIDE) {
            throw new \DomainException(sprintf('Un échange est limité à %d cartes de chaque côté.', self::MAX_CARDS_PER_SIDE));
        }

        $pending = (int) $this->em->createQueryBuilder()
            ->select('COUNT(t.id)')
            ->from(Trade::class, 't')
            ->where('t.proposer = :user AND t.status = :status AND t.expiresAt > :now')
            ->setParameter('user', $proposer)
            ->setParameter('status', TradeStatus::PENDING)
            ->setParameter('now', new \DateTimeImmutable())
            ->getQuery()
            ->getSingleScalarResult();
        if ($pending >= self::MAX_PENDING_TRADES) {
            throw new \DomainException('Trop d\'échanges en attente. Annulez-en ou attendez une réponse.');
        }

        $cards = [];
        $this->assertOwnership($proposer, $proposerCardIds, $cards);
        $this->assertOwnership($recipient, $recipientCardIds, $cards);

        $trade = new Trade();
        $trade->setProposer($proposer);
        $trade->setRecipient($recipient);

        foreach ($proposerCardIds as $cardId) {
            $item = new TradeItem();
            $item->setOwner($proposer);
            $item->setCard($cards[$cardId]);
            $trade->addItem($item);
        }

        foreach ($recipientCardIds as $cardId) {
            $item = new TradeItem();
            $item->setOwner($recipient);
            $item->setCard($cards[$cardId]);
            $trade->addItem($item);
        }

        $this->em->persist($trade);
        $this->em->flush();

        return $trade;
    }

    public function accept(User $user, int $tradeId): Trade
    {
        // L'échec "carte indisponible" ou "expiré" doit être enregistré (statut) PUIS signalé :
        // on le renvoie donc hors de la transaction, sinon l'exception annulerait le changement de statut.
        $failure = null;

        $trade = $this->em->wrapInTransaction(function () use ($user, $tradeId, &$failure) {
            // Verrou sur l'échange lui-même : deux acceptations (ou une acceptation et une
            // annulation) simultanées sont traitées l'une après l'autre.
            $trade = $this->em->find(Trade::class, $tradeId, LockMode::PESSIMISTIC_WRITE);

            if (!$trade || $trade->getRecipient()->getId() !== $user->getId()) {
                throw new \DomainException('Échange introuvable.');
            }

            if ($trade->getStatus() !== TradeStatus::PENDING) {
                throw new \DomainException('Cet échange n\'est plus en attente.');
            }

            if ($trade->isExpired()) {
                $trade->setStatus(TradeStatus::EXPIRED);
                $this->em->flush();
                $failure = 'Cet échange a expiré.';

                return $trade;
            }

            if (!$this->friendshipService->areFriends($trade->getProposer(), $trade->getRecipient())) {
                throw new \DomainException('Les échanges ne sont possibles qu\'entre amis.');
            }

            // Quantité à déplacer pour chaque couple (propriétaire, carte).
            $needed = [];
            foreach ($trade->getItems() as $item) {
                $key = $item->getOwner()->getId() . ':' . $item->getCard()->getId();
                $needed[$key] ??= ['owner' => $item->getOwner(), 'card' => $item->getCard(), 'count' => 0];
                $needed[$key]['count']++;
            }

            // Ordre fixe : deux échanges qui se croisent verrouillent les lignes dans le même ordre.
            uasort($needed, fn(array $a, array $b) => [$a['owner']->getId(), $a['card']->getId()]
                <=> [$b['owner']->getId(), $b['card']->getId()]);

            // Relecture stricte de la possession au moment T, lignes verrouillées et relues.
            $userCards = [];
            foreach ($needed as $key => $entry) {
                $userCard = $this->em->getRepository(UserCard::class)->findOneBy([
                    'user' => $entry['owner'],
                    'card' => $entry['card'],
                ]);

                if ($userCard) {
                    $this->em->refresh($userCard, LockMode::PESSIMISTIC_WRITE);
                }

                if (!$userCard || $userCard->getQuantity() < $entry['count']) {
                    $trade->setStatus(TradeStatus::CANCELLED);
                    $this->em->flush();
                    $failure = 'Une des cartes de l\'échange n\'est plus disponible. Échange annulé.';

                    return $trade;
                }

                $userCards[$key] = $userCard;
            }

            // Toutes les cartes sont confirmées disponibles : on échange réellement.
            $obtained = []; // userId => ['user' => User, 'cards' => Card[]]
            foreach ($needed as $key => $entry) {
                $userCards[$key]->removeQuantity($entry['count']);

                $newOwner = $entry['owner']->getId() === $trade->getProposer()->getId()
                    ? $trade->getRecipient()
                    : $trade->getProposer();

                $this->inventory->addCard($newOwner, $entry['card'], $entry['count']);

                $obtained[$newOwner->getId()]['user'] = $newOwner;
                $obtained[$newOwner->getId()]['cards'][] = $entry['card'];
            }

            foreach ($obtained as $received) {
                $this->achievementChecker->onCardsObtained($received['user'], $received['cards']);
            }

            $trade->setStatus(TradeStatus::ACCEPTED);
            $this->em->flush();

            return $trade;
        });

        if ($failure !== null) {
            throw new \DomainException($failure);
        }

        return $trade;
    }

    public function cancel(User $user, int $tradeId): void
    {
        $this->em->wrapInTransaction(function () use ($user, $tradeId) {
            $trade = $this->em->find(Trade::class, $tradeId, LockMode::PESSIMISTIC_WRITE);

            if (!$trade || !$trade->involves($user)) {
                throw new \DomainException('Échange introuvable.');
            }

            if ($trade->getStatus() !== TradeStatus::PENDING) {
                throw new \DomainException('Cet échange ne peut plus être annulé.');
            }

            $trade->setStatus(TradeStatus::CANCELLED);
            $this->em->flush();
        });
    }

    /**
     * Vérifie que $user possède assez d'exemplaires de chaque carte listée
     * (une carte listée 3 fois demande 3 exemplaires) et remplit $cards (id => Card).
     *
     * @param int[] $cardIds
     * @param array<int, Card> $cards
     */
    private function assertOwnership(User $user, array $cardIds, array &$cards): void
    {
        foreach (array_count_values($cardIds) as $cardId => $count) {
            $card = $cards[$cardId] ?? $this->em->getRepository(Card::class)->find($cardId);
            if (!$card) {
                throw new \DomainException("Carte $cardId introuvable.");
            }
            $cards[$cardId] = $card;

            $userCard = $this->em->getRepository(UserCard::class)->findOneBy(['user' => $user, 'card' => $card]);
            if (!$userCard || $userCard->getQuantity() < $count) {
                throw new \DomainException("Vous ne possédez pas assez d'exemplaires de la carte $cardId.");
            }
        }
    }
}
