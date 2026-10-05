<?php

namespace App\User\Security;

use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Core\Exception\TooManyLoginAttemptsAuthenticationException;
use Symfony\Component\Security\Http\Authentication\AuthenticationFailureHandlerInterface;

/**
 * Gestionnaire d'échec de connexion : renvoie un 429 clair quand la limite de
 * tentatives (login_throttling) est atteinte, et délègue le reste (mauvais mot
 * de passe, etc.) au gestionnaire par défaut de LexikJWT.
 */
class LoginFailureHandler implements AuthenticationFailureHandlerInterface
{
    public function __construct(
        #[Autowire(service: 'lexik_jwt_authentication.handler.authentication_failure')]
        private AuthenticationFailureHandlerInterface $inner,
    ) {}

    public function onAuthenticationFailure(Request $request, AuthenticationException $exception): Response
    {
        if ($exception instanceof TooManyLoginAttemptsAuthenticationException) {
            $minutes = max(1, (int) ($exception->getMessageData()['%minutes%'] ?? 1));

            return new JsonResponse([
                'error' => sprintf(
                    'Trop de tentatives de connexion. Réessayez dans %d minute%s.',
                    $minutes,
                    $minutes > 1 ? 's' : '',
                ),
            ], 429);
        }

        return $this->inner->onAuthenticationFailure($request, $exception);
    }
}