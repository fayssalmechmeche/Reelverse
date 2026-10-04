<?php

namespace App\PlayerProfile\Controller;

use App\User\User;
use App\Wishlist\SaleListManager;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;

#[AsController]
class GetPlayerSaleListController
{
    public function __construct(
        private SaleListManager $saleListManager,
        private EntityManagerInterface $em,
        private Security $security,
    ) {}

    #[Route('/api/players/{id}/sale-list', name: 'api_players_sale_list_get', methods: ['GET'])]
    public function __invoke(int $id): JsonResponse
    {
        $me = $this->security->getUser();
        if (!$me) {
            return new JsonResponse(['error' => 'Authentification requise.'], 401);
        }

        $player = $this->em->getRepository(User::class)->find($id);
        if (!$player) {
            return new JsonResponse(['error' => 'Joueur introuvable.'], 404);
        }

        return new JsonResponse(['cardIds' => $this->saleListManager->cardIdsForUser($player)]);
    }
}
