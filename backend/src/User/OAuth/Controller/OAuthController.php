<?php

namespace App\User\OAuth\Controller;

use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;
use App\User\OAuth\OAuthProviderFactory;
use App\User\OAuth\OAuthUserResolver;
use App\User\OAuth\OAuthLoginException;

#[AsController]
class OAuthController
{
    private const STATE_COOKIE = 'oauth_state';

    public function __construct(
        private readonly OAuthProviderFactory $providers,
        private readonly OAuthUserResolver $resolver,
        private readonly JWTTokenManagerInterface $jwt,
        private readonly LoggerInterface $logger,
        #[Autowire('%env(FRONTEND_URL)%')] private readonly string $frontendUrl,
        #[Autowire('%env(bool:APP_SECURE_COOKIES)%')] private readonly bool $secureCookie,
    ) {}

    #[Route('/api/connect/{provider}', name: 'oauth_connect', requirements: ['provider' => 'google|discord'], methods: ['GET'])]
    public function connect(string $provider): Response
    {
        $client = $this->providers->create($provider);
        if ($client === null) {
            return $this->errorRedirect('provider_unavailable');
        }

        $url = $client->getAuthorizationUrl(['scope' => $this->providers->scopes($provider)]);

        $response = new RedirectResponse($url);
        $response->headers->setCookie(
            Cookie::create(self::STATE_COOKIE)
                ->withValue($client->getState())
                ->withExpires(time() + 600)
                ->withPath('/api/connect')
                ->withHttpOnly(true)
                ->withSecure($this->secureCookie)
                ->withSameSite(Cookie::SAMESITE_LAX)
        );

        return $response;
    }

    #[Route('/api/connect/{provider}/check', name: 'oauth_check', requirements: ['provider' => 'google|discord'], methods: ['GET'])]
    public function check(string $provider, Request $request): Response
    {
        $client = $this->providers->create($provider);
        if ($client === null) {
            return $this->clearState($this->errorRedirect('provider_unavailable'));
        }

        $expectedState = (string) $request->cookies->get(self::STATE_COOKIE, '');
        $givenState = (string) $request->query->get('state', '');
        if ($expectedState === '' || !hash_equals($expectedState, $givenState)) {
            return $this->clearState($this->errorRedirect('invalid_state'));
        }

        // L'utilisateur a refuse sur la page du provider.
        if ($request->query->has('error')) {
            return $this->clearState($this->errorRedirect('access_denied'));
        }

        $code = (string) $request->query->get('code', '');
        if ($code === '') {
            return $this->clearState($this->errorRedirect('oauth_failed'));
        }

        try {
            $accessToken = $client->getAccessToken('authorization_code', ['code' => $code]);
            $owner = $client->getResourceOwner($accessToken);
            $data = $owner->toArray();

            $user = $this->resolver->resolve(
                $provider,
                (string) $owner->getId(),
                isset($data['email']) ? (string) $data['email'] : null,
                $this->isEmailVerified($provider, $data),
                $this->displayName($provider, $data),
            );
        } catch (OAuthLoginException $e) {
            return $this->clearState($this->errorRedirect($e->getErrorCode()));
        } catch (\Throwable $e) {
            $this->logger->error('OAuth login failed', ['provider' => $provider, 'exception' => $e]);

            return $this->clearState($this->errorRedirect('oauth_failed'));
        }

        // Ce parcours ne passe pas par le firewall : on bloque les comptes bannis ici.
        if ($user->isBanned()) {
            return $this->clearState($this->errorRedirect('account_banned'));
        }

        $response = new RedirectResponse(rtrim($this->frontendUrl, '/') . '/');
        $response->headers->setCookie(
            Cookie::create('BEARER')
                ->withValue($this->jwt->create($user))
                ->withExpires(time() + 604800) // aligné sur token_ttl (7 jours)
                ->withHttpOnly(true)
                ->withSecure($this->secureCookie)
                ->withSameSite(Cookie::SAMESITE_LAX)
                ->withPath('/')
        );

        return $this->clearState($response);
    }

    /** @param array<string, mixed> $data */
    private function isEmailVerified(string $provider, array $data): bool
    {
        $value = match ($provider) {
            'google' => $data['email_verified'] ?? false,
            'discord' => $data['verified'] ?? false,
            default => false,
        };

        return $value === true || $value === 'true' || $value === 1;
    }

    /** @param array<string, mixed> $data */
    private function displayName(string $provider, array $data): ?string
    {
        $name = match ($provider) {
            'google' => $data['name'] ?? $data['given_name'] ?? null,
            'discord' => $data['global_name'] ?? $data['username'] ?? null,
            default => null,
        };

        return is_string($name) ? $name : null;
    }

    private function errorRedirect(string $code): RedirectResponse
    {
        return new RedirectResponse(
            rtrim($this->frontendUrl, '/') . '/login?oauth_error=' . urlencode($code)
        );
    }

    private function clearState(Response $response): Response
    {
        $response->headers->clearCookie(self::STATE_COOKIE, '/api/connect');

        return $response;
    }
}
