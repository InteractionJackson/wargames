import { useState } from 'react';
import Tooltip from './Tooltip.jsx';

const TYPE_BADGE = {
  Character: 'badge-character',
  Infantry:  'badge-infantry',
  Vehicle:   'badge-vehicle',
  Monster:   'badge-monster',
};

// Stat labels shown in the expanded block, with beginner-friendly tooltip text
const STAT_TIPS = {
  M:   'Move — how far this unit can move each turn (in inches)',
  T:   'Toughness — how hard the unit is to wound',
  SV:  'Save — roll this or higher to ignore a wound (lower is better)',
  W:   'Wounds — how many hits the unit can take before being destroyed',
  LD:  'Leadership — roll 2D6 equal to or under this to pass morale tests',
  OC:  'Objective Control — counts as this many models when holding an objective',
  A:   'Attacks — number of attack rolls in melee',
  WS:  'Weapon Skill — roll this or higher to hit in melee (lower is better)',
  BS:  'Ballistic Skill — roll this or higher to hit with ranged weapons (lower is better)',
  S:   'Strength — used to calculate wound rolls against enemy Toughness',
};

// Weapon table column tooltips
const WEAPON_COL_TIPS = {
  Rng:   'Range — maximum distance the weapon can fire (inches)',
  A:     'Attacks — number of dice rolled when this weapon fires or strikes',
  Skill: 'Hit roll — roll this number or higher on a D6 to score a hit',
  S:     'Strength — compare to enemy Toughness to find the wound roll needed',
  AP:    'Armour Penetration — subtract from the enemy\'s armour save roll',
  D:     'Damage — wounds dealt per successful hit that isn\'t saved',
};

// Which stat cells to highlight per phase
const PHASE_STAT_HIGHLIGHTS = {
  'Movement Phase': ['M'],
  'Shooting Phase': ['BS'],
  'Charge Phase':   ['M'],
  'Fight Phase':    ['WS', 'A'],
  'Command Phase':  ['OC', 'LD'],
};

// Dice notation tooltip map
const DICE_TIPS = {
  'D3':    'Roll one D6: 1-2 = 1, 3-4 = 2, 5-6 = 3',
  'D6':    'Roll one six-sided die (1–6)',
  '2D6':   'Roll two D6 and add them together (2–12)',
  'D6+1':  'Roll a D6 and add 1 (2–7)',
  'D6+2':  'Roll a D6 and add 2 (3–8)',
  'D6+3':  'Roll a D6 and add 3 (4–9)',
  'D6+6':  'Roll a D6 and add 6 (7–12)',
  'D3+1':  'Roll a D3 and add 1 (2–4)',
};

function formatStat(val) {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return String(val);
    return val.toFixed(1);
  }
  return String(val);
}

function DiceValue({ val }) {
  const str = typeof val === 'string' ? val.toUpperCase() : String(val);
  const tip = DICE_TIPS[str];
  if (tip) return <Tooltip text={tip}><span className="abbr">{str}</span></Tooltip>;
  return <>{str}</>;
}

function PhaseHint({ unit, currentPhase, isCommandPhase }) {
  if (!currentPhase || unit.destroyed) return null;

  const ranged = unit.weapons.filter((w) => w.type === 'ranged');
  const melee  = unit.weapons.filter((w) => w.type === 'melee');
  const belowHalf = unit.currentWounds * 2 < unit.wounds;

  if (currentPhase === 'Movement Phase') {
    return (
      <div className="phase-hint">
        <span className="phase-hint-label">Move</span>
        <span className="phase-hint-value">{unit.move}"</span>
        <span className="phase-hint-sub">
          Advance: +<Tooltip text="Roll one D6 and add the result to your Move distance this turn"><span className="abbr">D6</span></Tooltip>"
          {' '}· Fall Back: full Move, can't shoot
        </span>
      </div>
    );
  }

  if (currentPhase === 'Shooting Phase') {
    if (ranged.length === 0) return (
      <div className="phase-hint phase-hint-dim">No ranged weapons</div>
    );
    return (
      <div className="phase-hint">
        <span className="phase-hint-label">Hit on</span>
        <span className="phase-hint-value">{unit.ballisticSkill}+</span>
        <span className="phase-hint-sub">
          {ranged.map((w) => w.name).join(' · ')}
        </span>
      </div>
    );
  }

  if (currentPhase === 'Charge Phase') {
    return (
      <div className="phase-hint">
        <span className="phase-hint-label">Charge roll</span>
        <span className="phase-hint-value">
          <Tooltip text="Roll two D6 and add them together — the result must equal or beat the distance to the target unit">
            <span className="abbr">2D6</span>
          </Tooltip>"
        </span>
        <span className="phase-hint-sub">Must beat the gap · Move up to {unit.move}" if failed</span>
      </div>
    );
  }

  if (currentPhase === 'Fight Phase') {
    if (melee.length === 0) return (
      <div className="phase-hint phase-hint-dim">No melee weapons</div>
    );
    return (
      <div className="phase-hint">
        <span className="phase-hint-label">Hit on</span>
        <span className="phase-hint-value">{unit.weaponSkill}+</span>
        <span className="phase-hint-sub">
          {melee.map((w) => w.name).join(' · ')}
        </span>
      </div>
    );
  }

  if (currentPhase === 'Command Phase') {
    return (
      <div className="phase-hint">
        <span className="phase-hint-label">
          <Tooltip text="Objective Control — counts as this many models when contesting an objective marker">
            <span className="abbr">OC</span>
          </Tooltip>
        </span>
        <span className="phase-hint-value">{unit.oc}</span>
        <span className="phase-hint-sub">
          {isCommandPhase && belowHalf ? (
            <span style={{ color: 'var(--danger)', fontWeight: 700 }}>
              ⚠ Below half strength — Battle Shock test required ({unit.leadership}+)
            </span>
          ) : (
            <>
              <Tooltip text="Leadership — if this unit fails a Battle Shock test it gets the Battle Shocked condition">
                <span className="abbr">LD</span>
              </Tooltip>
              {' '}{unit.leadership}+ morale
            </>
          )}
        </span>
      </div>
    );
  }

  return null;
}

