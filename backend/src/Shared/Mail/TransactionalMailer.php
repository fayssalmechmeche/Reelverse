<?php

namespace App\Shared\Mail;

use App\User\User;
use Psr\Log\LoggerInterface;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;

class TransactionalMailer
{
    public function __construct(
        private readonly MailerInterface $mailer,
        private readonly LoggerInterface $logger,
        #[Autowire('%env(FRONTEND_URL)%')]
        private readonly string $frontendUrl,
        #[Autowire('%env(MAILER_FROM)%')]
        private readonly string $from,
    ) {}

    public function sendPasswordReset(User $user, string $token): void
    {
        $this->send(
            $user->getEmail(),
            'Reelverse : réinitialisation de ton mot de passe',
            'reset_password',
            [
                'pseudo' => $user->getPseudo(),
                'link' => $this->appUrl() . '/reset-password/' . $token,
            ],
        );
    }

    public function sendWelcome(User $user): void
    {
        $this->send(
            $user->getEmail(),
            'Bienvenue sur Reelverse',
            'welcome',
            ['pseudo' => $user->getPseudo()],
        );
    }

    /**
     * Appelé après la suppression : on reçoit donc l'adresse et le pseudo en
     * clair, l'utilisateur n'existe plus en base.
     */
    public function sendAccountDeleted(string $email, string $pseudo): void
    {
        $this->send(
            $email,
            'Ton compte Reelverse a été supprimé',
            'account_deleted',
            ['pseudo' => $pseudo],
        );
    }

    /**
     * @param array<string, mixed> $context
     */
    private function send(string $to, string $subject, string $template, array $context): void
    {
        $email = (new TemplatedEmail())
            ->from(new Address($this->from, 'Reelverse'))
            ->to($to)
            ->subject($subject)
            ->htmlTemplate("email/{$template}.html.twig")
            ->textTemplate("email/{$template}.txt.twig")
            ->context($context + [
                'appUrl' => $this->appUrl(),
                'logoUrl' => $this->appUrl() . '/pwa-192x192.png',
            ]);

        try {
            $this->mailer->send($email);
        } catch (TransportExceptionInterface $e) {
            $this->logger->error(sprintf('Envoi du mail "%s" impossible : %s', $template, $e->getMessage()));
        }
    }

    private function appUrl(): string
    {
        return rtrim($this->frontendUrl, '/');
    }
}
