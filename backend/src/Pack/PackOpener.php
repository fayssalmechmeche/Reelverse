<?php

namespace App\Pack;

use App\Card\Card;
use App\Card\RandomCardDrawer;
use Doctrine\ORM\EntityManagerInterface;

class PackOpener
{
    public function __construct(
        private EntityManagerInterface $em,
        private PackDrawConfig $config,
        private RandomCardDrawer $drawer,
    ) {}

    /**
     * @return Card[] les cartes tirées (5, sans doublon dans ce pack)
     */
    public function open(PackStock $stock): array
    {
        $stock->sync(new \DateTimeImmutable());
        $stock->consumeOne();

        $drawn = [];
        $usedIds = [];

        $attempts = 0;
        while (count($drawn) < PackDrawConfig::CARDS_PER_PACK) {
            // Garde-fou : sans cartes disponibles, on ne boucle pas indefiniment.
            if (++$attempts > 100) {
                throw new \DomainException('Impossible de tirer des cartes : catalogue insuffisant.');
            }

            $rarity = $this->config->drawRarity();
            $card = $this->drawer->pickRandomCard($rarity, $usedIds);

            if ($card === null) {
                continue;
            }

            $drawn[] = $card;
            $usedIds[] = $card->getId();
        }

        $this->em->flush();

        return $drawn;
    }
}
