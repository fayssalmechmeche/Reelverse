<?php

namespace App\Marketplace\Controller;

use App\Marketplace\MarketplaceListing;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;

#[AsController]
class ListMarketplaceController
{
    public function __construct(private EntityManagerInterface $em) {}

    #[Route('/api/marketplace', name: 'api_marketplace_list', methods: ['GET'])]
    public function __invoke(): JsonResponse
    {
        $listings = $this->em->getRepository(MarketplaceListing::class)->createQueryBuilder('l')
            ->where('l.sold = false')
            ->andWhere('l.cancelled = false')
            ->orderBy('l.price', 'ASC')
            ->getQuery()
            ->getResult();

        return new JsonResponse(array_map(fn($l) => [
            'id' => $l->getId(),
            'cardId' => $l->getCard()->getId(),
            'type' => $l->getCard()->getType()->value,
            'entityId' => $l->getCard()->getEntityId(),
            'rarity' => $l->getCard()->getRarity()->value,
            'price' => $l->getPrice(),
            'sellerId' => $l->getSeller()->getId(),
            'sellerUsername' => $l->getSeller()->getPseudo(),
        ], $listings));
    }
}
