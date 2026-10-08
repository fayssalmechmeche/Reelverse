<?php

namespace App\User\Controller;

use App\Achievement\UserAchievement;
use App\Collection\UserCompletedCollection;
use App\Economy\Wallet\Wallet;
use App\Inventory\UserCard;
use App\LoginStreak\LoginStreak;
use App\Marketplace\MarketplaceListing;
use App\Pack\PackStock;
use App\Quest\UserQuestClaim;
use App\Social\Block;
use App\Social\Friendship;
use App\Trading\Trade;
use App\User\OAuth\OAuthIdentity;
use App\User\User;
use App\Wishlist\SaleListItem;
use App\Wishlist\WishlistItem;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Export des données personnelles (droit d'accès et portabilité, RGPD art. 15 et 20).
 */
#[AsController]
class ExportDataController
{
    public function __construct(
        private EntityManagerInterface $em,
        private Security $security,
    ) {}

    #[Route('/api/me/export', name: 'api_export_data', methods: ['GET'])]
    public function __invoke(): JsonResponse
    {
        /** @var User|null $user */
        $user = $this->security->getUser();
        if (!$user) {
            return new JsonResponse(['error' => 'Authentification requise.'], 401);
        }

        $id = (int) $user->getId();

        $data = [
            'exportedAt' => (new \DateTimeImmutable())->format(DATE_ATOM),
            'profile' => [
                'id' => $id,
                'email' => $user->getEmail(),
                'username' => $user->getPseudo(),
                'hasAvatar' => $user->getAvatar() !== null,
            ],
            'linkedProviders' => $this->col(
                'SELECT o.provider, o.createdAt FROM ' . OAuthIdentity::class . ' o WHERE o.user = :id',
                $id
            ),
            'wallet' => $this->col('SELECT w.balance FROM ' . Wallet::class . ' w WHERE w.user = :id', $id)[0] ?? null,
            'packStock' => $this->col('SELECT p.storedPacks, p.lastComputedAt FROM ' . PackStock::class . ' p WHERE p.user = :id', $id)[0] ?? null,
            'loginStreak' => $this->col('SELECT l.currentDay, l.lastClaimedAt FROM ' . LoginStreak::class . ' l WHERE l.user = :id', $id)[0] ?? null,
            'cards' => $this->col(
                'SELECT c.type AS type, c.entityId AS entityId, uc.quantity FROM ' . UserCard::class . ' uc JOIN uc.card c WHERE uc.user = :id',
                $id
            ),
            'achievements' => $this->col(
                'SELECT a.code, ua.unlockedAt FROM ' . UserAchievement::class . ' ua JOIN ua.achievement a WHERE ua.user = :id',
                $id
            ),
            'questClaims' => $this->col(
                'SELECT q.code, qc.periodKey, qc.claimedAt FROM ' . UserQuestClaim::class . ' qc JOIN qc.quest q WHERE qc.user = :id',
                $id
            ),
            'completedCollections' => $this->col(
                'SELECT cc.type, cc.entityId, cc.completedAt FROM ' . UserCompletedCollection::class . ' cc WHERE cc.user = :id',
                $id
            ),
            'friendships' => $this->col(
                'SELECT r.username AS requester, a.username AS addressee, f.status, f.createdAt
                 FROM ' . Friendship::class . ' f JOIN f.requester r JOIN f.addressee a
                 WHERE f.requester = :id OR f.addressee = :id',
                $id
            ),
            'blockedUsers' => $this->col(
                'SELECT b2.username AS blocked FROM ' . Block::class . ' b JOIN b.blocked b2 WHERE b.blocker = :id',
                $id
            ),
            'marketplaceListings' => $this->col(
                'SELECT c.type AS type, c.entityId AS entityId, m.price, m.sold, m.cancelled, m.createdAt
                 FROM ' . MarketplaceListing::class . ' m JOIN m.card c WHERE m.seller = :id',
                $id
            ),
            'trades' => $this->col(
                'SELECT p.username AS proposer, r.username AS recipient, t.status, t.createdAt
                 FROM ' . Trade::class . ' t JOIN t.proposer p JOIN t.recipient r
                 WHERE t.proposer = :id OR t.recipient = :id',
                $id
            ),
            'wishlist' => $this->col(
                'SELECT c.type AS type, c.entityId AS entityId, w.createdAt
                 FROM ' . WishlistItem::class . ' w JOIN w.card c WHERE w.user = :id',
                $id
            ),
            'saleList' => $this->col(
                'SELECT c.type AS type, c.entityId AS entityId, s.createdAt
                 FROM ' . SaleListItem::class . ' s JOIN s.card c WHERE s.user = :id',
                $id
            ),
        ];

        $response = new JsonResponse($data);
        $response->setEncodingOptions(JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $response->headers->set(
            'Content-Disposition',
            $response->headers->makeDisposition(ResponseHeaderBag::DISPOSITION_ATTACHMENT, 'reelverse-mes-donnees.json')
        );

        return $response;
    }

    /** @return list<array<string, mixed>> */
    private function col(string $dql, int $userId): array
    {
        $rows = $this->em->createQuery($dql)->setParameter('id', $userId)->getArrayResult();

        return array_map(fn(array $row) => array_map($this->scalar(...), $row), $rows);
    }

    private function scalar(mixed $value): mixed
    {
        if ($value instanceof \BackedEnum) {
            return $value->value;
        }
        if ($value instanceof \DateTimeInterface) {
            return $value->format(DATE_ATOM);
        }

        return $value;
    }
}
