<?php

namespace App\Shared\Http;

use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpFoundation\IpUtils;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * Derriere Vercel + Cloudflare + cloudflared, REMOTE_ADDR est l'IP interne du
 * conteneur du tunnel. On la remplace par l'IP reelle du visiteur pour que le
 * rate limiting et le login throttling fonctionnent par visiteur.
 */
#[AsEventListener(event: KernelEvents::REQUEST, priority: 512)]
final class ClientIpListener
{
    private const INTERNAL_RANGES = [
        '127.0.0.0/8',
        '10.0.0.0/8',
        '172.16.0.0/12',
        '192.168.0.0/16',
        '::1/128',
        'fc00::/7',
    ];

    public function __invoke(RequestEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();
        $remote = $request->server->get('REMOTE_ADDR');

        if (!is_string($remote) || !IpUtils::checkIp($remote, self::INTERNAL_RANGES)) {
            return;
        }

        $ip = $this->validIp($request->headers->get('X-Vercel-Forwarded-For'))
            ?? $this->validIp($request->headers->get('CF-Connecting-IP'));

        if ($ip !== null) {
            $request->server->set('REMOTE_ADDR', $ip);
        }
    }

    private function validIp(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $candidate = trim(explode(',', $value)[0]);

        return filter_var($candidate, FILTER_VALIDATE_IP) !== false ? $candidate : null;
    }
}
