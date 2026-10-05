<?php

namespace App\User\Dto;

use App\User\Validation\UniqueIgnoreCase;
use Symfony\Component\Validator\Constraints as Assert;

class UpdateProfileRequest
{
    public function __construct(
        #[Assert\Sequentially([
            new Assert\NotBlank(message: 'Le pseudo est requis.'),
            new Assert\Length(
                min: 3,
                max: 20,
                minMessage: 'Le pseudo doit contenir entre 3 et 20 caractères.',
                maxMessage: 'Le pseudo doit contenir entre 3 et 20 caractères.',
            ),
            new Assert\Regex(
                pattern: '/^[\p{L}\p{N}_\-. ]+$/u',
                message: 'Le pseudo ne peut contenir que des lettres, chiffres, espaces, ., - et _.',
            ),
            new Assert\Regex(
                pattern: '/^\S(.*\S)?$/u',
                message: 'Le pseudo ne doit pas commencer ou finir par un espace.',
            ),
            new UniqueIgnoreCase(
                field: 'username',
                excludeCurrentUser: true,
                message: 'Ce pseudo est déjà pris.',
            ),
        ])]
        public string $username = '',
    ) {}
}
