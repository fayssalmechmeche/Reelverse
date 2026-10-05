<?php

namespace App\User\Dto;

use Symfony\Component\Validator\Constraints as Assert;

class ForgotPasswordRequest
{
    public function __construct(
        #[Assert\Sequentially([
            new Assert\NotBlank(message: "L'email est requis."),
            new Assert\Email(message: "L'email n'est pas valide."),
        ])]
        public string $email = '',
    ) {}
}
