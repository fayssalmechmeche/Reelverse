<?php

namespace App\User;

use App\Economy\Wallet\Wallet;
use App\LoginStreak\LoginStreak;
use App\Pack\PackStock;
use Doctrine\ORM\EntityManagerInterface;

class UserOnboarding
{
    private const STARTING_COINS = 500;

    public function __construct(
        private EntityManagerInterface $em,
    ) {}

    public function setupNewUser(User $user): void
    {
        $wallet = new Wallet();
        $wallet->setUser($user);
        $wallet->credit(self::STARTING_COINS);
        $this->em->persist($wallet);

        $stock = new PackStock();
        $stock->setUser($user);
        $this->em->persist($stock);

        $loginStreak = new LoginStreak();
        $loginStreak->setUser($user);
        $this->em->persist($loginStreak);
    }
}
