<?php

namespace App\User;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;

#[ORM\Entity]
#[ORM\Table(name: 'app_user')]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(unique: true)]
    private string $email;

    #[ORM\Column(unique: true)]
    private string $username;

    #[ORM\Column]
    private string $password;

    #[ORM\Column(nullable: true)]
    private ?string $avatar = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $bannedAt = null;

    #[ORM\Column(nullable: true)]
    private ?string $banReason = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getEmail(): string
    {
        return $this->email;
    }
    public function setEmail(string $email): static
    {
        $this->email = $email;
        return $this;
    }

    public function getPseudo(): string
    {
        return $this->username;
    }
    public function setPseudo(string $username): static
    {
        $this->username = $username;
        return $this;
    }

    public function getPassword(): string
    {
        return $this->password;
    }
    public function setPassword(string $password): static
    {
        $this->password = $password;
        return $this;
    }

    public function getAvatar(): ?string
    {
        return $this->avatar;
    }
    public function setAvatar(?string $avatar): static
    {
        $this->avatar = $avatar;
        return $this;
    }

    public function getAvatarUrl(): ?string
    {
        return $this->avatar
            ? sprintf('/api/users/%d/avatar?v=%s', $this->id, $this->avatar)
            : null;
    }

    public function isBanned(): bool
    {
        return $this->bannedAt !== null;
    }

    public function getBannedAt(): ?\DateTimeImmutable
    {
        return $this->bannedAt;
    }

    public function getBanReason(): ?string
    {
        return $this->banReason;
    }

    public function ban(?string $reason = null): static
    {
        $this->bannedAt = new \DateTimeImmutable();
        $this->banReason = $reason !== null ? mb_substr($reason, 0, 255) : null;
        return $this;
    }

    public function unban(): static
    {
        $this->bannedAt = null;
        $this->banReason = null;
        return $this;
    }

    public function getUserIdentifier(): string
    {
        return $this->email;
    }

    public function getRoles(): array
    {
        return ['ROLE_USER'];
    }

    public function eraseCredentials(): void {}
}
