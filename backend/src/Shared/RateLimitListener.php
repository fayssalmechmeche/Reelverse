<?php

namespace App\Shared;

use Psr\Log\LoggerInterface;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\RateLimiter\RateLimiterFactory;

/**
 * Limite le nombre de requêtes par adresse IP :
 * - plafond strict sur l'inscription et le mot de passe oublié ;
 * - plafond large sur toute l'API, pour protéger le serveur.
 */
#[AsEventListener(event: KernelEvents::REQUEST, priority: 20)]
class RateLimitListener
{
    public function __construct(
        private RateLimiterFactory $registerLimiter,
        private RateLimiterFactory $forgotPasswordLimiter,
        private RateLimiterFactory $apiGlobalLimiter,
        private LoggerInterface $logger,
    ) {}

    public function __invoke(RequestEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();
        $path = $request->getPathInfo();

        if (!str_starts_with($path, '/api') || $request->isMethod('OPTIONS')) {
            return;
        }

        $limiters = [$this->apiGlobalLimiter];

        if ($request->isMethod('POST') && $path === '/api/register') {
            array_unshift($limiters, $this->registerLimiter);
        } elseif ($request->isMethod('POST') && $path === '/api/forgot-password') {
            array_unshift($limiters, $this->forgotPasswordLimiter);
        }

        $ip = $request->getClientIp() ?? 'unknown';

        try {
            foreach ($limiters as $factory) {
                $limit = $factory->create($ip)->consume(1);

                if (!$limit->isAccepted()) {
                    $retryAfter = max(1, $limit->getRetryAfter()->getTimestamp() - time());

                    $event->setResponse(new JsonResponse(
                        ['error' => 'Trop de requêtes. Réessayez dans un instant.'],
                        429,
                        ['Retry-After' => (string) $retryAfter]
                    ));

                    return;
                }
            }
        } catch (\Throwable $e) {
            // Si Redis est indisponible, on laisse passer plutôt que de couper tout le site.
            $this->logger->error('Rate limiter indisponible : ' . $e->getMessage());
        }
    }
}
