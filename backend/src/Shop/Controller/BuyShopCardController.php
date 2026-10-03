<?php

namespace App\Shop\Controller;

use App\Shop\ShopService;
use App\User\User;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;

#[AsController]
class BuyShopCardController
{
    public function __construct(
        private ShopService $shopService,
        private Security $security,
    ) {}

    #[Route('/api/shop/{id}/buy', name: 'api_shop_buy', methods: ['POST'])]
    public function __invoke(int $id): JsonResponse
    {
        /** @var User|null $user */
        $user = $this->security->getUser();

        if (!$user) {
            return new JsonResponse(['error' => 'Authentification requise.'], 401);
        }

        try {
            $shopCard = $this->shopService->buy($user, $id);
        } catch (\DomainException $e) {
            return new JsonResponse(['error' => $e->getMessage()], 400);
        }

        return new JsonResponse(['success' => true, 'cardId' => $shopCard->getCard()->getId()]);
    }
}
