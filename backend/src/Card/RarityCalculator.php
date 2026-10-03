<?php

namespace App\Card;

class RarityCalculator
{
    // Seuils configurables : le seul endroit du code où ils sont définis
    private const POPULARITY_LEGENDARY = 200.0;
    private const POPULARITY_EPIC = 80.0;
    private const POPULARITY_RARE = 30.0;
    private const POPULARITY_UNCOMMON = 10.0;

    private const VOTE_COUNT_BONUS_THRESHOLD = 5000;

    public function calculateForTitle(float $popularity, ?int $voteCount): Rarity
    {
        // Un titre très voté peut monter d'un cran, même si sa popularité TMDB a baissé avec le temps
        $bonus = ($voteCount ?? 0) >= self::VOTE_COUNT_BONUS_THRESHOLD;

        return match (true) {
            $popularity >= self::POPULARITY_LEGENDARY => Rarity::LEGENDARY,
            $popularity >= self::POPULARITY_EPIC || ($bonus && $popularity >= self::POPULARITY_RARE) => Rarity::EPIC,
            $popularity >= self::POPULARITY_RARE => Rarity::RARE,
            $popularity >= self::POPULARITY_UNCOMMON => Rarity::UNCOMMON,
            default => Rarity::COMMON,
        };
    }

    public function calculateForPerson(float $popularity): Rarity
    {
        // Les personnes ont des scores de popularité TMDB plus bas que les films/séries, seuils réduits
        return match (true) {
            $popularity >= 20.0 => Rarity::LEGENDARY,
            $popularity >= 8.0 => Rarity::EPIC,
            $popularity >= 3.0 => Rarity::RARE,
            $popularity >= 1.0 => Rarity::UNCOMMON,
            default => Rarity::COMMON,
        };
    }
}
