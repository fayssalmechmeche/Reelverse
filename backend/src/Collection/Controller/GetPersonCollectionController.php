<?php

namespace App\Collection\Controller;

use App\Cinema\Person\Person;
use App\Collection\CollectionService;
use App\User\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;

#[AsController]
class GetPersonCollectionController
{
    public function __construct(
        private EntityManagerInterface $em,
        private CollectionService $collectionService,
        private Security $security,
    ) {}

    #[Route('/api/people/{id}/collection', name: 'api_person_collection', methods: ['GET'])]
    public function __invoke(int $id): JsonResponse
    {
        /** @var User|null $user */
        $user = $this->security->getUser();
        if (!$user) {
            return new JsonResponse(['error' => 'Authentification requise.'], 401);
        }

        $person = $this->em->getRepository(Person::class)->find($id);
        if (!$person) {
            return new JsonResponse(['error' => 'Acteur introuvable.'], 404);
        }

        return new JsonResponse($this->collectionService->getPersonCollection($user, $person));
    }
}
