<?php

namespace App\Cinema\Movie;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'movie')]
class Movie
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(unique: true)]
    private int $tmdbId;

    #[ORM\Column(length: 255)]
    private string $title;

    #[ORM\Column(type: 'date_immutable', nullable: true)]
    private ?\DateTimeImmutable $releaseDate = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $posterPath = null;

    #[ORM\Column(type: 'float', nullable: true)]
    private ?float $popularity = null;

    #[ORM\Column(nullable: true)]
    private ?int $voteCount = null;

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

    public function getTitle(): string
    {
        return $this->title;
    }
    public function setTitle(string $title): static
    {
        $this->title = $title;
        return $this;
    }

    public function getReleaseDate(): ?\DateTimeImmutable
    {
        return $this->releaseDate;
    }
    public function setReleaseDate(?\DateTimeImmutable $releaseDate): static
    {
        $this->releaseDate = $releaseDate;
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
}
