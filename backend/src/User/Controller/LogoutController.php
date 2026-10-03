<?php

namespace App\User\Controller;

use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;

#[AsController]
class LogoutController
{
    #[Route('/api/logout', name: 'api_logout', methods: ['POST'])]
    public function __invoke(): JsonResponse
    {
        $response = new JsonResponse(['success' => true]);
        $response->headers->clearCookie('BEARER', '/', null, false, true, 'lax');
        return $response;
    }
}
