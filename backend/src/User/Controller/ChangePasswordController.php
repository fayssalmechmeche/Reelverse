<?php

namespace App\User\Controller;

use App\User\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

#[AsController]
class ChangePasswordController
{
    public function __construct(
        private EntityManagerInterface $em,
        private UserPasswordHasherInterface $passwordHasher,
        private Security $security,
    ) {}

    #[Route('/api/me/change-password', name: 'api_change_password', methods: ['POST'])]
    public function __invoke(Request $request): JsonResponse
    {
        /** @var User|null $user */
        $user = $this->security->getUser();
        if (!$user) {
            return new JsonResponse(['error' => 'Authentification requise.'], 401);
        }

        $data = json_decode($request->getContent(), true);
        $currentPassword = $data['currentPassword'] ?? '';
        $newPassword = $data['newPassword'] ?? '';

        if (empty($currentPassword) || empty($newPassword)) {
            return new JsonResponse(['error' => 'Mot de passe actuel et nouveau mot de passe requis.'], 400);
        }

        if (strlen($newPassword) < 6) {
            return new JsonResponse(['error' => 'Le nouveau mot de passe doit contenir au moins 6 caractères.'], 400);
        }

        if (!$this->passwordHasher->isPasswordValid($user, $currentPassword)) {
            return new JsonResponse(['error' => 'Mot de passe actuel incorrect.'], 400);
        }

        $user->setPassword($this->passwordHasher->hashPassword($user, $newPassword));
        $this->em->flush();

        return new JsonResponse(['success' => true]);
    }
}
