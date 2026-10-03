<?php

namespace App\User\Controller;

use App\Economy\Wallet\Wallet;
use App\User\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;

#[AsController]
class MeController
{
    public function __construct(
        private Security $security,
        private EntityManagerInterface $em,
    ) {}

    #[Route('/api/me', name: 'api_me', methods: ['GET'])]
    public function __invoke(): JsonResponse
    {
        /** @var User|null $user */
        $user = $this->security->getUser();

        if (!$user) {
            return new JsonResponse(['error' => 'Non authentifié.'], 401);
        }

        $wallet = $this->em->getRepository(Wallet::class)->findOneBy(['user' => $user]);

        return new JsonResponse([
            'id' => $user->getId(),
            'username' => $user->getPseudo(),
            'coins' => $wallet?->getBalance() ?? 0,
        ]);
    }
}
