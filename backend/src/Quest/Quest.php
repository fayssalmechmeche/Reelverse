<?php

namespace App\Quest;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'quest')]
class Quest
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private string $code;

    #[ORM\Column(length: 255)]
    private string $label;

    #[ORM\Column(length: 500)]
    private string $description;

    #[ORM\Column(enumType: QuestPeriod::class)]
    private QuestPeriod $period;

    #[ORM\Column(enumType: QuestTrigger::class)]
    private QuestTrigger $trigger;

    #[ORM\Column]
    private int $target;

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

    public function getDescription(): string
    {
        return $this->description;
    }
    public function setDescription(string $description): static
    {
        $this->description = $description;
        return $this;
    }

    public function getPeriod(): QuestPeriod
    {
        return $this->period;
    }
    public function setPeriod(QuestPeriod $period): static
    {
        $this->period = $period;
        return $this;
    }

    public function getTrigger(): QuestTrigger
    {
        return $this->trigger;
    }
    public function setTrigger(QuestTrigger $trigger): static
    {
        $this->trigger = $trigger;
        return $this;
    }

    public function getTarget(): int
    {
        return $this->target;
    }
    public function setTarget(int $target): static
    {
        $this->target = $target;
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
