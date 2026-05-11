import { PHASES } from '../state/gameReducer.js';

const PHASE_CONTENT = {
  'Command Phase': {
    summary:
      'Both players resolve Command phase abilities and CP regeneration. Select your Oath of Moment / Dark Pacts target. Activate any "start of Command phase" abilities on your datasheets.',
    steps: [
      'Gain 1 Command Point (CP) if eligible.',
      'Select one enemy unit for Oath of Moment (Space Marines) or make a Dark Pact declaration (Chaos).',
      'Resolve any "start of Command phase" abilities (e.g., Rhino Self Repair, Combat Doctrines).',
      'Battle-shock any units that have lost more than half their models.',
    ],
  },
  'Movement Phase': {
    summary:
      'Move all units up to their Movement (M) characteristic in inches. Units may Advance (add D6" to move, cannot shoot normally), Fall Back, or Remain Stationary.',
    steps: [
      'Declare which units will Normal Move, Advance, Fall Back, or Remain Stationary.',
      'Move each unit up to its M value. Advancing units add D6" but cannot shoot (except Assault weapons).',
      'Units cannot move within 1" of enemy models unless Falling Back.',
      'Disembark from transports before the transport moves (or after if it Remains Stationary).',
    ],
  },
  'Shooting Phase': {
    summary:
      'Units that are eligible to shoot select targets and resolve ranged attacks. Use the Combat Calculator to determine average wounds before rolling dice.',
    steps: [
      'Select a unit to shoot with (must not have Fallen Back or Advanced, unless special rules apply).',
      'Choose targets within range and line of sight.',
      'Resolve attacks: Hit roll (vs BS) → Wound roll (vs Strength/Toughness) → Save roll (vs AP).',
      'Apply damage to target unit\'s wounds. Use the Combat Calculator below for reference.',
    ],
  },
  'Charge Phase': {
    summary:
      'Units may attempt a Charge to move into engagement range (within 1") of an enemy unit. Roll 2D6 — the charge succeeds if the result equals or exceeds the distance.',
    steps: [
      'Declare a charge with any eligible unit (not within Engagement Range, not Advanced unless special rule).',
      'Select the unit(s) being charged.',
      'Roll 2D6 — result must equal or exceed the distance to the nearest model of the target unit.',
      'If successful, move the charging unit into Engagement Range (within 1"). Charged units may fire Overwatch (if eligible).',
    ],
  },
  'Fight Phase': {
    summary:
      'Units in Engagement Range (within 1" of enemy) fight in melee. The player whose turn it is fights first, then the opponent. Use the Combat Calculator for melee attacks.',
    steps: [
      'Active player selects one of their units in Engagement Range to fight.',
      'Opponent may then select one of their units that was charged or is in Engagement Range to fight.',
      'Players alternate selecting units to fight until all eligible units have fought.',
      'Resolve attacks: Hit roll (vs WS) → Wound roll → Save roll → Apply damage.',
      'Destroyed models are removed. Units below half strength may need to take Battle-shock tests.',
    ],
  },
  'Morale Phase': {
    summary:
      'Units that have suffered casualties may need to take Battle-shock tests. A failed test (rolling above Leadership on 2D6) means the unit is Battle-shocked and cannot use special abilities until the start of their next Command Phase.',
    steps: [
      'Units below half their starting strength must take a Battle-shock test.',
      'Roll 2D6: if the result is greater than the unit\'s Leadership (LD) characteristic, the unit is Battle-shocked.',
      'Battle-shocked units cannot use Stratagems and their OC counts as 0 until their next Command Phase.',
      'Character units attached to a unit use their own LD for the test.',
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
