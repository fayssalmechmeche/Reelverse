<?php

namespace App\Shop;

use App\Card\Card;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'shop_card')]
class ShopCard
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Shop::class, inversedBy: 'shopCards')]
    #[ORM\JoinColumn(nullable: false)]
    private Shop $shop;

    #[ORM\ManyToOne(targetEntity: Card::class)]
    #[ORM\JoinColumn(nullable: false)]
    private Card $card;

    #[ORM\Column]
    private int $price;

    #[ORM\Column]
    private bool $sold = false;

    #[ORM\Column]
    private bool $refreshed = false;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getShop(): Shop
    {
        return $this->shop;
    }
    public function setShop(Shop $shop): static
    {
        $this->shop = $shop;
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

    public function getPrice(): int
    {
        return $this->price;
    }
    public function setPrice(int $price): static
    {
        $this->price = $price;
        return $this;
    }

    public function isSold(): bool
    {
        return $this->sold;
    }
    public function markAsSold(): static
    {
        $this->sold = true;
        return $this;
    }

    public function isRefreshed(): bool
    {
        return $this->refreshed;
    }
    public function markAsRefreshed(): static
    {
        $this->refreshed = true;
        return $this;
    }
}
