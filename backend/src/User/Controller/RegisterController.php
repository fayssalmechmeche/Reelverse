<?php

namespace App\User\Controller;

use App\User\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use App\User\UserOnboarding;

#[AsController]
class RegisterController
{
    public function __construct(
        private EntityManagerInterface $em,
        private UserPasswordHasherInterface $passwordHasher,
        private UserOnboarding $onboarding,
    ) {}

    #[Route('/api/register', name: 'api_register', methods: ['POST'])]
    public function __invoke(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (empty($data['email']) || empty($data['username']) || empty($data['password'])) {
            return new JsonResponse(['error' => 'Email, pseudo et mot de passe requis.'], 400);
        }

        $existingEmail = $this->em->getRepository(User::class)->findOneBy(['email' => $data['email']]);
        if ($existingEmail) {
            return new JsonResponse(['error' => 'Cet email est déjà utilisé.'], 409);
        }

        $existingUsername = $this->em->getRepository(User::class)->findOneBy(['username' => $data['username']]);
        if ($existingUsername) {
            return new JsonResponse(['error' => 'Ce pseudo est déjà pris.'], 409);
        }

        $user = new User();
        $user->setEmail($data['email']);
        $user->setPseudo($data['username']);
        $user->setPassword($this->passwordHasher->hashPassword($user, $data['password']));

        $this->em->persist($user);
        $this->onboarding->setupNewUser($user);
        $this->em->flush();

        return new JsonResponse(['id' => $user->getId(), 'username' => $user->getPseudo()], 201);
    }
}
