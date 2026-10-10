<?php

declare(strict_types=1);

namespace App\Notification;

use App\Pack\PackDrawConfig;
use App\Pack\PackStock;
use App\User\User;
use Doctrine\ORM\EntityManagerInterface;

class NotificationService
{
    public const KEEP_DAYS = 30;

    public function __construct(private EntityManagerInterface $em) {}

    /**
     * Crée une notification (sans flush : l'appelant flush avec son propre travail).
     * Ne fait rien si le joueur a désactivé ce type.
     */
    public function notify(User $user, NotificationType $type, string $message, ?string $link = null): void
    {
        if (!$this->isEnabled($user, $type)) {
            return;
        }

        $this->em->persist(new Notification($user, $type, $message, $link));
    }

    /**
     * Notification dédupliquée par clé (ex: "shop:2026-10-11"), insérée tout de suite.
     * ON CONFLICT rend l'opération sûre si deux requêtes arrivent en même temps.
     */
    private function notifyOnce(User $user, NotificationType $type, string $message, ?string $link, string $dedupeKey): void
    {
        if (!$this->isEnabled($user, $type)) {
            return;
        }

        $this->em->getConnection()->executeStatement(
            'INSERT INTO notification (user_id, type, message, link, dedupe_key, read_at, created_at)
             VALUES (:user, :type, :message, :link, :key, NULL, :now)
             ON CONFLICT (user_id, dedupe_key) DO NOTHING',
            [
                'user' => $user->getId(),
                'type' => $type->value,
                'message' => $message,
                'link' => $link,
                'key' => $dedupeKey,
                'now' => (new \DateTimeImmutable())->format('Y-m-d H:i:s'),
            ],
        );
    }

    public function isEnabled(User $user, NotificationType $type): bool
    {
        $pref = $this->em->getRepository(NotificationPreference::class)->findOneBy(['user' => $user]);

        return $pref === null || !in_array($type->value, $pref->getDisabledTypes(), true);
    }

    /**
     * Événements liés au temps (pack plein, nouvelle boutique) : évalués à la volée
     * quand le joueur consulte ses notifications, donc sans tâche planifiée.
     */
    public function syncTimeBased(User $user): void
    {
        $stock = $this->em->getRepository(PackStock::class)->findOneBy(['user' => $user]);
        if ($stock !== null) {
            $stock->sync(new \DateTimeImmutable());
            $this->em->flush();

            if ($stock->getStoredPacks() >= PackDrawConfig::MAX_PACKS_STOCK) {
                // Marquage atomique : une seule requête obtient 1 et crée la notification.
                $claimed = $this->em->getConnection()->executeStatement(
                    'UPDATE pack_stock SET full_notified_at = :now WHERE id = :id AND full_notified_at IS NULL',
                    ['now' => (new \DateTimeImmutable())->format('Y-m-d H:i:s'), 'id' => $stock->getId()],
                );
                if ($claimed === 1) {
                    $this->em->refresh($stock);
                    $this->notify(
                        $user,
                        NotificationType::PACK_FULL,
                        sprintf('Ton stock est plein (%d packs). Ouvre-en un pour relancer le chrono.', PackDrawConfig::MAX_PACKS_STOCK),
                        '/',
                    );
                    $this->em->flush();
                }
            }
        }

        $this->notifyOnce(
            $user,
            NotificationType::SHOP_NEW,
            'La boutique du jour est renouvelée.',
            '/shop',
            'shop:' . (new \DateTimeImmutable('today'))->format('Y-m-d'),
        );
    }

    public function purgeOld(User $user): void
    {
        $this->em->createQueryBuilder()
            ->delete(Notification::class, 'n')
            ->where('n.user = :user AND n.createdAt < :limit')
            ->setParameter('user', $user)
            ->setParameter('limit', new \DateTimeImmutable('-' . self::KEEP_DAYS . ' days'))
            ->getQuery()
            ->execute();
    }
}
