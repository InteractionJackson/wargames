import { useState, useMemo } from 'react';
import Tooltip from './Tooltip.jsx';

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

function DiceGroup({ count, isEstimate }) {
  const n = Math.max(1, Math.round(count));
  const shown = Math.min(n, 10);
  const overflow = n > 10 ? n - 10 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
      <div className="cm-dice-group">
        {Array.from({ length: shown }).map((_, i) => (
          <span key={i} className="cm-die" />
        ))}
        {overflow > 0 && <span className="cm-die-more">+{overflow}</span>}
      </div>
      <span className="cm-dice-label">
        {n} d6{isEstimate ? ' (est.)' : ''}
      </span>
    </div>
  );
}

function RollStep({ label, rollTarget, diceCount, isEstimate, accentColor, tip }) {
  const noSave = rollTarget > 6;
  return (
    <div className="cm-roll-step">
      <div className="cm-roll-step-row">
        <span className="cm-roll-label">{label}</span>
        {isEstimate && <span className="cm-est-tag">est.</span>}
        <Tooltip text={tip}>
          <span className="cm-info-btn">ⓘ</span>
        </Tooltip>
        <span className="cm-roll-spacer" />
        {noSave ? (
          <span className="cm-no-save-tag">No save</span>
        ) : (
          <span className="cm-roll-target" style={{ color: accentColor }}>{rollTarget}+</span>
        )}
      </div>
      {!noSave && <DiceGroup count={diceCount} isEstimate={isEstimate} />}
    </div>
  );
}

