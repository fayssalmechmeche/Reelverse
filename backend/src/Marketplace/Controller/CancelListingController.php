<?php

namespace App\Marketplace\Controller;

use App\Marketplace\MarketplaceService;
use App\User\User;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;

#[AsController]
class CancelListingController
{
    public function __construct(
        private MarketplaceService $service,
        private Security $security,
    ) {}

    #[Route('/api/marketplace/{id}/cancel', name: 'api_marketplace_cancel', methods: ['POST'])]
    public function __invoke(int $id): JsonResponse
    {
        /** @var User|null $user */
        $user = $this->security->getUser();

        if (!$user) {
            return new JsonResponse(['error' => 'Authentification requise.'], 401);
        }

        try {
            $this->service->cancelListing($user, $id);
        } catch (\DomainException $e) {
            return new JsonResponse(['error' => $e->getMessage()], 400);
        }

        return new JsonResponse(['success' => true]);
    }
}
