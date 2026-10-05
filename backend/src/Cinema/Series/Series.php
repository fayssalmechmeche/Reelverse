<?php

namespace App\Cinema\Series;

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
#[ORM\Table(name: 'series')]
class Series
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(unique: true)]
    private int $tmdbId;

    #[ORM\Column(length: 255)]
    private string $name;

    #[ORM\Column(type: 'date_immutable', nullable: true)]
    private ?\DateTimeImmutable $firstAirDate = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $posterPath = null;

    #[ORM\Column(type: 'float', nullable: true)]
    private ?float $popularity = null;

    #[ORM\Column(nullable: true)]
    private ?int $voteCount = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $overview = null;

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

    public function getFirstAirDate(): ?\DateTimeImmutable
    {
        return $this->firstAirDate;
    }
    public function setFirstAirDate(?\DateTimeImmutable $firstAirDate): static
    {
        $this->firstAirDate = $firstAirDate;
        return $this;
    }

    public function getPosterPath(): ?string
    {
        return $this->posterPath;
    }
    public function setPosterPath(?string $posterPath): static
    {
        $this->posterPath = $posterPath;
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

    public function getVoteCount(): ?int
    {
        return $this->voteCount;
    }
    public function setVoteCount(?int $voteCount): static
    {
        $this->voteCount = $voteCount;
        return $this;
    }

    public function getOverview(): ?string
    {
        return $this->overview;
    }
    public function setOverview(?string $overview): static
    {
        $this->overview = $overview;
        return $this;
    }
}
