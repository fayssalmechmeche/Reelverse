<?php

namespace App\User\Controller;

use App\User\Dto\ResetPasswordPayload;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use SymfonyCasts\Bundle\ResetPassword\Exception\ResetPasswordExceptionInterface;
use SymfonyCasts\Bundle\ResetPassword\ResetPasswordHelperInterface;

#[AsController]
class ResetPasswordController
{
    public function __construct(
        private EntityManagerInterface $em,
        private ResetPasswordHelperInterface $resetPasswordHelper,
        private UserPasswordHasherInterface $passwordHasher,
    ) {}

    #[Route('/api/reset-password', name: 'api_reset_password', methods: ['POST'])]
    public function __invoke(#[MapRequestPayload] ResetPasswordPayload $dto): JsonResponse
    {
        try {
            $user = $this->resetPasswordHelper->validateTokenAndFetchUser($dto->token);
        } catch (ResetPasswordExceptionInterface) {
            return new JsonResponse(
                ['error' => 'Ce lien est invalide ou a expiré. Refais une demande de réinitialisation.'],
                400,
            );
        }

        // Le lien ne sert qu'une fois.
        $this->resetPasswordHelper->removeResetRequest($dto->token);

        $user->setPassword($this->passwordHasher->hashPassword($user, $dto->password));
        $this->em->flush();

        return new JsonResponse(['message' => 'Mot de passe mis à jour. Tu peux te connecter.']);
    }
}
