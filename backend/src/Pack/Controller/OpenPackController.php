<?php

namespace App\Pack\Controller;

use App\Pack\PackOpener;
use App\Pack\PackStock;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;

#[AsController]
class OpenPackController
{
    public function __construct(
        private EntityManagerInterface $em,
        private PackOpener $opener,
    ) {}

    #[Route('/api/packs/open', name: 'api_packs_open', methods: ['POST'])]
    public function __invoke(): JsonResponse
    {
        // Temporaire : un seul PackStock global, tant qu'il n'y a pas d'auth/user
        $stock = $this->em->getRepository(PackStock::class)->findOneBy([]) ?? new PackStock();

        if (!$stock->getId()) {
            $this->em->persist($stock);
        }

        $stock->sync(new \DateTimeImmutable());

        try {
            $cards = $this->opener->open($stock);
        } catch (\DomainException $e) {
            return new JsonResponse(['error' => $e->getMessage()], 400);
        }

        $this->em->flush();

        return new JsonResponse([
            'cards' => array_map(fn($c) => [
                'id' => $c->getId(),
                'type' => $c->getType()->value,
                'entityId' => $c->getEntityId(),
                'rarity' => $c->getRarity()->value,
            ], $cards),
            'remainingPacks' => $stock->getStoredPacks(),
        ]);
    }
}
