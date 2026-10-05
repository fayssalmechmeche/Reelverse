<?php

namespace App\Trading\Controller;

use App\Trading\Trade;
use App\User\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;

#[AsController]
class ListTradesController
{
    public function __construct(
        private EntityManagerInterface $em,
        private Security $security,
    ) {}

    #[Route('/api/trades', name: 'api_trades_list', methods: ['GET'])]
    public function __invoke(): JsonResponse
    {
        /** @var User|null $me */
        $me = $this->security->getUser();
        if (!$me) {
            return new JsonResponse(['error' => 'Authentification requise.'], 401);
        }

        $trades = $this->em->getRepository(Trade::class)->createQueryBuilder('t')
            ->where('t.proposer = :me OR t.recipient = :me')
            ->setParameter('me', $me)
            ->orderBy('t.createdAt', 'DESC')
            ->getQuery()
            ->getResult();

        return new JsonResponse(array_map(fn($t) => [
            'id' => $t->getId(),
            'proposerId' => $t->getProposer()->getId(),
            'proposerUsername' => $t->getProposer()->getPseudo(),
            'proposerAvatarUrl' => $t->getProposer()->getAvatarUrl(),
            'recipientId' => $t->getRecipient()->getId(),
            'recipientUsername' => $t->getRecipient()->getPseudo(),
            'recipientAvatarUrl' => $t->getRecipient()->getAvatarUrl(),
            'status' => $t->getStatus()->value,
            'expiresAt' => $t->getExpiresAt()->format(\DateTimeImmutable::ATOM),
            'items' => array_map(fn($item) => [
                'ownerId' => $item->getOwner()->getId(),
                'cardId' => $item->getCard()->getId(),
                'type' => $item->getCard()->getType()->value,
                'entityId' => $item->getCard()->getEntityId(),
                'rarity' => $item->getCard()->getRarity()->value,
            ], $t->getItems()->toArray()),
        ], $trades));
    }
}
