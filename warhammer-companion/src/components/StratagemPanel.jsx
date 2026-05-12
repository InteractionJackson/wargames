import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { STRATAGEMS } from '../data/stratagems.js';

const CATEGORY_COLOUR = {
  'Battle Tactic': '#4a7a30',
  'Strategic Ploy': '#304878',
  'Wargear':        '#6a4a10',
  'Epic Deed':      '#6a1a6a',
};

const TURN_LABEL = {
  yours:    'Your turn',
  opponent: "Opponent's turn",
  either:   'Either turn',
};

export default function StratagemPanel({ currentPhase, activePlayer, cp, battleUnits, activeStratagems, dispatch, onClose }) {
  const [tab, setTab] = useState('reference');
  const [filter, setFilter] = useState('phase');
  const [activating, setActivating] = useState(null);

  const myUnits = Object.values(battleUnits).filter(
    (u) => u.owner === activePlayer && !u.destroyed
  );

  const myCp = cp[activePlayer] || 0;

  function isRelevantToPhase(s) {
    return s.phases.includes('any') || s.phases.includes(currentPhase);
  }

  const displayed = filter === 'phase'
    ? STRATAGEMS.filter(isRelevantToPhase)
    : STRATAGEMS;

  function handleUse(stratagem) {
    if (stratagem.unitTarget) {
      setActivating(stratagem);
    } else {
      dispatch({
        type: 'ACTIVATE_STRATAGEM',
        stratagemId: stratagem.id,
        player: activePlayer,
        cpCost: stratagem.cpCost,
        duration: stratagem.duration,
        badgeLabel: stratagem.badgeLabel || null,
        instanceId: null,
      });
    }
  }

  function handleUnitSelect(unit) {
    dispatch({
      type: 'ACTIVATE_STRATAGEM',
      stratagemId: activating.id,
      player: activePlayer,
      cpCost: activating.cpCost,
      duration: activating.duration,
      badgeLabel: activating.badgeLabel,
      instanceId: unit.instanceId,
    });
    setActivating(null);
  }

  return (
    // Overlay fades in
    <motion.div
      className="stratagem-overlay"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Panel slides up */}
      <motion.div
        className="stratagem-panel"
        onClick={(e) => e.stopPropagation()}
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 36 }}
      >
        {/* Header */}
        <div className="stratagem-panel-header">
          <span className="stratagem-panel-title">Core Stratagems</span>
          <button className="btn btn-sm btn-icon" onClick={onClose}>✕</button>
        </div>

        {/* Tabs with sliding indicator */}
        <div className="stratagem-tabs" style={{ position: 'relative' }}>
          {['reference', 'active'].map((t) => (
            <button
              key={t}
              className={`stratagem-tab${tab === t ? ' active' : ''}`}
              onClick={() => setTab(t)}
              style={{ position: 'relative', zIndex: 1 }}
            >
              {tab === t && (
                <motion.span
                  layoutId="stratagem-tab-indicator"
                  className="stratagem-tab-bg"
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}
              {t === 'reference' ? 'Reference' : (
                <>Active {activeStratagems.length > 0 && <span className="stratagem-tab-count">{activeStratagems.length}</span>}</>
              )}
            </button>
          ))}
        </div>

        {/* Unit picker overlay */}
        <AnimatePresence>
          {activating && (
            <motion.div
              className="stratagem-unit-picker"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.15 }}
            >
              <p className="stratagem-unit-picker-label">
                Apply <strong>{activating.name}</strong> to which unit?
              </p>
              <div className="stratagem-unit-list">
                {myUnits.map((u) => (
                  <button
                    key={u.instanceId}
                    className="btn btn-sm"
                    style={{ justifyContent: 'flex-start' }}
                    onClick={() => handleUnitSelect(u)}
                  >
                    {u.name}
                  </button>
                ))}
              </div>
              <button className="btn btn-sm" style={{ marginTop: '8px', color: 'var(--text-muted)' }} onClick={() => setActivating(null)}>
                Cancel
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {!activating && tab === 'reference' && (
            <motion.div
              key="reference"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <div className="stratagem-filter-row">
                <button
                  className={`btn btn-sm${filter === 'phase' ? ' btn-primary' : ''}`}
                  onClick={() => setFilter('phase')}
                >
                  This Phase ({STRATAGEMS.filter(isRelevantToPhase).length})
                </button>
                <button
                  className={`btn btn-sm${filter === 'all' ? ' btn-primary' : ''}`}
                  onClick={() => setFilter('all')}
                >
                  All ({STRATAGEMS.length})
                </button>
              </div>

              <div className="stratagem-list">
                {displayed.map((s) => {
                  const relevant = isRelevantToPhase(s);
                  const canAfford = myCp >= s.cpCost;
                  return (
                    <div key={s.id} className={`stratagem-card${relevant ? ' stratagem-relevant' : ''}`}>
                      <div className="stratagem-card-top">
                        <div style={{ flex: 1 }}>
                          <div className="stratagem-card-name">{s.name}</div>
                          <div className="stratagem-card-timing">{s.timingLabel}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                          <span className="stratagem-cp-badge">{s.cpCost}CP</span>
                          <span
                            className="stratagem-category-badge"
                            style={{ background: CATEGORY_COLOUR[s.category] }}
                          >
                            {s.category}
                          </span>
                        </div>
                      </div>
                      <div className="stratagem-effect">{s.shortEffect}</div>
                      {s.restrictions && (
                        <div className="stratagem-restriction">⚠ {s.restrictions}</div>
                      )}
                      {relevant && (
                        <button
                          className={`btn btn-sm${canAfford ? ' btn-primary' : ''}`}
                          style={{ marginTop: '6px', width: '100%', justifyContent: 'center', opacity: canAfford ? 1 : 0.5 }}
                          onClick={() => handleUse(s)}
                          title={canAfford ? `Use (costs ${s.cpCost}CP)` : `Not enough CP`}
                        >
                          {canAfford ? `Use — ${s.cpCost}CP` : `Need ${s.cpCost}CP`}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {!activating && tab === 'active' && (
            <motion.div
              key="active"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <div className="stratagem-active-list">
                {activeStratagems.length === 0 ? (
                  <p className="text-muted text-sm" style={{ padding: '12px' }}>
                    No stratagems with ongoing effects are active.
                  </p>
                ) : (
                  activeStratagems.map((as, i) => {
                    const s = STRATAGEMS.find((x) => x.id === as.stratagemId);
                    const unit = as.instanceId ? battleUnits[as.instanceId] : null;
                    if (!s) return null;
                    return (
                      <div key={i} className="stratagem-active-item">
                        <div style={{ flex: 1 }}>
                          <div className="stratagem-card-name">{s.name}</div>
                          {unit && (
                            <div className="stratagem-card-timing">→ {unit.name}</div>
                          )}
                          <div className="stratagem-card-timing" style={{ color: 'var(--warning)' }}>
                            Expires end of phase
                          </div>
                        </div>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => dispatch({ type: 'DEACTIVATE_STRATAGEM', index: i })}
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
