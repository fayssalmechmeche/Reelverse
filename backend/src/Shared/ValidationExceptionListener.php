<?php

namespace App\Shared;

use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\Validator\Exception\ValidationFailedException;

/**
 * Transforme l'échec de validation d'un #[MapRequestPayload] en réponse JSON
 * `{ "error": "<premier message>", "violations": [...] }` (code 422), le format
 * que lit déjà le frontend.
 */
#[AsEventListener]
class ValidationExceptionListener
{
    public function __invoke(ExceptionEvent $event): void
    {
        $previous = $event->getThrowable()->getPrevious();

        if (!$previous instanceof ValidationFailedException) {
            return;
        }

        if (!str_starts_with($event->getRequest()->getPathInfo(), '/api/')) {
            return;
        }

        $violations = [];
        foreach ($previous->getViolations() as $violation) {
            $violations[] = [
                'field' => $violation->getPropertyPath(),
                'message' => $violation->getMessage(),
            ];
        }

        $event->setResponse(new JsonResponse([
            'error' => $violations[0]['message'] ?? 'Données invalides.',
            'violations' => $violations,
        ], 422));
    }
}