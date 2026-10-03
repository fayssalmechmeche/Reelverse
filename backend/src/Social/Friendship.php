<?php

namespace App\Social;

use App\User\User;
use Doctrine\ORM\Mapping as ORM;

enum FriendshipStatus: string
{
    case PENDING = 'pending';
    case ACCEPTED = 'accepted';
}

#[ORM\Entity]
#[ORM\Table(name: 'friendship')]
class Friendship
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private User $requester;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private User $addressee;

    #[ORM\Column(enumType: FriendshipStatus::class)]
    private FriendshipStatus $status;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    public function __construct()
    {
        $this->status = FriendshipStatus::PENDING;
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getRequester(): User
    {
        return $this->requester;
    }
    public function setRequester(User $requester): static
    {
        $this->requester = $requester;
        return $this;
    }

    public function getAddressee(): User
    {
        return $this->addressee;
    }
    public function setAddressee(User $addressee): static
    {
        $this->addressee = $addressee;
        return $this;
    }

    public function getStatus(): FriendshipStatus
    {
        return $this->status;
    }
    public function accept(): static
    {
        $this->status = FriendshipStatus::ACCEPTED;
        return $this;
    }

    public function involves(User $user): bool
    {
        return $this->requester->getId() === $user->getId() || $this->addressee->getId() === $user->getId();
    }

    public function getOtherUser(User $user): User
    {
        return $this->requester->getId() === $user->getId() ? $this->addressee : $this->requester;
    }
}
