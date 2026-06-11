import type { WalkOutcome } from '../types';

const OUTCOME_META: Record<Exclude<WalkOutcome, null>, { glyph: string; label: string; cls: string }> = {
  ready: { glyph: '✓', label: 'Ready', cls: 'chip-ok' },
  conditional: { glyph: '◆', label: 'Conditional', cls: 'chip-warn' },
  'not-ready': { glyph: '●', label: 'Not Ready', cls: 'chip-alert' }
};

export function OutcomeBadge({ outcome }: { outcome: WalkOutcome }) {
  if (!outcome) return <span className="chip chip-mute">Pending</span>;
  const meta = OUTCOME_META[outcome];
  return (
    <span className={`chip ${meta.cls}`}>
      <span>{meta.glyph}</span>
      {meta.label}
    </span>
  );
}