export default function CombatModal({ attacker, weapon, defender, phase, onClose }) {
  const [modelCount, setModelCount] = useState(attacker.modelCount ?? 5);
  const [woundsDealt, setWoundsDealt] = useState(0);

  const isShoot = phase === 'Shooting Phase';

  const stats = useMemo(() => {
    const totalAttacks = modelCount * avgDiceValue(weapon.attacks);
    const hitTarget = weapon.skill;
    const estHits = totalAttacks * prob(hitTarget);

    const woundTarget = woundRoll(weapon.strength, defender.toughness);
    const estWounds = estHits * prob(woundTarget);

    const modifiedSave = defender.save - weapon.ap;
    const invuln = defender.invulnSave ?? null;
    const bestSave = invuln != null ? Math.min(modifiedSave, invuln) : modifiedSave;
    const usesInvuln = invuln != null && invuln <= modifiedSave;
    const noSave = bestSave > 6;
    const clampedSave = noSave ? 7 : Math.max(2, bestSave);
    const saveFailProb = noSave ? 1 : 1 - prob(clampedSave);
    const estFailedSaves = estWounds * saveFailProb;

    const fnp = defender.feelNoPain ?? null;

    return {
      totalAttacks,
      hitTarget,
      estHits,
      woundTarget,
      estWounds,
      modifiedSave,
      invuln,
      usesInvuln,
      noSave,
      clampedSave,
      estFailedSaves,
      fnp,
    };
  }, [modelCount, weapon, defender]);

  function woundTip(s, t) {
    if (s >= t * 2) return `Strength ${s} is at least twice Toughness ${t} — you wound on 2+.`;
    if (s > t)      return `Strength ${s} beats Toughness ${t} — you wound on 3+.`;
    if (s === t)    return `Strength ${s} equals Toughness ${t} — you wound on 4+.`;
    if (s * 2 <= t) return `Strength ${s} is half or less of Toughness ${t} — you wound on 6+.`;
    return `Strength ${s} is less than Toughness ${t} — you wound on 5+.`;
  }

  const atkLabel = typeof weapon.attacks === 'string' ? weapon.attacks.toUpperCase() : String(weapon.attacks);
  const dmgLabel = typeof weapon.damage  === 'string' ? weapon.damage.toUpperCase()  : String(weapon.damage);
  const woundPct = defender.wounds > 0 ? woundsDealt / defender.wounds : 0;
  const trackColor = woundPct >= 1 ? 'var(--danger)' : woundPct > 0.5 ? '#c0a030' : 'var(--warning)';

  return (
    <div className="cm-overlay" onClick={onClose}>
      <div className="cm-panel" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="cm-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="cm-phase-tag">{isShoot ? 'Shooting' : 'Fight'}</span>
            <span className="cm-header-title">Roll Guide</span>
          </div>
          <button className="btn btn-sm btn-icon" onClick={onClose}>✕</button>
        </div>

        {/* Units strip */}
        <div className="cm-units-strip">
          <div className="cm-unit-col">
            <div className="cm-unit-faction">{attacker.faction}</div>
            <div className="cm-unit-name">{attacker.name}</div>
            <div className="cm-weapon-name">{weapon.name}</div>
            <div className="cm-unit-stats">
              <span>{isShoot ? 'BS' : 'WS'} {weapon.skill}+</span>
              <span>S{weapon.strength}</span>
              <span>AP{weapon.ap}</span>
              <span>D{dmgLabel}</span>
            </div>
          </div>
          <div className="cm-vs-col">vs</div>
          <div className="cm-unit-col cm-unit-col-right">
            <div className="cm-unit-faction">{defender.faction}</div>
            <div className="cm-unit-name">{defender.name}</div>
            <div className="cm-weapon-name">
              {defender.save}+ save{defender.invulnSave ? ` · ${defender.invulnSave}+ inv` : ''}
            </div>
            <div className="cm-unit-stats">
              <span>T{defender.toughness}</span>
              <span>W{defender.wounds}</span>
              {defender.invulnSave && <span>{defender.invulnSave}+ inv</span>}
              {defender.feelNoPain && <span>FNP {defender.feelNoPain}+</span>}
            </div>
          </div>
        </div>

        <div className="cm-body">

          {/* Model count stepper */}
          <div className="cm-models-bar">
            <span className="cm-bar-label">Models attacking</span>
            <div className="cm-stepper">
              <button
                className="btn btn-sm btn-icon"
                onClick={() => setModelCount((c) => Math.max(1, c - 1))}
                disabled={modelCount === 1}
              >−</button>
              <span className="cm-stepper-val">{modelCount}</span>
              <button
                className="btn btn-sm btn-icon"
                onClick={() => setModelCount((c) => Math.min(30, c + 1))}
                disabled={modelCount === 30}
              >+</button>
            </div>
            <span className="cm-bar-sub">
              {modelCount} × {atkLabel} = ~{Math.round(stats.totalAttacks)} attacks
            </span>
          </div>

          {/* You Roll */}
          <div className="cm-section">You roll</div>

          <RollStep
            label="To Hit"
            rollTarget={stats.hitTarget}
            diceCount={stats.totalAttacks}
            isEstimate={false}
            accentColor="var(--gold)"
            tip={`Roll ${Math.round(stats.totalAttacks)} dice. Each ${stats.hitTarget}+ scores a hit. This comes from the weapon's ${isShoot ? 'Ballistic Skill' : 'Weapon Skill'} of ${weapon.skill}+.`}
          />

          <RollStep
            label="To Wound"
            rollTarget={stats.woundTarget}
            diceCount={stats.estHits}
            isEstimate
            accentColor="var(--warning)"
            tip={`Roll one die per hit (about ${Math.round(stats.estHits)}). ${woundTip(weapon.strength, defender.toughness)}`}
          />

          {/* They Roll */}
          <div className="cm-section">They roll</div>

          {stats.noSave ? (
            <div className="cm-roll-step">
              <div className="cm-roll-step-row">
                <span className="cm-roll-label">Save</span>
                <Tooltip
                  text={`Base armour save is ${defender.save}+. AP${weapon.ap} worsens it by ${Math.abs(weapon.ap)}, giving ${stats.modifiedSave}+. That's above 6, so there's no save to roll.`}
                >
                  <span className="cm-info-btn">ⓘ</span>
                </Tooltip>
                <span className="cm-roll-spacer" />
                <span className="cm-no-save-tag">No save</span>
              </div>
            </div>
          ) : (
            <RollStep
              label={stats.usesInvuln ? 'Save (invuln)' : 'Save'}
              rollTarget={stats.clampedSave}
              diceCount={stats.estWounds}
              isEstimate
              accentColor="var(--text-muted)"
              tip={
                stats.usesInvuln
                  ? `Invulnerable save (${stats.invuln}+) is better than the armour save after AP (${stats.modifiedSave}+), so it's used. AP has no effect on invulnerable saves.`
                  : weapon.ap !== 0
                  ? `Armour save is ${defender.save}+. AP${weapon.ap} changes it to ${stats.modifiedSave}+. Roll one die per wound — a ${stats.clampedSave}+ blocks it.`
                  : `Armour save is ${defender.save}+. This weapon has no AP, so the full save applies. Roll one die per wound — a ${stats.clampedSave}+ blocks it.`
              }
            />
          )}

          {stats.fnp && (
            <RollStep
              label="Feel No Pain"
              rollTarget={stats.fnp}
              diceCount={stats.estFailedSaves}
              isEstimate
              accentColor="#8080e0"
              tip={`After each failed save, roll one die. A ${stats.fnp}+ ignores that wound. This is a special ability this unit has.`}
            />
          )}

          {/* Wounds tracker */}
          <div className="cm-section">Track wounds on this model</div>
          <div className="cm-wounds-track">
            <div className="cm-wounds-track-row">
              <div className="cm-stepper">
                <button
                  className="btn btn-sm btn-icon"
                  onClick={() => setWoundsDealt((w) => Math.max(0, w - 1))}
                  disabled={woundsDealt === 0}
                >−</button>
                <span className="cm-stepper-val">{woundsDealt}</span>
                <button
                  className="btn btn-sm btn-icon"
                  onClick={() => setWoundsDealt((w) => w + 1)}
                >+</button>
              </div>
              <span className="cm-wounds-track-label">
                of {defender.wounds}W — model dies at {defender.wounds}
              </span>
            </div>
            <div className="cm-wounds-progress">
              <div
                className="cm-wounds-fill"
                style={{
                  width: `${Math.min(100, woundPct * 100)}%`,
                  background: trackColor,
                }}
              />
            </div>
            {woundsDealt >= defender.wounds && (
              <div className="cm-destroyed-alert">⚠ Model destroyed</div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
