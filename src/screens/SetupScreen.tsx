import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalkStore } from '../store/walkStore';
import { useAuthStore } from '../store/authStore';
import { Field } from '../components/Field';
import { SITE_TYPES } from '../utils/checklistData';

type GpsState = 'idle' | 'capturing' | 'captured' | 'denied';

export function SetupScreen() {
  const navigate = useNavigate();
  const createWalk = useWalkStore((s) => s.createWalk);
  const currentUser = useAuthStore((s) => s.currentUser);

  const [siteId, setSiteId] = useState('');
  const [market, setMarket] = useState('');
  const [cmName, setCmName] = useState(currentUser && currentUser !== 'admin' ? currentUser : '');
  const [pmName, setPmName] = useState('');
  const [rfEngineerName, setRfEngineerName] = useState('');
  const [walkDate, setWalkDate] = useState(new Date().toISOString().slice(0, 10));
  const [siteType, setSiteType] = useState(SITE_TYPES[0]);
  const [client, setClient] = useState('T-MOBILE');
  const [gpsState, setGpsState] = useState<GpsState>('idle');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');

  function captureGps() {
    if (!navigator.geolocation) {
      setGpsState('denied');
      return;
    }
    setGpsState('capturing');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setGpsState('captured');
      },
      () => setGpsState('denied'),
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }

  function initiate() {
    const walk = createWalk({
      siteId: siteId.trim().toUpperCase(),
      market: market.trim(),
      cmName: cmName.trim(),
      pmName: pmName.trim(),
      rfEngineerName: rfEngineerName.trim(),
      walkDate,
      siteType,
      client: client.trim() || 'T-MOBILE',
      gpsLat: lat ? parseFloat(lat) : null,
      gpsLng: lng ? parseFloat(lng) : null
    });
    if (walk) navigate('/walk/checklist');
  }

  const canInitiate = siteId.trim().length > 0 && cmName.trim().length > 0;

  return (
    <div className="mx-auto max-w-lg px-4 pb-12 pt-8">
      <div className="eyebrow mb-2">Phase 2 · Site Intake</div>
      <h1>
        <em className="accent">Walk</em> Setup
      </h1>

      <div className="panel mt-5 space-y-4 p-4">
        <Field label="Site ID">
          <input className="input" value={siteId} onChange={(e) => setSiteId(e.target.value)} placeholder="TMO-XX-0000" />
        </Field>
        <Field label="Market">
          <input className="input" value={market} onChange={(e) => setMarket(e.target.value)} />
        </Field>
        <Field label="CM Name">
          <input className="input" value={cmName} onChange={(e) => setCmName(e.target.value)} />
        </Field>
        <Field label="PM Name">
          <input className="input" value={pmName} onChange={(e) => setPmName(e.target.value)} />
        </Field>
        <Field label="RF Engineer">
          <input className="input" value={rfEngineerName} onChange={(e) => setRfEngineerName(e.target.value)} />
        </Field>
        <Field label="Walk Date">
          <input type="date" className="input" value={walkDate} onChange={(e) => setWalkDate(e.target.value)} />
        </Field>
        <Field label="Site Type">
          <select className="input" value={siteType} onChange={(e) => setSiteType(e.target.value)}>
            {SITE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Client">
          <input className="input" value={client} onChange={(e) => setClient(e.target.value)} />
        </Field>
      </div>

      <div className="panel mt-4 space-y-3 p-4">
        <div className="flex items-center justify-between">
          <span className="eyebrow">Coordinates</span>
          {gpsState === 'captured' && <span className="chip chip-ok">GPS Locked</span>}
          {gpsState === 'denied' && <span className="chip chip-warn">Manual Entry</span>}
        </div>
        <button type="button" className="btn btn-secondary w-full" onClick={captureGps} disabled={gpsState === 'capturing'}>
          {gpsState === 'capturing' ? 'Acquiring Position' : 'GPS Capture'}
        </button>
        {gpsState === 'captured' && (
          <div className="font-mono text-[13px] text-ink-2 tnum">
            {lat}, {lng}
          </div>
        )}
        {gpsState === 'denied' && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Latitude">
              <input className="input" inputMode="decimal" value={lat} onChange={(e) => setLat(e.target.value)} />
            </Field>
            <Field label="Longitude">
              <input className="input" inputMode="decimal" value={lng} onChange={(e) => setLng(e.target.value)} />
            </Field>
          </div>
        )}
      </div>

      <button type="button" className="btn btn-primary mt-5 w-full" disabled={!canInitiate} onClick={initiate}>
        Initiate Walk
      </button>
    </div>
  );
}
