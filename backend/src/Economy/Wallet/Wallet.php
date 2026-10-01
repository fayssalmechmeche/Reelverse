<?php

namespace App\Economy\Wallet;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use Doctrine\ORM\Mapping as ORM;
use App\User\User;

#[ApiResource(
    operations: [
        new Get(),
    ]
)]
#[ORM\Entity]
#[ORM\Table(name: 'wallet')]
class Wallet
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column]
    private int $balance = 0;

    #[ORM\OneToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false, unique: true)]
    private User $user;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getBalance(): int
    {
        return $this->balance;
    }



    public function getUser(): User
    {
        return $this->user;
    }
    public function setUser(User $user): static
    {
        $this->user = $user;
        return $this;
    }

    public function credit(int $amount): static
    {
        if ($amount < 0) {
            throw new \InvalidArgumentException('Le montant à créditer doit être positif.');
        }
        $this->balance += $amount;
        return $this;
    }

    public function debit(int $amount): static
    {
        if ($amount < 0) {
            throw new \InvalidArgumentException('Le montant à débiter doit être positif.');
        }
        if ($amount > $this->balance) {
            throw new \DomainException('Solde insuffisant.');
        }
        $this->balance -= $amount;
        return $this;
    }
}
