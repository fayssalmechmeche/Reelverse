<?php

namespace App\User\Controller;

use App\User\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;

#[AsController]
class UpdateProfileController
{
    public function __construct(
        private EntityManagerInterface $em,
        private Security $security,
    ) {}

    #[Route('/api/me/profile', name: 'api_update_profile', methods: ['POST'])]
    public function __invoke(Request $request): JsonResponse
    {
        /** @var User|null $user */
        $user = $this->security->getUser();
        if (!$user) {
            return new JsonResponse(['error' => 'Authentification requise.'], 401);
        }

        $data = json_decode($request->getContent(), true);
        $username = trim((string) ($data['username'] ?? ''));

        if (mb_strlen($username) < 3 || mb_strlen($username) > 20) {
            return new JsonResponse(['error' => 'Le pseudo doit contenir entre 3 et 20 caractères.'], 400);
        }

        if (!preg_match('/^[\p{L}\p{N}_\-. ]+$/u', $username)) {
            return new JsonResponse(['error' => 'Le pseudo ne peut contenir que des lettres, chiffres, espaces, ., - et _.'], 400);
        }

        // Unicité insensible à la casse, en excluant l'utilisateur courant.
        $taken = $this->em->createQueryBuilder()
            ->select('COUNT(u.id)')
            ->from(User::class, 'u')
            ->where('LOWER(u.username) = :username')
            ->andWhere('u.id != :id')
            ->setParameter('username', mb_strtolower($username))
            ->setParameter('id', $user->getId())
            ->getQuery()
            ->getSingleScalarResult();

        if ((int) $taken > 0) {
            return new JsonResponse(['error' => 'Ce pseudo est déjà pris.'], 409);
        }

        $user->setPseudo($username);
        $this->em->flush();

        return new JsonResponse(['id' => $user->getId(), 'username' => $user->getPseudo()]);
    }
}
