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

export default function TopBar({ currentTurn, onQuit }) {
  return (
    <div className="top-bar">
      <QuitGameButton onQuit={onQuit} />
      <TurnIndicator currentTurn={currentTurn} />
      {/* right-side spacer keeps TurnIndicator visually centred */}
      <div className="top-bar__spacer" />
    </div>
  );
}
