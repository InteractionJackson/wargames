import { useState } from 'react';

const TYPE_BADGE = {
  Character: 'badge-character',
  Infantry:  'badge-infantry',
  Vehicle:   'badge-vehicle',
  Monster:   'badge-monster',
};

function formatStat(val) {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return String(val);
    return val.toFixed(1);
  }
  return String(val);
}

function formatDamage(d) {
  if (typeof d === 'string') return d.toUpperCase();
  return String(d);
}

export default function UnitCard({ unit, dispatch, isMoralePhase = false }) {
  const [expanded, setExpanded] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);

  const woundPct = unit.currentWounds / unit.wounds;
  const woundColor =
    woundPct > 0.6 ? 'var(--warning)' : woundPct > 0.3 ? '#c0a030' : 'var(--danger)';

  function handleWoundChange(delta) {
    dispatch({
      type: 'SET_WOUNDS',
      instanceId: unit.instanceId,
      wounds: unit.currentWounds + delta,
    });
  }

  function handleDirectWound(e) {
    const v = parseInt(e.target.value, 10);
    if (!isNaN(v)) {
      dispatch({ type: 'SET_WOUNDS', instanceId: unit.instanceId, wounds: v });
    }
  }

  return (
    <div className={`unit-card${unit.destroyed ? ' destroyed' : ''}`}>
      {/* Header row */}
      <div className="unit-card-header">
        <span className={`badge ${TYPE_BADGE[unit.type] || 'badge-infantry'}`}>
          {unit.type}
        </span>
        <span className="unit-card-name">{unit.name}</span>
        {unit.invulnSave && (
          <span className="badge badge-gold" title="Invulnerable save">
            {unit.invulnSave}+INV
          </span>
        )}
        {unit.battleShocked && <span className="badge badge-shocked">Battle Shocked</span>}
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
          <span
            className="text-sm"
            style={{ fontFamily: 'var(--font-head)', color: 'var(--text-muted)', minWidth: '48px', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.05em' }}
          >
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
            <button
              className="btn btn-sm btn-icon"
              onClick={() => handleWoundChange(-1)}
              disabled={unit.currentWounds === 0}
            >
              −
            </button>
            <input
              type="number"
              min={0}
              max={unit.wounds}
              value={unit.currentWounds}
              onChange={handleDirectWound}
              style={{ width: '44px', textAlign: 'center', padding: '2px 4px' }}
            />
            <button
              className="btn btn-sm btn-icon"
              onClick={() => handleWoundChange(1)}
              disabled={unit.currentWounds === unit.wounds}
            >
              +
            </button>
          </div>
          <span
            style={{
              fontFamily: 'var(--font-head)',
              fontSize: '11px',
              color: woundColor,
            }}
          >
            {unit.currentWounds}/{unit.wounds}W
          </span>
        </div>
      )}

      {/* Notes */}
      <div>
        {editingNotes ? (
          <textarea
            value={unit.notes}
            onChange={(e) =>
              dispatch({ type: 'SET_NOTES', instanceId: unit.instanceId, notes: e.target.value })
            }
            onBlur={() => setEditingNotes(false)}
            placeholder="Notes (aura effects, mission markers, stratagems…)"
            style={{ fontSize: '12px', minHeight: '48px' }}
            autoFocus
          />
        ) : (
          <div
            onClick={() => setEditingNotes(true)}
            style={{
              padding: '4px 6px',
              background: 'var(--surface-2)',
              border: '1px dashed var(--border-sub)',
              fontSize: '12px',
              color: unit.notes ? 'var(--text)' : 'var(--text-muted)',
              cursor: 'text',
              minHeight: '26px',
            }}
          >
            {unit.notes || 'Click to add notes…'}
          </div>
        )}
      </div>

      {/* Battle Shock toggle — Morale Phase only */}
      {isMoralePhase && !unit.destroyed && (
        <div style={{ marginTop: '6px' }}>
          <button
            className={`btn btn-sm${unit.battleShocked ? ' btn-danger' : ''}`}
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() =>
              dispatch({
                type: 'SET_BATTLE_SHOCKED',
                instanceId: unit.instanceId,
                battleShocked: !unit.battleShocked,
              })
            }
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
              { label: 'M', value: `${unit.move}"` },
              { label: 'T', value: unit.toughness },
              { label: 'SV', value: `${unit.save}+` },
              { label: 'W', value: unit.wounds },
              { label: 'LD', value: `${unit.leadership}+` },
              { label: 'OC', value: unit.oc },
              { label: 'A', value: unit.attacks },
              { label: 'WS', value: `${unit.weaponSkill}+` },
              { label: 'BS', value: `${unit.ballisticSkill}+` },
              { label: 'S', value: unit.strength },
            ].map(({ label, value }) => (
              <div key={label} className="stat-cell">
                <span className="stat-cell-label">{label}</span>
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
                <th>Rng</th>
                <th>A</th>
                <th>Skill</th>
                <th>S</th>
                <th>AP</th>
                <th>D</th>
              </tr>
            </thead>
            <tbody>
              {unit.weapons.map((w) => (
                <tr key={w.name}>
                  <td style={{ color: 'var(--white)' }}>{w.name}</td>
                  <td>
                    <span
                      style={{
                        fontSize: '10px',
                        fontFamily: 'var(--font-head)',
                        color: w.type === 'melee' ? '#c07830' : '#6080c0',
                        textTransform: 'uppercase',
                      }}
                    >
                      {w.type}
                    </span>
                  </td>
                  <td>{w.type === 'melee' ? '—' : `${w.range}"`}</td>
                  <td>{typeof w.attacks === 'string' ? w.attacks.toUpperCase() : w.attacks}</td>
                  <td>{w.skill}+</td>
                  <td>{w.strength}</td>
                  <td>{w.ap === 0 ? '0' : w.ap}</td>
                  <td>{formatDamage(w.damage)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Keywords */}
          <div style={{ marginTop: '6px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {unit.keywords.map((kw) => (
              <span
                key={kw}
                style={{
                  fontFamily: 'var(--font-head)',
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border-sub)',
                  padding: '1px 5px',
                  borderRadius: '2px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
