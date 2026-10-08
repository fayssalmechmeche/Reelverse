<?php

namespace App\User\Controller;

use App\User\AccountDeletionService;
use App\User\OAuth\OAuthIdentity;
use App\User\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

#[AsController]
class DeleteAccountController
{
    public function __construct(
        private EntityManagerInterface $em,
        private Security $security,
        private UserPasswordHasherInterface $passwordHasher,
        private AccountDeletionService $deletion,
    ) {}

    #[Route('/api/me', name: 'api_delete_account', methods: ['DELETE'])]
    public function __invoke(Request $request): JsonResponse
    {
        /** @var User|null $user */
        $user = $this->security->getUser();
        if (!$user) {
            return new JsonResponse(['error' => 'Authentification requise.'], 401);
        }

        $payload = json_decode($request->getContent(), true);
        $payload = is_array($payload) ? $payload : [];

        $username = (string) ($payload['username'] ?? '');
        if ($username !== $user->getPseudo()) {
            return new JsonResponse(['error' => 'Le pseudo saisi ne correspond pas à votre compte.'], 400);
        }

        // Les comptes créés via Google / Discord ont un mot de passe aléatoire inutilisable.
        $hasOAuth = $this->em->getRepository(OAuthIdentity::class)->count(['user' => $user]) > 0;
        if (!$hasOAuth) {
            $password = (string) ($payload['password'] ?? '');
            if ($password === '' || !$this->passwordHasher->isPasswordValid($user, $password)) {
                return new JsonResponse(['error' => 'Mot de passe incorrect.'], 400);
            }
        }

        $this->deletion->delete($user);

        $response = new JsonResponse(['success' => true]);
        $response->headers->clearCookie('BEARER', '/', null, false, true, 'lax');

        return $response;
    }
}
