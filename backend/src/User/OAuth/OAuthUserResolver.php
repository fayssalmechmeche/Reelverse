<?php

namespace App\User\OAuth;

use App\User\User;
use App\User\UserOnboarding;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class OAuthUserResolver
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly UserPasswordHasherInterface $hasher,
        private readonly UserOnboarding $onboarding,
    ) {}

    /**
     * Retrouve ou cree l'utilisateur correspondant a une identite OAuth.
     *
     * @throws OAuthLoginException
     */
    public function resolve(
        string $provider,
        string $providerUserId,
        ?string $email,
        bool $emailVerified,
        ?string $displayName,
    ): User {
        $identityRepo = $this->em->getRepository(OAuthIdentity::class);

        // 1. Identite deja connue : on connecte directement.
        $identity = $identityRepo->findOneBy([
            'provider' => $provider,
            'providerUserId' => $providerUserId,
        ]);
        if ($identity !== null) {
            return $identity->getUser();
        }

        // 2. Nouvelle identite : on exige un email verifie par le provider.
        $email = $email !== null ? mb_strtolower(trim($email)) : '';
        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new OAuthLoginException('email_missing');
        }
        if (!$emailVerified) {
            throw new OAuthLoginException('email_not_verified');
        }

        try {
            $user = $this->findUserByEmail($email);

            if ($user === null) {
                $user = new User();
                $user->setEmail($email);
                $user->setPseudo($this->generateUniquePseudo($displayName, $email));
                // Mot de passe aleatoire inutilisable : le compte se connecte via OAuth
                // (ou via "mot de passe oublie" pour en definir un).
                $user->setPassword($this->hasher->hashPassword($user, bin2hex(random_bytes(32))));
                $this->em->persist($user);
                $this->onboarding->setupNewUser($user);
            }

            $this->em->persist(new OAuthIdentity($user, $provider, $providerUserId));
            $this->em->flush();
        } catch (UniqueConstraintViolationException) {
            throw new OAuthLoginException('conflict');
        }

        return $user;
    }

    private function findUserByEmail(string $email): ?User
    {
        return $this->em->createQuery(
            'SELECT u FROM ' . User::class . ' u WHERE LOWER(u.email) = :email'
        )
            ->setParameter('email', $email)
            ->setMaxResults(1)
            ->getOneOrNullResult();
    }

    private function pseudoExists(string $pseudo): bool
    {
        $count = $this->em->createQuery(
            'SELECT COUNT(u.id) FROM ' . User::class . ' u WHERE LOWER(u.username) = :p'
        )
            ->setParameter('p', mb_strtolower($pseudo))
            ->getSingleScalarResult();

        return (int) $count > 0;
    }

    private function generateUniquePseudo(?string $displayName, string $email): string
    {
        $base = $this->sanitize($displayName ?? '');
        if (mb_strlen($base) < 3) {
            $base = $this->sanitize(strstr($email, '@', true) ?: '');
        }
        if (mb_strlen($base) < 3) {
            $base = 'Joueur';
        }
        $base = mb_substr($base, 0, 20);

        if (!$this->pseudoExists($base)) {
            return $base;
        }

        for ($i = 0; $i < 20; $i++) {
            $suffix = (string) random_int(100, 99999);
            $candidate = mb_substr($base, 0, 20 - mb_strlen($suffix)) . $suffix;
            if (!$this->pseudoExists($candidate)) {
                return $candidate;
            }
        }

        return 'Joueur' . bin2hex(random_bytes(4));
    }

    private function sanitize(string $value): string
    {
        $value = preg_replace('/[^\p{L}\p{N}_\-. ]/u', '', $value) ?? '';

        return trim(preg_replace('/\s+/u', ' ', $value) ?? '');
    }
}
