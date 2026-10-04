<?php

namespace App\LoginStreak\Controller;

use App\LoginStreak\LoginStreakService;
use App\User\User;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;

#[AsController]
class ClaimLoginStreakController
{
    public function __construct(
        private LoginStreakService $loginStreakService,
        private Security $security,
    ) {}

    #[Route('/api/login-streak/claim', name: 'api_login_streak_claim', methods: ['POST'])]
    public function __invoke(): JsonResponse
    {
        /** @var User|null $user */
        $user = $this->security->getUser();
        if (!$user) {
            return new JsonResponse(['error' => 'Authentification requise.'], 401);
        }

        try {
            $result = $this->loginStreakService->claim($user);
        } catch (\DomainException $e) {
            return new JsonResponse(['error' => $e->getMessage()], 400);
        }

        return new JsonResponse($result);
    }
}
