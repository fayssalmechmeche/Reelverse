<?php

namespace App\Achievement;

use App\User\User;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'user_achievement')]
#[ORM\UniqueConstraint(columns: ['user_id', 'achievement_id'])]
class UserAchievement
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private User $user;

    #[ORM\ManyToOne(targetEntity: Achievement::class)]
    #[ORM\JoinColumn(nullable: false)]
    private Achievement $achievement;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $unlockedAt;

    public function __construct()
    {
        $this->unlockedAt = new \DateTimeImmutable();
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

    public function getAchievement(): Achievement
    {
        return $this->achievement;
    }
    public function setAchievement(Achievement $achievement): static
    {
        $this->achievement = $achievement;
        return $this;
    }

    public function getUnlockedAt(): \DateTimeImmutable
    {
        return $this->unlockedAt;
    }
}
