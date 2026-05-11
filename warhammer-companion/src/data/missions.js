export const GAME_TYPES = ['Matched Play', 'Narrative Play', 'Open Play'];

export const MISSIONS = [
  {
    id: 'annihilation',
    name: 'Annihilation',
    description:
      'A brutal war of attrition where victory belongs to the side that destroys more of the enemy.',
    winCondition:
      'At the end of the battle, the player who has destroyed more enemy units (by points value) wins. If equal, the game is a draw.',
    victoryType: 'points_destroyed',
  },
  {
    id: 'take_and_hold',
    name: 'Take & Hold',
    description:
      'Both sides fight to control a central objective marker. Holding it at game end determines victory.',
    winCondition:
      'The player with the most surviving units (by wounds remaining) wins, representing control of the battlefield.',
    victoryType: 'wounds_remaining',
  },
  {
    id: 'sweep_and_clear',
    name: 'Sweep & Clear',
    description:
      'Advance through enemy lines, eliminating all resistance. Leave no foe standing.',
    winCondition:
      'The player who destroys the most enemy units wins. Ties are broken by total wounds remaining on surviving models.',
    victoryType: 'units_destroyed',
  },
  {
    id: 'last_stand',
    name: 'Last Stand',
    description:
      'One side defends a vital position while the attacker seeks to overwhelm them before reinforcements arrive.',
    winCondition:
      'The attacker wins if they destroy more than half the defender\'s starting units. The defender wins if they survive with more than half their units intact.',
    victoryType: 'survival',
  },
];
