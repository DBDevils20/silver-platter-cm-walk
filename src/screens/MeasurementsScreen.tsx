import type { ReactNode } from 'react';
import { useActiveWalk, useWalkStore, uid } from '../store/walkStore';
import { Field } from '../components/Field';
import { MeasureInput } from '../components/MeasureInput';
import { PhotoCapture } from '../components/PhotoCapture';
import { PhotoStrip } from '../components/PhotoStrip';
import type { PhotoCategory } from '../types';

function MeasurePanel({
  title,
  accent = 'brass',
  evidence,
  strip,
  children
}: {
  title: string;
  accent?: 'brass' | 'info';
  evidence?: ReactNode;
  strip?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={`panel ${accent === 'brass' ? 'accent-left-brass' : 'accent-left-info'} space-y-3 p-4`}>
      <div className="flex items-center justify-between gap-2">
        <div className="eyebrow">{title}</div>
        {evidence}
      </div>
      {children}
      {strip}
    </div>
  );
}

export function MeasurementsScreen() {
  const walk = useActiveWalk();
  const updateMeasurements = useWalkStore((s) => s.updateMeasurements);
  const addPhoto = useWalkStore((s) => s.addPhoto);
  const updatePhoto = useWalkStore((s) => s.updatePhoto);
  const deletePhoto = useWalkStore((s) => s.deletePhoto);

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

  /** Evidence capture button + thumbnail strip for one measurement group. */
  function groupEvidence(groupId: string, groupTitle: string, category: PhotoCategory) {
    const photos = walk!.photos.filter((p) => p.itemId === groupId);
    return {
      evidence: (
        <PhotoCapture
          category={category}
          sectionLabel={`MEASUREMENTS · ${groupTitle.toUpperCase()}`}
          itemId={groupId}
          defaultCaption={`${groupTitle} measurement`}
          onCapture={addPhoto}
          className={`item-action ${photos.length > 0 ? 'has-content' : ''}`}
        >
          Photo{photos.length > 0 ? ` · ${photos.length}` : ''}
        </PhotoCapture>
      ),
      strip:
        photos.length > 0 ? (
          <PhotoStrip
            photos={photos}
            onUpdate={updatePhoto}
            onDelete={deletePhoto}
            stripClassName="flex gap-2 overflow-x-auto"
          />
        ) : undefined
    };
  }

  const compound = groupEvidence('meas-compound', 'Compound', 'COMPOUND');
  const easement = groupEvidence('meas-easement', 'Easement Runs', 'ACCESS');
  const power = groupEvidence('meas-power', 'Power Runs', 'POWER');
  const telco = groupEvidence('meas-telco', 'Telco Runs', 'TELCO');
  const tower = groupEvidence('meas-tower', 'Tower & RF', 'TOWER');

  return (
    <div className="mx-auto max-w-lg px-4 pb-24 pt-6">
      <div className="eyebrow mb-2">Phase 2 · Measurements</div>
      <h1>
        <em className="accent">Field</em> Measurements
      </h1>
      <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
        Measure with your phone's Measure app · Copy · Paste — units auto-convert
      </div>

      <div className="mt-5 space-y-4">
        <MeasurePanel title="Compound" evidence={compound.evidence} strip={compound.strip}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Length (ft)">
              <MeasureInput value={m.compoundLength} onChange={(v) => updateMeasurements({ compoundLength: v })} />
            </Field>
            <Field label="Width (ft)">
              <MeasureInput value={m.compoundWidth} onChange={(v) => updateMeasurements({ compoundWidth: v })} />
            </Field>
          </div>
        </MeasurePanel>

        <MeasurePanel title="Easement Runs" evidence={easement.evidence} strip={easement.strip}>
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
                <MeasureInput
                  value={run.lengthFt}
                  onChange={(v) =>
                    updateMeasurements({
                      easementRuns: m.easementRuns.map((r) => (r.id === run.id ? { ...r, lengthFt: v } : r))
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

        <MeasurePanel title="Power Runs" evidence={power.evidence} strip={power.strip}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="MMP→Meter (ft)">
              <MeasureInput value={m.powerMmpToMeter} onChange={(v) => updateMeasurements({ powerMmpToMeter: v })} />
            </Field>
            <Field label="Meter→Cabinets (ft)">
              <MeasureInput value={m.powerMeterToCabinets} onChange={(v) => updateMeasurements({ powerMeterToCabinets: v })} />
            </Field>
          </div>
          <div className="flex items-center justify-between border-t border-line-cold pt-3">
            <span className="eyebrow">Total Run</span>
            <span className="font-mono text-[15px] font-semibold text-ink-1 tnum">{Math.round(powerTotal * 100) / 100} FT</span>
          </div>
          {wireReview && <span className="chip chip-warn">A&amp;E Wire Size Review Required</span>}
        </MeasurePanel>

        <MeasurePanel title="Telco Runs" accent="info" evidence={telco.evidence} strip={telco.strip}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Telco MMP→D-Mark (ft)">
              <MeasureInput value={m.telcoMmpToDmark} onChange={(v) => updateMeasurements({ telcoMmpToDmark: v })} />
            </Field>
            <Field label="D-Mark→Cabinets (ft)">
              <MeasureInput value={m.telcoDmarkToCabinets} onChange={(v) => updateMeasurements({ telcoDmarkToCabinets: v })} />
            </Field>
          </div>
        </MeasurePanel>

        <MeasurePanel title="Tower &amp; RF" evidence={tower.evidence} strip={tower.strip}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tower Height (ft)">
              <MeasureInput value={m.towerHeight} onChange={(v) => updateMeasurements({ towerHeight: v })} />
            </Field>
            <Field label="Proposed NSD (ft)">
              <MeasureInput value={m.nsdHeight} onChange={(v) => updateMeasurements({ nsdHeight: v })} />
            </Field>
            <Field label="Crane Pad L (ft)">
              <MeasureInput value={m.cranePadLength} onChange={(v) => updateMeasurements({ cranePadLength: v })} />
            </Field>
            <Field label="Crane Pad W (ft)">
              <MeasureInput value={m.cranePadWidth} onChange={(v) => updateMeasurements({ cranePadWidth: v })} />
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
