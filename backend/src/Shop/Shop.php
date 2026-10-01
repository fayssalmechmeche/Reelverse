<?php

namespace App\Shop;

use App\User\User;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'shop')]
class Shop
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private User $user;

    #[ORM\Column(type: 'date_immutable')]
    private \DateTimeImmutable $forDate;

    #[ORM\OneToMany(targetEntity: ShopCard::class, mappedBy: 'shop', cascade: ['persist'])]
    private Collection $shopCards;

    public function __construct()
    {
        $this->shopCards = new ArrayCollection();
    }

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

    public function getForDate(): \DateTimeImmutable
    {
        return $this->forDate;
    }
    public function setForDate(\DateTimeImmutable $forDate): static
    {
        $this->forDate = $forDate;
        return $this;
    }

    public function getShopCards(): Collection
    {
        return $this->shopCards;
    }

    public function addShopCard(ShopCard $shopCard): static
    {
        $shopCard->setShop($this);
        $this->shopCards->add($shopCard);
        return $this;
    }
}
