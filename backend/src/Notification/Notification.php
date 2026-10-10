<?php

declare(strict_types=1);

namespace App\Notification;

use App\User\User;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'notification')]
#[ORM\Index(name: 'idx_notification_user_created', columns: ['user_id', 'created_at'])]
#[ORM\UniqueConstraint(name: 'uniq_notification_user_dedupe', columns: ['user_id', 'dedupe_key'])]
class Notification
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private User $user;

    #[ORM\Column(length: 32, enumType: NotificationType::class)]
    private NotificationType $type;

    #[ORM\Column(length: 255)]
    private string $message;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $link;

    // Évite les doublons pour les événements périodiques (ex: "shop:2026-10-11").
    #[ORM\Column(length: 100, nullable: true)]
    private ?string $dedupeKey;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $readAt = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    public function __construct(User $user, NotificationType $type, string $message, ?string $link = null, ?string $dedupeKey = null)
    {
        $this->user = $user;
        $this->type = $type;
        $this->message = mb_substr($message, 0, 255);
        $this->link = $link;
        $this->dedupeKey = $dedupeKey;
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getType(): NotificationType
    {
        return $this->type;
    }

    public function getMessage(): string
    {
        return $this->message;
    }

    public function getLink(): ?string
    {
        return $this->link;
    }

    public function getReadAt(): ?\DateTimeImmutable
    {
        return $this->readAt;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }
}
