<?php

namespace App\User\Controller;

use App\User\Dto\ForgotPasswordRequest;
use App\User\User;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\Routing\Attribute\Route;
use SymfonyCasts\Bundle\ResetPassword\Exception\ResetPasswordExceptionInterface;
use SymfonyCasts\Bundle\ResetPassword\ResetPasswordHelperInterface;

#[AsController]
class ForgotPasswordController
{
    public function __construct(
        private EntityManagerInterface $em,
        private ResetPasswordHelperInterface $resetPasswordHelper,
        private MailerInterface $mailer,
        private LoggerInterface $logger,
        #[Autowire('%env(FRONTEND_URL)%')]
        private string $frontendUrl,
        #[Autowire('%env(MAILER_FROM)%')]
        private string $mailerFrom,
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

        $link = rtrim($this->frontendUrl, '/') . '/reset-password/' . $token->getToken();

        $email = (new Email())
            ->from($this->mailerFrom)
            ->to($user->getEmail())
            ->subject('Reelverse : réinitialisation de ton mot de passe')
            ->text(
                "Bonjour {$user->getPseudo()},\n\n"
                    . "Tu as demandé à réinitialiser ton mot de passe. Clique sur ce lien (valable 1 heure) :\n\n"
                    . "{$link}\n\n"
                    . "Si tu n'es pas à l'origine de cette demande, ignore simplement cet e-mail."
            )
            ->html(
                '<p>Bonjour ' . htmlspecialchars($user->getPseudo(), ENT_QUOTES) . ',</p>'
                    . '<p>Tu as demandé à réinitialiser ton mot de passe. Ce lien est valable 1 heure :</p>'
                    . '<p><a href="' . htmlspecialchars($link, ENT_QUOTES) . '">Réinitialiser mon mot de passe</a></p>'
                    . "<p>Si tu n'es pas à l'origine de cette demande, ignore simplement cet e-mail.</p>"
            );

        try {
            $this->mailer->send($email);
        } catch (TransportExceptionInterface $e) {
            $this->logger->error('Envoi du mail de réinitialisation impossible : ' . $e->getMessage());
        }

        return $response;
    }
}
