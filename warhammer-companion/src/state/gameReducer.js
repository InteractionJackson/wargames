// Central game state reducer — all game state lives here.
// Wound tracking, phase progression, and army lists all survive phase transitions.

export const PHASES = [
  'Command Phase',
  'Movement Phase',
  'Shooting Phase',
  'Charge Phase',
  'Fight Phase',
  'Morale Phase',
];

export const APP_PHASES = {
  ARMY_BUILDER: 'ARMY_BUILDER',
  MISSION_SETUP: 'MISSION_SETUP',
  BATTLE_TRACKER: 'BATTLE_TRACKER',
  GAME_SUMMARY: 'GAME_SUMMARY',
};

const initialState = {
  appPhase: APP_PHASES.ARMY_BUILDER,

  // Army Builder
  player1Army: [],
  player2Army: [],
  player1Confirmed: false,
  player2Confirmed: false,

  // Mission Setup
  gameType: 'Matched Play',
  mission: null,
  totalRounds: 5,

  // Battle Tracker
  currentRound: 1,
  currentPhaseIndex: 0,
  // battleUnits: { [instanceId]: { ...unitData, currentWounds, destroyed, notes } }
  battleUnits: {},
};

let instanceCounter = 0;
function makeInstanceId(unitId) {
  return `${unitId}_${++instanceCounter}`;
}

export function gameReducer(state, action) {
  switch (action.type) {
    // ── Army Builder ──────────────────────────────────────────────────────────
    case 'ADD_UNIT': {
      const { player, unit } = action;
      const instanceId = makeInstanceId(unit.id);
      const entry = { ...unit, instanceId };
      const key = player === 1 ? 'player1Army' : 'player2Army';
      return { ...state, [key]: [...state[key], entry] };
    }
    case 'REMOVE_UNIT': {
      const { player, instanceId } = action;
      const key = player === 1 ? 'player1Army' : 'player2Army';
      return {
        ...state,
        [key]: state[key].filter((u) => u.instanceId !== instanceId),
      };
    }
    case 'CONFIRM_ARMY': {
      const key = action.player === 1 ? 'player1Confirmed' : 'player2Confirmed';
      return { ...state, [key]: true };
    }
    case 'UNCONFIRM_ARMY': {
      const key = action.player === 1 ? 'player1Confirmed' : 'player2Confirmed';
      return { ...state, [key]: false };
    }
    case 'ADVANCE_TO_MISSION': {
      return { ...state, appPhase: APP_PHASES.MISSION_SETUP };
    }

    // ── Mission Setup ─────────────────────────────────────────────────────────
    case 'SET_GAME_TYPE':
      return { ...state, gameType: action.gameType };
    case 'SET_MISSION':
      return { ...state, mission: action.mission };
    case 'SET_TOTAL_ROUNDS':
      return { ...state, totalRounds: Math.max(1, Math.min(10, action.rounds)) };
    case 'START_BATTLE': {
      // Build battleUnits map from both armies
      const battleUnits = {};
      const buildUnits = (army, owner) => {
        army.forEach((unit) => {
          battleUnits[unit.instanceId] = {
            ...unit,
            owner,
            currentWounds: unit.wounds,
            destroyed: false,
            notes: '',
          };
        });
      };
      buildUnits(state.player1Army, 1);
      buildUnits(state.player2Army, 2);

      return {
        ...state,
        appPhase: APP_PHASES.BATTLE_TRACKER,
        battleUnits,
        currentRound: 1,
        currentPhaseIndex: 0,
      };
    }

    // ── Battle Tracker ────────────────────────────────────────────────────────
    case 'NEXT_PHASE': {
      const nextIndex = state.currentPhaseIndex + 1;
      if (nextIndex >= PHASES.length) {
        // End of round
        const nextRound = state.currentRound + 1;
        if (nextRound > state.totalRounds) {
          return { ...state, appPhase: APP_PHASES.GAME_SUMMARY };
        }
        return { ...state, currentRound: nextRound, currentPhaseIndex: 0 };
      }
      return { ...state, currentPhaseIndex: nextIndex };
    }
    case 'SET_WOUNDS': {
      const { instanceId, wounds } = action;
      const unit = state.battleUnits[instanceId];
      if (!unit) return state;
      const clamped = Math.max(0, Math.min(unit.wounds, wounds));
      const destroyed = clamped === 0;
      return {
        ...state,
        battleUnits: {
          ...state.battleUnits,
          [instanceId]: { ...unit, currentWounds: clamped, destroyed },
        },
      };
    }
    case 'SET_NOTES': {
      const { instanceId, notes } = action;
      const unit = state.battleUnits[instanceId];
      if (!unit) return state;
      return {
        ...state,
        battleUnits: {
          ...state.battleUnits,
          [instanceId]: { ...unit, notes },
        },
      };
    }
    case 'APPLY_WOUNDS': {
      // Subtract wounds from a target (result of combat calc confirm)
      const { instanceId, woundsToApply } = action;
      const unit = state.battleUnits[instanceId];
      if (!unit) return state;
      const newWounds = Math.max(0, unit.currentWounds - woundsToApply);
      const destroyed = newWounds === 0;
      return {
        ...state,
        battleUnits: {
          ...state.battleUnits,
          [instanceId]: { ...unit, currentWounds: newWounds, destroyed },
        },
      };
    }
    case 'END_GAME':
      return { ...state, appPhase: APP_PHASES.GAME_SUMMARY };

    case 'RESET':
      instanceCounter = 0;
      return { ...initialState };

    default:
      return state;
  }
}

export { initialState };
