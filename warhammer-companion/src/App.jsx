import { useReducer } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { gameReducer, initialState, APP_PHASES } from './state/gameReducer.js';
import ArmyBuilder from './components/ArmyBuilder.jsx';
import MissionSetup from './components/MissionSetup.jsx';
import BattleTracker from './components/BattleTracker.jsx';
import GameSummary from './components/GameSummary.jsx';
import './styles/global.css';

const PHASE_LABELS = {
  [APP_PHASES.ARMY_BUILDER]:  'Phase 1 — Army Builder',
  [APP_PHASES.MISSION_SETUP]: 'Phase 2 — Mission Setup',
  [APP_PHASES.BATTLE_TRACKER]:'Phase 3 — Battle',
  [APP_PHASES.GAME_SUMMARY]:  'Game Summary',
};

const PHASE_ORDER = [
  APP_PHASES.ARMY_BUILDER,
  APP_PHASES.MISSION_SETUP,
  APP_PHASES.BATTLE_TRACKER,
  APP_PHASES.GAME_SUMMARY,
];

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const { appPhase } = state;

  const phaseIndex = PHASE_ORDER.indexOf(appPhase);

  return (
    <div className="app-root">
      <header className="page-header">
        <div
          style={{
            width: '32px',
            height: '32px',
            background: 'var(--gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-head)',
            fontWeight: '700',
            fontSize: '16px',
            color: '#1a1208',
            flexShrink: 0,
          }}
        >
          ✦
        </div>
        <h1>Warhammer 40,000 Companion</h1>
        <div className="phase-indicator">
          <AnimatePresence mode="wait">
            <motion.span
              key={appPhase}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.2 }}
            >
              {PHASE_LABELS[appPhase]}
            </motion.span>
          </AnimatePresence>
        </div>
        {appPhase !== APP_PHASES.ARMY_BUILDER && (
          <button
            className="btn btn-sm btn-danger"
            style={{ marginLeft: '12px' }}
            onClick={() => {
              if (window.confirm('Reset the game? All progress will be lost.')) {
                dispatch({ type: 'RESET' });
              }
            }}
          >
            Reset
          </button>
        )}
      </header>

      <main className="main-content" style={{ overflow: 'hidden' }}>
        <AnimatePresence mode="wait" custom={phaseIndex}>
          <motion.div
            key={appPhase}
            custom={phaseIndex}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
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
          </motion.div>
        </AnimatePresence>
      </main>

      <footer
        style={{
          borderTop: '1px solid var(--border-sub)',
          padding: '8px 24px',
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-head)',
            fontSize: '11px',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          WH40K 10th Edition Companion
        </span>
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '11px',
            color: 'var(--border-em)',
          }}
        >
          For the Emperor. Or the Dark Gods. Whichever.
        </span>
      </footer>
    </div>
  );
}

