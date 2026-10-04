<?php

namespace App\Achievement\Import;

use App\Achievement\Achievement;
use App\Achievement\AchievementTrigger;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(name: 'app:achievements:seed', description: 'Crée les succès de base du jeu')]
class SeedAchievementsCommand extends Command
{
    public function __construct(private EntityManagerInterface $em)
    {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $repo = $this->em->getRepository(Achievement::class);

        $definitions = [
            ['code' => 'first_legendary', 'label' => 'Obtenir une carte Legendary', 'trigger' => AchievementTrigger::LEGENDARY_OBTAINED, 'threshold' => null, 'reward' => 500],
            ['code' => 'cards_10_day', 'label' => 'Obtenir 10 cartes en une journée', 'trigger' => AchievementTrigger::CARDS_OBTAINED_IN_DAY, 'threshold' => 10, 'reward' => 50],
            ['code' => 'cards_50_day', 'label' => 'Obtenir 50 cartes en une journée', 'trigger' => AchievementTrigger::CARDS_OBTAINED_IN_DAY, 'threshold' => 50, 'reward' => 300],
            ['code' => 'collection_completed_1', 'label' => 'Compléter une collection à 100%', 'trigger' => AchievementTrigger::COLLECTION_COMPLETED, 'threshold' => 1, 'reward' => 150],
            ['code' => 'collection_completed_3', 'label' => 'Compléter 3 collections à 100%', 'trigger' => AchievementTrigger::COLLECTION_COMPLETED, 'threshold' => 3, 'reward' => 600],
        ];

        $count = 0;
        foreach ($definitions as $def) {
            $existing = $repo->findOneBy(['code' => $def['code']]);
            if ($existing) {
                continue;
            }

            $achievement = new Achievement();
            $achievement->setCode($def['code']);
            $achievement->setLabel($def['label']);
            $achievement->setTrigger($def['trigger']);
            $achievement->setThreshold($def['threshold']);
            $achievement->setCoinsReward($def['reward']);

            $this->em->persist($achievement);
            $count++;
        }

        $this->em->flush();
        $output->writeln("$count succès créés.");

        return Command::SUCCESS;
    }
}
