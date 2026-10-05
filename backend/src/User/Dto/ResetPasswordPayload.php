<?php

namespace App\User\Dto;

use Symfony\Component\Validator\Constraints as Assert;

class ResetPasswordPayload
{
    public function __construct(
        #[Assert\NotBlank(message: 'Lien de réinitialisation invalide.')]
        public string $token = '',

        #[Assert\Sequentially([
            new Assert\NotBlank(message: 'Le mot de passe est requis.'),
            new Assert\Length(
                min: 8,
                max: 128,
                minMessage: 'Le mot de passe doit contenir au moins 8 caractères.',
                maxMessage: 'Le mot de passe ne doit pas dépasser 128 caractères.',
            ),
        ])]
        public string $password = '',
    ) {}
}
