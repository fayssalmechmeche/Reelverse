<?php

namespace App\Cinema\Import;

use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Contracts\Cache\CacheInterface;
use Symfony\Contracts\Cache\ItemInterface;
use Symfony\Contracts\HttpClient\Exception\HttpExceptionInterface;
use Symfony\Contracts\HttpClient\Exception\TransportExceptionInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

/**
 * Client minimal pour l'API TheTVDB v4 : connexion avec la clé API, jeton gardé
 * en cache (il dure environ un mois), relance automatique sur 429 / erreurs
 * serveur, et reconnexion si le jeton est refusé.
 */
class TvdbApi
{
    private const TOKEN_CACHE_KEY = 'tvdb_api_token';
    private const MAX_ATTEMPTS = 5;

    public function __construct(
        private HttpClientInterface $tvdbClient,
        private CacheInterface $cache,
        #[Autowire('%env(TVDB_API_KEY)%')] private string $apiKey,
    ) {}

    public function isConfigured(): bool
    {
        return trim($this->apiKey) !== '';
    }

    /** @return array<string, mixed> Corps complet de la réponse (les données sont sous "data"). */
    public function get(string $path, array $query = []): array
    {
        $reloggedIn = false;

        for ($attempt = 1;; $attempt++) {
            try {
                return $this->tvdbClient->request('GET', $path, [
                    'query' => $query,
                    'auth_bearer' => $this->token(),
                ])->toArray();
            } catch (HttpExceptionInterface | TransportExceptionInterface $e) {
                $status = $e instanceof HttpExceptionInterface ? $e->getResponse()->getStatusCode() : 0;

                if ($status === 401 && !$reloggedIn) {
                    $this->cache->delete(self::TOKEN_CACHE_KEY);
                    $reloggedIn = true;
                    continue;
                }

                $retryable = $status === 429 || $status >= 500 || $status === 0;
                if (!$retryable || $attempt >= self::MAX_ATTEMPTS) {
                    throw $e;
                }

                sleep(min(10, $attempt * 2));
            }
        }
    }

    private function token(): string
    {
        return $this->cache->get(self::TOKEN_CACHE_KEY, function (ItemInterface $item): string {
            $item->expiresAfter(60 * 60 * 24 * 25);

            $data = $this->tvdbClient->request('POST', 'login', [
                'json' => ['apikey' => $this->apiKey],
            ])->toArray();

            $token = $data['data']['token'] ?? null;
            if (!is_string($token) || $token === '') {
                throw new \RuntimeException('TheTVDB : jeton introuvable dans la réponse de connexion.');
            }

            return $token;
        });
    }
}
