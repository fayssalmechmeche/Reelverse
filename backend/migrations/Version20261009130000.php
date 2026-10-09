<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261009130000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajoute le bannissement des comptes';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE app_user ADD banned_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql('ALTER TABLE app_user ADD ban_reason VARCHAR(255) DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE app_user DROP banned_at');
        $this->addSql('ALTER TABLE app_user DROP ban_reason');
    }
}
