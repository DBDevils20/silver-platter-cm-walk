import { useState } from 'react';
import { useSyncStore } from '../store/syncStore';
import { Field } from './Field';

const STATUS_META: Record<string, { label: string; cls: string }> = {
  off: { label: 'Sync Off', cls: 'chip-mute' },
  idle: { label: 'Synced', cls: 'chip-ok' },
  syncing: { label: 'Syncing', cls: 'chip-info' },
  error: { label: 'Sync Error', cls: 'chip-alert' }
};

export function SyncPanel() {
  const { serverUrl, syncKey, status, lastSyncAt, lastError, configure, syncNow } = useSyncStore();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(serverUrl);
  const [key, setKey] = useState(syncKey);
  const meta = STATUS_META[status];

  return (
    <div className="mt-4">
      <button
        type="button"
        className="flex w-full items-center justify-between border-0 bg-transparent p-0 cursor-pointer"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="eyebrow">Cross-Device Sync</span>
        <span className={`chip ${meta.cls}`}>{meta.label}</span>
      </button>
      {open && (
        <div className="panel mt-2 space-y-3 p-4">
          <Field label="Sync Server URL">
            <input
              className="input"
              placeholder="https://your-tunnel.trycloudflare.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </Field>
          <Field label="Sync Key">
            <input className="input" value={key} onChange={(e) => setKey(e.target.value)} />
          </Field>
          <div className="flex gap-2">
            <button type="button" className="btn btn-primary flex-1" onClick={() => configure(url, key)}>
              Save &amp; Sync
            </button>
            <button
              type="button"
              className="btn btn-secondary flex-1"
              disabled={!serverUrl || status === 'syncing'}
              onClick={() => void syncNow()}
            >
              Sync Now
            </button>
          </div>
          {lastSyncAt && (
            <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-4 tnum">
              Last sync {new Date(lastSyncAt).toLocaleTimeString()}
            </div>
          )}
          {status === 'error' && lastError && (
            <div className="font-mono text-[11px] text-alert">{lastError}</div>
          )}
        </div>
      )}
    </div>
  );
}
