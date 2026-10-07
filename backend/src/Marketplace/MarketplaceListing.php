<?php

namespace App\Marketplace;

use App\Inventory\UserCard;
use App\User\User;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'marketplace_listing')]
class MarketplaceListing
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private User $seller;

    #[ORM\ManyToOne(targetEntity: \App\Card\Card::class)]
    #[ORM\JoinColumn(nullable: false)]
    private \App\Card\Card $card;

    #[ORM\Column]
    private int $price;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column]
    private bool $sold = false;

    /** Date de la vente (null pour les ventes antérieures à l'ajout de ce champ). */
    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $soldAt = null;

    #[ORM\Column]
    private bool $cancelled = false;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getSeller(): User
    {
        return $this->seller;
    }
    public function setSeller(User $seller): static
    {
        $this->seller = $seller;
        return $this;
    }

    public function getCard(): \App\Card\Card
    {
        return $this->card;
    }
    public function setCard(\App\Card\Card $card): static
    {
        $this->card = $card;
        return $this;
    }

    public function getPrice(): int
    {
        return $this->price;
    }
    public function setPrice(int $price): static
    {
        $this->price = $price;
        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function isSold(): bool
    {
        return $this->sold;
    }
    public function markAsSold(): static
    {
        $this->sold = true;
        $this->soldAt = new \DateTimeImmutable();
        return $this;
    }

    public function getSoldAt(): ?\DateTimeImmutable
    {
        return $this->soldAt;
    }

    public function isCancelled(): bool
    {
        return $this->cancelled;
    }
    public function cancel(): static
    {
        $this->cancelled = true;
        return $this;
    }

    public function isActive(): bool
    {
        return !$this->sold && !$this->cancelled;
    }
}
