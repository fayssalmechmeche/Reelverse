<?php

namespace App\Card;

class RarityCalculator
{
    // Seuils calibrés sur le catalogue réel (percentiles de popularité TMDB) :
    // Common ≈ 70 %, Uncommon ≈ 15 %, Rare ≈ 10 %, Epic ≈ 3,5 %, Legendary ≈ 1,5 %.
    // Les séries ont une popularité TMDB nettement plus haute que les films : seuils séparés.
    // Format : [seuil Legendary, seuil Epic, seuil Rare, seuil Uncommon]
    private const MOVIE_THRESHOLDS = [39.0, 23.0, 12.8, 8.4];
    private const SERIES_THRESHOLDS = [159.0, 94.0, 49.5, 30.0];

    // Les personnes ont des scores de popularité TMDB bien plus bas que les titres.
    // Les personnages héritent de la rareté de leur acteur.
    private const PERSON_THRESHOLDS = [20.0, 8.0, 3.0, 1.0];

    public function calculateForMovie(float $popularity): Rarity
    {
        return $this->fromThresholds($popularity, self::MOVIE_THRESHOLDS);
    }

    public function calculateForSeries(float $popularity): Rarity
    {
        return $this->fromThresholds($popularity, self::SERIES_THRESHOLDS);
    }

    public function calculateForPerson(float $popularity): Rarity
    {
        return $this->fromThresholds($popularity, self::PERSON_THRESHOLDS);
    }

    /** @param array{0: float, 1: float, 2: float, 3: float} $thresholds */
    private function fromThresholds(float $popularity, array $thresholds): Rarity
    {
        return match (true) {
            $popularity >= $thresholds[0] => Rarity::LEGENDARY,
            $popularity >= $thresholds[1] => Rarity::EPIC,
            $popularity >= $thresholds[2] => Rarity::RARE,
            $popularity >= $thresholds[3] => Rarity::UNCOMMON,
            default => Rarity::COMMON,
        };
    }
}
