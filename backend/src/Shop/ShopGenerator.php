<?php

namespace App\Shop;

use App\Card\Card;
use App\Card\Rarity;
use App\Pack\PackDrawConfig;
use App\User\User;
use Doctrine\ORM\EntityManagerInterface;

class ShopGenerator
{
    public function __construct(
        private EntityManagerInterface $em,
        private PackDrawConfig $drawConfig,
        private ShopPricing $pricing,
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
            $card = $this->pickRandomCard($rarity, $usedIds);

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

    public function pickRandomCard(Rarity $rarity, array $excludeIds = []): ?Card
    {
        $qb = $this->em->getRepository(Card::class)->createQueryBuilder('c')
            ->where('c.rarity = :rarity')
            ->setParameter('rarity', $rarity);

        if (!empty($excludeIds)) {
            $qb->andWhere('c.id NOT IN (:excluded)')
                ->setParameter('excluded', $excludeIds);
        }

        $count = (clone $qb)->select('COUNT(c.id)')->getQuery()->getSingleScalarResult();

        if ($count === 0) {
            return null;
        }

        $randomOffset = random_int(0, $count - 1);

        return $qb->setFirstResult($randomOffset)
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }
}
