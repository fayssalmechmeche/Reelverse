<?php

namespace App\User\Controller;

use App\Shared\Mail\TransactionalMailer;
use App\User\Dto\RegisterRequest;
use App\User\User;
use App\User\UserOnboarding;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

#[AsController]
class RegisterController
{
    public function __construct(
        private EntityManagerInterface $em,
        private UserPasswordHasherInterface $passwordHasher,
        private UserOnboarding $onboarding,
        private TransactionalMailer $mailer,
    ) {}

    #[Route('/api/register', name: 'api_register', methods: ['POST'])]
    public function __invoke(#[MapRequestPayload] RegisterRequest $dto): JsonResponse
    {
        $user = new User();
        $user->setEmail($dto->email);
        $user->setPseudo($dto->username);
        $user->setPassword($this->passwordHasher->hashPassword($user, $dto->password));

        $this->em->persist($user);
        $this->onboarding->setupNewUser($user);
        $this->em->flush();

        // Après le flush : le compte existe, un échec d'envoi ne l'annule pas.
        $this->mailer->sendWelcome($user);

        return new JsonResponse(['id' => $user->getId(), 'username' => $user->getPseudo()], 201);
    }
}
