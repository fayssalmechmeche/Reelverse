<?php

declare(strict_types=1);

namespace App\Notification;

enum NotificationType: string
{
    case PACK_FULL = 'pack_full';
    case SHOP_NEW = 'shop_new';
    case CARD_SOLD = 'card_sold';
    case TRADE_RECEIVED = 'trade_received';
    case TRADE_ACCEPTED = 'trade_accepted';
    case WISHLIST_MATCH = 'wishlist_match';
    case FRIEND_REQUEST = 'friend_request';

    /** Libellé affiché dans les préférences. */
    public function label(): string
    {
        return match ($this) {
            self::PACK_FULL => 'Stock de packs plein',
            self::SHOP_NEW => 'Nouvelle boutique du jour',
            self::CARD_SOLD => 'Une de mes cartes est vendue',
            self::TRADE_RECEIVED => 'Proposition d\'échange reçue',
            self::TRADE_ACCEPTED => 'Échange accepté',
            self::WISHLIST_MATCH => 'Un ami propose une carte de ma wishlist',
            self::FRIEND_REQUEST => 'Demande d\'ami reçue',
        };
    }
}
