<?php

namespace App\Social;

use App\User\User;
use Doctrine\ORM\EntityManagerInterface;

class FriendshipService
{
    public function __construct(private EntityManagerInterface $em) {}

    public function sendRequest(User $requester, User $addressee): Friendship
    {
        if ($requester->getId() === $addressee->getId()) {
            throw new \DomainException('Vous ne pouvez pas vous ajouter vous-même.');
        }

        if ($this->isBlocked($requester, $addressee) || $this->isBlocked($addressee, $requester)) {
            throw new \DomainException('Impossible d\'envoyer une demande à cet utilisateur.');
        }

        $existing = $this->findBetween($requester, $addressee);
        if ($existing) {
            throw new \DomainException('Une relation existe déjà avec cet utilisateur.');
        }

        $friendship = new Friendship();
        $friendship->setRequester($requester);
        $friendship->setAddressee($addressee);

        $this->em->persist($friendship);
        $this->em->flush();

        return $friendship;
    }

    public function acceptRequest(User $user, int $friendshipId): Friendship
    {
        $friendship = $this->em->getRepository(Friendship::class)->find($friendshipId);

        if (!$friendship || $friendship->getAddressee()->getId() !== $user->getId()) {
            throw new \DomainException('Demande introuvable.');
        }

        if ($friendship->getStatus() === FriendshipStatus::ACCEPTED) {
            throw new \DomainException('Cette demande a déjà été acceptée.');
        }

        $friendship->accept();
        $this->em->flush();

        return $friendship;
    }

    public function declineOrRemove(User $user, int $friendshipId): void
    {
        $friendship = $this->em->getRepository(Friendship::class)->find($friendshipId);

        if (!$friendship || !$friendship->involves($user)) {
            throw new \DomainException('Relation introuvable.');
        }

        $this->em->remove($friendship);
        $this->em->flush();
    }

    public function block(User $blocker, User $blocked): void
    {
        if ($blocker->getId() === $blocked->getId()) {
            throw new \DomainException('Vous ne pouvez pas vous bloquer vous-même.');
        }

        $existing = $this->em->getRepository(Block::class)->findOneBy(['blocker' => $blocker, 'blocked' => $blocked]);
        if ($existing) {
            return; // déjà bloqué, pas d'erreur
        }

        $friendship = $this->findBetween($blocker, $blocked);
        if ($friendship) {
            $this->em->remove($friendship);
        }

        $block = new Block();
        $block->setBlocker($blocker);
        $block->setBlocked($blocked);
        $this->em->persist($block);

        $this->em->flush();
    }

    public function unblock(User $blocker, User $blocked): void
    {
        $block = $this->em->getRepository(Block::class)->findOneBy(['blocker' => $blocker, 'blocked' => $blocked]);
        if ($block) {
            $this->em->remove($block);
            $this->em->flush();
        }
    }

    public function areFriends(User $a, User $b): bool
    {
        $friendship = $this->findBetween($a, $b);
        return $friendship !== null && $friendship->getStatus() === FriendshipStatus::ACCEPTED;
    }

    private function isBlocked(User $blocker, User $blocked): bool
    {
        return $this->em->getRepository(Block::class)->findOneBy(['blocker' => $blocker, 'blocked' => $blocked]) !== null;
    }

    private function findBetween(User $a, User $b): ?Friendship
    {
        return $this->em->getRepository(Friendship::class)->createQueryBuilder('f')
            ->where('(f.requester = :a AND f.addressee = :b) OR (f.requester = :b AND f.addressee = :a)')
            ->setParameter('a', $a)
            ->setParameter('b', $b)
            ->getQuery()
            ->getOneOrNullResult();
    }
}
