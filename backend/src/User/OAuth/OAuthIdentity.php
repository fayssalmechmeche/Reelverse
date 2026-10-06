<?php

namespace App\User\OAuth;

use App\User\User;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'oauth_identity')]
#[ORM\UniqueConstraint(name: 'uniq_oauth_provider_user', columns: ['provider', 'provider_user_id'])]
class OAuthIdentity
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private User $user;

    #[ORM\Column(length: 20)]
    private string $provider;

    #[ORM\Column(name: 'provider_user_id', length: 255)]
    private string $providerUserId;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    public function __construct(User $user, string $provider, string $providerUserId)
    {
        $this->user = $user;
        $this->provider = $provider;
        $this->providerUserId = $providerUserId;
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUser(): User
    {
        return $this->user;
    }

    public function getProvider(): string
    {
        return $this->provider;
    }

    public function getProviderUserId(): string
    {
        return $this->providerUserId;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }
}
