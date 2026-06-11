import { create } from 'zustand';
import type { SiteWalk } from '../types';
import { useWalkStore } from './walkStore';

export type SyncStatus = 'off' | 'idle' | 'syncing' | 'error';

const URL_KEY = 'sp-sync-url';
const SECRET_KEY = 'sp-sync-key';

// Built-in backend: sync works out of the box with no user setup.
// The panel on Home can still override these (e.g. to point at a test server).
const DEFAULT_SYNC_URL = 'https://silver-platter-sync.rkc-silver-platter.workers.dev';
const DEFAULT_SYNC_KEY = 'SP-SYNC-1234';

function initialUrl(): string {
  const stored = localStorage.getItem(URL_KEY);
  // Adopt the built-in backend if nothing is configured, or if the device
  // still points at a retired temporary tunnel.
  if (!stored || stored.includes('trycloudflare.com') || stored.includes('localhost')) {
    return DEFAULT_SYNC_URL;
  }
  return stored;
}

function initialKey(): string {
  return localStorage.getItem(SECRET_KEY) || DEFAULT_SYNC_KEY;
}

interface RemoteWalkSummary {
  id: string;
  siteId: string;
  status: string;
  lastModified: string;
}

interface SyncState {
  serverUrl: string;
  syncKey: string;
  status: SyncStatus;
  lastSyncAt: string | null;
  lastError: string;
  configure: (serverUrl: string, syncKey: string) => void;
  syncNow: () => Promise<void>;
}

let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;

function normalizeUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

async function api<T>(base: string, key: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(base + path, {
    ...init,
    headers: { 'Content-Type': 'application/json', 'X-Sync-Key': key, ...(init?.headers ?? {}) }
  });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return (await res.json()) as T;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  serverUrl: initialUrl(),
  syncKey: initialKey(),
  status: 'idle',
  lastSyncAt: null,
  lastError: '',

  configure: (serverUrl, syncKey) => {
    const url = normalizeUrl(serverUrl);
    localStorage.setItem(URL_KEY, url);
    localStorage.setItem(SECRET_KEY, syncKey);
    set({ serverUrl: url, syncKey, status: url ? 'idle' : 'off', lastError: '' });
    if (url) void get().syncNow();
  },

  syncNow: async () => {
    const { serverUrl, syncKey, status } = get();
    if (!serverUrl || status === 'syncing') return;
    set({ status: 'syncing', lastError: '' });
    try {
      const walkStore = useWalkStore.getState();
      const remote = await api<RemoteWalkSummary[]>(serverUrl, syncKey, '/api/walks');
      const remoteById = new Map(remote.map((r) => [r.id, r]));
      const localWalks = useWalkStore.getState().walks;
      const localById = new Map(localWalks.map((w) => [w.id, w]));

      // Pull: remote walks that are new or newer than our copy.
      for (const summary of remote) {
        const local = localById.get(summary.id);
        if (!local || summary.lastModified > local.lastModified) {
          const full = await api<SiteWalk>(serverUrl, syncKey, `/api/walks/${encodeURIComponent(summary.id)}`);
          walkStore.upsertWalkFromSync(full);
        }
      }

      // Push: local walks that are new or newer than the server copy.
      for (const walk of useWalkStore.getState().walks) {
        const summary = remoteById.get(walk.id);
        if (!summary || walk.lastModified > summary.lastModified) {
          await api(serverUrl, syncKey, `/api/walks/${encodeURIComponent(walk.id)}`, {
            method: 'PUT',
            body: JSON.stringify(walk)
          });
        }
      }

      set({ status: 'idle', lastSyncAt: new Date().toISOString() });
    } catch (err) {
      set({ status: 'error', lastError: err instanceof Error ? err.message : String(err) });
    }
  }
}));

/** Debounced push — called by the walk store after every mutation. */
export function scheduleSync(): void {
  if (!useSyncStore.getState().serverUrl) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    void useSyncStore.getState().syncNow();
  }, 2500);
}

/** Start periodic background sync. Called once at app startup. */
export function startSyncLoop(): void {
  if (pollTimer) return;
  pollTimer = setInterval(() => {
    if (useSyncStore.getState().serverUrl) void useSyncStore.getState().syncNow();
  }, 30000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && useSyncStore.getState().serverUrl) {
      void useSyncStore.getState().syncNow();
    }
  });
  if (useSyncStore.getState().serverUrl) void useSyncStore.getState().syncNow();
}
