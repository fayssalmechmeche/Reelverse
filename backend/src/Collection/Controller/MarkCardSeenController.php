<?php

namespace App\Collection\Controller;

use App\Inventory\UserCard;
use App\User\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Marque une carte comme "vue" : elle quitte l'onglet "Nouvelles".
 * Idempotent : sans effet si la carte n'est pas possédée ou déjà vue.
 */
#[AsController]
class MarkCardSeenController
{
    public function __construct(
        private EntityManagerInterface $em,
        private Security $security,
    ) {}

    #[Route('/api/collection/cards/{cardId}/seen', name: 'api_collection_card_seen', requirements: ['cardId' => '\d+'], methods: ['POST'])]
    public function __invoke(int $cardId): Response
    {
        /** @var User|null $user */
        $user = $this->security->getUser();

        if (!$user) {
            return new JsonResponse(['error' => 'Authentification requise.'], 401);
        }

        $userCard = $this->em->getRepository(UserCard::class)->findOneBy([
            'user' => $user,
            'card' => $cardId,
        ]);

        if ($userCard !== null && $userCard->isNew()) {
            $userCard->setIsNew(false);
            $this->em->flush();
        }

        return new Response(null, Response::HTTP_NO_CONTENT);
    }
}
