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
        <div className="army-player-header__identity">
          <svg className="army-player-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
          <h2 className="heading">Player {player}</h2>
        </div>
        <span className="points-total">{totalPoints(army)} pts</span>
      </div>

      {!confirmed ? (
        <>
          <div className="army-section">
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

          <div className="army-section army-section--units">
            <div className="army-section__label">Available units</div>
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
                  <span className="unit-roster-item-pts">{unit.points} pts</span>
                </div>
              ))}
            </div>
          </div>

          <div className="army-section">
            <div className="army-section__label">
              Army list
              {army.length === 0 && (
                <span className="army-section__sublabel"> — no units selected</span>
              )}
            </div>
            <div className="army-list" style={{ padding: 0, minHeight: '54px' }}>
              {army.length === 0 && (
                <div className="army-empty-state">
                  No units selected
                </div>
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

            {army.length > 0 && !confirmed && (
              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => dispatch({ type: 'CONFIRM_ARMY', player })}
                >
                  Confirm Army
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="army-section">
          <div className="army-confirmed-badge">
            <span>✔</span> Army Confirmed
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
    <div className="phase-page">
      <div className="phase-page__header">
        <div className="phase-page__label">Phase 1</div>
        <h2 className="phase-page__title heading">Army builder</h2>
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

      <div className="phase-page__footer">
        {!bothConfirmed && (
          <span className="text-muted text-sm">Both players must confirm their armies before proceeding.</span>
        )}
        {bothConfirmed && bothHaveUnits && (
          <button
            className="btn btn-primary btn-next"
            onClick={() => dispatch({ type: 'ADVANCE_TO_MISSION' })}
          >
            Mission setup
            <svg viewBox="0 0 12 10" fill="currentColor" width="12" height="10">
              <path d="M7 0l5 5-5 5-1.4-1.4L8.2 6H0V4h8.2L5.6 1.4z"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
