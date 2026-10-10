<?php

namespace App\Pack\Controller;

use App\Pack\PackDrawConfig;
use App\Pack\PackStock;
use App\User\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;

#[AsController]
class GetPackStockController
{
    public function __construct(
        private EntityManagerInterface $em,
        private Security $security,
    ) {}

    #[Route('/api/packs/stock', name: 'api_packs_stock', methods: ['GET'])]
    public function __invoke(): JsonResponse
    {
        /** @var User|null $user */
        $user = $this->security->getUser();

        if (!$user) {
            return new JsonResponse(['error' => 'Authentification requise.'], 401);
        }

        $stock = $this->em->getRepository(PackStock::class)->findOneBy(['user' => $user]);

        if (!$stock) {
            return new JsonResponse(['error' => 'Aucun stock de packs trouvé pour cet utilisateur.'], 404);
        }

        $now = new \DateTimeImmutable();
        $stock->sync($now);
        $this->em->flush();

        $maxStock = PackDrawConfig::MAX_PACKS_STOCK;
        $storedPacks = $stock->getStoredPacks();

        if ($storedPacks >= $maxStock) {
            $secondsToNextPack = 0;
        } else {
            $secondsSinceLastComputed = $now->getTimestamp() - $stock->getLastComputedAt()->getTimestamp();
            $intervalSeconds = PackDrawConfig::PACK_INTERVAL_MINUTES * 60;
            $secondsToNextPack = max(0, $intervalSeconds - $secondsSinceLastComputed);
        }

        return new JsonResponse([
            'storedPacks' => $storedPacks,
            'maxStock' => $maxStock,
            'secondsToNextPack' => $secondsToNextPack,
            'dropRates' => PackDrawConfig::rates(),
        ]);
    }
}
