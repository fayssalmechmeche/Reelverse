<?php

namespace App\Cinema\Character;

use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use App\Cinema\Movie\Movie;
use App\Cinema\Person\Person;
use App\Cinema\Series\Series;
use Doctrine\ORM\Mapping as ORM;

#[ApiResource(
    operations: [
        new GetCollection(),
        new Get(),
    ]
)]
#[ApiFilter(SearchFilter::class, properties: ['actor' => 'exact', 'movie' => 'exact', 'series' => 'exact'])]
#[ORM\Entity]
#[ORM\Table(name: 'character')]
class Character
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private string $name;

    #[ORM\ManyToOne(targetEntity: Person::class)]
    #[ORM\JoinColumn(nullable: false)]
    private Person $actor;

    #[ORM\ManyToOne(targetEntity: Movie::class)]
    #[ORM\JoinColumn(nullable: true)]
    private ?Movie $movie = null;

    #[ORM\ManyToOne(targetEntity: Series::class)]
    #[ORM\JoinColumn(nullable: true)]
    private ?Series $series = null;

    /** Image du personnage (TheTVDB, hotlink). Vide : on affiche la photo de l'acteur. */
    #[ORM\Column(length: 500, nullable: true)]
    private ?string $imageUrl = null;

    public function getId(): ?int
    {
        return $this->id;
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

    public function getActor(): Person
    {
        return $this->actor;
    }
    public function setActor(Person $actor): static
    {
        $this->actor = $actor;
        return $this;
    }

    public function getMovie(): ?Movie
    {
        return $this->movie;
    }
    public function setMovie(?Movie $movie): static
    {
        $this->movie = $movie;
        return $this;
    }

    public function getImageUrl(): ?string
    {
        return $this->imageUrl;
    }
    public function setImageUrl(?string $imageUrl): static
    {
        $this->imageUrl = $imageUrl;
        return $this;
    }

    public function getSeries(): ?Series
    {
        return $this->series;
    }
    public function setSeries(?Series $series): static
    {
        $this->series = $series;
        return $this;
    }
}
