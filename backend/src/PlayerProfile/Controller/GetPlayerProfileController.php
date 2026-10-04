<?php

namespace App\PlayerProfile\Controller;

use App\User\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Profil public d'un joueur : contrairement aux endpoints /api/friends/...
 * (réservés aux amis pour le trading), ces endpoints sont consultables par
 * n'importe quel joueur connecté, conformément au cahier des charges
 * ("Le profil est public. Un joueur trouvé peut voir : profil, collections,
 * cartes possédées, doublons, wishlist, cartes à échanger.").
 */
#[AsController]
class GetPlayerProfileController
{
    public function __construct(
        private EntityManagerInterface $em,
        private Security $security,
    ) {}

    #[Route('/api/players/{id}/profile', name: 'api_players_profile_get', methods: ['GET'])]
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

        return new JsonResponse([
            'id' => $player->getId(),
            'username' => $player->getPseudo(),
        ]);
    }
}
