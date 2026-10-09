<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261009120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Un seul shop par joueur et par jour';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE UNIQUE INDEX uniq_shop_user_date ON shop (user_id, for_date)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP INDEX uniq_shop_user_date');
    }
}
