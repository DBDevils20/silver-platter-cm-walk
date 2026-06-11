import { useNavigate } from 'react-router-dom';
import { useWalkStore, walkCompletion } from '../store/walkStore';
import { useAuthStore } from '../store/authStore';
import { StatusChip } from '../components/StatusChip';
import { ProgressBar } from '../components/ProgressBar';
import { SyncPanel } from '../components/SyncPanel';

export function HomeScreen() {
  const navigate = useNavigate();
  const walks = useWalkStore((s) => s.walks);
  const openWalk = useWalkStore((s) => s.openWalk);
  const currentUser = useAuthStore((s) => s.currentUser);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="mx-auto max-w-lg px-4 pb-12 pt-8">
      <div className="mb-3 flex items-center justify-between">
        <div className="eyebrow">Silver Platter · Phase 2</div>
        <div className="flex items-center gap-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-brass">{currentUser}</span>
          <button type="button" className="btn btn-ghost !px-2 !py-1 !text-[10px]" onClick={logout}>
            Log Out
          </button>
        </div>
      </div>

      <div className="panel brackets px-6 py-9 text-center">
        <span className="bk bk-tl" />
        <span className="bk bk-tr" />
        <span className="bk bk-bl" />
        <span className="bk bk-br" />
        <div className="font-display text-[26px] font-semibold tracking-[0.12em] text-ink-1">
          SILVER PLATTER
        </div>
        <div className="eyebrow mt-2">CM Site Walk</div>
      </div>

      <button type="button" className="btn btn-primary mt-5 w-full" onClick={() => navigate('/setup')}>
        Initiate Walk
      </button>

      <SyncPanel />

      <div className="mt-9">
        <div className="eyebrow mb-3">Saved Walks · {walks.length}</div>
        {walks.length === 0 && (
          <div className="font-mono text-[12px] italic text-ink-3">
            No walks on record. Initiate a walk to begin.
          </div>
        )}
        <div className="space-y-3">
          {walks.map((walk) => {
            const pct = walkCompletion(walk);
            return (
              <button
                key={walk.id}
                type="button"
                className="panel block w-full cursor-pointer p-4 text-left"
                onClick={() => {
                  openWalk(walk.id);
                  navigate('/walk/checklist');
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[14px] font-semibold text-brass">{walk.siteId}</span>
                  <StatusChip status={walk.status} />
                </div>
                <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-3">
                  {[walk.cmName || 'UNASSIGNED', walk.market, walk.walkDate].filter(Boolean).join(' · ')}
                </div>
                {walk.siteName && walk.siteName !== walk.siteId && (
                  <div className="mt-1 truncate font-mono text-[10px] text-ink-4">{walk.siteName}</div>
                )}
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex-1">
                    <ProgressBar percent={pct} />
                  </div>
                  <span className="font-mono text-[11px] text-ink-2 tnum">{pct}%</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-ink-4">
        Silver Platter · V{__APP_VERSION__}
      </div>
    </div>
  );
}
