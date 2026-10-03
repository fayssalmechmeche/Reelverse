<?php

namespace App\Trading\Controller;

use App\Trading\TradingService;
use App\User\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;

#[AsController]
class ProposeTradeController
{
    public function __construct(
        private TradingService $tradingService,
        private EntityManagerInterface $em,
        private Security $security,
    ) {}

    #[Route('/api/trades', name: 'api_trades_propose', methods: ['POST'])]
    public function __invoke(Request $request): JsonResponse
    {
        /** @var User|null $me */
        $me = $this->security->getUser();
        if (!$me) {
            return new JsonResponse(['error' => 'Authentification requise.'], 401);
        }

        $data = json_decode($request->getContent(), true) ?? [];
        $recipientId = $data['recipientId'] ?? null;
        $myCards = $data['myCards'] ?? [];
        $theirCards = $data['theirCards'] ?? [];

        $recipient = $recipientId ? $this->em->getRepository(User::class)->find($recipientId) : null;
        if (!$recipient) {
            return new JsonResponse(['error' => 'Destinataire introuvable.'], 404);
        }

        try {
            $trade = $this->tradingService->propose($me, $recipient, $myCards, $theirCards);
        } catch (\DomainException $e) {
            return new JsonResponse(['error' => $e->getMessage()], 400);
        }

        return new JsonResponse(['id' => $trade->getId()], 201);
    }
}
