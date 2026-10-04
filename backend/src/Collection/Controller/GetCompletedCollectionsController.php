<?php

namespace App\Collection\Controller;

use App\Collection\CollectionService;
use App\User\User;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;

#[AsController]
class GetCompletedCollectionsController
{
    public function __construct(
        private CollectionService $collectionService,
        private Security $security,
    ) {}

    #[Route('/api/collections/completed', name: 'api_collections_completed', methods: ['GET'])]
    public function __invoke(): JsonResponse
    {
        /** @var User|null $user */
        $user = $this->security->getUser();
        if (!$user) {
            return new JsonResponse(['error' => 'Authentification requise.'], 401);
        }

        return new JsonResponse($this->collectionService->listCompletedCollections($user));
    }
}
