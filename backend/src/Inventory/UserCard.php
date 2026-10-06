<?php

namespace App\Inventory;

use App\Card\Card;
use App\User\User;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'user_card')]
#[ORM\UniqueConstraint(columns: ['user_id', 'card_id'])]
class UserCard
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private User $user;

    #[ORM\ManyToOne(targetEntity: Card::class)]
    #[ORM\JoinColumn(nullable: false)]
    private Card $card;

    #[ORM\Column]
    private int $quantity = 0;

    /** Carte obtenue et pas encore consultée (onglet "Nouvelles"). */
    #[ORM\Column(options: ['default' => false])]
    private bool $isNew = false;

    public function getId(): ?int
    {
        return $this->id;
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

    public function getCard(): Card
    {
        return $this->card;
    }
    public function setCard(Card $card): static
    {
        $this->card = $card;
        return $this;
    }

    public function getQuantity(): int
    {
        return $this->quantity;
    }

    public function isNew(): bool
    {
        return $this->isNew;
    }

    public function setIsNew(bool $isNew): static
    {
        $this->isNew = $isNew;
        return $this;
    }

    public function addQuantity(int $amount = 1): static
    {
        if ($amount < 0) {
            throw new \InvalidArgumentException('La quantité à ajouter doit être positive.');
        }
        $this->quantity += $amount;
        return $this;
    }

    public function removeQuantity(int $amount = 1): static
    {
        if ($amount < 0) {
            throw new \InvalidArgumentException('La quantité à retirer doit être positive.');
        }
        if ($amount > $this->quantity) {
            throw new \DomainException('Quantité insuffisante.');
        }
        $this->quantity -= $amount;
        return $this;
    }
}
