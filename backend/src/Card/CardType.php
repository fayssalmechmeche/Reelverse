<?php

namespace App\Card;

enum CardType: string
{
    case PERSON = 'person';
    case MOVIE = 'movie';
    case SERIES = 'series';
    case CHARACTER = 'character';
}
