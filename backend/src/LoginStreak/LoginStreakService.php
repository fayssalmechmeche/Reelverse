<?php

namespace App\LoginStreak;

use App\Economy\Wallet\WalletService;
use App\User\User;
use Doctrine\DBAL\LockMode;
use Doctrine\ORM\EntityManagerInterface;

class LoginStreakService
{
    /** Récompenses en Coins par jour du cycle de 7 jours. */
    private const REWARDS = [
        1 => 100,
        2 => 150,
        3 => 200,
        4 => 250,
        5 => 300,
        6 => 400,
        7 => 750,
    ];

    public function __construct(
        private EntityManagerInterface $em,
        private WalletService $wallet,
    ) {}

    public function getStatus(User $user): array
    {
        $streak = $this->getOrCreate($user);
        [$day, $claimable] = $this->computeCurrentState($streak);

        return [
            'currentDay' => $day,
            'claimable' => $claimable,
            'coinsReward' => self::REWARDS[$day],
            'rewards' => array_map(
                fn(int $d, int $coins) => ['day' => $d, 'coinsReward' => $coins],
                array_keys(self::REWARDS),
                self::REWARDS,
            ),
        ];
    }

    public function claim(User $user): array
    {
        $streak = $this->getOrCreate($user);

        return $this->em->wrapInTransaction(function () use ($user, $streak) {
            // Relecture avec verrou : deux récupérations simultanées sont traitées une par une,
            // la seconde voit déjà la récompense du jour récupérée.
            $this->em->refresh($streak, LockMode::PESSIMISTIC_WRITE);
            [$day, $claimable] = $this->computeCurrentState($streak);

            if (!$claimable) {
                throw new \DomainException('La récompense du jour a déjà été récupérée.');
            }

            $reward = self::REWARDS[$day];
            $this->wallet->credit((int) $user->getId(), $reward);

            $streak->setCurrentDay($day);
            $streak->setLastClaimedAt(new \DateTimeImmutable('today'));
            $this->em->flush();

            return ['day' => $day, 'coinsReward' => $reward];
        });
    }

    private function getOrCreate(User $user): LoginStreak
    {
        $streak = $this->em->getRepository(LoginStreak::class)->findOneBy(['user' => $user]);
        if (!$streak) {
            $streak = new LoginStreak();
            $streak->setUser($user);
            $this->em->persist($streak);
            $this->em->flush();
        }

        return $streak;
    }

    /** @return array{0: int, 1: bool} [jour courant du cycle, récupérable maintenant] */
    private function computeCurrentState(LoginStreak $streak): array
    {
        $today = new \DateTimeImmutable('today');
        $lastClaimedAt = $streak->getLastClaimedAt();

        if ($lastClaimedAt === null) {
            return [1, true];
        }

        if ($lastClaimedAt->format('Y-m-d') === $today->format('Y-m-d')) {
            // Déjà récupérée aujourd'hui.
            return [$streak->getCurrentDay(), false];
        }

        $yesterday = $today->modify('-1 day');
        if ($lastClaimedAt->format('Y-m-d') === $yesterday->format('Y-m-d')) {
            // La série continue : jour suivant (retour à 1 après le jour 7).
            $nextDay = $streak->getCurrentDay() >= 7 ? 1 : $streak->getCurrentDay() + 1;
            return [$nextDay, true];
        }

        // Plus d'un jour d'écart : la série est rompue, retour au jour 1.
        return [1, true];
    }
}
