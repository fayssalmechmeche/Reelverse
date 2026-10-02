<?php

namespace App\Social\Controller;

use App\Social\FriendshipService;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;

#[AsController]
class RespondFriendRequestController
{
    public function __construct(
        private FriendshipService $friendshipService,
        private Security $security,
    ) {}

    #[Route('/api/friends/{id}/accept', name: 'api_friends_accept', methods: ['POST'])]
    public function accept(int $id): JsonResponse
    {
        $me = $this->security->getUser();
        if (!$me) {
            return new JsonResponse(['error' => 'Authentification requise.'], 401);
        }

        try {
            $this->friendshipService->acceptRequest($me, $id);
        } catch (\DomainException $e) {
            return new JsonResponse(['error' => $e->getMessage()], 400);
        }

        return new JsonResponse(['success' => true]);
    }

    #[Route('/api/friends/{id}', name: 'api_friends_remove', methods: ['DELETE'])]
    public function remove(int $id): JsonResponse
    {
        $me = $this->security->getUser();
        if (!$me) {
            return new JsonResponse(['error' => 'Authentification requise.'], 401);
        }

        try {
            $this->friendshipService->declineOrRemove($me, $id);
        } catch (\DomainException $e) {
            return new JsonResponse(['error' => $e->getMessage()], 400);
        }

        return new JsonResponse(['success' => true]);
    }
}
