import { useState } from 'react';
import Tooltip from './Tooltip.jsx';

const TYPE_BADGE = {
  Character: 'badge-character',
  Infantry:  'badge-infantry',
  Vehicle:   'badge-vehicle',
  Monster:   'badge-monster',
};

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

const WEAPON_COL_TIPS = {
  Rng:   'Range — maximum distance the weapon can fire (inches)',
  A:     'Attacks — number of dice rolled when this weapon fires or strikes',
  Skill: 'Hit roll — roll this number or higher on a D6 to score a hit',
  S:     'Strength — compare to enemy Toughness to find the wound roll needed',
  AP:    'Armour Penetration — subtract from the enemy\'s armour save roll',
  D:     'Damage — wounds dealt per successful hit that isn\'t saved',
};

const PHASE_STAT_HIGHLIGHTS = {
  'Movement Phase': ['M'],
  'Shooting Phase': ['BS'],
  'Charge Phase':   ['M'],
  'Fight Phase':    ['WS', 'A'],
  'Command Phase':  ['OC', 'LD'],
  'Morale Phase':   ['LD'],
};

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

// ── UnitHeader ────────────────────────────────────────────────────────────────

function UnitHeader({ unit, expanded, onToggle, activeStratagems }) {
  return (
    <div className="unit-header">
      <span className={`badge ${TYPE_BADGE[unit.type] || 'badge-infantry'}`}>{unit.type}</span>
      <span className="unit-name">{unit.name}</span>
      {unit.invulnSave && (
        <Tooltip text={`Invulnerable save — roll ${unit.invulnSave}+ to ignore wounds regardless of AP`}>
          <span className="badge badge-gold badge-inv" style={{ cursor: 'help' }}>
            {unit.invulnSave}+<span className="abbr">INV</span>
          </span>
        </Tooltip>
      )}
      {unit.battleShocked && <span className="badge badge-shocked">Battle Shocked</span>}
      {activeStratagems.map((s, i) => (
        <span key={i} className="badge badge-stratagem">⚡ {s.badgeLabel}</span>
      ))}
      {unit.destroyed && <span className="badge badge-destroyed">Destroyed</span>}
      <button
        className="unit-expand-btn"
        onClick={onToggle}
        aria-label={expanded ? 'Collapse' : 'Expand'}
      >
        <svg viewBox="0 0 10 6" width="10" height="6" fill="currentColor" aria-hidden="true"
          style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
          <path d="M0 0l5 6 5-6z" />
        </svg>
      </button>
    </div>
  );
}

// ── WoundPips ─────────────────────────────────────────────────────────────────

function WoundPips({ total, current }) {
  const woundPct = current / total;
  const color = woundPct > 0.6 ? 'var(--warning)' : woundPct > 0.3 ? '#c0a030' : 'var(--danger)';
  return (
    <div className="wounds-bar">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`wound-pip${i >= current ? ' lost' : ''}`}
          style={i < current ? { background: color } : {}}
        />
      ))}
    </div>
  );
}

// ── WoundStepper ──────────────────────────────────────────────────────────────

function WoundStepper({ current, total, onDecrement, onIncrement }) {
  return (
    <div className="wound-stepper">
      <button className="wound-stepper__btn" onClick={onDecrement} disabled={current === 0}>−</button>
      <button className="wound-stepper__btn" onClick={onIncrement} disabled={current === total}>+</button>
    </div>
  );
}

// ── ModelRow ──────────────────────────────────────────────────────────────────

function ModelRow({ label, total, current, onDecrement, onIncrement }) {
  return (
    <div className="model-row">
      <span className="model-label">{label}</span>
      <WoundPips total={total} current={current} />
      <WoundStepper
        current={current}
        total={total}
        onDecrement={onDecrement}
        onIncrement={onIncrement}
      />
    </div>
  );
}

// ── ModelList ─────────────────────────────────────────────────────────────────

function ModelList({ unit, dispatch }) {
  if (unit.destroyed) return null;
  return (
    <div className="model-list">
      <ModelRow
        label={unit.name.toUpperCase()}
        total={unit.wounds}
        current={unit.currentWounds}
        onDecrement={() => dispatch({ type: 'SET_WOUNDS', instanceId: unit.instanceId, wounds: unit.currentWounds - 1 })}
        onIncrement={() => dispatch({ type: 'SET_WOUNDS', instanceId: unit.instanceId, wounds: unit.currentWounds + 1 })}
      />
    </div>
  );
}

