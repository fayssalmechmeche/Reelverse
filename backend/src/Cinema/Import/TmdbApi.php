<?php

namespace App\Cinema\Import;

use Symfony\Contracts\HttpClient\Exception\HttpExceptionInterface;
use Symfony\Contracts\HttpClient\Exception\TransportExceptionInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

/**
 * Petit utilitaire autour du client TMDB : relance automatique quand TMDB
 * répond "trop de requêtes" (429) ou en cas d'erreur serveur / réseau passagère.
 */
class TmdbApi
{
    private const MAX_ATTEMPTS = 5;
    private const MAX_DISCOVER_PAGES = 500; // plafond imposé par TMDB

    public function __construct(
        private HttpClientInterface $tmdbClient,
    ) {}

    /** @return array<string, mixed> */
    public function get(string $path, array $query = []): array
    {
        for ($attempt = 1;; $attempt++) {
            try {
                return $this->tmdbClient->request('GET', $path, ['query' => $query])->toArray();
            } catch (HttpExceptionInterface | TransportExceptionInterface $e) {
                $status = $e instanceof HttpExceptionInterface ? $e->getResponse()->getStatusCode() : 0;
                $retryable = $status === 429 || $status >= 500 || $status === 0;

                if (!$retryable || $attempt >= self::MAX_ATTEMPTS) {
                    throw $e;
                }

                sleep(min(10, $attempt * 2));
            }
        }
    }

    /**
     * Parcourt les pages d'un endpoint "discover" et renvoie, page par page,
     * la liste des résultats.
     *
     * @return \Generator<int, array<int, array<string, mixed>>>
     */
    public function discover(string $endpoint, array $query, int $maxPages): \Generator
    {
        $maxPages = min($maxPages, self::MAX_DISCOVER_PAGES);

        for ($page = 1; $page <= $maxPages; $page++) {
            $data = $this->get($endpoint, $query + ['page' => $page]);

            yield $data['results'] ?? [];

            if ($page >= (int) ($data['total_pages'] ?? 0)) {
                break;
            }
        }
    }
}
