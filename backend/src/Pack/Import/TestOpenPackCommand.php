<?php

namespace App\Pack\Import;

use App\Pack\PackOpener;
use App\Pack\PackStock;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(name: 'app:pack:test-open', description: 'Crée un PackStock de test avec un pack disponible et l\'ouvre')]
class TestOpenPackCommand extends Command
{
    public function __construct(
        private EntityManagerInterface $em,
        private PackOpener $opener,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $stock = new PackStock();
        $this->em->persist($stock);
        $this->em->flush();

        // On force manuellement un pack disponible pour le test
        $reflection = new \ReflectionProperty($stock, 'storedPacks');
        $reflection->setAccessible(true);
        $reflection->setValue($stock, 1);

        $cards = $this->opener->open($stock);

        foreach ($cards as $card) {
            $output->writeln(sprintf('%s #%d — %s', $card->getType()->value, $card->getEntityId(), $card->getRarity()->value));
        }

        return Command::SUCCESS;
    }
}
