<?php

namespace App\Inventory\Controller;

use App\Inventory\UserCard;
use App\User\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;

#[AsController]
class GetInventoryController
{
    public function __construct(
        private EntityManagerInterface $em,
        private Security $security,
    ) {}

    #[Route('/api/inventory', name: 'api_inventory_get', methods: ['GET'])]
    public function __invoke(): JsonResponse
    {
        /** @var User|null $user */
        $user = $this->security->getUser();

        if (!$user) {
            return new JsonResponse(['error' => 'Authentification requise.'], 401);
        }

        $userCards = $this->em->getRepository(UserCard::class)->findBy(['user' => $user]);

        return new JsonResponse(array_map(fn($uc) => [
            'id' => $uc->getId(),
            'cardId' => $uc->getCard()->getId(),
            'type' => $uc->getCard()->getType()->value,
            'entityId' => $uc->getCard()->getEntityId(),
            'rarity' => $uc->getCard()->getRarity()->value,
            'quantity' => $uc->getQuantity(),
        ], $userCards));
    }
}
