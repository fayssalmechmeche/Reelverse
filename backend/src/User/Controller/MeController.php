<?php

namespace App\User\Controller;

use App\User\User;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;

#[AsController]
class MeController
{
    public function __construct(private Security $security) {}

    #[Route('/api/me', name: 'api_me', methods: ['GET'])]
    public function __invoke(): JsonResponse
    {
        /** @var User|null $user */
        $user = $this->security->getUser();

        if (!$user) {
            return new JsonResponse(['error' => 'Non authentifié.'], 401);
        }

        return new JsonResponse(['id' => $user->getId(), 'username' => $user->getPseudo()]);
    }
}
