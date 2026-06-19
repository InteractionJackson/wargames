// ── Primitive sub-components ─────────────────────────────────────────────────

export function FactionName({ name }) {
  return <div className="faction-name">{name}</div>;
}

export function MissionText({ missionName, gameType, align = 'left' }) {
  return (
    <div className={`mission-text mission-text--${align}`}>
      <span className="mission-text__primary">{missionName ?? '—'}</span>
      <span className="mission-text__secondary">{gameType}</span>
    </div>
  );
}

export function StrategemsButton({ onClick, activeCount }) {
  return (
    <button className="stratagems-btn" onClick={onClick}>
      ⚡ Stratagems
      {activeCount > 0 && (
        <span className="stratagems-btn__badge">{activeCount}</span>
      )}
    </button>
  );
}

export function RollGuideButton({ onClick }) {
  return (
    <button className="roll-guide-btn" onClick={onClick}>
      Roll guide
    </button>
  );
}

export function StrategemControls({ onOpenStratagems, showRollGuide, activeCount, onOpenRollGuide }) {
  return (
    <div className="stratagem-controls">
      <StrategemsButton onClick={onOpenStratagems} activeCount={activeCount} />
      {showRollGuide && (
        <RollGuideButton onClick={onOpenRollGuide} />
      )}
    </div>
  );
}

export function FactionHeader({ factionName, missionName, gameType, align, onOpenStratagems, showRollGuide, activeStratagemCount, onOpenRollGuide }) {
  return (
    <div className={`faction-header faction-header--${align}`}>
      <FactionName name={factionName} />
      <MissionText missionName={missionName} gameType={gameType} align={align} />
      <StrategemControls
        onOpenStratagems={onOpenStratagems}
        showRollGuide={showRollGuide}
        activeCount={activeStratagemCount}
        onOpenRollGuide={onOpenRollGuide}
      />
    </div>
  );
}

// ── ScoreStack ────────────────────────────────────────────────────────────────
// mirrored=false → label VP / value 01  (player side)
// mirrored=true  → value 01 / label VP  (opponent side)

export function ScoreStack({ vpValue, cpValue, mirrored = false }) {
  return (
    <div className="score-stack">
      <ScoreItem label="VP" value={vpValue} mirrored={mirrored} />
      <ScoreItem label="CP" value={cpValue} mirrored={mirrored} />
    </div>
  );
}

function ScoreItem({ label, value, mirrored }) {
  const formatted = String(value ?? 0).padStart(2, '0');
  return (
    <div className="score-item">
      {mirrored ? (
        <>
          <span className="score-item__value">{formatted}</span>
          <span className="score-item__label">{label}</span>
        </>
      ) : (
        <>
          <span className="score-item__label">{label}</span>
          <span className="score-item__value">{formatted}</span>
        </>
      )}
    </div>
  );
}

// ── RoundCounter ──────────────────────────────────────────────────────────────

export function RoundCounter({ round }) {
  return (
    <div className="round-counter">
      <span className="round-counter__num">{round}</span>
      <span className="round-counter__label">Battle round</span>
    </div>
  );
}

// ── ScoreRow ──────────────────────────────────────────────────────────────────

function ScoreRow({ p1Vp, p1Cp, currentRound, p2Vp, p2Cp }) {
  return (
    <div className="score-row">
      <ScoreStack vpValue={p1Vp} cpValue={p1Cp} mirrored={false} />
      <RoundCounter round={currentRound} />
      <ScoreStack vpValue={p2Vp} cpValue={p2Cp} mirrored={true} />
    </div>
  );
}

// ── BattleHeader (composed) ───────────────────────────────────────────────────

export default function BattleHeader({
  p1Faction, p2Faction,
  missionName, gameType,
  p1Vp, p1Cp, p2Vp, p2Cp,
  currentRound, currentTurn,
  activeStratagems,
  onOpenStratagemsP1,
  onOpenStratagemsP2,
  onOpenRollGuide,
}) {
  // TODO: conditionally show RollGuideButton only for the active player's side
  const p1IsActive = currentTurn === 1;
  const p1ActiveCount = activeStratagems.filter((s) => s.owner === 1).length;
  const p2ActiveCount = activeStratagems.filter((s) => s.owner === 2).length;

  return (
    <div className="battle-header-panel">
      <FactionHeader
        factionName={p1Faction}
        missionName={missionName}
        gameType={gameType}
        align="left"
        onOpenStratagems={onOpenStratagemsP1}
        showRollGuide={p1IsActive}
        activeStratagemCount={p1ActiveCount}
        onOpenRollGuide={onOpenRollGuide}
      />
      <ScoreRow
        p1Vp={p1Vp} p1Cp={p1Cp}
        currentRound={currentRound}
        p2Vp={p2Vp} p2Cp={p2Cp}
      />
      <FactionHeader
        factionName={p2Faction}
        missionName={missionName}
        gameType={gameType}
        align="right"
        onOpenStratagems={onOpenStratagemsP2}
        showRollGuide={!p1IsActive}
        activeStratagemCount={p2ActiveCount}
        onOpenRollGuide={onOpenRollGuide}
      />
    </div>
  );
}
