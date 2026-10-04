<?php

namespace App\PlayerProfile\Controller;

use App\Inventory\UserCard;
use App\User\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;

#[AsController]
class GetPlayerInventoryController
{
    public function __construct(
        private EntityManagerInterface $em,
        private Security $security,
    ) {}

    #[Route('/api/players/{id}/inventory', name: 'api_players_inventory_get', methods: ['GET'])]
    public function __invoke(int $id): JsonResponse
    {
        $me = $this->security->getUser();
        if (!$me) {
            return new JsonResponse(['error' => 'Authentification requise.'], 401);
        }

        $player = $this->em->getRepository(User::class)->find($id);
        if (!$player) {
            return new JsonResponse(['error' => 'Joueur introuvable.'], 404);
        }

        $userCards = array_filter(
            $this->em->getRepository(UserCard::class)->findBy(['user' => $player]),
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
