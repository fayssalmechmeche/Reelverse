<?php

namespace App\Card;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use Doctrine\ORM\Mapping as ORM;

enum CardType: string
{
    case PERSON = 'person';
    case MOVIE = 'movie';
    case SERIES = 'series';
    case CHARACTER = 'character';
}

enum Rarity: string
{
    case COMMON = 'common';
    case UNCOMMON = 'uncommon';
    case RARE = 'rare';
    case EPIC = 'epic';
    case LEGENDARY = 'legendary';
}

#[ApiResource(
    operations: [
        new GetCollection(),
        new Get(),
    ]
)]
#[ORM\Entity]
#[ORM\Table(name: 'card')]
#[ORM\UniqueConstraint(columns: ['type', 'entity_id'])]
class Card
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(enumType: CardType::class)]
    private CardType $type;

    #[ORM\Column(name: 'entity_id')]
    private int $entityId;

    #[ORM\Column(enumType: Rarity::class)]
    private Rarity $rarity;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getType(): CardType
    {
        return $this->type;
    }
    public function setType(CardType $type): static
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

    public function getRarity(): Rarity
    {
        return $this->rarity;
    }
    public function setRarity(Rarity $rarity): static
    {
        $this->rarity = $rarity;
        return $this;
    }
}
