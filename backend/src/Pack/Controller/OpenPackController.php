<?php

namespace App\Pack\Controller;

use App\Pack\PackOpener;
use App\Pack\PackStock;
use App\User\User;
use App\Inventory\InventoryManager;
use App\Inventory\UserCard;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;
use App\Achievement\AchievementChecker;

#[AsController]
class OpenPackController
{
    public function __construct(
        private EntityManagerInterface $em,
        private PackOpener $opener,
        private Security $security,
        private InventoryManager $inventory,
        private AchievementChecker $achievementChecker,
    ) {}

    #[Route('/api/packs/open', name: 'api_packs_open', methods: ['POST'])]
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

        $stock->sync(new \DateTimeImmutable());

        try {
            $cards = $this->opener->open($stock);

            // "Nouvelle carte" doit refléter la possession AVANT ce tirage,
            // pas juste "cette carte vient d'un pack" : on la résout ici,
            // avant que addCard() n'incrémente les quantités.
            $existingUserCards = count($cards) > 0
                ? $this->em->getRepository(UserCard::class)->createQueryBuilder('uc')
                ->where('uc.user = :user AND uc.card IN (:cards)')
                ->setParameter('user', $user)
                ->setParameter('cards', $cards)
                ->getQuery()
                ->getResult()
                : [];
            $ownedBeforeByCardId = [];
            foreach ($existingUserCards as $uc) {
                $ownedBeforeByCardId[$uc->getCard()->getId()] = $uc->getQuantity() > 0;
            }

            $seenThisPack = [];
            $isNewByCardId = [];
            foreach ($cards as $card) {
                $wasOwnedBefore = $ownedBeforeByCardId[$card->getId()] ?? false;
                $isNewByCardId[$card->getId()] = !$wasOwnedBefore && !isset($seenThisPack[$card->getId()]);
                $seenThisPack[$card->getId()] = true;

                $this->inventory->addCard($user, $card);
            }
        } catch (\DomainException $e) {
            return new JsonResponse(['error' => $e->getMessage()], 400);
        }
        $this->achievementChecker->onCardsObtained($user, $cards);
        $this->em->flush();

        return new JsonResponse([
            'cards' => array_map(fn($c) => [
                'id' => $c->getId(),
                'type' => $c->getType()->value,
                'entityId' => $c->getEntityId(),
                'rarity' => $c->getRarity()->value,
                'isNew' => $isNewByCardId[$c->getId()] ?? false,
            ], $cards),
            'remainingPacks' => $stock->getStoredPacks(),
        ]);
    }
}
