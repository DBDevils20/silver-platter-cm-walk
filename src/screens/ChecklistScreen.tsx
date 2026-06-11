import { useActiveWalk, useWalkStore, walkCompletion } from '../store/walkStore';
import { ChecklistSectionPanel } from '../components/ChecklistSection';
import { ProgressBar } from '../components/ProgressBar';
import type { PhotoEntry } from '../types';

export function ChecklistScreen() {
  const walk = useActiveWalk();
  const setItemState = useWalkStore((s) => s.setItemState);
  const setItemNotes = useWalkStore((s) => s.setItemNotes);
  const setSectionFreeText = useWalkStore((s) => s.setSectionFreeText);
  const addPhoto = useWalkStore((s) => s.addPhoto);
  const updatePhoto = useWalkStore((s) => s.updatePhoto);
  const deletePhoto = useWalkStore((s) => s.deletePhoto);

  if (!walk) return null;
  const pct = walkCompletion(walk);
  const photosByItem: Record<string, PhotoEntry[]> = {};
  for (const photo of walk.photos) {
    if (photo.itemId) (photosByItem[photo.itemId] ??= []).push(photo);
  }

  return (
    <div className="mx-auto max-w-lg pb-24">
      <div
        className="sticky top-0 z-30 border-b border-line bg-deck px-4 pb-3"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)', marginTop: 'calc(env(safe-area-inset-top) * -1)' }}
      >
        <div className="flex items-center justify-between">
          <span className="font-mono text-[13px] font-semibold text-brass">{walk.siteId}</span>
          <span className="font-mono text-[12px] text-ink-2 tnum">{pct}% COMPLETE</span>
        </div>
        <div className="mt-2">
          <ProgressBar percent={pct} />
        </div>
      </div>

      <div className="space-y-3 px-4 pt-4">
        {walk.sections.filter((section) => !section.freeTextOnly).map((section) => (
          <ChecklistSectionPanel
            key={section.id}
            section={section}
            photosByItem={photosByItem}
            onSetItemState={(itemId, state) => setItemState(section.id, itemId, state)}
            onSetItemNotes={(itemId, notes) => setItemNotes(section.id, itemId, notes)}
            onSetFreeText={(text) => setSectionFreeText(section.id, text)}
            onCapturePhoto={addPhoto}
            onUpdatePhoto={updatePhoto}
            onDeletePhoto={deletePhoto}
          />
        ))}
      </div>
    </div>
  );
}
