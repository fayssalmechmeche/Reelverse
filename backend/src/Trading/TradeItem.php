<?php

namespace App\Trading;

use App\Card\Card;
use App\User\User;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'trade_item')]
class TradeItem
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Trade::class, inversedBy: 'items')]
    #[ORM\JoinColumn(nullable: false)]
    private Trade $trade;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private User $owner; // qui propose cette carte dans l'échange

    #[ORM\ManyToOne(targetEntity: Card::class)]
    #[ORM\JoinColumn(nullable: false)]
    private Card $card;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getTrade(): Trade
    {
        return $this->trade;
    }
    public function setTrade(Trade $trade): static
    {
        $this->trade = $trade;
        return $this;
    }

    public function getOwner(): User
    {
        return $this->owner;
    }
    public function setOwner(User $owner): static
    {
        $this->owner = $owner;
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
}
