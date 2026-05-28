import { useState, useMemo } from 'react';
import CombatModal from './CombatModal.jsx';

// Standard 40k 10th edition wound roll table:
// Attacker S >= 2x Defender T → 2+
// Attacker S > Defender T      → 3+
// Attacker S == Defender T     → 4+
// Attacker S < Defender T      → 5+
// Attacker S <= half Defender T→ 6+
function woundRoll(str, toughness) {
  if (str >= toughness * 2) return 2;
  if (str > toughness) return 3;
  if (str === toughness) return 4;
  if (str * 2 <= toughness) return 6;
  return 5;
}

// Probability of rolling >= target on a D6
function prob(target) {
  if (target <= 1) return 1;
  if (target >= 7) return 0;
  return (7 - target) / 6;
}

// Parse damage/attacks that may be a string like 'd3', 'd6', 'd6+1', '2d6' etc.
// Returns expected average
function avgDiceValue(val) {
  if (typeof val === 'number') return val;
  const s = String(val).toLowerCase().replace(/\s/g, '');
  // d6+1, d3, 2d6, etc.
  const m = s.match(/^(\d*)(d\d+)([+-]\d+)?$/);
  if (!m) return parseFloat(s) || 0;
  const num = m[1] ? parseInt(m[1], 10) : 1;
  const sides = parseInt(m[2].slice(1), 10);
  const bonus = m[3] ? parseInt(m[3], 10) : 0;
  return num * ((sides + 1) / 2) + bonus;
}

function CalcStep({ label, value, detail, active }) {
  return (
    <div className={`calc-step${active ? ' active' : ''}`}>
      <span className="calc-step-label">{label}</span>
      <span className="calc-step-value">{typeof value === 'number' ? value.toFixed(2) : value}</span>
      {detail && <span className="calc-step-detail">{detail}</span>}
    </div>
  );
}

