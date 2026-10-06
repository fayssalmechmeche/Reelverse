<?php

namespace App\Inventory;

use App\Achievement\CardAcquisitionLog;
use App\Card\Card;
use App\User\User;
use Doctrine\DBAL\LockMode;
use Doctrine\ORM\EntityManagerInterface;

class InventoryManager
{
    public function __construct(private EntityManagerInterface $em) {}

    /**
     * @param bool $logAcquisition false quand la carte ne fait que revenir à son propriétaire
     *                             (annulation d'une annonce) : ce n'est pas une nouvelle obtention,
     *                             elle ne doit donc pas compter pour les quêtes et les succès.
     */
    public function addCard(User $user, Card $card, int $quantity = 1, bool $logAcquisition = true): UserCard
    {
        $repo = $this->em->getRepository(UserCard::class);
        $userCard = $repo->findOneBy(['user' => $user, 'card' => $card]);

        if (!$userCard) {
            $userCard = new UserCard();
            $userCard->setUser($user);
            $userCard->setCard($card);
        } elseif ($this->em->getConnection()->isTransactionActive()) {
            // Relit la ligne avec un verrou d'écriture : deux ajouts simultanés
            // de la même carte ne s'écrasent plus (perte d'exemplaire).
            // Le flush préalable évite que le refresh n'efface des modifications en attente.
            $this->em->flush();
            $this->em->refresh($userCard, LockMode::PESSIMISTIC_WRITE);
        }

        // Première obtention (ou retour après une revente totale) : carte "nouvelle"
        if ($userCard->getQuantity() === 0 && $quantity > 0) {
            $userCard->setIsNew(true);
        }

        $userCard->addQuantity($quantity);
        $this->em->persist($userCard);

        if ($logAcquisition) {
            $log = new CardAcquisitionLog();
            $log->setUser($user);
            $log->setCard($card);
            $log->setQuantity($quantity);
            $this->em->persist($log);
        }

        return $userCard;
    }
}
