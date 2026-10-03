<?php

namespace App\Achievement\Controller;

use App\Achievement\Achievement;
use App\Achievement\UserAchievement;
use App\User\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\HttpKernel\Attribute\AsController;

#[AsController]
class ListAchievementsController
{
    public function __construct(
        private EntityManagerInterface $em,
    ) {}

    #[Route('/api/achievements', name: 'api_achievements_list', methods: ['GET'])]
    public function __invoke(#[CurrentUser] User $user): JsonResponse
    {
        $achievements = $this->em->getRepository(Achievement::class)->findAll();
        $unlocked = $this->em->getRepository(UserAchievement::class)->findBy(['user' => $user]);

        $unlockedMap = [];
        foreach ($unlocked as $ua) {
            $unlockedMap[$ua->getAchievement()->getId()] = $ua->getUnlockedAt();
        }

        $data = array_map(function (Achievement $a) use ($unlockedMap) {
            $isUnlocked = isset($unlockedMap[$a->getId()]);
            return [
                'id' => $a->getId(),
                'code' => $a->getCode(),
                'label' => $a->getLabel(),
                'coinsReward' => $a->getCoinsReward(),
                'unlocked' => $isUnlocked,
                'unlockedAt' => $isUnlocked ? $unlockedMap[$a->getId()]->format(DATE_ATOM) : null,
            ];
        }, $achievements);

        return new JsonResponse($data);
    }
}