export default function CombatCalculator({ battleUnits, dispatch, player, currentPhase }) {
  const [attackerId, setAttackerId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [weaponIdx, setWeaponIdx] = useState(0);
  const [showModal, setShowModal] = useState(false);

  const activeUnits = Object.values(battleUnits).filter((u) => !u.destroyed);
  const attackerUnits = activeUnits.filter((u) => u.owner === player);
  const targetUnits = activeUnits.filter((u) => u.owner !== player);

  const attacker = battleUnits[attackerId];
  const target = battleUnits[targetId];
  const weapon = attacker?.weapons[weaponIdx];

  const calc = useMemo(() => {
    if (!attacker || !target || !weapon) return null;

    const avgAttacks = avgDiceValue(weapon.attacks);
    const hitTarget = weapon.skill;
    const hitProb = prob(hitTarget);
    const avgHits = avgAttacks * hitProb;

    const wTarget = woundRoll(weapon.strength, target.toughness);
    const woundProb = prob(wTarget);
    const avgWounds = avgHits * woundProb;

    // Save: target save modified by AP, or invuln if better
    const modifiedSave = target.save - weapon.ap;
    const invuln = target.invulnSave;
    const effectiveSave = invuln
      ? Math.min(modifiedSave, invuln) // lower number = better save
      : modifiedSave;
    const clampedSave = Math.max(2, effectiveSave); // saves of 1+ don't exist
    const saveProb = prob(clampedSave);
    const failSaveProb = 1 - saveProb;
    const avgFailedSaves = avgWounds * failSaveProb;

    const avgDmg = avgDiceValue(weapon.damage);
    const avgTotalDamage = avgFailedSaves * avgDmg;

    return {
      avgAttacks,
      hitTarget,
      hitProb,
      avgHits,
      wTarget,
      woundProb,
      avgWounds,
      modifiedSave,
      invuln,
      effectiveSave: clampedSave,
      failSaveProb,
      avgFailedSaves,
      avgDmg,
      avgTotalDamage,
    };
  }, [attacker, target, weapon]);

  function handleApplyWounds() {
    if (!calc || !targetId) return;
    const wounds = Math.round(calc.avgTotalDamage);
    if (wounds > 0) {
      dispatch({ type: 'APPLY_WOUNDS', instanceId: targetId, woundsToApply: wounds });
    }
  }

  const saveLabel =
    calc
      ? calc.invuln && calc.invuln <= calc.modifiedSave
        ? `${calc.effectiveSave}+ (invuln)`
        : calc.modifiedSave <= 1
        ? `2+ (capped)`
        : `${calc.effectiveSave}+`
      : '—';

  return (
    <div className="calc-panel">
      <div className="panel-header" style={{ marginBottom: '12px', paddingBottom: '8px' }}>
        <h2>Combat Calculator</h2>
        <span className="text-muted text-sm">Expected average — roll real dice to resolve</span>
      </div>

      {/* Selectors */}
      <div className="form-row" style={{ marginBottom: '12px' }}>
        <div className="form-group">
          <label>Attacking Unit (Player {player})</label>
          <select
            value={attackerId}
            onChange={(e) => {
              setAttackerId(e.target.value);
              setWeaponIdx(0);
            }}
          >
            <option value="">— Select unit —</option>
            {attackerUnits.map((u) => (
              <option key={u.instanceId} value={u.instanceId}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Weapon</label>
          <select
            value={weaponIdx}
            onChange={(e) => setWeaponIdx(Number(e.target.value))}
            disabled={!attacker}
          >
            {attacker
              ? attacker.weapons.map((w, i) => (
                  <option key={i} value={i}>
                    {w.name} ({w.type})
                  </option>
                ))
              : <option>— Select attacker first —</option>}
          </select>
        </div>

        <div className="form-group">
          <label>Target Unit (Player {player === 1 ? 2 : 1})</label>
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
          >
            <option value="">— Select target —</option>
            {targetUnits.map((u) => (
              <option key={u.instanceId} value={u.instanceId}>
                {u.name} ({u.currentWounds}/{u.wounds}W)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Breakdown */}
      {calc && (
        <>
          <CalcStep
            label="Attacks"
            value={calc.avgAttacks}
            detail={`${typeof weapon.attacks === 'string' ? weapon.attacks.toUpperCase() : weapon.attacks} attack${calc.avgAttacks !== 1 ? 's' : ''}`}
            active
          />
          <CalcStep
            label="Hit Roll"
            value={calc.avgHits}
            detail={`${calc.hitTarget}+ to hit · ${(calc.hitProb * 100).toFixed(0)}% chance · ${calc.avgAttacks.toFixed(2)} × ${(calc.hitProb).toFixed(3)} = ${calc.avgHits.toFixed(2)}`}
          />
          <CalcStep
            label="Wound Roll"
            value={calc.avgWounds}
            detail={`${calc.wTarget}+ to wound (S${weapon.strength} vs T${target.toughness}) · ${(calc.woundProb * 100).toFixed(0)}% chance`}
          />
          <CalcStep
            label="Save Roll"
            value={calc.avgFailedSaves}
            detail={`${saveLabel} save · ${(calc.failSaveProb * 100).toFixed(0)}% fail rate${weapon.ap !== 0 ? ` · AP${weapon.ap} modifier` : ''}`}
          />
          <CalcStep
            label="Damage"
            value={calc.avgDmg}
            detail={`${formatDamage(weapon.damage)} damage per unsaved wound`}
          />

          <div className="calc-result">
            <span className="calc-result-value">{calc.avgTotalDamage.toFixed(2)}</span>
            <div>
              <div className="calc-result-label">Expected wounds dealt</div>
              <div className="text-muted text-sm">
                Target has {target.currentWounds}/{target.wounds}W remaining
              </div>
            </div>
            <button
              className="btn btn-danger"
              style={{ marginLeft: 'auto' }}
              onClick={handleApplyWounds}
              title={`Apply ${Math.round(calc.avgTotalDamage)} wounds to ${target.name}`}
            >
              Apply {Math.round(calc.avgTotalDamage)}W
            </button>
          </div>

          <button
            className="btn btn-sm"
            style={{ marginTop: '8px', width: '100%', justifyContent: 'center', borderColor: 'var(--gold-dim)', color: 'var(--gold)' }}
            onClick={() => setShowModal(true)}
          >
            ⚄ Roll Guide
          </button>

          {calc.avgTotalDamage >= target.currentWounds && (
            <div
              style={{
                marginTop: '8px',
                padding: '6px 10px',
                background: '#3a1010',
                border: '1px solid var(--danger)',
                fontSize: '12px',
                color: 'var(--danger)',
                fontFamily: 'var(--font-head)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              ⚠ Expected to destroy {target.name}
            </div>
          )}
        </>
      )}

      {!attacker && (
        <p className="text-muted text-sm" style={{ padding: '8px 0' }}>
          Select an attacking unit, weapon, and target to see the expected outcome.
        </p>
      )}

      {showModal && attacker && weapon && target && (
        <CombatModal
          attacker={attacker}
          weapon={weapon}
          defender={target}
          phase={currentPhase}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

function formatDamage(d) {
  if (typeof d === 'string') return d.toUpperCase();
  return String(d);
}
