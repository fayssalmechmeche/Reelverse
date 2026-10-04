<?php

namespace App\Collection\Controller;

use App\Card\Card;
use App\Inventory\UserCard;
use App\User\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Liste TOUT le catalogue de cartes du jeu (possédées ou non), avec la
 * quantité de l'utilisateur connecté pour chacune (0 si jamais obtenue).
 *
 * Contrairement à /api/inventory (qui ne renvoie que les cartes déjà
 * obtenues au moins une fois), cet endpoint permet d'afficher les cartes
 * "Manquantes" dans Ma Collection.
 *
 * Note : placé volontairement hors de /api/cards/... car Card est une
 * ApiResource avec une route GET /api/cards/{id} générée automatiquement,
 * qui intercepterait sinon un chemin comme /api/cards/catalog (404 "Not
 * Found" renvoyé par API Platform lui-même, avant d'atteindre ce contrôleur).
 */
#[AsController]
class GetCardsCatalogController
{
    public function __construct(
        private EntityManagerInterface $em,
        private Security $security,
    ) {}

    #[Route('/api/collection/catalog', name: 'api_collection_catalog', methods: ['GET'])]
    public function __invoke(): JsonResponse
    {
        /** @var User|null $user */
        $user = $this->security->getUser();

        if (!$user) {
            return new JsonResponse(['error' => 'Authentification requise.'], 401);
        }

        $cards = $this->em->getRepository(Card::class)->findAll();

        $userCards = $this->em->getRepository(UserCard::class)->createQueryBuilder('uc')
            ->where('uc.user = :user')
            ->setParameter('user', $user)
            ->getQuery()
            ->getResult();

        $userCardByCardId = [];
        foreach ($userCards as $uc) {
            $userCardByCardId[$uc->getCard()->getId()] = $uc;
        }

        return new JsonResponse(array_map(function (Card $card) use ($userCardByCardId) {
            $userCard = $userCardByCardId[$card->getId()] ?? null;

            return [
                'id' => $userCard?->getId(),
                'cardId' => $card->getId(),
                'type' => $card->getType()->value,
                'entityId' => $card->getEntityId(),
                'rarity' => $card->getRarity()->value,
                'quantity' => $userCard?->getQuantity() ?? 0,
            ];
        }, $cards));
    }
}
