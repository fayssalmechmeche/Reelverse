<?php

declare(strict_types=1);

namespace App\Notification;

use App\User\User;
use Doctrine\ORM\Mapping as ORM;

/** Types de notifications désactivés par un joueur. Tout est activé par défaut. */
#[ORM\Entity]
#[ORM\Table(name: 'notification_preference')]
class NotificationPreference
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\OneToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false, unique: true, onDelete: 'CASCADE')]
    private User $user;

    /** @var string[] */
    #[ORM\Column(type: 'json')]
    private array $disabledTypes = [];

    public function __construct(User $user)
    {
        $this->user = $user;
    }

    /** @return string[] */
    public function getDisabledTypes(): array
    {
        return $this->disabledTypes;
    }

    /** @param string[] $types */
    public function setDisabledTypes(array $types): void
    {
        $this->disabledTypes = array_values(array_unique($types));
    }
}
