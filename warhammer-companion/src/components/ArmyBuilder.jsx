import { useState } from 'react';
import units, { FACTIONS } from '../data/units.js';

const TYPE_BADGE = {
  Character: 'badge-character',
  Infantry:  'badge-infantry',
  Vehicle:   'badge-vehicle',
  Monster:   'badge-monster',
};

function totalPoints(army) {
  return army.reduce((s, u) => s + u.points, 0);
}

function PlayerPanel({ player, faction, army, confirmed, dispatch }) {
  const [selectedFaction, setSelectedFaction] = useState(faction);
  const roster = units.filter((u) => u.faction === selectedFaction);

  return (
    <div className="army-player-panel">
      <div className="army-player-header">
        <h2 className="heading">Player {player}</h2>
        <div>
          <span className="points-label">Total: </span>
          <span className="points-total">{totalPoints(army)} pts</span>
        </div>
      </div>

      {!confirmed ? (
        <>
          {/* Faction selector */}
          <div style={{ padding: '12px', borderBottom: '1px solid var(--border-sub)' }}>
            <label>Faction</label>
            <select
              value={selectedFaction}
              onChange={(e) => setSelectedFaction(e.target.value)}
            >
              {Object.values(FACTIONS).map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          {/* Unit roster */}
          <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-sub)' }}>
            <div className="panel-header" style={{ marginBottom: '6px', paddingBottom: '6px' }}>
              <h3 className="heading" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Available Units — click to add
              </h3>
            </div>
            <div className="army-roster">
              {roster.map((unit) => (
                <div
                  key={unit.id}
                  className="unit-roster-item"
                  onClick={() => dispatch({ type: 'ADD_UNIT', player, unit })}
                >
                  <span className={`badge ${TYPE_BADGE[unit.type] || 'badge-infantry'}`}>
                    {unit.type}
                  </span>
                  <span className="unit-roster-item-name">{unit.name}</span>
                  <span style={{ fontFamily: 'var(--font-head)', fontSize: '12px', color: 'var(--gold)' }}>
                    {unit.points} pts
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Selected army list */}
          <div style={{ padding: '12px' }}>
            <div className="panel-header" style={{ marginBottom: '6px', paddingBottom: '6px' }}>
              <h3 className="heading" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Army List ({army.length} unit{army.length !== 1 ? 's' : ''})
              </h3>
            </div>
            <div className="army-list" style={{ padding: 0, minHeight: '60px' }}>
              {army.length === 0 && (
                <p className="text-muted text-sm" style={{ padding: '8px 0' }}>
                  No units selected. Click units above to add them.
                </p>
              )}
              {army.map((unit) => (
                <div key={unit.instanceId} className="army-list-item">
                  <span className={`badge ${TYPE_BADGE[unit.type] || 'badge-infantry'}`}>
                    {unit.type.slice(0, 3).toUpperCase()}
                  </span>
                  <span className="army-list-item-name">{unit.name}</span>
                  <span className="army-list-item-pts">{unit.points} pts</span>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() =>
                      dispatch({ type: 'REMOVE_UNIT', player, instanceId: unit.instanceId })
                    }
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '12px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              {army.length > 0 && (
                <button
                  className="btn btn-primary"
                  onClick={() => dispatch({ type: 'CONFIRM_ARMY', player })}
                >
                  Confirm Army
                </button>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Confirmed view */
        <div style={{ padding: '12px' }}>
          <div
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--warning)',
              padding: '8px 12px',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{ color: 'var(--warning)', fontSize: '16px' }}>✔</span>
            <span
              style={{
                fontFamily: 'var(--font-head)',
                fontSize: '13px',
                color: 'var(--warning)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Army Confirmed
            </span>
          </div>
          {army.map((unit) => (
            <div key={unit.instanceId} className="army-list-item">
              <span className={`badge ${TYPE_BADGE[unit.type] || 'badge-infantry'}`}>
                {unit.type.slice(0, 3).toUpperCase()}
              </span>
              <span className="army-list-item-name">{unit.name}</span>
              <span className="army-list-item-pts">{unit.points} pts</span>
            </div>
          ))}
          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn"
              onClick={() => dispatch({ type: 'UNCONFIRM_ARMY', player })}
            >
              Edit Army
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ArmyBuilder({ state, dispatch }) {
  const { player1Army, player2Army, player1Confirmed, player2Confirmed } = state;
  const bothConfirmed = player1Confirmed && player2Confirmed;
  const bothHaveUnits = player1Army.length > 0 && player2Army.length > 0;

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 className="heading" style={{ fontSize: '20px', color: 'var(--gold)', marginBottom: '6px' }}>
          Phase 1 — Army Builder
        </h2>
        <p className="text-muted text-sm">
          Each player selects their units from the roster. Confirm both armies to proceed to mission setup.
          Units may be added multiple times to represent multiple squads or models.
        </p>
      </div>

      <div className="army-builder-grid">
        <PlayerPanel
          player={1}
          faction={FACTIONS.SPACE_MARINES}
          army={player1Army}
          confirmed={player1Confirmed}
          dispatch={dispatch}
        />
        <PlayerPanel
          player={2}
          faction={FACTIONS.CHAOS_SPACE_MARINES}
          army={player2Army}
          confirmed={player2Confirmed}
          dispatch={dispatch}
        />
      </div>

      {bothConfirmed && bothHaveUnits && (
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
          <button
            className="btn btn-primary"
            style={{ fontSize: '15px', padding: '12px 36px' }}
            onClick={() => dispatch({ type: 'ADVANCE_TO_MISSION' })}
          >
            Proceed to Mission Setup →
          </button>
        </div>
      )}

      {!bothConfirmed && (
        <p
          className="text-muted text-sm"
          style={{ textAlign: 'center', marginTop: '16px' }}
        >
          Both players must confirm their armies before proceeding.
        </p>
      )}
    </div>
  );
}
