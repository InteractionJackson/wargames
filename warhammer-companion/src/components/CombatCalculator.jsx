import { useState, useMemo } from 'react';

// Standard 40k 10th edition wound roll table
function woundRoll(str, toughness) {
  if (str >= toughness * 2) return 2;
  if (str > toughness) return 3;
  if (str === toughness) return 4;
  if (str * 2 <= toughness) return 6;
  return 5;
}

function prob(target) {
  if (target <= 1) return 1;
  if (target >= 7) return 0;
  return (7 - target) / 6;
}

function avgDiceValue(val) {
  if (typeof val === 'number') return val;
  const s = String(val).toLowerCase().replace(/\s/g, '');
  const m = s.match(/^(\d*)(d\d+)([+-]\d+)?$/);
  if (!m) return parseFloat(s) || 0;
  const num = m[1] ? parseInt(m[1], 10) : 1;
  const sides = parseInt(m[2].slice(1), 10);
  const bonus = m[3] ? parseInt(m[3], 10) : 0;
  return num * ((sides + 1) / 2) + bonus;
}

function formatVal(val) {
  if (typeof val === 'string') return val.toUpperCase();
  return String(val);
}

// Visual roll chain chip at the top
function RollChain({ items }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', margin: '10px 0 14px' }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{
            background: 'var(--surface-2)',
            border: `1px solid ${item.highlight ? 'var(--gold)' : 'var(--border-em)'}`,
            padding: '4px 10px',
            borderRadius: '2px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minWidth: '52px',
          }}>
            <span style={{ fontFamily: 'var(--font-head)', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</span>
            <span style={{ fontFamily: 'var(--font-head)', fontSize: '18px', color: item.highlight ? 'var(--gold)' : 'var(--white)', fontWeight: 700, lineHeight: 1.2 }}>{item.roll}</span>
            {item.sub && <span style={{ fontFamily: 'var(--font-body)', fontSize: '9px', color: 'var(--text-muted)', marginTop: '1px' }}>{item.sub}</span>}
          </div>
          {i < items.length - 1 && (
            <span style={{ color: 'var(--border-em)', fontSize: '12px' }}>→</span>
          )}
        </div>
      ))}
    </div>
  );
}

// Individual breakdown row
function CalcRow({ label, roll, rollSub, avg, detail, faded }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '110px 70px 1fr',
      gap: '8px',
      alignItems: 'center',
      padding: '6px 0',
      borderBottom: '1px solid var(--border-sub)',
      opacity: faded ? 0.5 : 1,
    }}>
      <span style={{ fontFamily: 'var(--font-head)', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <span style={{ fontFamily: 'var(--font-head)', fontSize: '15px', color: 'var(--white)', fontWeight: 700 }}>{roll}</span>
        {rollSub && <span style={{ fontFamily: 'var(--font-body)', fontSize: '9px', color: 'var(--text-muted)' }}>{rollSub}</span>}
      </div>
      <div>
        <span style={{ fontFamily: 'var(--font-head)', fontSize: '12px', color: 'var(--gold)' }}>~{typeof avg === 'number' ? avg.toFixed(2) : avg}</span>
        {detail && <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--text-muted)', marginLeft: '6px' }}>{detail}</span>}
      </div>
    </div>
  );
}

