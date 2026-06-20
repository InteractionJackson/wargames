function QuitGameButton({ onQuit }) {
  return (
    <button className="quit-game-btn" onClick={onQuit}>
      Quit game
    </button>
  );
}

function TurnIndicator({ currentTurn }) {
  return (
    <span className="turn-indicator">Player {currentTurn}'s turn</span>
  );
}

function NextButton({ label, onClick }) {
  return (
    <button className="topbar-next-btn" onClick={onClick}>
      {label}
    </button>
  );
}

export default function TopBar({ currentTurn, onQuit, nextLabel, onNext }) {
  return (
    <div className="top-bar">
      <QuitGameButton onQuit={onQuit} />
      <TurnIndicator currentTurn={currentTurn} />
      <NextButton label={nextLabel} onClick={onNext} />
    </div>
  );
}
