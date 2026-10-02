<?php

namespace App\Trading\Controller;

use App\Trading\TradingService;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;

#[AsController]
class RespondTradeController
{
    public function __construct(
        private TradingService $tradingService,
        private Security $security,
    ) {}

    #[Route('/api/trades/{id}/accept', name: 'api_trades_accept', methods: ['POST'])]
    public function accept(int $id): JsonResponse
    {
        $me = $this->security->getUser();
        if (!$me) {
            return new JsonResponse(['error' => 'Authentification requise.'], 401);
        }

        try {
            $this->tradingService->accept($me, $id);
        } catch (\DomainException $e) {
            return new JsonResponse(['error' => $e->getMessage()], 400);
        }

        return new JsonResponse(['success' => true]);
    }

    #[Route('/api/trades/{id}/cancel', name: 'api_trades_cancel', methods: ['POST'])]
    public function cancel(int $id): JsonResponse
    {
        $me = $this->security->getUser();
        if (!$me) {
            return new JsonResponse(['error' => 'Authentification requise.'], 401);
        }

        try {
            $this->tradingService->cancel($me, $id);
        } catch (\DomainException $e) {
            return new JsonResponse(['error' => $e->getMessage()], 400);
        }

        return new JsonResponse(['success' => true]);
    }
}
