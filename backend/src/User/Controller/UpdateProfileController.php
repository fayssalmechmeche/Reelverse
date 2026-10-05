<?php

namespace App\User\Controller;

use App\User\Dto\UpdateProfileRequest;
use App\User\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;

#[AsController]
class UpdateProfileController
{
    public function __construct(
        private EntityManagerInterface $em,
        private Security $security,
    ) {}

    #[Route('/api/me/profile', name: 'api_update_profile', methods: ['POST'])]
    public function __invoke(#[MapRequestPayload] UpdateProfileRequest $dto): JsonResponse
    {
        /** @var User|null $user */
        $user = $this->security->getUser();
        if (!$user) {
            return new JsonResponse(['error' => 'Authentification requise.'], 401);
        }

        $user->setPseudo($dto->username);
        $this->em->flush();

        return new JsonResponse(['id' => $user->getId(), 'username' => $user->getPseudo()]);
    }
}