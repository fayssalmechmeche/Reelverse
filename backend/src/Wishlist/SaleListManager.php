<?php

declare(strict_types=1);

namespace App\Wishlist;

use App\Card\Card;
use App\Notification\NotificationService;
use App\Notification\NotificationType;
use App\Social\Friendship;
use App\User\User;
use Doctrine\ORM\EntityManagerInterface;
use App\Wishlist\Repository\SaleListItemRepository;

class SaleListManager
{
    public function __construct(
        private EntityManagerInterface $em,
        private SaleListItemRepository $repository,
        private NotificationService $notifications,
    ) {}

    public function add(User $user, Card $card): void
    {
        if ($this->repository->findOneForUserAndCard($user, $card->getId()) !== null) {
            return;
        }

        $this->em->persist(new SaleListItem($user, $card));
        $this->notifyFriendsWishingFor($user, $card);
        $this->em->flush();
    }

    /** Prévient les amis qui ont cette carte dans leur wishlist. */
    private function notifyFriendsWishingFor(User $user, Card $card): void
    {
        /** @var WishlistItem[] $wishes */
        $wishes = $this->em->createQueryBuilder()
            ->select('w', 'u')
            ->from(WishlistItem::class, 'w')
            ->join('w.user', 'u')
            ->join(Friendship::class, 'f', 'WITH', '(f.requester = :me AND f.addressee = u) OR (f.addressee = :me AND f.requester = u)')
            ->where('w.card = :card AND f.status = :accepted AND u <> :me')
            ->setParameter('me', $user)
            ->setParameter('card', $card)
            // Valeur littérale : l'enum FriendshipStatus vit dans Friendship.php, non autochargeable seul.
            ->setParameter('accepted', 'accepted')
            ->getQuery()
            ->getResult();

        foreach ($wishes as $wish) {
            $this->notifications->notify(
                $wish->getUser(),
                NotificationType::WISHLIST_MATCH,
                sprintf('%s propose une carte %s de ta wishlist.', $user->getPseudo(), $card->getRarity()->value),
                '/profile?tab=social',
            );
        }
    }

    public function remove(User $user, int $cardId): void
    {
        $item = $this->repository->findOneForUserAndCard($user, $cardId);
        if ($item === null) {
            return;
        }

        $this->em->remove($item);
        $this->em->flush();
    }

    /** @return SaleListItem[] */
    public function listForUser(User $user): array
    {
        return $this->repository->findAllForUser($user);
    }

    /** @return int[] */
    public function cardIdsForUser(User $user): array
    {
        return $this->repository->findCardIdsForUser($user);
    }
}
