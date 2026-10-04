<?php

namespace App\Quest\Controller;

use App\Quest\QuestService;
use App\User\User;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;

#[AsController]
class ClaimQuestController
{
    public function __construct(
        private QuestService $questService,
        private Security $security,
    ) {}

    #[Route('/api/quests/{id}/claim', name: 'api_quests_claim', methods: ['POST'])]
    public function __invoke(int $id): JsonResponse
    {
        /** @var User|null $user */
        $user = $this->security->getUser();
        if (!$user) {
            return new JsonResponse(['error' => 'Authentification requise.'], 401);
        }

        try {
            $result = $this->questService->claim($user, $id);
        } catch (\DomainException $e) {
            return new JsonResponse(['error' => $e->getMessage()], 400);
        }

        return new JsonResponse($result);
    }
}
