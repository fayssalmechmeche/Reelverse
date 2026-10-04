<?php

namespace App\Quest;

enum QuestTrigger: string
{
    // Nombre total de cartes obtenues sur la période (packs, boutique, échanges)
    case CARDS_OBTAINED = 'cards_obtained';
        // Nombre de cartes Epic ou Legendary obtenues sur la période
    case RARE_CARDS_OBTAINED = 'rare_cards_obtained';
}
