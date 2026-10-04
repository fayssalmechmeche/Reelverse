<?php

namespace App\LoginStreak;

use App\User\User;
use Doctrine\ORM\Mapping as ORM;

/**
 * Série de connexion quotidienne d'un joueur (calendrier 7 jours).
 *
 * currentDay est le dernier jour du cycle récupéré (1 à 7, revient à 1
 * après le 7). lastClaimedAt sert à savoir si la série continue (hier),
 * si elle est déjà à jour (aujourd'hui), ou si elle est rompue (plus
 * d'un jour d'écart, retour au jour 1).
 */
#[ORM\Entity]
#[ORM\Table(name: 'login_streak')]
class LoginStreak
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\OneToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false, unique: true)]
    private User $user;

    #[ORM\Column]
    private int $currentDay = 1;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $lastClaimedAt = null;

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

    public function getCurrentDay(): int
    {
        return $this->currentDay;
    }
    public function setCurrentDay(int $currentDay): static
    {
        $this->currentDay = $currentDay;
        return $this;
    }

    public function getLastClaimedAt(): ?\DateTimeImmutable
    {
        return $this->lastClaimedAt;
    }
    public function setLastClaimedAt(\DateTimeImmutable $lastClaimedAt): static
    {
        $this->lastClaimedAt = $lastClaimedAt;
        return $this;
    }
}
