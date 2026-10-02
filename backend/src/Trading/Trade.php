<?php

namespace App\Trading;

use App\User\User;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

enum TradeStatus: string
{
    case PENDING = 'pending';
    case ACCEPTED = 'accepted';
    case CANCELLED = 'cancelled';
    case EXPIRED = 'expired';
}

#[ORM\Entity]
#[ORM\Table(name: 'trade')]
class Trade
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private User $proposer;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private User $recipient;

    #[ORM\Column(enumType: TradeStatus::class)]
    private TradeStatus $status;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $expiresAt;

    #[ORM\OneToMany(targetEntity: TradeItem::class, mappedBy: 'trade', cascade: ['persist'])]
    private Collection $items;

    public function __construct()
    {
        $this->status = TradeStatus::PENDING;
        $this->createdAt = new \DateTimeImmutable();
        $this->expiresAt = $this->createdAt->modify('+48 hours');
        $this->items = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getProposer(): User
    {
        return $this->proposer;
    }
    public function setProposer(User $proposer): static
    {
        $this->proposer = $proposer;
        return $this;
    }

    public function getRecipient(): User
    {
        return $this->recipient;
    }
    public function setRecipient(User $recipient): static
    {
        $this->recipient = $recipient;
        return $this;
    }

    public function getStatus(): TradeStatus
    {
        return $this->status;
    }
    public function setStatus(TradeStatus $status): static
    {
        $this->status = $status;
        return $this;
    }

    public function getExpiresAt(): \DateTimeImmutable
    {
        return $this->expiresAt;
    }

    public function isExpired(): bool
    {
        return $this->status === TradeStatus::PENDING && new \DateTimeImmutable() > $this->expiresAt;
    }

    public function getItems(): Collection
    {
        return $this->items;
    }

    public function addItem(TradeItem $item): static
    {
        $item->setTrade($this);
        $this->items->add($item);
        return $this;
    }

    public function involves(User $user): bool
    {
        return $this->proposer->getId() === $user->getId() || $this->recipient->getId() === $user->getId();
    }
}
