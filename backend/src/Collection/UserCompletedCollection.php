<?php

namespace App\Collection;

use App\User\User;
use Doctrine\ORM\Mapping as ORM;

/**
 * Mémorise qu'une collection (acteur, film ou série) a déjà été complétée
 * à 100% par un joueur, pour pouvoir compter le nombre total de collections
 * complétées sans tout recalculer à chaque carte obtenue, et pour ne
 * déclencher le succès générique "collection_completed" qu'une seule fois
 * par collection.
 */
#[ORM\Entity]
#[ORM\Table(name: 'user_completed_collection')]
#[ORM\UniqueConstraint(columns: ['user_id', 'type', 'entity_id'])]
class UserCompletedCollection
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private User $user;

    /** 'person' | 'movie' | 'series' */
    #[ORM\Column(length: 20)]
    private string $type;

    #[ORM\Column]
    private int $entityId;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $completedAt;

    public function __construct()
    {
        $this->completedAt = new \DateTimeImmutable();
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

    public function getType(): string
    {
        return $this->type;
    }
    public function setType(string $type): static
    {
        $this->type = $type;
        return $this;
    }

    public function getEntityId(): int
    {
        return $this->entityId;
    }
    public function setEntityId(int $entityId): static
    {
        $this->entityId = $entityId;
        return $this;
    }

    public function getCompletedAt(): \DateTimeImmutable
    {
        return $this->completedAt;
    }
}
