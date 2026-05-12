// Central game state reducer — all game state lives here.

export const PHASES = [
  'Command Phase',
  'Movement Phase',
  'Shooting Phase',
  'Charge Phase',
  'Fight Phase',
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
  firstPlayer: 1,

  // Battle Tracker
  currentRound: 1,
  currentTurn: 1,
  currentPhaseIndex: 0,
  battleUnits: {},

  // Command Points — both players start at 0, gain 1 each Command Phase
  cp: { 1: 0, 2: 0 },

  // Active stratagems with ongoing effects: [{ stratagemId, owner, instanceId|null, phase }]
  activeStratagems: [],
};

let instanceCounter = 0;
function makeInstanceId(unitId) {
  return `${unitId}_${++instanceCounter}`;
}

function clearBattleShockForPlayer(battleUnits, player) {
  const updated = {};
  for (const [id, unit] of Object.entries(battleUnits)) {
    updated[id] = unit.owner === player ? { ...unit, battleShocked: false } : unit;
  }
  return updated;
}

// Remove end_of_phase stratagems when a phase ends
function clearExpiredStratagems(activeStratagems) {
  return activeStratagems.filter((s) => s.duration !== 'end_of_phase');
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
      return { ...state, [key]: state[key].filter((u) => u.instanceId !== instanceId) };
    }
    case 'CONFIRM_ARMY': {
      const key = action.player === 1 ? 'player1Confirmed' : 'player2Confirmed';
      return { ...state, [key]: true };
    }
    case 'UNCONFIRM_ARMY': {
      const key = action.player === 1 ? 'player1Confirmed' : 'player2Confirmed';
      return { ...state, [key]: false };
    }
    case 'ADVANCE_TO_MISSION':
      return { ...state, appPhase: APP_PHASES.MISSION_SETUP };

    // ── Mission Setup ─────────────────────────────────────────────────────────
    case 'SET_GAME_TYPE':
      return { ...state, gameType: action.gameType };
    case 'SET_MISSION':
      return { ...state, mission: action.mission };
    case 'SET_TOTAL_ROUNDS':
      return { ...state, totalRounds: Math.max(1, Math.min(10, action.rounds)) };
    case 'SET_FIRST_PLAYER':
      return { ...state, firstPlayer: action.player };
    case 'START_BATTLE': {
      const battleUnits = {};
      const buildUnits = (army, owner) => {
        army.forEach((unit) => {
          battleUnits[unit.instanceId] = {
            ...unit, owner,
            currentWounds: unit.wounds,
            destroyed: false,
            notes: '',
            battleShocked: false,
          };
        });
      };
      buildUnits(state.player1Army, 1);
      buildUnits(state.player2Army, 2);
      const fp = state.firstPlayer;
      return {
        ...state,
        appPhase: APP_PHASES.BATTLE_TRACKER,
        battleUnits,
        currentRound: 1,
        currentTurn: fp,
        currentPhaseIndex: 0,
        // First player starts their Command Phase — they get 1 CP to start
        cp: { 1: fp === 1 ? 1 : 0, 2: fp === 2 ? 1 : 0 },
        activeStratagems: [],
      };
    }

    // ── Battle Tracker ────────────────────────────────────────────────────────
    case 'NEXT_PHASE': {
      const nextIndex = state.currentPhaseIndex + 1;
      // Clear any end_of_phase stratagems when the phase advances
      const clearedStratagems = clearExpiredStratagems(state.activeStratagems);

      if (nextIndex >= PHASES.length) {
        if (state.currentTurn === 1) {
          // Player 2's turn begins — Command Phase → +1 CP for P2
          return {
            ...state,
            currentTurn: 2,
            currentPhaseIndex: 0,
            cp: { ...state.cp, 2: state.cp[2] + 1 },
            battleUnits: clearBattleShockForPlayer(state.battleUnits, 2),
            activeStratagems: clearedStratagems,
          };
        } else {
          const nextRound = state.currentRound + 1;
          if (nextRound > state.totalRounds) {
            return { ...state, appPhase: APP_PHASES.GAME_SUMMARY };
          }
          // New round — Player 1's Command Phase → +1 CP for P1
          return {
            ...state,
            currentRound: nextRound,
            currentTurn: 1,
            currentPhaseIndex: 0,
            cp: { ...state.cp, 1: state.cp[1] + 1 },
            battleUnits: clearBattleShockForPlayer(state.battleUnits, 1),
            activeStratagems: clearedStratagems,
          };
        }
      }
      return { ...state, currentPhaseIndex: nextIndex, activeStratagems: clearedStratagems };
    }

    // ── CP Management ─────────────────────────────────────────────────────────
    case 'ADJUST_CP': {
      const { player, delta } = action;
      const newVal = Math.max(0, (state.cp[player] || 0) + delta);
      return { ...state, cp: { ...state.cp, [player]: newVal } };
    }

    // ── Stratagems ────────────────────────────────────────────────────────────
    case 'ACTIVATE_STRATAGEM': {
      const { stratagemId, player, instanceId, duration, badgeLabel } = action;
      const cost = action.cpCost || 1;
      const newCp = Math.max(0, (state.cp[player] || 0) - cost);
      // For instant stratagems just deduct CP; for end_of_phase ones also track
      if (duration !== 'end_of_phase') {
        return { ...state, cp: { ...state.cp, [player]: newCp } };
      }
      return {
        ...state,
        cp: { ...state.cp, [player]: newCp },
        activeStratagems: [
          ...state.activeStratagems,
          { stratagemId, owner: player, instanceId: instanceId || null, duration, badgeLabel },
        ],
      };
    }
    case 'DEACTIVATE_STRATAGEM': {
      return {
        ...state,
        activeStratagems: state.activeStratagems.filter((_, i) => i !== action.index),
      };
    }

    // ── Unit State ────────────────────────────────────────────────────────────
    case 'SET_BATTLE_SHOCKED': {
      const { instanceId, battleShocked } = action;
      const unit = state.battleUnits[instanceId];
      if (!unit) return state;
      return { ...state, battleUnits: { ...state.battleUnits, [instanceId]: { ...unit, battleShocked } } };
    }
    case 'SET_WOUNDS': {
      const { instanceId, wounds } = action;
      const unit = state.battleUnits[instanceId];
      if (!unit) return state;
      const clamped = Math.max(0, Math.min(unit.wounds, wounds));
      return { ...state, battleUnits: { ...state.battleUnits, [instanceId]: { ...unit, currentWounds: clamped, destroyed: clamped === 0 } } };
    }
    case 'SET_NOTES': {
      const { instanceId, notes } = action;
      const unit = state.battleUnits[instanceId];
      if (!unit) return state;
      return { ...state, battleUnits: { ...state.battleUnits, [instanceId]: { ...unit, notes } } };
    }
    case 'APPLY_WOUNDS': {
      const { instanceId, woundsToApply } = action;
      const unit = state.battleUnits[instanceId];
      if (!unit) return state;
      const newWounds = Math.max(0, unit.currentWounds - woundsToApply);
      return { ...state, battleUnits: { ...state.battleUnits, [instanceId]: { ...unit, currentWounds: newWounds, destroyed: newWounds === 0 } } };
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
