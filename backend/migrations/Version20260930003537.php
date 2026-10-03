<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260930003537 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE pack_stock ADD user_id INT NOT NULL');
        $this->addSql('ALTER TABLE pack_stock ADD CONSTRAINT FK_F9C2DC11A76ED395 FOREIGN KEY (user_id) REFERENCES app_user (id) NOT DEFERRABLE');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_F9C2DC11A76ED395 ON pack_stock (user_id)');
        $this->addSql('ALTER TABLE wallet ADD user_id INT NOT NULL');
        $this->addSql('ALTER TABLE wallet ADD CONSTRAINT FK_7C68921FA76ED395 FOREIGN KEY (user_id) REFERENCES app_user (id) NOT DEFERRABLE');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_7C68921FA76ED395 ON wallet (user_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE pack_stock DROP CONSTRAINT FK_F9C2DC11A76ED395');
        $this->addSql('DROP INDEX UNIQ_F9C2DC11A76ED395');
        $this->addSql('ALTER TABLE pack_stock DROP user_id');
        $this->addSql('ALTER TABLE wallet DROP CONSTRAINT FK_7C68921FA76ED395');
        $this->addSql('DROP INDEX UNIQ_7C68921FA76ED395');
        $this->addSql('ALTER TABLE wallet DROP user_id');
    }
}
