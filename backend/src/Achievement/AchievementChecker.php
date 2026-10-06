<?php

namespace App\Achievement;

use App\Card\Card;
use App\Card\Rarity;
use App\Collection\CollectionService;
use App\Economy\Wallet\WalletService;
use App\User\User;
use Doctrine\ORM\EntityManagerInterface;
use App\Achievement\CardAcquisitionLog;

class AchievementChecker
{
    public function __construct(
        private EntityManagerInterface $em,
        private CollectionService $collectionService,
        private WalletService $wallet,
    ) {}

    /**
     * À appeler chaque fois qu'un joueur obtient une ou plusieurs cartes (pack, shop, trade...).
     *
     * @param Card[] $cards cartes obtenues dans cette action
     */
    public function onCardsObtained(User $user, array $cards): void
    {
        $obtainedRarities = array_map(fn(Card $c) => $c->getRarity(), $cards);

        if (in_array(Rarity::LEGENDARY, $obtainedRarities, true)) {
            $this->tryUnlock($user, AchievementTrigger::LEGENDARY_OBTAINED, null);
        }

        $cardsToday = $this->countCardsObtainedToday($user);
        $this->tryUnlockThresholds($user, AchievementTrigger::CARDS_OBTAINED_IN_DAY, $cardsToday);

        foreach ($cards as $card) {
            $this->collectionService->recordCompletionsForCard($user, $card);
        }
        $completedCollections = $this->collectionService->countCompletedCollections($user);
        $this->tryUnlockThresholds($user, AchievementTrigger::COLLECTION_COMPLETED, $completedCollections);
    }

    private function tryUnlockThresholds(User $user, AchievementTrigger $trigger, int $currentValue): void
    {
        $achievements = $this->em->getRepository(Achievement::class)->findBy(['trigger' => $trigger]);

        foreach ($achievements as $achievement) {
            if ($achievement->getThreshold() !== null && $currentValue >= $achievement->getThreshold()) {
                $this->tryUnlock($user, $trigger, $achievement->getThreshold());
            }
        }
    }

    private function tryUnlock(User $user, AchievementTrigger $trigger, ?int $threshold): void
    {
        $achievement = $this->em->getRepository(Achievement::class)->findOneBy([
            'trigger' => $trigger,
            'threshold' => $threshold,
        ]);

        if (!$achievement) {
            return;
        }

        $already = $this->em->getRepository(UserAchievement::class)->findOneBy([
            'user' => $user,
            'achievement' => $achievement,
        ]);

        if ($already) {
            return;
        }

        $userAchievement = new UserAchievement();
        $userAchievement->setUser($user);
        $userAchievement->setAchievement($achievement);
        $this->em->persist($userAchievement);
        // Le succès est enregistré d'abord : si une requête parallèle l'a déjà débloqué,
        // la contrainte unique échoue ici, avant le crédit de la récompense.
        $this->em->flush();

        if ($achievement->getCoinsReward() > 0) {
            $this->wallet->credit((int) $user->getId(), $achievement->getCoinsReward());
        }
    }

    private function countCardsObtainedToday(User $user): int
    {
        $today = new \DateTimeImmutable('today');

        $result = $this->em->getRepository(CardAcquisitionLog::class)->createQueryBuilder('log')
            ->select('SUM(log.quantity)')
            ->where('log.user = :user')
            ->andWhere('log.acquiredAt >= :today')
            ->setParameter('user', $user)
            ->setParameter('today', $today)
            ->getQuery()
            ->getSingleScalarResult();

        return (int) ($result ?? 0);
    }
}
