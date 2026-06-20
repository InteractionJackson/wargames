import { useState } from 'react';
import { PHASES } from '../state/gameReducer.js';
import TopBar from './TopBar.jsx';
import BattleHeader from './BattleHeader.jsx';
import PhaseNav from './PhaseNav.jsx';
import PhaseGuide from './PhaseGuide.jsx';
import UnitCard from './UnitCard.jsx';
import CombatCalculator from './CombatCalculator.jsx';
import StratagemPanel from './StratagemPanel.jsx';

const CALC_PHASES = ['Shooting Phase', 'Fight Phase'];

function FactionGroupHeader({ faction, isActive, activeCount, destroyedCount }) {
  return (
    <div className="faction-group-header">
      <div className="faction-group-header__left">
        <h3 className="faction-group-header__name">{faction}</h3>
      </div>
      <span className="faction-group-header__count">
        {activeCount} active · {destroyedCount} destroyed
      </span>
    </div>
  );
}

export default function GameScreen({ state, dispatch }) {
  const {
    battleUnits, currentRound, currentTurn, currentPhaseIndex,
    totalRounds, cp, vp, activeStratagems,
    player1Army, player2Army, mission, gameType,
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

  function handleQuit() {
    if (window.confirm('Quit the game? All progress will be lost.')) {
      dispatch({ type: 'RESET' });
    }
  }

  return (
    <div className="battle-page">
      <TopBar
        currentTurn={currentTurn}
        onQuit={handleQuit}
        nextLabel={nextLabel()}
        onNext={() => dispatch({ type: 'NEXT_PHASE' })}
      />

      <BattleHeader
        p1Faction={p1Faction}
        p2Faction={p2Faction}
        missionName={mission?.name}
        gameType={gameType}
        p1Vp={vp?.[1] ?? 0}
        p1Cp={cp[1] || 0}
        p2Vp={vp?.[2] ?? 0}
        p2Cp={cp[2] || 0}
        currentRound={currentRound}
        currentTurn={currentTurn}
        activeStratagems={activeStratagems}
        onOpenStratagemsP1={() => setShowStratagems(true)}
        onOpenStratagemsP2={() => setShowStratagems(true)}
        onOpenRollGuide={() => {/* TODO: open roll guide */}}
      />

      <PhaseNav
        currentPhaseIndex={currentPhaseIndex}
      />

      <div className="main-content-inner">
        <PhaseGuide phaseIndex={currentPhaseIndex} />

        <div className="battle-grid">
          {[1, 2].map((player) => {
            const active = player === 1 ? p1Active : p2Active;
            const dead   = player === 1 ? p1Dead : p2Dead;
            const isActive = currentTurn === player;
            const unitStratagems = activeStratagems.filter((s) => s.owner === player && s.instanceId);
            const faction = player === 1 ? p1Faction : p2Faction;
            return (
              <div key={player}>
                <FactionGroupHeader
                  faction={faction}
                  isActive={isActive}
                  activeCount={active.length}
                  destroyedCount={dead.length}
                />

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
          <CombatCalculator
            battleUnits={battleUnits}
            dispatch={dispatch}
            player={currentTurn}
            currentPhase={currentPhase}
          />
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
