<?php

namespace App\Shop;

use App\Card\RandomCardDrawer;
use App\Pack\PackDrawConfig;
use App\User\User;
use Doctrine\ORM\EntityManagerInterface;

class ShopGenerator
{
    public function __construct(
        private EntityManagerInterface $em,
        private PackDrawConfig $drawConfig,
        private ShopPricing $pricing,
        private RandomCardDrawer $drawer,
    ) {}

    public function getOrCreateForToday(User $user): Shop
    {
        $today = new \DateTimeImmutable('today');

        $existing = $this->em->getRepository(Shop::class)->findOneBy([
            'user' => $user,
            'forDate' => $today,
        ]);

        if ($existing) {
            return $existing;
        }

        $shop = new Shop();
        $shop->setUser($user);
        $shop->setForDate($today);

        $usedIds = [];

        for ($i = 0; $i < ShopPricing::CARDS_PER_SHOP; $i++) {
            $rarity = $this->drawConfig->drawRarity();
            $card = $this->drawer->pickRandomCard($rarity, $usedIds);

            if ($card === null) {
                continue;
            }

            $usedIds[] = $card->getId();

            $shopCard = new ShopCard();
            $shopCard->setCard($card);
            $shopCard->setPrice($this->pricing->priceFor($rarity));
            $shop->addShopCard($shopCard);
        }

        $this->em->persist($shop);
        $this->em->flush();

        return $shop;
    }
}
