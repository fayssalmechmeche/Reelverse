<?php

namespace App\Economy\Wallet;

use Doctrine\ORM\EntityManagerInterface;

/**
 * Seul point d'entrée pour modifier un solde.
 *
 * Chaque opération est une requête SQL atomique : PostgreSQL verrouille la ligne
 * le temps de l'UPDATE, donc deux requêtes simultanées ne peuvent ni lire le même
 * solde ni s'écraser l'une l'autre. Ne pas modifier Wallet via l'entité (credit/debit)
 * ailleurs que pour un portefeuille tout juste créé.
 *
 * À appeler dans la transaction de l'opération métier (wrapInTransaction), pour que
 * le débit soit annulé si la suite échoue.
 */
class WalletService
{
    /** Plafond : la colonne est un entier 32 bits. */
    public const MAX_BALANCE = 2_000_000_000;

    public function __construct(private EntityManagerInterface $em) {}

    public function debit(int $userId, int $amount): void
    {
        if ($amount < 0) {
            throw new \InvalidArgumentException('Le montant à débiter doit être positif.');
        }

        $updated = $this->em->getConnection()->executeStatement(
            'UPDATE wallet SET balance = balance - :amount WHERE user_id = :user AND balance >= :amount',
            ['amount' => $amount, 'user' => $userId],
        );

        if ($updated === 0) {
            $exists = $this->em->getConnection()->fetchOne(
                'SELECT 1 FROM wallet WHERE user_id = :user',
                ['user' => $userId],
            );

            throw new \DomainException($exists ? 'Solde insuffisant.' : 'Wallet introuvable.');
        }
    }

    public function credit(int $userId, int $amount): void
    {
        if ($amount < 0) {
            throw new \InvalidArgumentException('Le montant à créditer doit être positif.');
        }

        $updated = $this->em->getConnection()->executeStatement(
            'UPDATE wallet SET balance = LEAST(balance + :amount, :max) WHERE user_id = :user',
            ['amount' => $amount, 'max' => self::MAX_BALANCE, 'user' => $userId],
        );

        if ($updated === 0) {
            throw new \DomainException('Wallet introuvable.');
        }
    }
}
