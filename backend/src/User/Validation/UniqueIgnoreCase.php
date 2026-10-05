<?php

namespace App\User\Validation;

use Symfony\Component\Validator\Attribute\HasNamedArguments;
use Symfony\Component\Validator\Constraint;

/**
 * Vérifie qu'aucun utilisateur n'a déjà cette valeur (email ou pseudo),
 * sans tenir compte de la casse ("Fayssal" et "fayssal" sont identiques).
 */
#[\Attribute(\Attribute::TARGET_PROPERTY)]
class UniqueIgnoreCase extends Constraint
{
    public string $message = 'Cette valeur est déjà utilisée.';

    #[HasNamedArguments]
    public function __construct(
        public string $field,
        public bool $excludeCurrentUser = false,
        ?string $message = null,
        ?array $groups = null,
        mixed $payload = null,
    ) {
        parent::__construct([], $groups, $payload);

        if ($message !== null) {
            $this->message = $message;
        }
    }
}
