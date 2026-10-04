<?php

namespace App\Collection\Controller;

use App\Cinema\Series\Series;
use App\Collection\CollectionService;
use App\User\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;

#[AsController]
class GetSeriesCollectionController
{
    public function __construct(
        private EntityManagerInterface $em,
        private CollectionService $collectionService,
        private Security $security,
    ) {}

    #[Route('/api/series/{id}/collection', name: 'api_series_collection', methods: ['GET'])]
    public function __invoke(int $id): JsonResponse
    {
        /** @var User|null $user */
        $user = $this->security->getUser();
        if (!$user) {
            return new JsonResponse(['error' => 'Authentification requise.'], 401);
        }

        $series = $this->em->getRepository(Series::class)->find($id);
        if (!$series) {
            return new JsonResponse(['error' => 'Série introuvable.'], 404);
        }

        return new JsonResponse($this->collectionService->getSeriesCollection($user, $series));
    }
}
