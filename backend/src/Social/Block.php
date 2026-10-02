<?php

namespace App\Social;

use App\User\User;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'user_block')]
#[ORM\UniqueConstraint(columns: ['blocker_id', 'blocked_id'])]
class Block
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false, name: 'blocker_id')]
    private User $blocker;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false, name: 'blocked_id')]
    private User $blocked;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getBlocker(): User
    {
        return $this->blocker;
    }
    public function setBlocker(User $blocker): static
    {
        $this->blocker = $blocker;
        return $this;
    }

    public function getBlocked(): User
    {
        return $this->blocked;
    }
    public function setBlocked(User $blocked): static
    {
        $this->blocked = $blocked;
        return $this;
    }
}
