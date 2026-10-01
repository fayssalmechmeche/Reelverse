<?php

namespace App\Economy;

use App\Card\Rarity;

class QuickSellPricing
{
    private const PRICES = [
        'common' => 20,
        'uncommon' => 50,
        'rare' => 120,
        'epic' => 300,
        'legendary' => 800,
    ];

    public function priceFor(Rarity $rarity): int
    {
        return self::PRICES[$rarity->value];
    }
}
