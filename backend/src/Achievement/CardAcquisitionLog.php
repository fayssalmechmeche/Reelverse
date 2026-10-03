<?php

namespace App\Achievement;

use App\Card\Card;
use App\User\User;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'card_acquisition_log')]
class CardAcquisitionLog
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
    private int $quantity;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $acquiredAt;

    public function __construct()
    {
        $this->acquiredAt = new \DateTimeImmutable();
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
    public function setQuantity(int $quantity): static
    {
        $this->quantity = $quantity;
        return $this;
    }

    public function getAcquiredAt(): \DateTimeImmutable
    {
        return $this->acquiredAt;
    }
}
