import { useState } from 'react';

export default function Tooltip({ text, children }) {
  const [open, setOpen] = useState(false);
  return (
    <span
      className="tooltip-wrap"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={() => setOpen((v) => !v)}
    >
      {children}
      {open && <span className="tooltip-box">{text}</span>}
    </span>
  );
}
