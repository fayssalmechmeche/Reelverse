<?php

namespace App\Quest\Import;

use App\Quest\Quest;
use App\Quest\QuestPeriod;
use App\Quest\QuestTrigger;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(name: 'app:quests:seed', description: 'Crée les quêtes de base du jeu')]
class SeedQuestsCommand extends Command
{
    public function __construct(private EntityManagerInterface $em)
    {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $repo = $this->em->getRepository(Quest::class);

        $definitions = [
            [
                'code' => 'daily_cards_5',
                'label' => 'Obtenir 5 cartes',
                'description' => 'Obtenez 5 cartes aujourd\'hui (packs, boutique ou échanges).',
                'period' => QuestPeriod::DAILY,
                'trigger' => QuestTrigger::CARDS_OBTAINED,
                'target' => 5,
                'reward' => 30,
            ],
            [
                'code' => 'daily_cards_15',
                'label' => 'Obtenir 15 cartes',
                'description' => 'Obtenez 15 cartes aujourd\'hui.',
                'period' => QuestPeriod::DAILY,
                'trigger' => QuestTrigger::CARDS_OBTAINED,
                'target' => 15,
                'reward' => 80,
            ],
            [
                'code' => 'weekly_cards_50',
                'label' => 'Obtenir 50 cartes cette semaine',
                'description' => 'Obtenez 50 cartes cumulées sur la semaine.',
                'period' => QuestPeriod::WEEKLY,
                'trigger' => QuestTrigger::CARDS_OBTAINED,
                'target' => 50,
                'reward' => 250,
            ],
            [
                'code' => 'weekly_rare_card',
                'label' => 'Obtenir une carte rare',
                'description' => 'Obtenez au moins une carte Epic ou Legendary cette semaine.',
                'period' => QuestPeriod::WEEKLY,
                'trigger' => QuestTrigger::RARE_CARDS_OBTAINED,
                'target' => 1,
                'reward' => 150,
            ],
        ];

        $count = 0;
        foreach ($definitions as $def) {
            $existing = $repo->findOneBy(['code' => $def['code']]);
            if ($existing) {
                continue;
            }

            $quest = new Quest();
            $quest->setCode($def['code']);
            $quest->setLabel($def['label']);
            $quest->setDescription($def['description']);
            $quest->setPeriod($def['period']);
            $quest->setTrigger($def['trigger']);
            $quest->setTarget($def['target']);
            $quest->setCoinsReward($def['reward']);

            $this->em->persist($quest);
            $count++;
        }

        $this->em->flush();
        $output->writeln("$count quêtes créées.");

        return Command::SUCCESS;
    }
}
