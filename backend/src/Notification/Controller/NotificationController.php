<?php

declare(strict_types=1);

namespace App\Notification\Controller;

use App\User\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\HttpKernel\Attribute\AsController;
use App\Notification\Notification;
use App\Notification\NotificationPreference;
use App\Notification\NotificationService;
use App\Notification\NotificationType;


#[AsController]
#[Route('/api/notifications')]
class NotificationController
{
    private const LIMIT = 30;

    public function __construct(
        private EntityManagerInterface $em,
        private Security $security,
        private NotificationService $notifications,
    ) {}

    #[Route('', name: 'api_notifications_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $user = $this->currentUser();
        if (!$user) {
            return new JsonResponse(['error' => 'Authentification requise.'], 401);
        }

        $this->notifications->syncTimeBased($user);

        /** @var Notification[] $items */
        $items = $this->em->createQueryBuilder()
            ->select('n')
            ->from(Notification::class, 'n')
            ->where('n.user = :user')
            ->setParameter('user', $user)
            ->orderBy('n.createdAt', 'DESC')
            ->addOrderBy('n.id', 'DESC')
            ->setMaxResults(self::LIMIT)
            ->getQuery()
            ->getResult();

        $unread = (int) $this->em->createQueryBuilder()
            ->select('COUNT(n.id)')
            ->from(Notification::class, 'n')
            ->where('n.user = :user AND n.readAt IS NULL')
            ->setParameter('user', $user)
            ->getQuery()
            ->getSingleScalarResult();

        return new JsonResponse([
            'unreadCount' => $unread,
            'items' => array_map(static fn(Notification $n) => [
                'id' => $n->getId(),
                'type' => $n->getType()->value,
                'message' => $n->getMessage(),
                'link' => $n->getLink(),
                'read' => $n->getReadAt() !== null,
                'createdAt' => $n->getCreatedAt()->format(DATE_ATOM),
            ], $items),
        ]);
    }

    #[Route('/read', name: 'api_notifications_read', methods: ['POST'])]
    public function markRead(Request $request): JsonResponse
    {
        $user = $this->currentUser();
        if (!$user) {
            return new JsonResponse(['error' => 'Authentification requise.'], 401);
        }

        $data = json_decode($request->getContent(), true) ?? [];
        $ids = $data['ids'] ?? null;

        $qb = $this->em->createQueryBuilder()
            ->update(Notification::class, 'n')
            ->set('n.readAt', ':now')
            ->where('n.user = :user AND n.readAt IS NULL')
            ->setParameter('now', new \DateTimeImmutable())
            ->setParameter('user', $user);

        // Sans "ids", on marque tout comme lu.
        if (is_array($ids)) {
            $qb->andWhere('n.id IN (:ids)')->setParameter('ids', array_map('intval', $ids));
        }
        $qb->getQuery()->execute();

        $this->notifications->purgeOld($user);

        return new JsonResponse(['success' => true]);
    }

    #[Route('/preferences', name: 'api_notifications_prefs_get', methods: ['GET'])]
    public function getPreferences(): JsonResponse
    {
        $user = $this->currentUser();
        if (!$user) {
            return new JsonResponse(['error' => 'Authentification requise.'], 401);
        }

        return new JsonResponse($this->preferencesPayload($user));
    }

    #[Route('/preferences', name: 'api_notifications_prefs_put', methods: ['PUT'])]
    public function updatePreferences(Request $request): JsonResponse
    {
        $user = $this->currentUser();
        if (!$user) {
            return new JsonResponse(['error' => 'Authentification requise.'], 401);
        }

        $data = json_decode($request->getContent(), true) ?? [];
        $enabled = $data['enabled'] ?? null; // { "card_sold": false, ... }
        if (!is_array($enabled)) {
            return new JsonResponse(['error' => 'Format invalide.'], 400);
        }

        $pref = $this->em->getRepository(NotificationPreference::class)->findOneBy(['user' => $user])
            ?? new NotificationPreference($user);

        $disabled = [];
        foreach (NotificationType::cases() as $type) {
            if (array_key_exists($type->value, $enabled) && $enabled[$type->value] === false) {
                $disabled[] = $type->value;
            }
        }
        $pref->setDisabledTypes($disabled);

        $this->em->persist($pref);
        $this->em->flush();

        return new JsonResponse($this->preferencesPayload($user));
    }

    /** @return array{types: list<array{type: string, label: string, enabled: bool}>} */
    private function preferencesPayload(User $user): array
    {
        return [
            'types' => array_map(fn(NotificationType $t) => [
                'type' => $t->value,
                'label' => $t->label(),
                'enabled' => $this->notifications->isEnabled($user, $t),
            ], NotificationType::cases()),
        ];
    }

    private function currentUser(): ?User
    {
        $user = $this->security->getUser();

        return $user instanceof User ? $user : null;
    }
}
