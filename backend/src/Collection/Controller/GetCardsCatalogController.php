<?php

namespace App\Collection\Controller;

use App\Card\Card;
use App\Cinema\Character\Character;
use App\Cinema\Movie\Movie;
use App\Cinema\Person\Person;
use App\Cinema\Series\Series;
use App\Inventory\UserCard;
use App\User\User;
use App\Wishlist\SaleListItem;
use App\Wishlist\WishlistItem;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\QueryBuilder;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Catalogue de cartes du jeu (possédées ou non), PAGINÉ et filtré côté
 * serveur, avec la quantité de l'utilisateur connecté pour chacune.
 *
 * Paramètres de requête (tous optionnels) :
 *  - page      : numéro de page, à partir de 0
 *  - perPage   : cartes par page (1 à 60, 15 par défaut)
 *  - tab       : ALL | OWNED | MISSING | NEW | DUPLICATES | WISHLIST | TRADELIST
 *  - type      : person | movie | series | character
 *  - rarity    : common | uncommon | rare | epic | legendary
 *  - hideMissing : 1 pour masquer les cartes non possédées
 *  - search    : recherche sur le nom de la carte
 *  - sort      : OWNED_FIRST | NAME_ASC | RARITY_DESC | RARITY_ASC | YEAR_DESC
 *
 * Note : placé volontairement hors de /api/cards/... car Card est une
 * ApiResource avec une route GET /api/cards/{id} générée automatiquement,
 * qui intercepterait sinon un chemin comme /api/cards/catalog (404 "Not
 * Found" renvoyé par API Platform lui-même, avant d'atteindre ce contrôleur).
 */
#[AsController]
class GetCardsCatalogController
{
    private const TABS = ['ALL', 'OWNED', 'MISSING', 'NEW', 'DUPLICATES', 'WISHLIST', 'TRADELIST'];
    private const TYPES = ['person', 'movie', 'series', 'character'];
    private const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
    private const SORTS = ['OWNED_FIRST', 'NAME_ASC', 'RARITY_DESC', 'RARITY_ASC', 'YEAR_DESC'];

    private const DEFAULT_PER_PAGE = 15;
    private const MAX_PER_PAGE = 60;

    public function __construct(
        private EntityManagerInterface $em,
        private Security $security,
    ) {}

    #[Route('/api/collection/catalog', name: 'api_collection_catalog', methods: ['GET'])]
    public function __invoke(Request $request): JsonResponse
    {
        /** @var User|null $user */
        $user = $this->security->getUser();

        if (!$user) {
            return new JsonResponse(['error' => 'Authentification requise.'], 401);
        }

        $q = $request->query;

        $page = max(0, $q->getInt('page', 0));
        $perPage = min(self::MAX_PER_PAGE, max(1, $q->getInt('perPage', self::DEFAULT_PER_PAGE)));

        $tab = $this->whitelist($q->get('tab'), self::TABS, 'ALL');
        $type = $this->whitelist($q->get('type'), self::TYPES, null);
        $rarity = $this->whitelist($q->get('rarity'), self::RARITIES, null);
        $sort = $this->whitelist($q->get('sort'), self::SORTS, 'OWNED_FIRST');
        $hideMissing = $q->getBoolean('hideMissing');
        $search = trim((string) $q->get('search', ''));

        $filters = compact('tab', 'type', 'rarity', 'hideMissing', 'search');

        // Total des cartes correspondant aux filtres (pour la pagination)
        $total = (int) $this->baseQuery($user, $filters)
            ->select('COUNT(c.id)')
            ->getQuery()
            ->getSingleScalarResult();

        $totalPages = max(1, (int) ceil($total / $perPage));
        // Page hors limites (ex: après une vente) : on ramène à la dernière
        $page = min($page, $totalPages - 1);

        $rows = $this->pageQuery($user, $filters, $sort)
            ->setFirstResult($page * $perPage)
            ->setMaxResults($perPage)
            ->getQuery()
            ->getArrayResult();

        $items = array_map(fn(array $row) => [
            'id' => $row['userCardId'] !== null ? (int) $row['userCardId'] : null,
            'cardId' => (int) $row['cardId'],
            'type' => $this->enumValue($row['type']),
            'entityId' => (int) $row['entityId'],
            'rarity' => $this->enumValue($row['rarity']),
            'quantity' => (int) $row['quantity'],
            'isNew' => (int) $row['isNew'] === 1,
        ], $rows);

        return new JsonResponse([
            'items' => $items,
            'total' => $total,
            'page' => $page,
            'perPage' => $perPage,
            'totalPages' => $totalPages,
            'counts' => $this->globalCounts($user),
        ]);
    }

    /**
     * Requête de base : joint la possession du joueur et les noms des
     * entités, et applique les filtres. Le SELECT est défini par l'appelant.
     *
     * @param array{tab: string, type: ?string, rarity: ?string, hideMissing: bool, search: string} $filters
     */
    private function baseQuery(User $user, array $filters): QueryBuilder
    {
        $qb = $this->em->createQueryBuilder()
            ->from(Card::class, 'c')
            ->leftJoin(UserCard::class, 'uc', 'WITH', 'uc.card = c AND uc.user = :user')
            ->leftJoin(Movie::class, 'm', 'WITH', "c.type = 'movie' AND m.id = c.entityId")
            ->leftJoin(Series::class, 's', 'WITH', "c.type = 'series' AND s.id = c.entityId")
            ->leftJoin(Person::class, 'p', 'WITH', "c.type = 'person' AND p.id = c.entityId")
            ->leftJoin(Character::class, 'ch', 'WITH', "c.type = 'character' AND ch.id = c.entityId")
            ->setParameter('user', $user);

        switch ($filters['tab']) {
            case 'OWNED':
                $qb->andWhere('uc.quantity > 0');
                break;
            case 'MISSING':
                $qb->andWhere('uc.quantity IS NULL OR uc.quantity = 0');
                break;
            case 'NEW':
                $qb->andWhere('uc.quantity > 0 AND uc.isNew = true');
                break;
            case 'DUPLICATES':
                $qb->andWhere('uc.quantity >= 2');
                break;
            case 'WISHLIST':
                $qb->innerJoin(WishlistItem::class, 'w', 'WITH', 'w.card = c AND w.user = :user');
                break;
            case 'TRADELIST':
                $qb->innerJoin(SaleListItem::class, 'sl', 'WITH', 'sl.card = c AND sl.user = :user');
                break;
        }

        if ($filters['type'] !== null) {
            $qb->andWhere('c.type = :type')->setParameter('type', $filters['type']);
        }
        if ($filters['rarity'] !== null) {
            $qb->andWhere('c.rarity = :rarity')->setParameter('rarity', $filters['rarity']);
        }
        if ($filters['hideMissing']) {
            $qb->andWhere('uc.quantity > 0');
        }
        if ($filters['search'] !== '') {
            $escaped = addcslashes(mb_strtolower($filters['search']), '%_\\');
            $qb->andWhere('LOWER(COALESCE(m.title, s.name, p.name, ch.name)) LIKE :search')
                ->setParameter('search', '%' . $escaped . '%');
        }

        return $qb;
    }

    /**
     * @param array{tab: string, type: ?string, rarity: ?string, hideMissing: bool, search: string} $filters
     */
    private function pageQuery(User $user, array $filters, string $sort): QueryBuilder
    {
        $qb = $this->baseQuery($user, $filters)
            ->select(
                'c.id AS cardId',
                'c.type AS type',
                'c.entityId AS entityId',
                'c.rarity AS rarity',
                'COALESCE(uc.quantity, 0) AS quantity',
                'CASE WHEN uc.isNew = true AND uc.quantity > 0 THEN 1 ELSE 0 END AS isNew',
                'uc.id AS userCardId',
            )
            ->addSelect('COALESCE(m.title, s.name, p.name, ch.name) AS HIDDEN sortName');

        switch ($sort) {
            case 'NAME_ASC':
                $qb->orderBy('sortName', 'ASC');
                break;
            case 'RARITY_DESC':
                $qb->addSelect(
                    "CASE c.rarity WHEN 'legendary' THEN 5 WHEN 'epic' THEN 4 WHEN 'rare' THEN 3 WHEN 'uncommon' THEN 2 ELSE 1 END AS HIDDEN rarityRank"
                )
                    ->orderBy('rarityRank', 'DESC')
                    ->addOrderBy('sortName', 'ASC');
                break;
            case 'RARITY_ASC':
                $qb->addSelect(
                    "CASE c.rarity WHEN 'legendary' THEN 5 WHEN 'epic' THEN 4 WHEN 'rare' THEN 3 WHEN 'uncommon' THEN 2 ELSE 1 END AS HIDDEN rarityRank"
                )
                    ->orderBy('rarityRank', 'ASC')
                    ->addOrderBy('sortName', 'ASC');
                break;
            case 'YEAR_DESC':
                // 1) films et séries déjà sortis, du plus récent au plus ancien ;
                // 2) puis ceux à venir, du plus proche au plus lointain ;
                // 3) puis les cartes sans date (acteurs, personnages), par nom.
                // dayDiff = nombre de jours entre la sortie et aujourd'hui
                // (<= 0 : sorti, > 0 : à venir).
                $qb->addSelect(
                    'CASE WHEN COALESCE(m.releaseDate, s.firstAirDate) IS NULL THEN 0 '
                        . 'WHEN DATE_DIFF(COALESCE(m.releaseDate, s.firstAirDate), CURRENT_DATE()) <= 0 THEN 2 '
                        . 'ELSE 1 END AS HIDDEN releaseRank'
                )
                    ->addSelect(
                        'CASE WHEN COALESCE(m.releaseDate, s.firstAirDate) IS NULL THEN 0 '
                            . 'WHEN DATE_DIFF(COALESCE(m.releaseDate, s.firstAirDate), CURRENT_DATE()) <= 0 '
                            . 'THEN DATE_DIFF(COALESCE(m.releaseDate, s.firstAirDate), CURRENT_DATE()) '
                            . 'ELSE 0 - DATE_DIFF(COALESCE(m.releaseDate, s.firstAirDate), CURRENT_DATE()) END AS HIDDEN releaseOrder'
                    )
                    ->orderBy('releaseRank', 'DESC')
                    ->addOrderBy('releaseOrder', 'DESC')
                    ->addOrderBy('sortName', 'ASC');
                break;
            default: // OWNED_FIRST
                $qb->addSelect('CASE WHEN uc.quantity > 0 THEN 1 ELSE 0 END AS HIDDEN ownedRank')
                    ->orderBy('ownedRank', 'DESC')
                    ->addOrderBy('sortName', 'ASC');
        }

        // Départage stable pour que la pagination ne mélange jamais les pages
        return $qb->addOrderBy('c.id', 'ASC');
    }

    /**
     * Compteurs globaux (indépendants des filtres) pour les onglets et la
     * barre de progression de Ma Collection.
     *
     * @return array{all: int, owned: int, duplicates: int, new: int}
     */
    private function globalCounts(User $user): array
    {
        $row = $this->em->createQueryBuilder()
            ->select(
                'COUNT(c.id) AS total',
                'SUM(CASE WHEN uc.quantity > 0 THEN 1 ELSE 0 END) AS owned',
                'SUM(CASE WHEN uc.quantity >= 2 THEN 1 ELSE 0 END) AS duplicates',
                'SUM(CASE WHEN uc.quantity > 0 AND uc.isNew = true THEN 1 ELSE 0 END) AS newCards',
            )
            ->from(Card::class, 'c')
            ->leftJoin(UserCard::class, 'uc', 'WITH', 'uc.card = c AND uc.user = :user')
            ->setParameter('user', $user)
            ->getQuery()
            ->getSingleResult();

        return [
            'all' => (int) $row['total'],
            'owned' => (int) $row['owned'],
            'duplicates' => (int) $row['duplicates'],
            'new' => (int) $row['newCards'],
        ];
    }

    /** @param string[] $allowed */
    private function whitelist(mixed $value, array $allowed, ?string $default): ?string
    {
        return is_string($value) && in_array($value, $allowed, true) ? $value : $default;
    }

    private function enumValue(mixed $value): mixed
    {
        return $value instanceof \BackedEnum ? $value->value : $value;
    }
}
