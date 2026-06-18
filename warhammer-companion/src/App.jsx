import { useReducer } from 'react';
import { gameReducer, initialState, APP_PHASES } from './state/gameReducer.js';
import ArmyBuilder from './components/ArmyBuilder.jsx';
import MissionSetup from './components/MissionSetup.jsx';
import BattleTracker from './components/BattleTracker.jsx';
import GameSummary from './components/GameSummary.jsx';
import './styles/global.css';

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const { appPhase } = state;

  const isBattle = appPhase === APP_PHASES.BATTLE_TRACKER;

  return (
    <div className="app-root">
      {!isBattle && (
        <header className="page-header">
          <h1>40K grump</h1>
        </header>
      )}

      <main className={isBattle ? 'main-content main-content--battle' : 'main-content'}>
        {appPhase === APP_PHASES.ARMY_BUILDER && (
          <ArmyBuilder state={state} dispatch={dispatch} />
        )}
        {appPhase === APP_PHASES.MISSION_SETUP && (
          <MissionSetup state={state} dispatch={dispatch} />
        )}
        {appPhase === APP_PHASES.BATTLE_TRACKER && (
          <BattleTracker state={state} dispatch={dispatch} />
        )}
        {appPhase === APP_PHASES.GAME_SUMMARY && (
          <GameSummary state={state} dispatch={dispatch} />
        )}
      </main>
    </div>
  );
}
