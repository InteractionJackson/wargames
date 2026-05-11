export default function GameSummary({ state, dispatch }) {
  const { battleUnits, mission, player1Army, player2Army, totalRounds, currentRound } = state;

  const allUnits = Object.values(battleUnits);

  const p1Units = allUnits.filter((u) => u.owner === 1);
  const p2Units = allUnits.filter((u) => u.owner === 2);

  const p1Destroyed = p1Units.filter((u) => u.destroyed);
  const p2Destroyed = p2Units.filter((u) => u.destroyed);
  const p1Survivors = p1Units.filter((u) => !u.destroyed);
  const p2Survivors = p2Units.filter((u) => !u.destroyed);

  const p1PtsDestroyed = p2Destroyed.reduce((s, u) => s + u.points, 0);
  const p2PtsDestroyed = p1Destroyed.reduce((s, u) => s + u.points, 0);

  const p1WoundsRemaining = p1Survivors.reduce((s, u) => s + u.currentWounds, 0);
  const p2WoundsRemaining = p2Survivors.reduce((s, u) => s + u.currentWounds, 0);

  const p1StartPts = player1Army.reduce((s, u) => s + u.points, 0);
  const p2StartPts = player2Army.reduce((s, u) => s + u.points, 0);

  // Determine winner
  let winner = null;
  let winReason = '';

  if (mission) {
    switch (mission.victoryType) {
      case 'points_destroyed':
        if (p1PtsDestroyed > p2PtsDestroyed) {
          winner = 1;
          winReason = `Player 1 destroyed ${p1PtsDestroyed} pts vs Player 2's ${p2PtsDestroyed} pts.`;
        } else if (p2PtsDestroyed > p1PtsDestroyed) {
          winner = 2;
          winReason = `Player 2 destroyed ${p2PtsDestroyed} pts vs Player 1's ${p1PtsDestroyed} pts.`;
        } else {
          winner = 0;
          winReason = `Both sides destroyed equal points value — a draw!`;
        }
        break;
      case 'units_destroyed': {
        const p1k = p2Destroyed.length;
        const p2k = p1Destroyed.length;
        if (p1k > p2k) {
          winner = 1;
          winReason = `Player 1 destroyed ${p1k} units vs Player 2's ${p2k}.`;
        } else if (p2k > p1k) {
          winner = 2;
          winReason = `Player 2 destroyed ${p2k} units vs Player 1's ${p1k}.`;
        } else {
          // Tiebreak: wounds remaining
          winner = p1WoundsRemaining >= p2WoundsRemaining ? 1 : 2;
          winReason = `Equal units destroyed. Tiebreak: wounds remaining (P1 ${p1WoundsRemaining} vs P2 ${p2WoundsRemaining}).`;
        }
        break;
      }
      case 'wounds_remaining':
        if (p1WoundsRemaining > p2WoundsRemaining) {
          winner = 1;
          winReason = `Player 1 has ${p1WoundsRemaining}W remaining vs Player 2's ${p2WoundsRemaining}W.`;
        } else if (p2WoundsRemaining > p1WoundsRemaining) {
          winner = 2;
          winReason = `Player 2 has ${p2WoundsRemaining}W remaining vs Player 1's ${p1WoundsRemaining}W.`;
        } else {
          winner = 0;
          winReason = 'Equal wounds remaining — a draw!';
        }
        break;
      case 'survival': {
        const p1Half = p1Units.length / 2;
        const p2Half = p2Units.length / 2;
        const p1SurvivedHalf = p1Survivors.length > p1Half;
        const p2SurvivedHalf = p2Survivors.length > p2Half;
        if (p1SurvivedHalf && !p2SurvivedHalf) {
          winner = 1;
          winReason = `Player 1 retained more than half their force.`;
        } else if (p2SurvivedHalf && !p1SurvivedHalf) {
          winner = 2;
          winReason = `Player 2 retained more than half their force.`;
        } else if (p1SurvivedHalf && p2SurvivedHalf) {
          winner = p1WoundsRemaining >= p2WoundsRemaining ? 1 : 2;
          winReason = `Both sides survived. Winner by wounds remaining.`;
        } else {
          winner = 0;
          winReason = 'Both sides decimated — a pyrrhic draw!';
        }
        break;
      }
      default:
        winner = p1WoundsRemaining >= p2WoundsRemaining ? 1 : 2;
        winReason = 'Victory by wounds remaining.';
    }
  }

  const winnerText = winner === 0 ? 'Draw' : `Player ${winner} Wins`;
  const winnerColor = winner === 0 ? 'var(--text-muted)' : winner === 1 ? 'var(--warning)' : 'var(--danger)';

  return (
    <div className="summary-panel">
      <div className="winner-banner">
        <div
          style={{
            fontFamily: 'var(--font-head)',
            fontSize: '11px',
            color: 'var(--text-muted)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}
        >
          {mission?.name} · {totalRounds} Rounds
        </div>
        <h2 style={{ color: winnerColor }}>{winnerText}</h2>
        <p style={{ marginTop: '8px', color: 'var(--text)' }}>{winReason}</p>
        {mission && (
          <p style={{ marginTop: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
            {mission.winCondition}
          </p>
        )}
      </div>

      {/* Stats comparison */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          gap: '0',
          marginBottom: '20px',
          border: '1px solid var(--border-em)',
        }}
      >
        {/* Headers */}
        <StatHeader label="Player 1" color="var(--warning)" />
        <StatHeader label="" color="var(--border-em)" center />
        <StatHeader label="Player 2" color="var(--danger)" />

        <StatRow
          p1={`${p1Survivors.length} / ${p1Units.length}`}
          label="Units Surviving"
          p2={`${p2Survivors.length} / ${p2Units.length}`}
        />
        <StatRow
          p1={`${p1Destroyed.length}`}
          label="Units Lost"
          p2={`${p2Destroyed.length}`}
        />
        <StatRow
          p1={`${p1WoundsRemaining}W`}
          label="Wounds Left"
          p2={`${p2WoundsRemaining}W`}
        />
        <StatRow
          p1={`${p1PtsDestroyed} pts`}
          label="Enemy Pts Destroyed"
          p2={`${p2PtsDestroyed} pts`}
        />
        <StatRow
          p1={`${p1StartPts} pts`}
          label="Starting Points"
          p2={`${p2StartPts} pts`}
        />
      </div>

      {/* Unit breakdown */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <UnitBreakdown title="Player 1" units={p1Units} />
        <UnitBreakdown title="Player 2" units={p2Units} />
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button
          className="btn btn-primary"
          style={{ padding: '12px 32px', fontSize: '15px' }}
          onClick={() => dispatch({ type: 'RESET' })}
        >
          New Game
        </button>
      </div>
    </div>
  );
}

function StatHeader({ label, color, center }) {
  return (
    <div
      style={{
        background: 'var(--surface-2)',
        borderBottom: `2px solid ${color}`,
        padding: '8px 12px',
        fontFamily: 'var(--font-head)',
        fontSize: '13px',
        color: 'var(--white)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        textAlign: center ? 'center' : undefined,
      }}
    >
      {label}
    </div>
  );
}

function StatRow({ p1, label, p2 }) {
  return (
    <>
      <div
        style={{
          padding: '8px 12px',
          fontFamily: 'var(--font-head)',
          fontSize: '15px',
          color: 'var(--warning)',
          borderBottom: '1px solid var(--border-sub)',
          background: 'var(--surface-1)',
        }}
      >
        {p1}
      </div>
      <div
        style={{
          padding: '8px 6px',
          fontFamily: 'var(--font-head)',
          fontSize: '10px',
          color: 'var(--text-muted)',
          borderBottom: '1px solid var(--border-sub)',
          textAlign: 'center',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          background: 'var(--surface-2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {label}
      </div>
      <div
        style={{
          padding: '8px 12px',
          fontFamily: 'var(--font-head)',
          fontSize: '15px',
          color: 'var(--danger)',
          borderBottom: '1px solid var(--border-sub)',
          background: 'var(--surface-1)',
          textAlign: 'right',
        }}
      >
        {p2}
      </div>
    </>
  );
}

function UnitBreakdown({ title, units }) {
  return (
    <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-sub)' }}>
      <div
        style={{
          background: 'var(--surface-2)',
          borderBottom: '1px solid var(--border-em)',
          padding: '8px 12px',
          fontFamily: 'var(--font-head)',
          fontSize: '13px',
          color: 'var(--white)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {title}
      </div>
      {units.map((u) => (
        <div
          key={u.instanceId}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '5px 12px',
            borderBottom: '1px solid var(--border-sub)',
            opacity: u.destroyed ? 0.5 : 1,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-head)',
              fontSize: '12px',
              color: u.destroyed ? 'var(--danger)' : 'var(--text)',
            }}
          >
            {u.name}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-head)',
              fontSize: '12px',
              color: u.destroyed ? 'var(--danger)' : 'var(--warning)',
            }}
          >
            {u.destroyed ? 'Destroyed' : `${u.currentWounds}/${u.wounds}W`}
          </span>
        </div>
      ))}
    </div>
  );
}
