<?php

declare(strict_types=1);

namespace App\Wishlist\Controller;

use App\Card\Card;
use App\User\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use App\Wishlist\WishlistManager;

#[Route('/api/wishlist')]
class WishlistController
{
    public function __construct(
        private WishlistManager $wishlistManager,
        private EntityManagerInterface $em,
        private Security $security,
    ) {}

    #[Route('', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $items = $this->wishlistManager->listForUser($this->currentUser());

        return new JsonResponse(array_map(
            static fn($item) => [
                'cardId' => $item->getCard()->getId(),
                'type' => $item->getCard()->getType()->value,
                'entityId' => $item->getCard()->getEntityId(),
                'rarity' => $item->getCard()->getRarity()->value,
                'addedAt' => $item->getCreatedAt()->format(DATE_ATOM),
            ],
            $items,
        ));
    }

    #[Route('/{cardId}', methods: ['POST'])]
    public function add(int $cardId): JsonResponse
    {
        $card = $this->em->getRepository(Card::class)->find($cardId);
        if ($card === null) {
            return new JsonResponse(['error' => 'Carte introuvable'], Response::HTTP_NOT_FOUND);
        }

        $this->wishlistManager->add($this->currentUser(), $card);

        return new JsonResponse(['status' => 'ok']);
    }

    #[Route('/{cardId}', methods: ['DELETE'])]
    public function remove(int $cardId): JsonResponse
    {
        $this->wishlistManager->remove($this->currentUser(), $cardId);

        return new JsonResponse(['status' => 'ok']);
    }

    private function currentUser(): User
    {
        $user = $this->security->getUser();
        if (!$user instanceof User) {
            throw new \LogicException('Utilisateur non authentifié');
        }

        return $user;
    }
}
