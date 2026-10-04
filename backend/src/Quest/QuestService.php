<?php

namespace App\Quest;

use App\Achievement\CardAcquisitionLog;
use App\Card\Rarity;
use App\Economy\Wallet\Wallet;
use App\User\User;
use Doctrine\ORM\EntityManagerInterface;

class QuestService
{
    public function __construct(private EntityManagerInterface $em) {}

    /**
     * Liste toutes les quêtes avec la progression courante du joueur pour
     * la période en cours (aujourd'hui pour une quête quotidienne, semaine
     * en cours pour une hebdomadaire).
     */
    public function listQuests(User $user): array
    {
        $quests = $this->em->getRepository(Quest::class)->findBy([], ['id' => 'ASC']);

        $result = [];
        foreach ($quests as $quest) {
            $periodKey = $this->periodKey($quest->getPeriod());
            $progress = min(
                $this->computeProgress($user, $quest->getTrigger(), $this->periodStart($quest->getPeriod())),
                $quest->getTarget(),
            );
            $claimed = $this->isClaimed($user, $quest, $periodKey);

            $result[] = [
                'id' => $quest->getId(),
                'code' => $quest->getCode(),
                'label' => $quest->getLabel(),
                'description' => $quest->getDescription(),
                'period' => $quest->getPeriod()->value,
                'progress' => $progress,
                'target' => $quest->getTarget(),
                'coinsReward' => $quest->getCoinsReward(),
                'claimed' => $claimed,
                'readyToClaim' => !$claimed && $progress >= $quest->getTarget(),
            ];
        }

        return $result;
    }

    /**
     * @return array{coinsReward: int}
     */
    public function claim(User $user, int $questId): array
    {
        $quest = $this->em->getRepository(Quest::class)->find($questId);
        if (!$quest) {
            throw new \DomainException('Quête introuvable.');
        }

        $periodKey = $this->periodKey($quest->getPeriod());
        if ($this->isClaimed($user, $quest, $periodKey)) {
            throw new \DomainException('Cette quête a déjà été récupérée pour cette période.');
        }

        $progress = $this->computeProgress($user, $quest->getTrigger(), $this->periodStart($quest->getPeriod()));
        if ($progress < $quest->getTarget()) {
            throw new \DomainException('Objectif pas encore atteint.');
        }

        $wallet = $this->em->getRepository(Wallet::class)->findOneBy(['user' => $user]);
        if (!$wallet) {
            throw new \DomainException('Wallet introuvable pour l\'utilisateur.');
        }

        $claim = new UserQuestClaim();
        $claim->setUser($user);
        $claim->setQuest($quest);
        $claim->setPeriodKey($periodKey);
        $this->em->persist($claim);

        $wallet->credit($quest->getCoinsReward());
        $this->em->flush();

        return ['coinsReward' => $quest->getCoinsReward()];
    }

    private function computeProgress(User $user, QuestTrigger $trigger, \DateTimeImmutable $periodStart): int
    {
        $qb = $this->em->getRepository(CardAcquisitionLog::class)->createQueryBuilder('log')
            ->select('SUM(log.quantity)')
            ->where('log.user = :user')
            ->andWhere('log.acquiredAt >= :periodStart')
            ->setParameter('user', $user)
            ->setParameter('periodStart', $periodStart);

        if ($trigger === QuestTrigger::RARE_CARDS_OBTAINED) {
            $qb->join('log.card', 'card')
                ->andWhere('card.rarity IN (:rarities)')
                ->setParameter('rarities', [Rarity::EPIC, Rarity::LEGENDARY]);
        }

        $result = $qb->getQuery()->getSingleScalarResult();

        return (int) ($result ?? 0);
    }

    private function isClaimed(User $user, Quest $quest, string $periodKey): bool
    {
        return $this->em->getRepository(UserQuestClaim::class)->findOneBy([
            'user' => $user,
            'quest' => $quest,
            'periodKey' => $periodKey,
        ]) !== null;
    }

    private function periodStart(QuestPeriod $period): \DateTimeImmutable
    {
        $today = new \DateTimeImmutable('today');

        if ($period === QuestPeriod::DAILY) {
            return $today;
        }

        // Lundi 00:00 de la semaine courante (N : 1 = lundi .. 7 = dimanche)
        $dayOfWeek = (int) $today->format('N');
        return $today->modify('-' . ($dayOfWeek - 1) . ' days');
    }

    private function periodKey(QuestPeriod $period): string
    {
        $today = new \DateTimeImmutable('today');

        if ($period === QuestPeriod::DAILY) {
            return $today->format('Y-m-d');
        }

        // ex: "2026-W40"
        return $today->format('o-\WW');
    }
}
