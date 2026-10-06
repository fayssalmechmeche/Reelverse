<?php

namespace App\User\OAuth;

use League\OAuth2\Client\Provider\AbstractProvider;
use League\OAuth2\Client\Provider\Google;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Wohali\OAuth2\Client\Provider\Discord;

class OAuthProviderFactory
{
    public const PROVIDERS = ['google', 'discord'];

    public function __construct(
        #[Autowire('%env(FRONTEND_URL)%')] private readonly string $frontendUrl,
        #[Autowire('%env(GOOGLE_CLIENT_ID)%')] private readonly string $googleClientId,
        #[Autowire('%env(GOOGLE_CLIENT_SECRET)%')] private readonly string $googleClientSecret,
        #[Autowire('%env(DISCORD_CLIENT_ID)%')] private readonly string $discordClientId,
        #[Autowire('%env(DISCORD_CLIENT_SECRET)%')] private readonly string $discordClientSecret,
    ) {}

    public function create(string $name): ?AbstractProvider
    {
        $redirectUri = rtrim($this->frontendUrl, '/') . '/api/connect/' . $name . '/check';

        return match ($name) {
            'google' => $this->googleClientId !== '' && $this->googleClientSecret !== ''
                ? new Google([
                    'clientId' => $this->googleClientId,
                    'clientSecret' => $this->googleClientSecret,
                    'redirectUri' => $redirectUri,
                ])
                : null,
            'discord' => $this->discordClientId !== '' && $this->discordClientSecret !== ''
                ? new Discord([
                    'clientId' => $this->discordClientId,
                    'clientSecret' => $this->discordClientSecret,
                    'redirectUri' => $redirectUri,
                ])
                : null,
            default => null,
        };
    }

    /** @return string[] */
    public function scopes(string $name): array
    {
        return match ($name) {
            'google' => ['openid', 'email', 'profile'],
            'discord' => ['identify', 'email'],
            default => [],
        };
    }
}
