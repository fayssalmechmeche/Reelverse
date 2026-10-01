<?php

namespace App\User\EventListener;

use Lexik\Bundle\JWTAuthenticationBundle\Event\AuthenticationSuccessEvent;
use Symfony\Component\HttpFoundation\Cookie;

class JwtCookieListener
{
    public function __construct(
        private bool $secureCookie,
    ) {}

    public function onAuthenticationSuccess(AuthenticationSuccessEvent $event): void
    {
        $data = $event->getData();
        $token = $data['token'];

        $event->getResponse()->headers->setCookie(
            Cookie::create('BEARER')
                ->withValue($token)
                ->withHttpOnly(true)
                ->withSecure($this->secureCookie)
                ->withSameSite(Cookie::SAMESITE_LAX)
                ->withPath('/')
        );

        // Le token ne sort plus dans le corps JSON, uniquement dans le cookie
        unset($data['token']);
        $event->setData($data);
    }
}