export default function UnitCard({ unit, dispatch, isCommandPhase = false, currentPhase = null, activeStratagems = [] }) {
  const [expanded, setExpanded] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);

  const woundPct = unit.currentWounds / unit.wounds;
  const woundColor =
    woundPct > 0.6 ? 'var(--warning)' : woundPct > 0.3 ? '#c0a030' : 'var(--danger)';

  const highlightedStats = PHASE_STAT_HIGHLIGHTS[currentPhase] || [];

  function handleWoundChange(delta) {
    dispatch({ type: 'SET_WOUNDS', instanceId: unit.instanceId, wounds: unit.currentWounds + delta });
  }

  function handleDirectWound(e) {
    const v = parseInt(e.target.value, 10);
    if (!isNaN(v)) dispatch({ type: 'SET_WOUNDS', instanceId: unit.instanceId, wounds: v });
  }

  // In shooting/fight phases, dim weapons that aren't relevant to the phase
  function weaponRowClass(w) {
    if (currentPhase === 'Shooting Phase' && w.type === 'melee') return 'weapon-row-dim';
    if (currentPhase === 'Fight Phase'    && w.type === 'ranged') return 'weapon-row-dim';
    if (currentPhase === 'Shooting Phase' && w.type === 'ranged') return 'weapon-row-highlight';
    if (currentPhase === 'Fight Phase'    && w.type === 'melee')  return 'weapon-row-highlight';
    return '';
  }

  return (
    <div className={`unit-card${unit.destroyed ? ' destroyed' : ''}`}>
      {/* Header row */}
      <div className="unit-card-header">
        <span className={`badge ${TYPE_BADGE[unit.type] || 'badge-infantry'}`}>{unit.type}</span>
        <span className="unit-card-name">{unit.name}</span>
        {unit.invulnSave && (
          <Tooltip text={`Invulnerable save — roll ${unit.invulnSave}+ to ignore wounds regardless of AP`}>
            <span className="badge badge-gold" style={{ cursor: 'help' }}>{unit.invulnSave}+<span className="abbr">INV</span></span>
          </Tooltip>
        )}
        {unit.battleShocked && <span className="badge badge-shocked">Battle Shocked</span>}
        {activeStratagems.map((s, i) => (
          <span key={i} className="badge badge-stratagem">⚡ {s.badgeLabel}</span>
        ))}
        {unit.destroyed && <span className="badge badge-destroyed">Destroyed</span>}
        <button
          className="btn btn-sm btn-icon"
          style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? '▲' : '▼'}
        </button>
      </div>

      {/* Wounds bar */}
      {!unit.destroyed && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span className="text-sm" style={{ fontFamily: 'var(--font-head)', color: 'var(--text-muted)', minWidth: '48px', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.05em' }}>
            Wounds
          </span>
          <div className="wounds-bar">
            {Array.from({ length: unit.wounds }).map((_, i) => (
              <div
                key={i}
                className={`wound-pip${i >= unit.currentWounds ? ' lost' : ''}`}
                style={i < unit.currentWounds ? { background: woundColor } : {}}
              />
            ))}
          </div>
          <div className="wounds-control">
            <button className="btn btn-sm btn-icon" onClick={() => handleWoundChange(-1)} disabled={unit.currentWounds === 0}>−</button>
            <input type="number" min={0} max={unit.wounds} value={unit.currentWounds} onChange={handleDirectWound} style={{ width: '44px', textAlign: 'center', padding: '2px 4px' }} />
            <button className="btn btn-sm btn-icon" onClick={() => handleWoundChange(1)} disabled={unit.currentWounds === unit.wounds}>+</button>
          </div>
          <span style={{ fontFamily: 'var(--font-head)', fontSize: '11px', color: woundColor }}>
            {unit.currentWounds}/{unit.wounds}W
          </span>
        </div>
      )}

      {/* Phase hint — visible without expanding */}
      <PhaseHint unit={unit} currentPhase={currentPhase} isCommandPhase={isCommandPhase} />

      {/* Notes */}
      <div>
        {editingNotes ? (
          <textarea
            value={unit.notes}
            onChange={(e) => dispatch({ type: 'SET_NOTES', instanceId: unit.instanceId, notes: e.target.value })}
            onBlur={() => setEditingNotes(false)}
            placeholder="Notes (aura effects, mission markers, stratagems…)"
            style={{ fontSize: '12px', minHeight: '48px' }}
            autoFocus
          />
        ) : (
          <div
            onClick={() => setEditingNotes(true)}
            style={{ padding: '4px 6px', background: 'var(--surface-2)', border: '1px dashed var(--border-sub)', fontSize: '12px', color: unit.notes ? 'var(--text)' : 'var(--text-muted)', cursor: 'text', minHeight: '26px' }}
          >
            {unit.notes || 'Click to add notes…'}
          </div>
        )}
      </div>

      {/* Battle Shock toggle — Command Phase, skip the very first Command Phase */}
      {isCommandPhase && !unit.destroyed && (
        <div style={{ marginTop: '6px' }}>
          <button
            className={`btn btn-sm${unit.battleShocked ? ' btn-danger' : ''}`}
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => dispatch({ type: 'SET_BATTLE_SHOCKED', instanceId: unit.instanceId, battleShocked: !unit.battleShocked })}
          >
            {unit.battleShocked ? '✕ Remove Battle Shock' : '⚡ Mark Battle Shocked'}
          </button>
        </div>
      )}

      {/* Expanded stat block */}
      {expanded && (
        <div style={{ marginTop: '8px' }}>
          <hr className="divider" />

          {/* Stat row */}
          <div className="stat-row">
            {[
              { label: 'M',  value: `${unit.move}"` },
              { label: 'T',  value: unit.toughness },
              { label: 'SV', value: `${unit.save}+` },
              { label: 'W',  value: unit.wounds },
              { label: 'LD', value: `${unit.leadership}+` },
              { label: 'OC', value: unit.oc },
              { label: 'A',  value: unit.attacks },
              { label: 'WS', value: `${unit.weaponSkill}+` },
              { label: 'BS', value: `${unit.ballisticSkill}+` },
              { label: 'S',  value: unit.strength },
            ].map(({ label, value }) => (
              <div key={label} className={`stat-cell${highlightedStats.includes(label) ? ' stat-cell-highlight' : ''}`}>
                <span className="stat-cell-label">
                  <Tooltip text={STAT_TIPS[label]}><span className="abbr">{label}</span></Tooltip>
                </span>
                <span className="stat-cell-value">{formatStat(value)}</span>
              </div>
            ))}
          </div>

          {/* Weapons */}
          <table className="weapon-table">
            <thead>
              <tr>
                <th>Weapon</th>
                <th>Type</th>
                {(['Rng', 'A', 'Skill', 'S', 'AP', 'D']).map((col) => (
                  <th key={col}>
                    <Tooltip text={WEAPON_COL_TIPS[col]}><span className="abbr">{col}</span></Tooltip>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {unit.weapons.map((w) => (
                <tr key={w.name} className={weaponRowClass(w)}>
                  <td style={{ color: 'var(--white)' }}>{w.name}</td>
                  <td>
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-head)', color: w.type === 'melee' ? '#c07830' : '#6080c0', textTransform: 'uppercase' }}>
                      {w.type}
                    </span>
                  </td>
                  <td>{w.type === 'melee' ? '—' : `${w.range}"`}</td>
                  <td><DiceValue val={w.attacks} /></td>
                  <td>{w.skill}+</td>
                  <td>{w.strength}</td>
                  <td>{w.ap === 0 ? '0' : w.ap}</td>
                  <td><DiceValue val={w.damage} /></td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Keywords */}
          <div style={{ marginTop: '6px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {unit.keywords.map((kw) => (
              <span key={kw} style={{ fontFamily: 'var(--font-head)', fontSize: '10px', color: 'var(--text-muted)', background: 'var(--surface-2)', border: '1px solid var(--border-sub)', padding: '1px 5px', borderRadius: '2px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
