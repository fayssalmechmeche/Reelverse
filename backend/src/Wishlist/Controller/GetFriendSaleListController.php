<?php

declare(strict_types=1);

namespace App\Wishlist\Controller;

use App\Social\FriendshipService;
use App\User\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use App\Wishlist\SaleListManager;

#[Route('/api/friends/{userId}/sale-list', methods: ['GET'])]
class GetFriendSaleListController
{
    public function __construct(
        private SaleListManager $saleListManager,
        private FriendshipService $friendshipService,
        private EntityManagerInterface $em,
        private Security $security,
    ) {}

    public function __invoke(int $userId): JsonResponse
    {
        $me = $this->security->getUser();
        if (!$me instanceof User) {
            throw new \LogicException('Utilisateur non authentifié');
        }

        $friend = $this->em->getRepository(User::class)->find($userId);
        if ($friend === null) {
            return new JsonResponse(['error' => 'Joueur introuvable'], Response::HTTP_NOT_FOUND);
        }

        if (!$this->friendshipService->areFriends($me, $friend)) {
            return new JsonResponse(['error' => "Vous n'êtes pas ami avec ce joueur"], Response::HTTP_FORBIDDEN);
        }

        return new JsonResponse(['cardIds' => $this->saleListManager->cardIdsForUser($friend)]);
    }
}
