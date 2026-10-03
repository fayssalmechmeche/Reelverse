<?php

namespace App\Economy\Controller;

use App\Economy\QuickSellService;
use App\User\User;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;

#[AsController]
class QuickSellController
{
    public function __construct(
        private QuickSellService $quickSellService,
        private Security $security,
    ) {}

    #[Route('/api/inventory/{id}/sell', name: 'api_inventory_sell', methods: ['POST'])]
    public function __invoke(int $id, Request $request): JsonResponse
    {
        /** @var User|null $user */
        $user = $this->security->getUser();

        if (!$user) {
            return new JsonResponse(['error' => 'Authentification requise.'], 401);
        }

        $data = json_decode($request->getContent(), true) ?? [];
        $quantity = $data['quantity'] ?? 1;

        try {
            $earned = $this->quickSellService->sell($user, $id, $quantity);
        } catch (\DomainException | \InvalidArgumentException $e) {
            return new JsonResponse(['error' => $e->getMessage()], 400);
        }

        return new JsonResponse(['success' => true, 'earned' => $earned]);
    }
}
