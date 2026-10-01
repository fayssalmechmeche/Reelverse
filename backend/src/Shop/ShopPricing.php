<?php

namespace App\Shop;

use App\Card\Rarity;

class ShopPricing
{
    private const PRICES = [
        'common' => 100,
        'uncommon' => 250,
        'rare' => 500,
        'epic' => 1200,
        'legendary' => 3000,
    ];

    private const REFRESH_COST = 50;

    public const CARDS_PER_SHOP = 5;

    public function priceFor(Rarity $rarity): int
    {
        return self::PRICES[$rarity->value];
    }

    public function refreshCost(): int
    {
        return self::REFRESH_COST;
    }
}
