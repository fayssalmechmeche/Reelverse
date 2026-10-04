<?php

namespace App\User\Controller;

use App\User\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;

#[AsController]
class AvatarController
{
    private const MAX_BYTES = 300 * 1024; // 300 Ko (le frontend redimensionne avant l'envoi)
    private const MAX_DIMENSION = 600;

    private string $dir;

    public function __construct(
        private EntityManagerInterface $em,
        private Security $security,
        #[Autowire('%kernel.project_dir%')] string $projectDir,
    ) {
        $this->dir = $projectDir . '/var/uploads/avatars';
    }

    #[Route('/api/me/avatar', name: 'api_upload_avatar', methods: ['POST'])]
    public function upload(Request $request): JsonResponse
    {
        /** @var User|null $user */
        $user = $this->security->getUser();
        if (!$user) {
            return new JsonResponse(['error' => 'Authentification requise.'], 401);
        }

        $file = $request->files->get('avatar');
        if (!$file || !$file->isValid()) {
            return new JsonResponse(['error' => 'Aucun fichier valide reçu.'], 400);
        }

        if ($file->getSize() > self::MAX_BYTES) {
            return new JsonResponse(['error' => 'Image trop lourde (300 Ko max).'], 400);
        }

        $info = @getimagesize($file->getPathname());
        if ($info === false || $info[2] !== IMAGETYPE_JPEG) {
            return new JsonResponse(['error' => 'Format invalide (JPEG attendu).'], 400);
        }

        if ($info[0] > self::MAX_DIMENSION || $info[1] > self::MAX_DIMENSION) {
            return new JsonResponse(['error' => 'Image trop grande.'], 400);
        }

        if (!is_dir($this->dir) && !mkdir($this->dir, 0775, true) && !is_dir($this->dir)) {
            return new JsonResponse(['error' => 'Impossible d\'enregistrer l\'image.'], 500);
        }

        $this->deleteFile($user->getAvatar());

        $filename = $user->getId() . '-' . bin2hex(random_bytes(6)) . '.jpg';
        $file->move($this->dir, $filename);

        $user->setAvatar($filename);
        $this->em->flush();

        return new JsonResponse(['avatarUrl' => $this->avatarUrl($user)]);
    }

    #[Route('/api/me/avatar', name: 'api_delete_avatar', methods: ['DELETE'])]
    public function delete(): JsonResponse
    {
        /** @var User|null $user */
        $user = $this->security->getUser();
        if (!$user) {
            return new JsonResponse(['error' => 'Authentification requise.'], 401);
        }

        $this->deleteFile($user->getAvatar());
        $user->setAvatar(null);
        $this->em->flush();

        return new JsonResponse(['avatarUrl' => null]);
    }

    #[Route('/api/users/{id}/avatar', name: 'api_get_avatar', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function show(int $id): Response
    {
        $user = $this->em->getRepository(User::class)->find($id);
        $filename = $user?->getAvatar();

        if (!$filename || !preg_match('/^\d+-[a-f0-9]+\.jpg$/', $filename)) {
            return new Response('', 404);
        }

        $path = $this->dir . '/' . $filename;
        if (!is_file($path)) {
            return new Response('', 404);
        }

        $response = new BinaryFileResponse($path);
        $response->headers->set('Content-Type', 'image/jpeg');
        $response->setPublic();
        $response->setMaxAge(86400);

        return $response;
    }

    private function avatarUrl(User $user): ?string
    {
        $avatar = $user->getAvatar();

        return $avatar ? sprintf('/api/users/%d/avatar?v=%s', $user->getId(), $avatar) : null;
    }

    private function deleteFile(?string $filename): void
    {
        if ($filename && preg_match('/^\d+-[a-f0-9]+\.jpg$/', $filename)) {
            $path = $this->dir . '/' . $filename;
            if (is_file($path)) {
                @unlink($path);
            }
        }
    }
}
