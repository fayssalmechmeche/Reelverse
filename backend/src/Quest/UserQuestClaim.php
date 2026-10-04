<?php

namespace App\Quest;

use App\User\User;
use Doctrine\ORM\Mapping as ORM;

/**
 * Trace qu'un joueur a récupéré la récompense d'une quête pour une période
 * donnée (ex: "2026-10-04" pour une quête quotidienne, "2026-W40" pour une
 * hebdomadaire). Empêche de récupérer deux fois la même quête sur la même
 * période, tout en la laissant redevenir disponible à la période suivante.
 */
#[ORM\Entity]
#[ORM\Table(name: 'user_quest_claim')]
#[ORM\UniqueConstraint(columns: ['user_id', 'quest_id', 'period_key'])]
class UserQuestClaim
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private User $user;

    #[ORM\ManyToOne(targetEntity: Quest::class)]
    #[ORM\JoinColumn(nullable: false)]
    private Quest $quest;

    #[ORM\Column(length: 20)]
    private string $periodKey;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $claimedAt;

    public function __construct()
    {
        $this->claimedAt = new \DateTimeImmutable();
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

    public function getQuest(): Quest
    {
        return $this->quest;
    }
    public function setQuest(Quest $quest): static
    {
        $this->quest = $quest;
        return $this;
    }

    public function getPeriodKey(): string
    {
        return $this->periodKey;
    }
    public function setPeriodKey(string $periodKey): static
    {
        $this->periodKey = $periodKey;
        return $this;
    }

    public function getClaimedAt(): \DateTimeImmutable
    {
        return $this->claimedAt;
    }
}
