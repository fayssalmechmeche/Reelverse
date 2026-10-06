<?php

namespace App\User\OAuth;

/** Erreur "attendue" du parcours OAuth, le code est renvoye au front dans ?oauth_error=. */
class OAuthLoginException extends \RuntimeException
{
    public function __construct(private readonly string $errorCode)
    {
        parent::__construct($errorCode);
    }

    public function getErrorCode(): string
    {
        return $this->errorCode;
    }
}
