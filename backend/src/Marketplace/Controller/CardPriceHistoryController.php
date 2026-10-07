<?php

namespace App\Marketplace\Controller;

use App\Marketplace\MarketplaceListing;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Derniers prix de vente d'une carte sur le marché (pour aider à fixer un prix).
 */
#[AsController]
class CardPriceHistoryController
{
    private const LIMIT = 5;

    public function __construct(private EntityManagerInterface $em) {}

    #[Route('/api/marketplace/cards/{cardId}/history', name: 'api_marketplace_card_history', requirements: ['cardId' => '\d+'], methods: ['GET'])]
    public function __invoke(int $cardId): JsonResponse
    {
        // Les ventes plus anciennes que l'ajout de sold_at utilisent la date de création de l'annonce.
        $rows = $this->em->createQuery(
            'SELECT l.price AS price, COALESCE(l.soldAt, l.createdAt) AS lastAt
             FROM ' . MarketplaceListing::class . ' l
             WHERE l.card = :card AND l.sold = true
             ORDER BY lastAt DESC, l.id DESC'
        )
            ->setParameter('card', $cardId)
            ->setMaxResults(self::LIMIT)
            ->getArrayResult();

        return new JsonResponse(array_map(static function (array $row): array {
            $at = $row['lastAt'];
            $at = $at instanceof \DateTimeInterface ? $at : new \DateTimeImmutable((string) $at);

            return [
                'price' => (int) $row['price'],
                'soldAt' => $at->format(DATE_ATOM),
            ];
        }, $rows));
    }
}
