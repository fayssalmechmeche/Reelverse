<?php

namespace App\LoginStreak\Controller;

use App\LoginStreak\LoginStreakService;
use App\User\User;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;

#[AsController]
class GetLoginStreakController
{
    public function __construct(
        private LoginStreakService $loginStreakService,
        private Security $security,
    ) {}

    #[Route('/api/login-streak', name: 'api_login_streak_get', methods: ['GET'])]
    public function __invoke(): JsonResponse
    {
        /** @var User|null $user */
        $user = $this->security->getUser();
        if (!$user) {
            return new JsonResponse(['error' => 'Authentification requise.'], 401);
        }

        return new JsonResponse($this->loginStreakService->getStatus($user));
    }
}
