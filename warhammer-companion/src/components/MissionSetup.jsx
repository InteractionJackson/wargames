import { GAME_TYPES, MISSIONS } from '../data/missions.js';

export default function MissionSetup({ state, dispatch }) {
  const { gameType, mission, totalRounds, firstTurn } = state;
  const canStart = mission !== null;

  return (
    <div className="phase-page">
      <div className="phase-page__header">
        <button className="back-btn" onClick={() => dispatch({ type: 'RESET' })}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
            <circle cx="12" cy="12" r="10"/>
            <path d="M14 8l-4 4 4 4"/>
          </svg>
          Back to army setup
        </button>
        <div style={{ marginTop: '16px' }}>
          <div className="phase-page__label">Phase 2</div>
          <h2 className="phase-page__title heading">Mission setup</h2>
        </div>
      </div>

      <div className="mission-layout">
        {/* Main content */}
        <div className="mission-layout__main">

          {/* Game Type */}
          <div className="mission-section">
            <div className="mission-section__title">Game type</div>
            <div className="option-tabs">
              {GAME_TYPES.map((gt) => (
                <button
                  key={gt}
                  className={`option-tab ${gameType === gt ? 'option-tab--active' : ''}`}
                  onClick={() => dispatch({ type: 'SET_GAME_TYPE', gameType: gt })}
                >
                  {gt}
                </button>
              ))}
            </div>
          </div>

          {/* Mission Objective */}
          <div className="mission-section">
            <div className="mission-section__title">Mission objective</div>
            <div className="mission-grid">
              {MISSIONS.map((m) => (
                <div
                  key={m.id}
                  className={`mission-card ${mission?.id === m.id ? 'selected' : ''}`}
                  onClick={() => dispatch({ type: 'SET_MISSION', mission: m })}
                >
                  <h3>{m.name}</h3>
                  <p>{m.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Battle Rounds */}
          <div className="mission-section">
            <div className="mission-section__title">Battle rounds</div>
            <div className="option-tabs option-tabs--stepper">
              <button
                className="option-tab option-tab--icon"
                onClick={() => dispatch({ type: 'SET_TOTAL_ROUNDS', rounds: totalRounds - 1 })}
                disabled={totalRounds <= 1}
              >
                −
              </button>
              <div className="option-tab option-tab--value">{totalRounds}</div>
              <button
                className="option-tab option-tab--icon"
                onClick={() => dispatch({ type: 'SET_TOTAL_ROUNDS', rounds: totalRounds + 1 })}
                disabled={totalRounds >= 10}
              >
                +
              </button>
            </div>
          </div>

          {/* First Turn */}
          <div className="mission-section">
            <div className="mission-section__title">First turn</div>
            <div className="option-tabs">
              {[1, 2].map((p) => (
                <button
                  key={p}
                  className={`option-tab option-tab--wide ${firstTurn === p ? 'option-tab--active' : ''}`}
                  onClick={() => dispatch({ type: 'SET_FIRST_TURN', player: p })}
                >
                  Player {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar — Battle Summary */}
        <div className="mission-sidebar">
          <div className="mission-summary">
            <div className="mission-summary__title">Battle summary</div>
            <div className="mission-summary__body">
              <div className="mission-summary__item">
                <div className="mission-summary__item-label">Game type</div>
                <div className="mission-summary__item-value">{gameType}</div>
              </div>
              <div className="mission-summary__item">
                <div className="mission-summary__item-label">Objective</div>
                <div className="mission-summary__item-value">{mission ? mission.name : '—'}</div>
              </div>
              <div className="mission-summary__item">
                <div className="mission-summary__item-label">Rounds</div>
                <div className="mission-summary__item-value">{totalRounds} rounds</div>
              </div>
              <div className="mission-summary__item">
                <div className="mission-summary__item-label">First turn</div>
                <div className="mission-summary__item-value">Player {firstTurn}</div>
              </div>
            </div>
            <div className="mission-summary__footer">
              <button
                className="btn btn-primary btn-next"
                disabled={!canStart}
                onClick={() => dispatch({ type: 'START_BATTLE' })}
              >
                Begin battle
                <svg viewBox="0 0 12 10" fill="currentColor" width="12" height="10">
                  <path d="M7 0l5 5-5 5-1.4-1.4L8.2 6H0V4h8.2L5.6 1.4z"/>
                </svg>
              </button>
              {!canStart && (
                <p className="text-muted text-sm" style={{ marginTop: '8px' }}>Select a mission to proceed.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
