<?php

namespace App\Pack;

use App\Card\Rarity;

class PackDrawConfig
{
    // Probabilités en pourcentage, doivent totaliser 100
    private const WEIGHTS = [
        'common' => 55,
        'uncommon' => 27,
        'rare' => 13,
        'epic' => 4,
        'legendary' => 1,
    ];

    public const CARDS_PER_PACK = 5;
    public const MAX_PACKS_STOCK = 10;
    public const PACK_INTERVAL_MINUTES = 10;

    public function drawRarity(): Rarity
    {
        $roll = mt_rand(1, 100);
        $cumulative = 0;

        foreach (self::WEIGHTS as $rarityValue => $weight) {
            $cumulative += $weight;
            if ($roll <= $cumulative) {
                return Rarity::from($rarityValue);
            }
        }

        return Rarity::COMMON; // filet de sécurité, ne devrait jamais arriver
    }
}
