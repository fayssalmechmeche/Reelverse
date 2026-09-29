<?php

namespace App\Pack;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'pack_stock')]
class PackStock
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column]
    private int $storedPacks = 0;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $lastComputedAt;

    public function __construct()
    {
        $this->lastComputedAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }
    public function getStoredPacks(): int
    {
        return $this->storedPacks;
    }
    public function getLastComputedAt(): \DateTimeImmutable
    {
        return $this->lastComputedAt;
    }

    /**
     * Recalcule le nombre de packs accumulés depuis le dernier calcul, plafonné au max.
     * À appeler avant toute lecture ou consommation du stock.
     */
    public function sync(\DateTimeImmutable $now): static
    {
        $minutesElapsed = ($now->getTimestamp() - $this->lastComputedAt->getTimestamp()) / 60;
        $packsEarned = (int) floor($minutesElapsed / PackDrawConfig::PACK_INTERVAL_MINUTES);

        if ($packsEarned > 0) {
            $this->storedPacks = min(
                PackDrawConfig::MAX_PACKS_STOCK,
                $this->storedPacks + $packsEarned
            );
            // On avance lastComputedAt seulement du temps "consommé" par les packs gagnés,
            // pour ne pas perdre les minutes restantes du cycle en cours
            $this->lastComputedAt = $this->lastComputedAt->modify(
                sprintf('+%d minutes', $packsEarned * PackDrawConfig::PACK_INTERVAL_MINUTES)
            );
        }

        // Si on est déjà au stock max, on gèle le timer (pas d'accumulation au-delà)
        if ($this->storedPacks >= PackDrawConfig::MAX_PACKS_STOCK) {
            $this->lastComputedAt = $now;
        }

        return $this;
    }

    public function consumeOne(): static
    {
        if ($this->storedPacks <= 0) {
            throw new \DomainException('Aucun pack disponible.');
        }
        $this->storedPacks--;
        return $this;
    }
}
