<?php

namespace App\User\Controller;

use App\Shared\Mail\TransactionalMailer;
use App\User\Dto\ForgotPasswordRequest;
use App\User\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use SymfonyCasts\Bundle\ResetPassword\Exception\ResetPasswordExceptionInterface;
use SymfonyCasts\Bundle\ResetPassword\ResetPasswordHelperInterface;

#[AsController]
class ForgotPasswordController
{
    public function __construct(
        private EntityManagerInterface $em,
        private ResetPasswordHelperInterface $resetPasswordHelper,
        private TransactionalMailer $mailer,
    ) {}

    #[Route('/api/forgot-password', name: 'api_forgot_password', methods: ['POST'])]
    public function __invoke(#[MapRequestPayload] ForgotPasswordRequest $dto): JsonResponse
    {
        // Réponse identique que le compte existe ou non : on ne révèle jamais
        // quels emails sont inscrits.
        $response = new JsonResponse([
            'message' => 'Si un compte existe avec cet email, un lien de réinitialisation vient de lui être envoyé.',
        ]);

        $user = $this->em->getRepository(User::class)
            ->createQueryBuilder('u')
            ->where('LOWER(u.email) = :email')
            ->setParameter('email', mb_strtolower(trim($dto->email)))
            ->getQuery()
            ->getOneOrNullResult();

        if (!$user instanceof User) {
            return $response;
        }

        try {
            $token = $this->resetPasswordHelper->generateResetToken($user);
        } catch (ResetPasswordExceptionInterface) {
            // Demande trop rapprochée : on ne dit rien de plus.
            return $response;
        }

        $this->mailer->sendPasswordReset($user, $token->getToken());

        return $response;
    }
}
