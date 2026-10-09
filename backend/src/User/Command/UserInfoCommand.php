<?php

namespace App\User\Command;

use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(name: 'app:user:info', description: 'Affiche une fiche rapide sur un joueur')]
class UserInfoCommand extends Command
{
    public function __construct(
        private EntityManagerInterface $em,
        private UserFinder $finder,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addArgument('user', InputArgument::REQUIRED, 'E-mail ou pseudo');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $user = $this->finder->find((string) $input->getArgument('user'));
        if (!$user) {
            $output->writeln('<error>Utilisateur introuvable.</error>');

            return Command::FAILURE;
        }

        $conn = $this->em->getConnection();
        $id = $user->getId();

        $balance = $conn->fetchOne('SELECT balance FROM wallet WHERE user_id = :id', ['id' => $id]);
        $cards = $conn->fetchAssociative(
            'SELECT COUNT(*) AS distincts, COALESCE(SUM(quantity), 0) AS total FROM user_card WHERE user_id = :id AND quantity > 0',
            ['id' => $id]
        );
        $listings = $conn->fetchOne(
            'SELECT COUNT(*) FROM marketplace_listing WHERE seller_id = :id AND sold = false AND cancelled = false',
            ['id' => $id]
        );
        $sales = $conn->fetchOne(
            'SELECT COUNT(*) FROM marketplace_listing WHERE seller_id = :id AND sold = true',
            ['id' => $id]
        );

        $output->writeln(sprintf('#%d  %s  <%s>', $id, $user->getPseudo(), $user->getEmail()));
        $output->writeln('Statut          : ' . ($user->isBanned()
            ? sprintf('BANNI le %s (%s)', $user->getBannedAt()->format('Y-m-d H:i'), $user->getBanReason() ?? 'sans motif')
            : 'actif'));
        $output->writeln('Pièces          : ' . ($balance === false ? 'aucun wallet' : $balance));
        $output->writeln(sprintf('Cartes          : %d distinctes, %d exemplaires', $cards['distincts'], $cards['total']));
        $output->writeln('Annonces actives: ' . $listings);
        $output->writeln('Ventes réalisées: ' . $sales);

        return Command::SUCCESS;
    }
}
