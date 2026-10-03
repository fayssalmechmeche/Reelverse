<?php

namespace App\Shop\Controller;

use App\Shop\ShopGenerator;
use App\User\User;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;

#[AsController]
class GetShopController
{
    public function __construct(
        private ShopGenerator $generator,
        private Security $security,
    ) {}

    #[Route('/api/shop', name: 'api_shop_get', methods: ['GET'])]
    public function __invoke(): JsonResponse
    {
        /** @var User|null $user */
        $user = $this->security->getUser();

        if (!$user) {
            return new JsonResponse(['error' => 'Authentification requise.'], 401);
        }

        $shop = $this->generator->getOrCreateForToday($user);

        return new JsonResponse([
            'id' => $shop->getId(),
            'forDate' => $shop->getForDate()->format('Y-m-d'),
            'cards' => array_map(fn($sc) => [
                'id' => $sc->getId(),
                'cardId' => $sc->getCard()->getId(),
                'type' => $sc->getCard()->getType()->value,
                'entityId' => $sc->getCard()->getEntityId(),
                'rarity' => $sc->getCard()->getRarity()->value,
                'price' => $sc->getPrice(),
                'sold' => $sc->isSold(),
                'refreshed' => $sc->isRefreshed(),
            ], $shop->getShopCards()->toArray()),
        ]);
    }
}
