<?php

namespace App\Social\Controller;

use App\Social\Block;
use App\User\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[AsController]
class ListBlockedUsersController
{
    public function __construct(private EntityManagerInterface $em) {}

    #[Route('/api/blocks', name: 'api_blocks_list', methods: ['GET'])]
    public function __invoke(#[CurrentUser] User $user): JsonResponse
    {
        $blocks = $this->em->getRepository(Block::class)->findBy(['blocker' => $user]);

        $data = array_map(fn(Block $b) => [
            'id' => $b->getId(),
            'userId' => $b->getBlocked()->getId(),
            'username' => $b->getBlocked()->getPseudo(),
        ], $blocks);

        return new JsonResponse($data);
    }
}
