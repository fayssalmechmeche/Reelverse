<?php

namespace App\Marketplace\Controller;

use App\Marketplace\MarketplaceService;
use App\User\User;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;

#[AsController]
class CreateListingController
{
    public function __construct(
        private MarketplaceService $service,
        private Security $security,
    ) {}

    #[Route('/api/marketplace', name: 'api_marketplace_create', methods: ['POST'])]
    public function __invoke(Request $request): JsonResponse
    {
        /** @var User|null $user */
        $user = $this->security->getUser();

        if (!$user) {
            return new JsonResponse(['error' => 'Authentification requise.'], 401);
        }

        $data = json_decode($request->getContent(), true) ?? [];
        $cardId = $data['cardId'] ?? null;
        $price = $data['price'] ?? null;

        if (!$cardId || !$price) {
            return new JsonResponse(['error' => 'cardId et price requis.'], 400);
        }

        try {
            $listing = $this->service->createListing($user, $cardId, $price);
        } catch (\DomainException | \InvalidArgumentException $e) {
            return new JsonResponse(['error' => $e->getMessage()], 400);
        }

        return new JsonResponse(['id' => $listing->getId(), 'price' => $listing->getPrice()], 201);
    }
}
