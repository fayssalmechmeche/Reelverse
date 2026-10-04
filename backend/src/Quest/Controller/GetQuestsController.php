<?php

namespace App\Quest\Controller;

use App\Quest\QuestService;
use App\User\User;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;

#[AsController]
class GetQuestsController
{
    public function __construct(
        private QuestService $questService,
        private Security $security,
    ) {}

    #[Route('/api/quests', name: 'api_quests_list', methods: ['GET'])]
    public function __invoke(): JsonResponse
    {
        /** @var User|null $user */
        $user = $this->security->getUser();
        if (!$user) {
            return new JsonResponse(['error' => 'Authentification requise.'], 401);
        }

        return new JsonResponse($this->questService->listQuests($user));
    }
}
