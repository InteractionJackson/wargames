import { useState } from 'react';
import { PHASES } from '../state/gameReducer.js';
import PhaseGuide from './PhaseGuide.jsx';
import UnitCard from './UnitCard.jsx';
import CombatCalculator from './CombatCalculator.jsx';
import StratagemPanel from './StratagemPanel.jsx';

const CALC_PHASES = ['Shooting Phase', 'Fight Phase'];

const PHASE_LABELS = ['Command', 'Movement', 'Shooting', 'Charge', 'Fight'];

export default function BattleTracker({ state, dispatch }) {
  const {
    battleUnits, currentRound, currentTurn, currentPhaseIndex,
    totalRounds, cp, vp, activeStratagems,
    player1Army, player2Army,
  } = state;
  const [showDestroyed, setShowDestroyed] = useState(false);
  const [showStratagems, setShowStratagems] = useState(false);

  const currentPhase = PHASES[currentPhaseIndex];
  const isMoralePhase = currentPhase === 'Command Phase';
  const showCalc = CALC_PHASES.includes(currentPhase);

  const allUnits = Object.values(battleUnits);
  const p1Active = allUnits.filter((u) => u.owner === 1 && !u.destroyed);
  const p1Dead   = allUnits.filter((u) => u.owner === 1 && u.destroyed);
  const p2Active = allUnits.filter((u) => u.owner === 2 && !u.destroyed);
  const p2Dead   = allUnits.filter((u) => u.owner === 2 && u.destroyed);

  const isLastPhase = currentPhaseIndex === PHASES.length - 1;
  const isLastRound = currentRound === totalRounds;

  function nextLabel() {
    if (!isLastPhase) return 'Next';
    if (currentTurn === 1) return 'Next';
    if (isLastRound) return 'End';
    return 'Next';
  }

  const p1Faction = player1Army.length > 0 ? player1Army[0].faction : 'Player 1';
  const p2Faction = player2Army.length > 0 ? player2Army[0].faction : 'Player 2';

  return (
    <div className="battle-page">
      {/* Header */}
      <header className="battle-header">
        <button
          className="btn btn-sm btn-danger"
          onClick={() => {
            if (window.confirm('Quit the game? All progress will be lost.')) {
              dispatch({ type: 'RESET' });
            }
          }}
        >
          Quit game
        </button>
        <h1 className="battle-header__turn">Player {currentTurn}'s turn</h1>
        <button className="btn btn-primary btn-next" onClick={() => dispatch({ type: 'NEXT_PHASE' })}>
          {nextLabel()}
          <svg viewBox="0 0 12 10" fill="currentColor" width="10" height="10">
            <path d="M7 0l5 5-5 5-1.4-1.4L8.2 6H0V4h8.2L5.6 1.4z"/>
          </svg>
        </button>
      </header>

      {/* Scoreboard */}
      <div className="battle-scoreboard">
        {/* Player 1 side */}
        <div className="battle-scoreboard__side battle-scoreboard__side--left">
          <div className="battle-scoreboard__faction">{p1Faction}</div>
          <div className="battle-scoreboard__objectives">
            <div className="battle-scoreboard__score-item">
              <div className="battle-scoreboard__score-label">VP</div>
              <div className="battle-scoreboard__score-value">{String(vp?.[1] ?? 0).padStart(2, '0')}</div>
            </div>
            <div className="battle-scoreboard__score-item">
              <div className="battle-scoreboard__score-label">CP</div>
              <div className="battle-scoreboard__score-value">{String(cp[1] || 0).padStart(2, '0')}</div>
            </div>
          </div>
          <div className="battle-scoreboard__buttons">
            <button className="btn btn-sm" onClick={() => dispatch({ type: 'ADJUST_VP', player: 1, delta: -1 })} disabled={(vp?.[1] ?? 0) === 0}>−VP</button>
            <button className="btn btn-sm" onClick={() => dispatch({ type: 'ADJUST_VP', player: 1, delta: 1 })}>+VP</button>
            <button className="btn btn-sm" onClick={() => dispatch({ type: 'ADJUST_CP', player: 1, delta: -1 })} disabled={(cp[1] || 0) === 0}>−CP</button>
            <button className="btn btn-sm" onClick={() => dispatch({ type: 'ADJUST_CP', player: 1, delta: 1 })}>+CP</button>
          </div>
        </div>

        {/* Round circle */}
        <div className="battle-scoreboard__round">
          <div className="battle-round-circle">
            <div className="battle-round-circle__num">{currentRound}</div>
            <div className="battle-round-circle__label">Battle round</div>
          </div>
        </div>

        {/* Player 2 side */}
        <div className="battle-scoreboard__side battle-scoreboard__side--right">
          <div className="battle-scoreboard__objectives">
            <div className="battle-scoreboard__score-item">
              <div className="battle-scoreboard__score-value">{String(vp?.[2] ?? 0).padStart(2, '0')}</div>
              <div className="battle-scoreboard__score-label">VP</div>
            </div>
            <div className="battle-scoreboard__score-item">
              <div className="battle-scoreboard__score-value">{String(cp[2] || 0).padStart(2, '0')}</div>
              <div className="battle-scoreboard__score-label">CP</div>
            </div>
          </div>
          <div className="battle-scoreboard__faction">{p2Faction}</div>
          <div className="battle-scoreboard__buttons">
            <button className="btn btn-sm" onClick={() => dispatch({ type: 'ADJUST_VP', player: 2, delta: -1 })} disabled={(vp?.[2] ?? 0) === 0}>−VP</button>
            <button className="btn btn-sm" onClick={() => dispatch({ type: 'ADJUST_VP', player: 2, delta: 1 })}>+VP</button>
            <button className="btn btn-sm" onClick={() => dispatch({ type: 'ADJUST_CP', player: 2, delta: -1 })} disabled={(cp[2] || 0) === 0}>−CP</button>
            <button className="btn btn-sm" onClick={() => dispatch({ type: 'ADJUST_CP', player: 2, delta: 1 })}>+CP</button>
          </div>
        </div>
      </div>

      {/* Phase Tabs */}
      <div className="phase-tabs-bar">
        <div className="phase-tabs">
          {PHASES.map((ph, i) => (
            <div
              key={ph}
              className={`phase-tab ${i === currentPhaseIndex ? 'phase-tab--active' : i < currentPhaseIndex ? 'phase-tab--done' : ''}`}
            >
              {PHASE_LABELS[i]}
            </div>
          ))}
        </div>
        <button
          className={`btn btn-sm cp-stratagem-btn${activeStratagems.length > 0 ? ' has-active' : ''}`}
          onClick={() => setShowStratagems(true)}
        >
          ⚡ Stratagems
          {activeStratagems.length > 0 && (
            <span className="cp-active-badge">{activeStratagems.length}</span>
          )}
        </button>
      </div>

      {/* Phase Guide */}
      <div className="main-content-inner">
        <PhaseGuide phaseIndex={currentPhaseIndex} />

        {/* Unit Grid */}
        <div className="battle-grid">
          {[1, 2].map((player) => {
            const active = player === 1 ? p1Active : p2Active;
            const dead   = player === 1 ? p1Dead : p2Dead;
            const isActive = currentTurn === player;
            const unitStratagems = activeStratagems.filter((s) => s.owner === player && s.instanceId);
            const faction = player === 1 ? p1Faction : p2Faction;
            return (
              <div key={player}>
                <div className={`battle-player-header ${isActive ? 'battle-player-header--active' : ''}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 className="heading" style={{ fontSize: '16px' }}>{faction}</h3>
                    {isActive && <span className="badge badge-active">Active</span>}
                  </div>
                  <span className="text-muted text-sm">
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

        {(p1Dead.length > 0 || p2Dead.length > 0) && (
          <div style={{ margin: '8px 0 16px' }}>
            <button className="btn btn-sm" onClick={() => setShowDestroyed((v) => !v)}>
              {showDestroyed ? '▲ Hide' : '▼ Show'} Destroyed Units ({p1Dead.length + p2Dead.length})
            </button>
          </div>
        )}

        {showCalc && (
          <CombatCalculator battleUnits={battleUnits} dispatch={dispatch} player={currentTurn} currentPhase={currentPhase} />
        )}
      </div>

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
