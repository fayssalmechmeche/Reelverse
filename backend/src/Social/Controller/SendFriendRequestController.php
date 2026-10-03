<?php

namespace App\Social\Controller;

use App\Social\FriendshipService;
use App\User\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;

#[AsController]
class SendFriendRequestController
{
    public function __construct(
        private FriendshipService $friendshipService,
        private EntityManagerInterface $em,
        private Security $security,
    ) {}

    #[Route('/api/friends/request', name: 'api_friends_request', methods: ['POST'])]
    public function __invoke(Request $request): JsonResponse
    {
        $me = $this->security->getUser();
        if (!$me) {
            return new JsonResponse(['error' => 'Authentification requise.'], 401);
        }

        $data = json_decode($request->getContent(), true) ?? [];
        $targetId = $data['userId'] ?? null;

        $target = $targetId ? $this->em->getRepository(User::class)->find($targetId) : null;
        if (!$target) {
            return new JsonResponse(['error' => 'Utilisateur introuvable.'], 404);
        }

        try {
            $friendship = $this->friendshipService->sendRequest($me, $target);
        } catch (\DomainException $e) {
            return new JsonResponse(['error' => $e->getMessage()], 400);
        }

        return new JsonResponse(['id' => $friendship->getId()], 201);
    }
}
