<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261010120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajoute l\'image des personnages (TheTVDB) et le marqueur de synchronisation TVDB des films et séries';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE character ADD image_url VARCHAR(500) DEFAULT NULL');
        $this->addSql('ALTER TABLE movie ADD tvdb_synced_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql('ALTER TABLE series ADD tvdb_synced_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE character DROP image_url');
        $this->addSql('ALTER TABLE movie DROP tvdb_synced_at');
        $this->addSql('ALTER TABLE series DROP tvdb_synced_at');
    }
}