// ── WeaponStatBlock ───────────────────────────────────────────────────────────

function WeaponStatBlock({ unit, currentPhase }) {
  if (!currentPhase || unit.destroyed) return null;

  const isShoot = currentPhase === 'Shooting Phase';
  const isFight = currentPhase === 'Fight Phase';

  if (!isShoot && !isFight) return null;

  const weapons = isShoot
    ? unit.weapons.filter((w) => w.type === 'ranged')
    : unit.weapons.filter((w) => w.type === 'melee');

  const skill = isShoot ? unit.ballisticSkill : unit.weaponSkill;
  const hitLabel = `HIT ON ${skill}+`;

  if (weapons.length === 0) return (
    <div className="weapon-stat-block weapon-stat-block--empty">
      No {isShoot ? 'ranged' : 'melee'} weapons
    </div>
  );

  return (
    <div className="weapon-stat-block">
      <span className="weapon-stat-hit">{hitLabel}</span>
      <span className="weapon-stat-names">
        {weapons.map((w, i) => (
          <span key={w.name}>
            {i > 0 && <span className="weapon-sep"> · </span>}
            {w.name}
          </span>
        ))}
      </span>
    </div>
  );
}

// ── Movement / Charge / Command hints ────────────────────────────────────────

function PhaseHint({ unit, currentPhase }) {
  if (!currentPhase || unit.destroyed) return null;

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
          <Tooltip text="Leadership — if this unit fails a Battle Shock test it gets the Battle Shocked condition">
            <span className="abbr">LD</span>
          </Tooltip>
          {' '}{unit.leadership}+ morale
        </span>
      </div>
    );
  }

  return null;
}

// ── UnitCard ──────────────────────────────────────────────────────────────────

export default function UnitCard({ unit, dispatch, isMoralePhase = false, currentPhase = null, activeStratagems = [] }) {
  const [expanded, setExpanded] = useState(false);

  const highlightedStats = PHASE_STAT_HIGHLIGHTS[currentPhase] || [];

  function weaponRowClass(w) {
    if (currentPhase === 'Shooting Phase' && w.type === 'melee') return 'weapon-row-dim';
    if (currentPhase === 'Fight Phase'    && w.type === 'ranged') return 'weapon-row-dim';
    if (currentPhase === 'Shooting Phase' && w.type === 'ranged') return 'weapon-row-highlight';
    if (currentPhase === 'Fight Phase'    && w.type === 'melee')  return 'weapon-row-highlight';
    return '';
  }

  return (
    <div className={`unit-card${unit.destroyed ? ' destroyed' : ''}`}>
      <UnitHeader
        unit={unit}
        expanded={expanded}
        onToggle={() => setExpanded((v) => !v)}
        activeStratagems={activeStratagems}
      />

      <ModelList unit={unit} dispatch={dispatch} />

      <WeaponStatBlock unit={unit} currentPhase={currentPhase} />

      <PhaseHint unit={unit} currentPhase={currentPhase} />

      {/* Battle Shock toggle — Command Phase only */}
      {isMoralePhase && !unit.destroyed && (
        <div style={{ marginTop: '8px' }}>
          <button
            className={`btn btn-sm${unit.battleShocked ? ' btn-danger' : ''}`}
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => dispatch({ type: 'SET_BATTLE_SHOCKED', instanceId: unit.instanceId, battleShocked: !unit.battleShocked })}
          >
            {unit.battleShocked ? '✕ Remove Battle Shock' : '⚡ Mark Battle Shocked'}
          </button>
        </div>
      )}

      {expanded && (
        <div style={{ marginTop: '8px' }}>
          <hr className="divider" />

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

          <div style={{ marginTop: '6px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {unit.keywords.map((kw) => (
              <span key={kw} style={{ fontFamily: 'var(--font-head)', fontSize: '10px', color: 'var(--text-muted)', background: 'var(--surface-2)', border: '1px solid var(--border-sub)', padding: '1px 5px', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {kw}
              </span>
            ))}
          </div>

          {/* Model list */}
          {unit.modelCount > 0 && (
            <div style={{ marginTop: '8px' }}>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                Models ({unit.modelCount})
              </div>
              <ModelList modelCount={unit.modelCount} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
