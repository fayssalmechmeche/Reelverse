<?php

namespace App\Achievement;

enum AchievementTrigger: string
{
    case COLLECTION_COMPLETED = 'collection_completed';
    case CARDS_OBTAINED_IN_DAY = 'cards_obtained_in_day';
    case LEGENDARY_OBTAINED = 'legendary_obtained';
}
