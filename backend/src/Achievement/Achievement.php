<?php

namespace App\Achievement;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'achievement')]
class Achievement
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private string $code;

    #[ORM\Column(length: 255)]
    private string $label;

    #[ORM\Column(enumType: AchievementTrigger::class)]
    private AchievementTrigger $trigger;

    #[ORM\Column(nullable: true)]
    private ?int $threshold = null;

    #[ORM\Column]
    private int $coinsReward = 0;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getCode(): string
    {
        return $this->code;
    }
    public function setCode(string $code): static
    {
        $this->code = $code;
        return $this;
    }

    public function getLabel(): string
    {
        return $this->label;
    }
    public function setLabel(string $label): static
    {
        $this->label = $label;
        return $this;
    }

    public function getTrigger(): AchievementTrigger
    {
        return $this->trigger;
    }
    public function setTrigger(AchievementTrigger $trigger): static
    {
        $this->trigger = $trigger;
        return $this;
    }

    public function getThreshold(): ?int
    {
        return $this->threshold;
    }
    public function setThreshold(?int $threshold): static
    {
        $this->threshold = $threshold;
        return $this;
    }

    public function getCoinsReward(): int
    {
        return $this->coinsReward;
    }
    public function setCoinsReward(int $coinsReward): static
    {
        $this->coinsReward = $coinsReward;
        return $this;
    }
}
