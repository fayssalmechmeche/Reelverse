<?php

namespace App\Cinema\Person;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use Doctrine\ORM\Mapping as ORM;

#[ApiResource(
    operations: [
        new GetCollection(),
        new Get(),
    ]
)]
#[ORM\Entity]
#[ORM\Table(name: 'person')]
class Person
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(unique: true)]
    private int $tmdbId;

    #[ORM\Column(length: 255)]
    private string $name;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $profilePath = null;

    #[ORM\Column(type: 'float', nullable: true)]
    private ?float $popularity = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getTmdbId(): int
    {
        return $this->tmdbId;
    }
    public function setTmdbId(int $tmdbId): static
    {
        $this->tmdbId = $tmdbId;
        return $this;
    }

    public function getName(): string
    {
        return $this->name;
    }
    public function setName(string $name): static
    {
        $this->name = $name;
        return $this;
    }

    public function getProfilePath(): ?string
    {
        return $this->profilePath;
    }
    public function setProfilePath(?string $profilePath): static
    {
        $this->profilePath = $profilePath;
        return $this;
    }

    public function getPopularity(): ?float
    {
        return $this->popularity;
    }
    public function setPopularity(?float $popularity): static
    {
        $this->popularity = $popularity;
        return $this;
    }
}