export default function CombatCalculator({ battleUnits, dispatch, player }) {
  const [attackerId, setAttackerId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [weaponIdx, setWeaponIdx] = useState(0);

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

    // AP is stored as a negative number (e.g. -1, -2) or 0
    const apVal = weapon.ap; // e.g. -1
    const baseSave = target.save;
    const modifiedSave = baseSave - apVal; // subtracting a negative increases the target number
    const invuln = target.invulnSave;
    // Lower number = better save; pick whichever is better for the defender
    const effectiveSave = invuln ? Math.min(modifiedSave, invuln) : modifiedSave;
    const clampedSave = Math.max(2, effectiveSave);
    const saveImpossible = effectiveSave > 6;
    const saveProb = saveImpossible ? 0 : prob(clampedSave);
    const failSaveProb = 1 - saveProb;
    const avgFailedSaves = avgWounds * failSaveProb;

    const avgDmg = avgDiceValue(weapon.damage);
    const avgTotalDamage = avgFailedSaves * avgDmg;

    const usingInvuln = invuln && invuln <= modifiedSave;

    return {
      avgAttacks, hitTarget, hitProb, avgHits,
      wTarget, woundProb, avgWounds,
      baseSave, apVal, modifiedSave, invuln, usingInvuln,
      effectiveSave: clampedSave, saveImpossible,
      failSaveProb, avgFailedSaves,
      avgDmg, avgTotalDamage,
    };
  }, [attacker, target, weapon]);

  function handleApplyWounds() {
    if (!calc || !targetId) return;
    const wounds = Math.round(calc.avgTotalDamage);
    if (wounds > 0) {
      dispatch({ type: 'APPLY_WOUNDS', instanceId: targetId, woundsToApply: wounds });
    }
  }

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
            onChange={(e) => { setAttackerId(e.target.value); setWeaponIdx(0); }}
          >
            <option value="">— Select unit —</option>
            {attackerUnits.map((u) => (
              <option key={u.instanceId} value={u.instanceId}>{u.name}</option>
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
                  <option key={i} value={i}>{w.name} ({w.type})</option>
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
              <option key={u.instanceId} value={u.instanceId}>{u.name} ({u.currentWounds}/{u.wounds}W)</option>
            ))}
          </select>
        </div>
      </div>

      {!attacker && (
        <p className="text-muted text-sm" style={{ padding: '8px 0' }}>
          Select an attacking unit, weapon, and target to see the expected outcome.
        </p>
      )}

      {calc && (
        <>
          {/* Visual roll chain */}
          <RollChain items={[
            { label: 'Hit', roll: `${calc.hitTarget}+`, sub: `BS${calc.hitTarget}`, highlight: true },
            { label: 'Wound', roll: `${calc.wTarget}+`, sub: `S${weapon.strength} v T${target.toughness}`, highlight: true },
            {
              label: 'Save',
              roll: calc.saveImpossible ? 'None' : `${calc.effectiveSave}+`,
              sub: calc.usingInvuln ? 'invuln' : calc.apVal !== 0 ? `AP${calc.apVal}` : 'armour',
              highlight: true,
            },
            { label: 'Damage', roll: formatVal(weapon.damage), sub: `avg ${calc.avgDmg.toFixed(1)}`, highlight: true },
          ]} />

          {/* Step-by-step breakdown */}
          <CalcRow
            label="Attacks"
            roll={formatVal(weapon.attacks)}
            rollSub={`avg ${calc.avgAttacks.toFixed(1)}`}
            avg={calc.avgAttacks}
            detail="total dice rolled"
          />
          <CalcRow
            label="Hit Roll"
            roll={`${calc.hitTarget}+`}
            rollSub={`${(calc.hitProb * 100).toFixed(0)}% chance`}
            avg={calc.avgHits}
            detail={`${calc.avgAttacks.toFixed(2)} attacks × ${(calc.hitProb * 100).toFixed(0)}%`}
          />
          <CalcRow
            label="Wound Roll"
            roll={`${calc.wTarget}+`}
            rollSub={`S${weapon.strength} vs T${target.toughness}`}
            avg={calc.avgWounds}
            detail={`${calc.avgHits.toFixed(2)} hits × ${(calc.woundProb * 100).toFixed(0)}%`}
          />

          {/* Save breakdown — show the AP maths explicitly */}
          <div style={{
            padding: '6px 0',
            borderBottom: '1px solid var(--border-sub)',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '110px 70px 1fr', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-head)', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Save Roll</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontFamily: 'var(--font-head)', fontSize: '15px', color: calc.saveImpossible ? 'var(--danger)' : 'var(--white)', fontWeight: 700 }}>
                  {calc.saveImpossible ? 'No save' : `${calc.effectiveSave}+`}
                </span>
                {calc.usingInvuln && (
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '9px', color: 'var(--gold)' }}>using invuln</span>
                )}
              </div>
              <div>
                <span style={{ fontFamily: 'var(--font-head)', fontSize: '12px', color: 'var(--gold)' }}>~{calc.avgFailedSaves.toFixed(2)}</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--text-muted)', marginLeft: '6px' }}>unsaved wounds</span>
              </div>
            </div>
            {/* AP maths */}
            <div style={{ marginTop: '4px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', paddingLeft: '118px' }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--text-muted)' }}>
                Armour {calc.baseSave}+
                {calc.apVal !== 0 && (
                  <> → AP{calc.apVal} → <span style={{ color: calc.modifiedSave > 6 ? 'var(--danger)' : 'var(--text)' }}>{calc.modifiedSave > 6 ? 'no save' : `${calc.modifiedSave}+`}</span></>
                )}
                {calc.invuln && (
                  <> · Invuln {calc.invuln}+ {calc.usingInvuln ? <span style={{ color: 'var(--gold)' }}>(better — used)</span> : '(worse — ignored)'}</>
                )}
              </span>
            </div>
          </div>

          <CalcRow
            label="Damage"
            roll={formatVal(weapon.damage)}
            rollSub={`avg ${calc.avgDmg.toFixed(1)} per hit`}
            avg={calc.avgTotalDamage}
            detail={`${calc.avgFailedSaves.toFixed(2)} unsaved × ${calc.avgDmg.toFixed(2)}`}
          />

          {/* Result */}
          <div className="calc-result" style={{ marginTop: '10px' }}>
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

          {calc.avgTotalDamage >= target.currentWounds && (
            <div style={{
              marginTop: '8px',
              padding: '6px 10px',
              background: '#3a1010',
              border: '1px solid var(--danger)',
              fontSize: '12px',
              color: 'var(--danger)',
              fontFamily: 'var(--font-head)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}>
              ⚠ Expected to destroy {target.name}
            </div>
          )}
        </>
      )}
    </div>
  );
}
