import { PHASES } from '../state/gameReducer.js';

const PHASE_LABELS = ['Command', 'Movement', 'Shooting', 'Charge', 'Fight'];

function ChevronRight() {
  return (
    <svg viewBox="0 0 12 10" fill="currentColor" width="10" height="10" aria-hidden="true">
      <path d="M7 0l5 5-5 5-1.4-1.4L8.2 6H0V4h8.2L5.6 1.4z" />
    </svg>
  );
}

export function NextButton({ label, onClick }) {
  return (
    <button className="next-btn" onClick={onClick}>
      {label}
      <ChevronRight />
    </button>
  );
}

export function PhaseTab({ label, active, done }) {
  let cls = 'phase-tab';
  if (active) cls += ' phase-tab--active';
  else if (done) cls += ' phase-tab--done';
  return <div className={cls}>{label}</div>;
}

export default function PhaseNav({ currentPhaseIndex }) {
  return (
    <div className="phase-nav">
      <div className="phase-nav__tabs">
        {PHASES.map((ph, i) => (
          <PhaseTab
            key={ph}
            label={PHASE_LABELS[i]}
            active={i === currentPhaseIndex}
            done={i < currentPhaseIndex}
          />
        ))}
      </div>
    </div>
  );
}
