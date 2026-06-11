import type { ReactNode } from 'react';
import { useActiveWalk, useWalkStore, uid } from '../store/walkStore';
import { Field } from '../components/Field';

function MeasurePanel({ title, accent = 'brass', children }: { title: string; accent?: 'brass' | 'info'; children: ReactNode }) {
  return (
    <div className={`panel ${accent === 'brass' ? 'accent-left-brass' : 'accent-left-info'} space-y-3 p-4`}>
      <div className="eyebrow">{title}</div>
      {children}
    </div>
  );
}

export function MeasurementsScreen() {
  const walk = useActiveWalk();
  const updateMeasurements = useWalkStore((s) => s.updateMeasurements);

  if (!walk) return null;
  const m = walk.measurements;

  const powerTotal = (parseFloat(m.powerMmpToMeter) || 0) + (parseFloat(m.powerMeterToCabinets) || 0);
  const wireReview = powerTotal > 200;

  function addRun() {
    if (m.easementRuns.length >= 4) return;
    updateMeasurements({
      easementRuns: [...m.easementRuns, { id: uid(), label: `RUN ${m.easementRuns.length + 1}`, lengthFt: '' }]
    });
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-24 pt-6">
      <div className="eyebrow mb-2">Phase 2 · Measurements</div>
      <h1>
        <em className="accent">Field</em> Measurements
      </h1>

      <div className="mt-5 space-y-4">
        <MeasurePanel title="Compound">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Length (ft)">
              <input className="input tnum" inputMode="decimal" value={m.compoundLength} onChange={(e) => updateMeasurements({ compoundLength: e.target.value })} />
            </Field>
            <Field label="Width (ft)">
              <input className="input tnum" inputMode="decimal" value={m.compoundWidth} onChange={(e) => updateMeasurements({ compoundWidth: e.target.value })} />
            </Field>
          </div>
        </MeasurePanel>

        <MeasurePanel title="Easement Runs">
          {m.easementRuns.length === 0 && (
            <div className="font-mono text-[12px] italic text-ink-3">No runs recorded.</div>
          )}
          {m.easementRuns.map((run, idx) => (
            <div key={run.id} className="grid grid-cols-2 gap-3">
              <Field label={`Run ${idx + 1} Label`}>
                <input
                  className="input"
                  value={run.label}
                  onChange={(e) =>
                    updateMeasurements({
                      easementRuns: m.easementRuns.map((r) => (r.id === run.id ? { ...r, label: e.target.value } : r))
                    })
                  }
                />
              </Field>
              <Field label="Length (ft)">
                <input
                  className="input tnum"
                  inputMode="decimal"
                  value={run.lengthFt}
                  onChange={(e) =>
                    updateMeasurements({
                      easementRuns: m.easementRuns.map((r) => (r.id === run.id ? { ...r, lengthFt: e.target.value } : r))
                    })
                  }
                />
              </Field>
            </div>
          ))}
          {m.easementRuns.length < 4 && (
            <button type="button" className="btn btn-ghost" onClick={addRun}>
              + Add Run
            </button>
          )}
        </MeasurePanel>

        <MeasurePanel title="Power Runs">
          <div className="grid grid-cols-2 gap-3">
            <Field label="MMP→Meter (ft)">
              <input className="input tnum" inputMode="decimal" value={m.powerMmpToMeter} onChange={(e) => updateMeasurements({ powerMmpToMeter: e.target.value })} />
            </Field>
            <Field label="Meter→Cabinets (ft)">
              <input className="input tnum" inputMode="decimal" value={m.powerMeterToCabinets} onChange={(e) => updateMeasurements({ powerMeterToCabinets: e.target.value })} />
            </Field>
          </div>
          <div className="flex items-center justify-between border-t border-line-cold pt-3">
            <span className="eyebrow">Total Run</span>
            <span className="font-mono text-[15px] font-semibold text-ink-1 tnum">{powerTotal} FT</span>
          </div>
          {wireReview && <span className="chip chip-warn">A&amp;E Wire Size Review Required</span>}
        </MeasurePanel>

        <MeasurePanel title="Telco Runs" accent="info">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Telco MMP→D-Mark (ft)">
              <input className="input tnum" inputMode="decimal" value={m.telcoMmpToDmark} onChange={(e) => updateMeasurements({ telcoMmpToDmark: e.target.value })} />
            </Field>
            <Field label="D-Mark→Cabinets (ft)">
              <input className="input tnum" inputMode="decimal" value={m.telcoDmarkToCabinets} onChange={(e) => updateMeasurements({ telcoDmarkToCabinets: e.target.value })} />
            </Field>
          </div>
        </MeasurePanel>

        <MeasurePanel title="Tower &amp; RF">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tower Height (ft)">
              <input className="input tnum" inputMode="decimal" value={m.towerHeight} onChange={(e) => updateMeasurements({ towerHeight: e.target.value })} />
            </Field>
            <Field label="Proposed NSD (ft)">
              <input className="input tnum" inputMode="decimal" value={m.nsdHeight} onChange={(e) => updateMeasurements({ nsdHeight: e.target.value })} />
            </Field>
            <Field label="Crane Pad L (ft)">
              <input className="input tnum" inputMode="decimal" value={m.cranePadLength} onChange={(e) => updateMeasurements({ cranePadLength: e.target.value })} />
            </Field>
            <Field label="Crane Pad W (ft)">
              <input className="input tnum" inputMode="decimal" value={m.cranePadWidth} onChange={(e) => updateMeasurements({ cranePadWidth: e.target.value })} />
            </Field>
          </div>
        </MeasurePanel>

        <MeasurePanel title="Notes">
          <textarea className="input" value={m.notes} onChange={(e) => updateMeasurements({ notes: e.target.value })} placeholder="MEASUREMENT NOTES" />
        </MeasurePanel>
      </div>
    </div>
  );
}
