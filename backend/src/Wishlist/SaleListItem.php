<?php

declare(strict_types=1);

namespace App\Wishlist;

use App\Card\Card;
use App\User\User;
use Doctrine\ORM\Mapping as ORM;
use App\Wishlist\Repository\SaleListItemRepository;

/**
 * Représente la liste "À échanger" du joueur : les cartes qu'il indique
 * vouloir céder (vendre ou échanger) à d'autres joueurs.
 */
#[ORM\Entity(repositoryClass: SaleListItemRepository::class)]
#[ORM\Table(name: 'sale_list_item')]
#[ORM\UniqueConstraint(name: 'uniq_sale_list_user_card', columns: ['user_id', 'card_id'])]
class SaleListItem
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private User $user;

    #[ORM\ManyToOne(targetEntity: Card::class)]
    #[ORM\JoinColumn(nullable: false)]
    private Card $card;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    public function __construct(User $user, Card $card)
    {
        $this->user = $user;
        $this->card = $card;
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUser(): User
    {
        return $this->user;
    }

    public function getCard(): Card
    {
        return $this->card;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }
}
