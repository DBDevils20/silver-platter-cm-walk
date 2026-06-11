import { useActiveWalk, useWalkStore } from '../store/walkStore';
import { Field } from '../components/Field';
import { BORE_TRENCH_OPTIONS } from '../utils/checklistData';

function Seg<T extends string>({ value, options, onChange }: { value: T | ''; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="seg">
      {options.map((opt) => (
        <button key={opt.value} type="button" className={value === opt.value ? 'is-active' : ''} onClick={() => onChange(opt.value)}>
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function UtilitiesScreen() {
  const walk = useActiveWalk();
  const updatePower = useWalkStore((s) => s.updatePowerUtility);
  const updateTelco = useWalkStore((s) => s.updateTelcoUtility);

  if (!walk) return null;
  const { power, telco } = walk.utilities;

  function setProvider(idx: number, value: string) {
    const providers = telco.providers.map((p, i) => (i === idx ? value : p));
    updateTelco({ providers });
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-24 pt-6">
      <div className="eyebrow mb-2">Phase 2 · Utilities</div>
      <h1>
        <em className="accent">Site</em> Utilities
      </h1>

      <div className="mt-5 space-y-4">
        <div className="panel accent-left-brass space-y-4 p-4">
          <div className="eyebrow">Power</div>
          <Field label="Provider">
            <input className="input" value={power.provider} onChange={(e) => updatePower({ provider: e.target.value })} />
          </Field>
          <Field label="Feed Type">
            <Seg
              value={power.feedType}
              options={[
                { value: 'community' as const, label: 'Community' },
                { value: 'direct' as const, label: 'Direct' }
              ]}
              onChange={(v) => updatePower({ feedType: v })}
            />
          </Field>
          <Field label="Build-to-Power">
            <textarea className="input !min-h-[64px]" value={power.buildToPower} onChange={(e) => updatePower({ buildToPower: e.target.value })} />
          </Field>
          <Field label="MMP Location">
            <input className="input" value={power.mmpLocation} onChange={(e) => updatePower({ mmpLocation: e.target.value })} />
          </Field>
          <Field label="Bore vs Trench">
            <select className="input" value={power.boreOrTrench} onChange={(e) => updatePower({ boreOrTrench: e.target.value })}>
              <option value="">SELECT</option>
              {BORE_TRENCH_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Notes">
            <textarea className="input !min-h-[64px]" value={power.notes} onChange={(e) => updatePower({ notes: e.target.value })} />
          </Field>
        </div>

        <div className="panel accent-left-info space-y-4 p-4">
          <div className="eyebrow">Telco</div>
          {telco.providers.map((provider, idx) => (
            <Field key={idx} label={`Provider ${idx + 1}`}>
              <input className="input" value={provider} onChange={(e) => setProvider(idx, e.target.value)} />
            </Field>
          ))}
          {telco.providers.length < 3 && (
            <button type="button" className="btn btn-ghost" onClick={() => updateTelco({ providers: [...telco.providers, ''] })}>
              + Add Provider
            </button>
          )}
          <Field label="Preferred Provider">
            <input className="input" value={telco.preferredProvider} onChange={(e) => updateTelco({ preferredProvider: e.target.value })} />
          </Field>
          <Field label="D-Mark Location">
            <input className="input" value={telco.dmarkLocation} onChange={(e) => updateTelco({ dmarkLocation: e.target.value })} />
          </Field>
          <Field label="Fiber vs Coax">
            <Seg
              value={telco.fiberOrCoax}
              options={[
                { value: 'fiber' as const, label: 'Fiber' },
                { value: 'coax' as const, label: 'Coax' }
              ]}
              onChange={(v) => updateTelco({ fiberOrCoax: v })}
            />
          </Field>
          <Field label="Bore vs Trench">
            <select className="input" value={telco.boreOrTrench} onChange={(e) => updateTelco({ boreOrTrench: e.target.value })}>
              <option value="">SELECT</option>
              {BORE_TRENCH_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Notes">
            <textarea className="input !min-h-[64px]" value={telco.notes} onChange={(e) => updateTelco({ notes: e.target.value })} />
          </Field>
        </div>
      </div>
    </div>
  );
}
