<?php

namespace App\User\Dto;

use App\User\Validation\UniqueIgnoreCase;
use Symfony\Component\Validator\Constraints as Assert;

class RegisterRequest
{
    public function __construct(
        #[Assert\Sequentially([
            new Assert\NotBlank(message: 'Email, pseudo et mot de passe requis.'),
            new Assert\Length(max: 180, maxMessage: 'Adresse e-mail invalide.'),
            new Assert\Email(message: 'Adresse e-mail invalide.'),
            new UniqueIgnoreCase(field: 'email', message: 'Cet email est déjà utilisé.'),
        ])]
        public string $email = '',

        #[Assert\Sequentially([
            new Assert\NotBlank(message: 'Email, pseudo et mot de passe requis.'),
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
            new UniqueIgnoreCase(field: 'username', message: 'Ce pseudo est déjà pris.'),
        ])]
        public string $username = '',

        #[Assert\Sequentially([
            new Assert\NotBlank(message: 'Email, pseudo et mot de passe requis.'),
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
