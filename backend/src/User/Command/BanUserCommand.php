<?php

namespace App\User\Command;

use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(name: 'app:user:ban', description: 'Bannit un compte (ou le débannit avec --lift)')]
class BanUserCommand extends Command
{
    public function __construct(
        private EntityManagerInterface $em,
        private UserFinder $finder,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addArgument('user', InputArgument::REQUIRED, 'E-mail ou pseudo')
            ->addOption('reason', null, InputOption::VALUE_REQUIRED, 'Motif (usage interne)')
            ->addOption('lift', null, InputOption::VALUE_NONE, 'Lève le bannissement');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $user = $this->finder->find((string) $input->getArgument('user'));
        if (!$user) {
            $output->writeln('<error>Utilisateur introuvable.</error>');

            return Command::FAILURE;
        }

        if ($input->getOption('lift')) {
            $user->unban();
            $this->em->flush();
            $output->writeln(sprintf('Compte #%d (%s) débanni.', $user->getId(), $user->getPseudo()));

            return Command::SUCCESS;
        }

        $user->ban($input->getOption('reason'));
        $this->em->flush();
        $output->writeln(sprintf('Compte #%d (%s) banni.', $user->getId(), $user->getPseudo()));

        return Command::SUCCESS;
    }
}
