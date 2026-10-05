<?php

namespace App\Social\Controller;

use App\User\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;

#[AsController]
class SearchUsersController
{
    public function __construct(
        private EntityManagerInterface $em,
        private Security $security,
    ) {}

    #[Route('/api/search/users', name: 'api_users_search', methods: ['GET'])]
    public function __invoke(Request $request): JsonResponse
    {
        $me = $this->security->getUser();
        if (!$me) {
            return new JsonResponse(['error' => 'Authentification requise.'], 401);
        }

        $query = $request->query->get('q', '');
        if (strlen($query) < 2) {
            return new JsonResponse(['error' => 'Recherche trop courte (2 caractères minimum).'], 400);
        }

        $users = $this->em->getRepository(User::class)->createQueryBuilder('u')
            ->where('u.username LIKE :query')
            ->andWhere('u.id != :myId')
            ->setParameter('query', '%' . $query . '%')
            ->setParameter('myId', $me->getId())
            ->setMaxResults(20)
            ->getQuery()
            ->getResult();

        return new JsonResponse(array_map(fn($u) => [
            'id' => $u->getId(),
            'username' => $u->getPseudo(),
            'avatarUrl' => $u->getAvatarUrl(),
        ], $users));
    }
}
