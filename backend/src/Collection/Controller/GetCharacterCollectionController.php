<?php

namespace App\Collection\Controller;

use App\Cinema\Character\Character;
use App\Collection\CollectionService;
use App\User\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;

#[AsController]
class GetCharacterCollectionController
{
    public function __construct(
        private EntityManagerInterface $em,
        private CollectionService $collectionService,
        private Security $security,
    ) {}

    #[Route('/api/characters/{id}/collection', name: 'api_character_collection', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function __invoke(int $id): JsonResponse
    {
        /** @var User|null $user */
        $user = $this->security->getUser();
        if (!$user) {
            return new JsonResponse(['error' => 'Authentification requise.'], 401);
        }

        $character = $this->em->getRepository(Character::class)->find($id);
        if (!$character) {
            return new JsonResponse(['error' => 'Personnage introuvable.'], 404);
        }

        return new JsonResponse($this->collectionService->getCharacterCollection($user, $character));
    }
}
