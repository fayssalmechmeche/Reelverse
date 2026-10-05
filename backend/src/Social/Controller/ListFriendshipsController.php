<?php

namespace App\Social\Controller;

use App\Social\Friendship;
use App\Social\FriendshipStatus;
use App\User\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;

#[AsController]
class ListFriendshipsController
{
    public function __construct(
        private EntityManagerInterface $em,
        private Security $security,
    ) {}

    #[Route('/api/friends', name: 'api_friends_list', methods: ['GET'])]
    public function __invoke(): JsonResponse
    {
        /** @var User|null $me */
        $me = $this->security->getUser();
        if (!$me) {
            return new JsonResponse(['error' => 'Authentification requise.'], 401);
        }

        $all = $this->em->getRepository(Friendship::class)->createQueryBuilder('f')
            ->where('f.requester = :me OR f.addressee = :me')
            ->setParameter('me', $me)
            ->getQuery()
            ->getResult();

        $friends = [];
        $incoming = [];
        $outgoing = [];

        foreach ($all as $f) {
            $other = $f->getOtherUser($me);
            $entry = ['id' => $f->getId(), 'userId' => $other->getId(), 'username' => $other->getPseudo(), 'avatarUrl' => $other->getAvatarUrl()];

            if ($f->getStatus() === FriendshipStatus::ACCEPTED) {
                $friends[] = $entry;
            } elseif ($f->getAddressee()->getId() === $me->getId()) {
                $incoming[] = $entry;
            } else {
                $outgoing[] = $entry;
            }
        }

        return new JsonResponse(['friends' => $friends, 'incoming' => $incoming, 'outgoing' => $outgoing]);
    }
}
