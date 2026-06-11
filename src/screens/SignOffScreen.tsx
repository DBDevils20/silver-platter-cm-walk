import { useState } from 'react';
import { useActiveWalk, useWalkStore } from '../store/walkStore';
import { Field } from '../components/Field';
import { exportWalkPdf } from '../utils/pdfExport';
import type { WalkOutcome } from '../types';

const OUTCOMES: { value: Exclude<WalkOutcome, null>; glyph: string; label: string; accent: string }[] = [
  { value: 'ready', glyph: '✓', label: 'Ready', accent: 'var(--ok)' },
  { value: 'conditional', glyph: '◆', label: 'Conditional', accent: 'var(--warn)' },
  { value: 'not-ready', glyph: '●', label: 'Not Ready', accent: 'var(--alert)' }
];

export function SignOffScreen() {
  const walk = useActiveWalk();
  const setOutcome = useWalkStore((s) => s.setOutcome);
  const setOutcomeReason = useWalkStore((s) => s.setOutcomeReason);
  const setGeneralComments = useWalkStore((s) => s.setGeneralComments);
  const setSignOffName = useWalkStore((s) => s.setSignOffName);
  const certifyWalk = useWalkStore((s) => s.certifyWalk);
  const [exporting, setExporting] = useState(false);

  if (!walk) return null;

  const needsReason = walk.outcome === 'conditional' || walk.outcome === 'not-ready';
  const canCertify =
    walk.outcome !== null &&
    walk.signOff.cmName.trim().length > 0 &&
    (!needsReason || walk.outcomeReason.trim().length > 0) &&
    !walk.signOff.certifiedAt;

  async function handleExport() {
    if (!walk) return;
    setExporting(true);
    try {
      await exportWalkPdf(walk);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-24 pt-6">
      <div className="eyebrow mb-2">Phase 2 · Certification</div>
      <h1>
        <em className="accent">Walk</em> Sign-Off
      </h1>

      <div className="panel mt-5 space-y-3 p-4">
        <div className="eyebrow">General Comments</div>
        <textarea
          className="input !min-h-[120px]"
          value={walk.generalComments}
          onChange={(e) => setGeneralComments(e.target.value)}
          placeholder="WALK SUMMARY AND OBSERVATIONS"
        />
      </div>

      <div className="mt-4 space-y-3">
        <div className="eyebrow">Walk Outcome</div>
        {OUTCOMES.map((o) => {
          const selected = walk.outcome === o.value;
          return (
            <button
              key={o.value}
              type="button"
              className="panel flex w-full cursor-pointer items-center gap-4 p-4 text-left"
              style={{
                borderLeft: `3px solid ${o.accent}`,
                borderColor: selected ? 'rgba(201,169,97,0.32)' : undefined,
                borderLeftColor: o.accent,
                background: selected ? 'var(--bg-panel-2)' : undefined
              }}
              onClick={() => setOutcome(o.value)}
            >
              <span className="font-mono text-[16px]" style={{ color: o.accent }}>
                {o.glyph}
              </span>
              <span className="font-mono text-[13px] font-semibold uppercase tracking-[0.14em] text-ink-1">{o.label}</span>
              {selected && <span className="chip chip-brass ml-auto">Selected</span>}
            </button>
          );
        })}
      </div>

      {needsReason && (
        <div className="panel mt-4 space-y-3 p-4" style={{ borderColor: 'rgba(217,119,102,0.4)' }}>
          <div className="eyebrow">Blocking Issues · Required</div>
          <textarea
            className="input !min-h-[88px]"
            value={walk.outcomeReason}
            onChange={(e) => setOutcomeReason(e.target.value)}
            placeholder="DESCRIBE BLOCKING CONDITIONS"
          />
        </div>
      )}

      <div className="panel mt-4 space-y-4 p-4">
        <div className="eyebrow">Certifying Parties</div>
        <Field label="Project Manager">
          <input className="input" value={walk.signOff.pmName} onChange={(e) => setSignOffName('pmName', e.target.value)} />
        </Field>
        <Field label="RF Engineer">
          <input className="input" value={walk.signOff.rfEngineerName} onChange={(e) => setSignOffName('rfEngineerName', e.target.value)} />
        </Field>
        <Field label="Construction Manager">
          <input className="input" value={walk.signOff.cmName} onChange={(e) => setSignOffName('cmName', e.target.value)} />
        </Field>
      </div>

      {walk.signOff.certifiedAt && (
        <div className="mt-4 flex items-center gap-2">
          <span className="chip chip-brass">Certified</span>
          <span className="font-mono text-[11px] text-ink-3 tnum">
            {new Date(walk.signOff.certifiedAt).toLocaleString()}
          </span>
        </div>
      )}

      <div className="mt-5 space-y-3">
        <button type="button" className="btn btn-primary w-full" disabled={!canCertify} onClick={certifyWalk}>
          Certify Walk
        </button>
        <button type="button" className="btn btn-secondary w-full" disabled={exporting} onClick={() => void handleExport()}>
          {exporting ? 'Assembling Report' : 'Export Report'}
        </button>
      </div>
    </div>
  );
}
