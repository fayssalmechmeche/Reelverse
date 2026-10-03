<?php

namespace App\Inventory\Controller;

use App\Inventory\UserCard;
use App\Social\FriendshipService;
use App\User\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;

#[AsController]
class GetFriendInventoryController
{
    public function __construct(
        private EntityManagerInterface $em,
        private Security $security,
        private FriendshipService $friendshipService,
    ) {}

    #[Route('/api/friends/{userId}/inventory', name: 'api_friends_inventory_get', methods: ['GET'])]
    public function __invoke(int $userId): JsonResponse
    {
        /** @var User|null $me */
        $me = $this->security->getUser();
        if (!$me) {
            return new JsonResponse(['error' => 'Authentification requise.'], 401);
        }

        $friend = $this->em->getRepository(User::class)->find($userId);
        if (!$friend) {
            return new JsonResponse(['error' => 'Utilisateur introuvable.'], 404);
        }

        if (!$this->friendshipService->areFriends($me, $friend)) {
            return new JsonResponse(['error' => "Vous ne pouvez consulter que l'inventaire de vos amis."], 403);
        }

        $userCards = array_filter(
            $this->em->getRepository(UserCard::class)->findBy(['user' => $friend]),
            fn($uc) => $uc->getQuantity() > 0,
        );

        return new JsonResponse(array_values(array_map(fn($uc) => [
            'id' => $uc->getId(),
            'cardId' => $uc->getCard()->getId(),
            'type' => $uc->getCard()->getType()->value,
            'entityId' => $uc->getCard()->getEntityId(),
            'rarity' => $uc->getCard()->getRarity()->value,
            'quantity' => $uc->getQuantity(),
        ], $userCards)));
    }
}
