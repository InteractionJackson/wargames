import { useState } from 'react';
import { PHASES } from '../state/gameReducer.js';
import PhaseGuide from './PhaseGuide.jsx';
import UnitCard from './UnitCard.jsx';
import CombatCalculator from './CombatCalculator.jsx';
import StratagemPanel from './StratagemPanel.jsx';

const CALC_PHASES = ['Shooting Phase', 'Fight Phase'];

function CpDisplay({ player, cp, dispatch, color }) {
  const val = cp[player] || 0;
  return (
    <div className="cp-display" style={{ borderColor: color }}>
      <span className="cp-label">P{player} CP</span>
      <button
        className="btn btn-sm btn-icon cp-btn"
        onClick={() => dispatch({ type: 'ADJUST_CP', player, delta: -1 })}
        disabled={val === 0}
      >−</button>
      <span className="cp-value" style={{ color }}>{val}</span>
      <button
        className="btn btn-sm btn-icon cp-btn"
        onClick={() => dispatch({ type: 'ADJUST_CP', player, delta: 1 })}
      >+</button>
    </div>
  );
}

export default function BattleTracker({ state, dispatch }) {
  const { battleUnits, currentRound, currentTurn, currentPhaseIndex, totalRounds, cp, activeStratagems } = state;
  const [showDestroyed, setShowDestroyed] = useState(false);
  const [showStratagems, setShowStratagems] = useState(false);

  const currentPhase = PHASES[currentPhaseIndex];
  // 11th ed: battle-shock is checked during the Command Phase (no separate Morale Phase).
  const isMoralePhase = currentPhase === 'Command Phase';
  const showCalc = CALC_PHASES.includes(currentPhase);

  const allUnits = Object.values(battleUnits);
  const p1Active = allUnits.filter((u) => u.owner === 1 && !u.destroyed);
  const p1Dead   = allUnits.filter((u) => u.owner === 1 && u.destroyed);
  const p2Active = allUnits.filter((u) => u.owner === 2 && !u.destroyed);
  const p2Dead   = allUnits.filter((u) => u.owner === 2 && u.destroyed);

  const isLastPhase = currentPhaseIndex === PHASES.length - 1;
  const isLastRound = currentRound === totalRounds;
  const activeColor = currentTurn === 1 ? 'var(--warning)' : 'var(--danger)';

  function nextButtonLabel() {
    if (!isLastPhase) return 'Next Phase →';
    if (currentTurn === 1) return "Begin Player 2's Turn →";
    if (isLastRound) return 'End Game →';
    return `Begin Round ${currentRound + 1} →`;
  }

  return (
    <div>
      {/* Phase Banner */}
      <div className="phase-banner" style={{ borderColor: activeColor }}>
        <div>
          <div className="round-label">Battle Round</div>
          <div className="round-num" style={{ color: activeColor }}>{currentRound}</div>
          <div className="round-label">of {totalRounds}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: '14px', color: activeColor, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2px', fontWeight: 700 }}>
            Player {currentTurn}'s Turn
          </div>
          <div className="phase-name">{currentPhase}</div>
          <div style={{ display: 'flex', gap: '4px', marginTop: '8px', flexWrap: 'wrap' }}>
            {PHASES.map((ph, i) => (
              <span
                key={ph}
                style={{
                  fontFamily: 'var(--font-head)',
                  fontSize: '10px',
                  padding: '2px 7px',
                  borderRadius: '2px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  background: i === currentPhaseIndex ? activeColor : 'var(--surface-2)',
                  color: i === currentPhaseIndex ? '#1a1208' : i < currentPhaseIndex ? 'var(--border-em)' : 'var(--text-muted)',
                  border: `1px solid ${i === currentPhaseIndex ? activeColor : 'var(--border-sub)'}`,
                }}
              >
                {ph.replace(' Phase', '')}
              </span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
          <button className="btn btn-primary" onClick={() => dispatch({ type: 'NEXT_PHASE' })}>
            {nextButtonLabel()}
          </button>
          <button className="btn btn-sm btn-danger" onClick={() => dispatch({ type: 'END_GAME' })}>
            End Game Early
          </button>
        </div>
      </div>

      {/* CP Bar — always visible */}
      <div className="cp-bar">
        <CpDisplay player={1} cp={cp} dispatch={dispatch} color="var(--warning)" />
        <button
          className={`btn btn-sm cp-stratagem-btn${activeStratagems.length > 0 ? ' has-active' : ''}`}
          onClick={() => setShowStratagems(true)}
        >
          ⚡ Stratagems
          {activeStratagems.length > 0 && (
            <span className="cp-active-badge">{activeStratagems.length}</span>
          )}
        </button>
        <CpDisplay player={2} cp={cp} dispatch={dispatch} color="var(--danger)" />
      </div>

      {/* Phase Guide */}
      <PhaseGuide phaseIndex={currentPhaseIndex} />

      {/* Unit Battlefield Grid */}
      <div className="battle-grid">
        {[1, 2].map((player) => {
          const active = player === 1 ? p1Active : p2Active;
          const dead   = player === 1 ? p1Dead   : p2Dead;
          const color  = player === 1 ? 'var(--warning)' : 'var(--danger)';
          const isActive = currentTurn === player;
          // Stratagems affecting units owned by this player
          const unitStratagems = activeStratagems.filter((s) => s.owner === player && s.instanceId);
          return (
            <div key={player}>
              <div
                style={{
                  background: 'var(--surface-2)',
                  border: `1px solid ${isActive ? color : 'var(--border-em)'}`,
                  borderTop: `3px solid ${color}`,
                  padding: '10px 14px',
                  marginBottom: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 className="heading" style={{ fontSize: '16px' }}>Player {player}</h3>
                  {isActive && <span className="badge badge-active">Active</span>}
                </div>
                <span style={{ fontFamily: 'var(--font-head)', fontSize: '12px', color: 'var(--text-muted)' }}>
                  {active.length} active · {dead.length} destroyed
                </span>
              </div>
              {active.length === 0 && (
                <p className="text-muted text-sm" style={{ padding: '8px' }}>All units destroyed.</p>
              )}
              {active.map((unit) => (
                <UnitCard
                  key={unit.instanceId}
                  unit={unit}
                  dispatch={dispatch}
                  isMoralePhase={isMoralePhase && isActive}
                  currentPhase={isActive ? currentPhase : null}
                  activeStratagems={unitStratagems.filter((s) => s.instanceId === unit.instanceId)}
                />
              ))}
              {showDestroyed && dead.map((unit) => (
                <UnitCard key={unit.instanceId} unit={unit} dispatch={dispatch} isMoralePhase={false} currentPhase={null} activeStratagems={[]} />
              ))}
            </div>
          );
        })}
      </div>

      {/* Destroyed units toggle */}
      {(p1Dead.length > 0 || p2Dead.length > 0) && (
        <div style={{ marginTop: '8px', marginBottom: '16px' }}>
          <button className="btn btn-sm" onClick={() => setShowDestroyed((v) => !v)}>
            {showDestroyed ? '▲ Hide' : '▼ Show'} Destroyed Units ({p1Dead.length + p2Dead.length})
          </button>
        </div>
      )}

      {/* Combat Calculator */}
      {showCalc && (
        <CombatCalculator battleUnits={battleUnits} dispatch={dispatch} player={currentTurn} currentPhase={currentPhase} />
      )}

      {/* Stratagem Panel */}
      {showStratagems && (
        <StratagemPanel
          currentPhase={currentPhase}
          activePlayer={currentTurn}
          cp={cp}
          battleUnits={battleUnits}
          activeStratagems={activeStratagems}
          dispatch={dispatch}
          onClose={() => setShowStratagems(false)}
        />
      )}
    </div>
  );
}
