import { GAME_TYPES, MISSIONS } from '../data/missions.js';

export default function MissionSetup({ state, dispatch }) {
  const { gameType, mission, totalRounds, firstPlayer } = state;

  const canStart = mission !== null;

  return (
    <div style={{ maxWidth: '900px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 className="heading" style={{ fontSize: '20px', color: 'var(--gold)', marginBottom: '6px' }}>
          Phase 2 — Mission Setup
        </h2>
        <p className="text-muted text-sm">
          Select your game type, mission objective, and the number of battle rounds.
        </p>
      </div>

      {/* Game Type */}
      <div className="panel">
        <div className="panel-header">
          <h2>Game Type</h2>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {GAME_TYPES.map((gt) => (
            <button
              key={gt}
              className={`btn ${gameType === gt ? 'btn-primary' : ''}`}
              onClick={() => dispatch({ type: 'SET_GAME_TYPE', gameType: gt })}
            >
              {gt}
            </button>
          ))}
        </div>
      </div>

      {/* Mission */}
      <div className="panel" style={{ marginTop: '16px' }}>
        <div className="panel-header">
          <h2>Mission Objective</h2>
        </div>
        <div className="mission-grid">
          {MISSIONS.map((m) => (
            <div
              key={m.id}
              className={`mission-card ${mission?.id === m.id ? 'selected' : ''}`}
              onClick={() => dispatch({ type: 'SET_MISSION', mission: m })}
            >
              <h3>{m.name}</h3>
              <p>{m.description}</p>
              {mission?.id === m.id && (
                <div
                  style={{
                    marginTop: '8px',
                    paddingTop: '8px',
                    borderTop: '1px solid var(--border-em)',
                    fontSize: '11px',
                    color: 'var(--gold)',
                    fontFamily: 'var(--font-head)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  Win Condition
                  <p
                    style={{
                      color: 'var(--text)',
                      fontSize: '11px',
                      fontFamily: 'var(--font-body)',
                      textTransform: 'none',
                      letterSpacing: 0,
                      marginTop: '4px',
                    }}
                  >
                    {m.winCondition}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* First Turn */}
      <div className="panel" style={{ marginTop: '16px' }}>
        <div className="panel-header">
          <h2>First Turn</h2>
        </div>
        <p className="text-muted text-sm" style={{ marginBottom: '10px' }}>
          Which player takes the first turn? Battle Shock tests only start from the second Command Phase.
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          {[1, 2].map((p) => (
            <button
              key={p}
              className={`btn ${firstPlayer === p ? 'btn-primary' : ''}`}
              onClick={() => dispatch({ type: 'SET_FIRST_PLAYER', player: p })}
            >
              Player {p} goes first
            </button>
          ))}
        </div>
      </div>

      {/* Rounds */}
      <div className="panel" style={{ marginTop: '16px' }}>
        <div className="panel-header">
          <h2>Battle Rounds</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            className="btn btn-sm"
            onClick={() => dispatch({ type: 'SET_TOTAL_ROUNDS', rounds: totalRounds - 1 })}
            disabled={totalRounds <= 1}
          >
            −
          </button>
          <span
            style={{
              fontFamily: 'var(--font-head)',
              fontSize: '28px',
              color: 'var(--gold)',
              minWidth: '40px',
              textAlign: 'center',
            }}
          >
            {totalRounds}
          </span>
          <button
            className="btn btn-sm"
            onClick={() => dispatch({ type: 'SET_TOTAL_ROUNDS', rounds: totalRounds + 1 })}
            disabled={totalRounds >= 10}
          >
            +
          </button>
          <span className="text-muted text-sm">rounds (default: 5)</span>
        </div>
      </div>

      {/* Summary & Start */}
      <div className="panel" style={{ marginTop: '16px' }}>
        <div className="panel-header">
          <h2>Battle Summary</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {[
            { label: 'Game Type', value: gameType },
            { label: 'Mission', value: mission ? mission.name : '—' },
            { label: 'Rounds', value: totalRounds },
            { label: 'First Turn', value: `Player ${firstPlayer}` },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: 'var(--surface-2)', padding: '10px 14px', border: '1px solid var(--border-sub)' }}>
              <div className="points-label">{label}</div>
              <div
                style={{
                  fontFamily: 'var(--font-head)',
                  fontSize: '16px',
                  color: 'var(--white)',
                  marginTop: '2px',
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            className="btn btn-primary"
            style={{ fontSize: '15px', padding: '12px 36px' }}
            disabled={!canStart}
            onClick={() => dispatch({ type: 'START_BATTLE' })}
          >
            Begin Battle →
          </button>
          {!canStart && (
            <span className="text-muted text-sm">Select a mission objective to proceed.</span>
          )}
        </div>
      </div>
    </div>
  );
}
