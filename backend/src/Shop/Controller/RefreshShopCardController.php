<?php

namespace App\Shop\Controller;

use App\Shop\ShopService;
use App\User\User;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;

#[AsController]
class RefreshShopCardController
{
    public function __construct(
        private ShopService $shopService,
        private Security $security,
    ) {}

    #[Route('/api/shop/{id}/refresh', name: 'api_shop_refresh', methods: ['POST'])]
    public function __invoke(int $id): JsonResponse
    {
        /** @var User|null $user */
        $user = $this->security->getUser();

        if (!$user) {
            return new JsonResponse(['error' => 'Authentification requise.'], 401);
        }

        try {
            $newShopCard = $this->shopService->refresh($user, $id);
        } catch (\DomainException $e) {
            return new JsonResponse(['error' => $e->getMessage()], 400);
        }

        return new JsonResponse([
            'id' => $newShopCard->getId(),
            'cardId' => $newShopCard->getCard()->getId(),
            'rarity' => $newShopCard->getCard()->getRarity()->value,
            'price' => $newShopCard->getPrice(),
        ]);
    }
}
