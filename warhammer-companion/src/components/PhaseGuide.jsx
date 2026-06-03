import { PHASES } from '../state/gameReducer.js';

const PHASE_CONTENT = {
  'Command Phase': {
    summary:
      'Both players gain 1 CP. The active player then checks battle-shock for any units that are currently battle-shocked or at/below half-strength. A successful battle-shock roll removes the battle-shocked condition.',
    steps: [
      'Both players gain 1 Command Point (CP).',
      'Battle-shock step: make a battle-shock roll (2D6 vs Leadership) for each friendly unit that is currently battle-shocked OR at/below half-strength.',
      'If a unit was battle-shocked and its roll succeeds, it is no longer battle-shocked.',
      'If a roll fails, that unit becomes (or remains) battle-shocked.',
      'Battle-shocked units: OC = "-", cannot be targeted by stratagems, cannot start or complete actions.',
      'Resolve any Command Abilities (abilities that trigger in the Command phase).',
    ],
  },
  'Movement Phase': {
    summary:
      'Move all units. Choose from: Remain Stationary, Normal Move (up to M"), Advance (M + D6", cannot shoot normally or charge), or Fall Back.',
    steps: [
      'Select each unit in turn and choose its move type.',
      'Normal Move: up to M" while unengaged; must be unengaged after.',
      'Advance: up to M + D6"; cannot shoot (except Assault weapons), declare charges, or start actions until end of turn.',
      'Fall Back (engaged units only): choose a mode — Ordered Retreat (non-shocked; safe fall back) or Desperate Escape (battle-shocked; each model makes a hazard roll, models can move through enemies). After falling back, cannot shoot, charge, or start actions.',
      'Strategic reserves can also arrive via Ingress moves this phase.',
    ],
  },
  'Shooting Phase': {
    summary:
      'Eligible units shoot with their ranged weapons. Choose a shooting type for each unit: Normal, Assault, Close-quarters, or Indirect.',
    steps: [
      'Select an eligible unit to shoot (must not be battle-shocked beyond eligibility checks).',
      'Normal Shooting: unit is unengaged and did not Advance. Select targets within range and line of sight.',
      'Assault Shooting: unit Advanced but has [ASSAULT] weapons — can only fire those weapons.',
      'Close-quarters Shooting: unit is engaged. Monsters/Vehicles can fire all weapons at -1 to hit (except [CLOSE-QUARTERS] weapons vs their engaged target). Others can only use [CLOSE-QUARTERS] weapons.',
      'Indirect Shooting: unit has [INDIRECT FIRE] weapons; can target units not visible. Auto-fail on 1–5 unless stationary with a spotter (1–3 fail). Cannot re-roll hit rolls. Target has Benefit of Cover.',
      'Resolve attacks: Hit roll (vs BS) → Wound roll → Save roll → Apply damage.',
    ],
  },
  'Charge Phase': {
    summary:
      'Units charge to engage the enemy in close combat. The charge roll is made first — then targets are selected based on the distance rolled.',
    steps: [
      'Declare which unit is charging (must be within 12" of an enemy, unengaged, and not having Advanced or Fallen Back).',
      'Make the charge roll: roll 2D6 — this is the maximum distance for the charge move.',
      'Select charge targets: one or more enemy units within 12" AND within the rolled distance.',
      'Make the charge move: each model moves toward charge targets; must end within 1" of a target if possible.',
      'After a successful charge, all models in the charging unit gain the Fights First ability until end of turn.',
      'Fire Overwatch (stratagem) can be used at the end of the Movement phase, not in reaction to individual charges.',
    ],
  },
  'Fight Phase': {
    summary:
      'All pile-in moves happen first, then all combats are fought, then consolidation. Both players\' units participate.',
    steps: [
      '1. PILE IN: Both players make pile-in moves (up to 3") with eligible units — active player first, then opponent. Models in base-contact with enemies cannot move.',
      '2. FIGHT: Resolve Fights First units first (active player selects one, then opponent alternates). Then resolve remaining combats, alternating.',
      'A unit with Fights First fights before other units in its priority bracket.',
      'Overrun Fight: a unit that was unengaged (or became unengaged mid-phase) can make an extra pile-in move then fight.',
      '3. CONSOLIDATE: Both players make consolidation moves (up to 3") — active player first. Must use Ongoing mode (if engaged), Engaging mode (if within 3" of enemy), or Objective mode (if within 3" of objective). Consolidating into new enemies forces those enemies to fight.',
      'Resolve attacks each fight: Hit roll (vs WS) → Wound roll → Save roll → Apply damage.',
    ],
  },
};

export default function PhaseGuide({ phaseIndex }) {
  const phaseName = PHASES[phaseIndex];
  const content = PHASE_CONTENT[phaseName];
  if (!content) return null;

  return (
    <div className="phase-guide">
      <h3>{phaseName} — Guide</h3>
      <p style={{ marginBottom: '8px' }}>{content.summary}</p>
      <ul>
        {content.steps.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ul>
    </div>
  );
}
