<?php

namespace App\User\Command;

use App\Economy\Wallet\WalletService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(name: 'app:user:coins', description: 'Crédite (ou débite avec --debit) des pièces à un joueur')]
class AdjustCoinsCommand extends Command
{
    public function __construct(
        private EntityManagerInterface $em,
        private UserFinder $finder,
        private WalletService $wallet,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addArgument('user', InputArgument::REQUIRED, 'E-mail ou pseudo')
            ->addArgument('amount', InputArgument::REQUIRED, 'Montant (entier positif)')
            ->addOption('debit', null, InputOption::VALUE_NONE, 'Retire les pièces au lieu de les ajouter');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $user = $this->finder->find((string) $input->getArgument('user'));
        if (!$user) {
            $output->writeln('<error>Utilisateur introuvable.</error>');

            return Command::FAILURE;
        }

        $raw = (string) $input->getArgument('amount');
        if (!ctype_digit($raw) || (int) $raw < 1) {
            $output->writeln('<error>Le montant doit être un entier positif.</error>');

            return Command::FAILURE;
        }
        $amount = (int) $raw;

        try {
            if ($input->getOption('debit')) {
                $this->wallet->debit((int) $user->getId(), $amount);
            } else {
                $this->wallet->credit((int) $user->getId(), $amount);
            }
        } catch (\DomainException $e) {
            $output->writeln('<error>' . $e->getMessage() . '</error>');

            return Command::FAILURE;
        }

        $balance = $this->em->getConnection()->fetchOne(
            'SELECT balance FROM wallet WHERE user_id = :id',
            ['id' => $user->getId()]
        );

        $output->writeln(sprintf(
            '%s %d pièces pour #%d (%s). Nouveau solde : %d.',
            $input->getOption('debit') ? 'Débit de' : 'Crédit de',
            $amount,
            $user->getId(),
            $user->getPseudo(),
            $balance
        ));

        return Command::SUCCESS;
    }
}
