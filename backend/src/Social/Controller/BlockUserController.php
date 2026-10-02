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
class BlockUserController
{
    public function __construct(
        private FriendshipService $friendshipService,
        private EntityManagerInterface $em,
        private Security $security,
    ) {}

    #[Route('/api/users/{id}/block', name: 'api_users_block', methods: ['POST'])]
    public function block(int $id): JsonResponse
    {
        $me = $this->security->getUser();
        if (!$me) {
            return new JsonResponse(['error' => 'Authentification requise.'], 401);
        }

        $target = $this->em->getRepository(User::class)->find($id);
        if (!$target) {
            return new JsonResponse(['error' => 'Utilisateur introuvable.'], 404);
        }

        try {
            $this->friendshipService->block($me, $target);
        } catch (\DomainException $e) {
            return new JsonResponse(['error' => $e->getMessage()], 400);
        }

        return new JsonResponse(['success' => true]);
    }

    #[Route('/api/users/{id}/unblock', name: 'api_users_unblock', methods: ['POST'])]
    public function unblock(int $id): JsonResponse
    {
        $me = $this->security->getUser();
        if (!$me) {
            return new JsonResponse(['error' => 'Authentification requise.'], 401);
        }

        $target = $this->em->getRepository(User::class)->find($id);
        if (!$target) {
            return new JsonResponse(['error' => 'Utilisateur introuvable.'], 404);
        }

        $this->friendshipService->unblock($me, $target);

        return new JsonResponse(['success' => true]);
    }
}
