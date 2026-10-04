<?php

namespace App\Collection\Controller;

use App\Cinema\Movie\Movie;
use App\Collection\CollectionService;
use App\User\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;

#[AsController]
class GetMovieCollectionController
{
    public function __construct(
        private EntityManagerInterface $em,
        private CollectionService $collectionService,
        private Security $security,
    ) {}

    #[Route('/api/movies/{id}/collection', name: 'api_movie_collection', methods: ['GET'])]
    public function __invoke(int $id): JsonResponse
    {
        /** @var User|null $user */
        $user = $this->security->getUser();
        if (!$user) {
            return new JsonResponse(['error' => 'Authentification requise.'], 401);
        }

        $movie = $this->em->getRepository(Movie::class)->find($id);
        if (!$movie) {
            return new JsonResponse(['error' => 'Film introuvable.'], 404);
        }

        return new JsonResponse($this->collectionService->getMovieCollection($user, $movie));
    }
}
