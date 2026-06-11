import type { WalkStatus } from '../types';

const STATUS_META: Record<WalkStatus, { label: string; cls: string }> = {
  'in-progress': { label: 'In Progress', cls: 'chip-info' },
  complete: { label: 'Complete', cls: 'chip-ok' },
  submitted: { label: 'Submitted', cls: 'chip-brass' }
};

export function StatusChip({ status }: { status: WalkStatus }) {
  const meta = STATUS_META[status];
  return <span className={`chip ${meta.cls}`}>{meta.label}</span>;
}
