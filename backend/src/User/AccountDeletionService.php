<?php

namespace App\User;

use App\Achievement\CardAcquisitionLog;
use App\Achievement\UserAchievement;
use App\Collection\UserCompletedCollection;
use App\Economy\Wallet\Wallet;
use App\Inventory\UserCard;
use App\LoginStreak\LoginStreak;
use App\Marketplace\MarketplaceListing;
use App\Pack\PackStock;
use App\Quest\UserQuestClaim;
use App\Shared\Mail\TransactionalMailer;
use App\Shop\Shop;
use App\Shop\ShopCard;
use App\Social\Block;
use App\Social\Friendship;
use App\Trading\Trade;
use App\Trading\TradeItem;
use App\User\OAuth\OAuthIdentity;
use App\User\Reset\ResetPasswordRequest;
use App\Wishlist\SaleListItem;
use App\Wishlist\WishlistItem;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

/**
 * Supprime définitivement un compte et toutes les données qui en dépendent
 * (droit à l'effacement, RGPD art. 17).
 */
class AccountDeletionService
{
    private string $avatarDir;

    public function __construct(
        private EntityManagerInterface $em,
        private TransactionalMailer $mailer,
        #[Autowire('%kernel.project_dir%')] string $projectDir,
    ) {
        $this->avatarDir = $projectDir . '/var/uploads/avatars';
    }

    public function delete(User $user): void
    {
        $userId = (int) $user->getId();
        $avatar = $user->getAvatar();
        // À garder avant la suppression : après, l'utilisateur n'existe plus.
        $email = $user->getEmail();
        $pseudo = $user->getPseudo();

        $this->em->wrapInTransaction(function () use ($userId): void {
            // Les échanges auxquels l'utilisateur participe disparaissent avec leurs cartes.
            $this->run(
                'DELETE FROM ' . TradeItem::class . ' ti WHERE ti.owner = :id
                 OR ti.trade IN (SELECT t.id FROM ' . Trade::class . ' t WHERE t.proposer = :id OR t.recipient = :id)',
                $userId
            );
            $this->run('DELETE FROM ' . Trade::class . ' t WHERE t.proposer = :id OR t.recipient = :id', $userId);

            $this->run('DELETE FROM ' . MarketplaceListing::class . ' m WHERE m.seller = :id', $userId);

            $this->run(
                'DELETE FROM ' . ShopCard::class . ' sc WHERE sc.shop IN (SELECT s.id FROM ' . Shop::class . ' s WHERE s.user = :id)',
                $userId
            );
            $this->run('DELETE FROM ' . Shop::class . ' s WHERE s.user = :id', $userId);

            foreach (
                [
                    WishlistItem::class,
                    SaleListItem::class,
                    UserCard::class,
                    CardAcquisitionLog::class,
                    UserAchievement::class,
                    UserQuestClaim::class,
                    UserCompletedCollection::class,
                    LoginStreak::class,
                    PackStock::class,
                    Wallet::class,
                    ResetPasswordRequest::class,
                    OAuthIdentity::class,
                ] as $class
            ) {
                $this->run('DELETE FROM ' . $class . ' e WHERE e.user = :id', $userId);
            }

            $this->run('DELETE FROM ' . Friendship::class . ' f WHERE f.requester = :id OR f.addressee = :id', $userId);
            $this->run('DELETE FROM ' . Block::class . ' b WHERE b.blocker = :id OR b.blocked = :id', $userId);

            $this->run('DELETE FROM ' . User::class . ' u WHERE u.id = :id', $userId);
        });

        $this->em->clear();

        // Le fichier n'est supprimé qu'une fois la transaction validée.
        if ($avatar && preg_match('/^\d+-[a-f0-9]+\.jpg$/', $avatar)) {
            $path = $this->avatarDir . '/' . $avatar;
            if (is_file($path)) {
                @unlink($path);
            }
        }

        // Confirmation envoyée une fois la suppression validée. Elle ne contient
        // aucune donnée du compte : l'adresse sert uniquement à l'envoi.
        $this->mailer->sendAccountDeleted($email, $pseudo);
    }

    private function run(string $dql, int $userId): void
    {
        $this->em->createQuery($dql)->setParameter('id', $userId)->execute();
    }
}
