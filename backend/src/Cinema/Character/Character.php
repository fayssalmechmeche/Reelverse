<?php

namespace App\Cinema\Character;

use App\Cinema\Movie\Movie;
use App\Cinema\Person\Person;
use App\Cinema\Series\Series;
use Doctrine\ORM\Mapping as ORM;

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
