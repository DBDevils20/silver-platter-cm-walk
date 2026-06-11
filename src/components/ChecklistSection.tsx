import { useState } from 'react';
import type { ChecklistSection as ChecklistSectionType, ItemState, PhotoEntry } from '../types';
import { sectionCompletion } from '../store/walkStore';
import { ChecklistItemRow } from './ChecklistItem';

interface ChecklistSectionProps {
  section: ChecklistSectionType;
  photosByItem: Record<string, PhotoEntry[]>;
  onSetItemState: (itemId: string, state: ItemState) => void;
  onSetItemNotes: (itemId: string, notes: string) => void;
  onSetFreeText: (text: string) => void;
  onCapturePhoto: (photo: PhotoEntry) => void;
  onUpdatePhoto: (photoId: string, patch: Partial<PhotoEntry>) => void;
  onDeletePhoto: (photoId: string) => void;
}

export function ChecklistSectionPanel({
  section,
  photosByItem,
  onSetItemState,
  onSetItemNotes,
  onSetFreeText,
  onCapturePhoto,
  onUpdatePhoto,
  onDeletePhoto
}: ChecklistSectionProps) {
  const { done, total } = sectionCompletion(section);
  const isComplete = !section.freeTextOnly && total > 0 && done === total;
  const [open, setOpen] = useState(!isComplete);
  const sectionLabel = `${String(section.number).padStart(2, '0')} · ${section.title}`;

  return (
    <div className="panel overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center gap-3 border-0 bg-panel-2 px-3 py-3 text-left cursor-pointer"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="font-mono text-[11px] font-semibold text-brass">
          {String(section.number).padStart(2, '0')}
        </span>
        <h2 className="flex-1 font-serif text-[17px] font-semibold text-ink-1">{section.title}</h2>
        {isComplete && <span className="font-mono text-[12px] text-brass">✓</span>}
        {!section.freeTextOnly && (
          <span className={`chip ${isComplete ? 'chip-brass' : 'chip-mute'} tnum`}>
            {done} / {total}
          </span>
        )}
        <span className="font-mono text-[11px] text-ink-4">{open ? '▾' : '▸'}</span>
      </button>
      {open &&
        (section.freeTextOnly ? (
          <div className="p-3">
            <textarea
              className="input !min-h-[120px]"
              placeholder="GENERAL NOTES"
              value={section.freeText}
              onChange={(e) => onSetFreeText(e.target.value)}
            />
          </div>
        ) : (
          <div>
            {section.items.map((item) => (
              <ChecklistItemRow
                key={item.id}
                item={item}
                sectionLabel={sectionLabel}
                photos={photosByItem[item.id] ?? []}
                onSetState={(state) => onSetItemState(item.id, state)}
                onSetNotes={(notes) => onSetItemNotes(item.id, notes)}
                onCapturePhoto={onCapturePhoto}
                onUpdatePhoto={onUpdatePhoto}
                onDeletePhoto={onDeletePhoto}
              />
            ))}
          </div>
        ))}
    </div>
  );
}
