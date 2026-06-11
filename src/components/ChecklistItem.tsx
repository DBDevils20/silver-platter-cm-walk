import { useState } from 'react';
import type { ChecklistItem as ChecklistItemType, ItemState, PhotoEntry } from '../types';
import { PhotoCapture } from './PhotoCapture';
import { NotesEditor } from './NotesEditor';
import { PhotoStrip } from './PhotoStrip';

const NEXT_STATE: Record<ItemState, ItemState> = {
  unchecked: 'checked',
  checked: 'flagged',
  flagged: 'unchecked'
};

const STATE_GLYPH: Record<ItemState, string> = {
  unchecked: '',
  checked: '✓',
  flagged: '◆'
};

interface ChecklistItemProps {
  item: ChecklistItemType;
  sectionLabel: string;
  photos: PhotoEntry[];
  onSetState: (state: ItemState) => void;
  onSetNotes: (notes: string) => void;
  onCapturePhoto: (photo: PhotoEntry) => void;
  onUpdatePhoto: (photoId: string, patch: Partial<PhotoEntry>) => void;
  onDeletePhoto: (photoId: string) => void;
}

export function ChecklistItemRow({
  item,
  sectionLabel,
  photos,
  onSetState,
  onSetNotes,
  onCapturePhoto,
  onUpdatePhoto,
  onDeletePhoto
}: ChecklistItemProps) {
  const [notesOpen, setNotesOpen] = useState(false);
  const showNotes = notesOpen || item.notes.length > 0;

  return (
    <div
      className="border-b border-line-cold last:border-b-0"
      style={item.state === 'flagged' ? { borderLeft: '2px solid rgba(217,119,102,0.45)' } : undefined}
    >
      <div className="flex min-h-[44px] items-center gap-2 px-3 py-2">
        <button
          type="button"
          aria-label={`Item state: ${item.state}`}
          className={`checkbox ${item.state === 'checked' ? 'is-checked' : ''} ${item.state === 'flagged' ? 'is-flagged' : ''}`}
          onClick={() => onSetState(NEXT_STATE[item.state])}
        >
          {STATE_GLYPH[item.state]}
        </button>
        <button
          type="button"
          className="flex-1 cursor-pointer border-0 bg-transparent p-0 text-left font-serif text-[15px] text-ink-1"
          onClick={() => setNotesOpen((v) => !v)}
        >
          {item.label}
        </button>
        <PhotoCapture
          category="GENERAL"
          sectionLabel={sectionLabel}
          itemId={item.id}
          defaultCaption={item.label}
          onCapture={onCapturePhoto}
          className={`item-action ${photos.length > 0 ? 'has-content' : ''}`}
        >
          Photo{photos.length > 0 ? ` · ${photos.length}` : ''}
        </PhotoCapture>
        <button
          type="button"
          className={`item-action ${item.notes.length > 0 ? 'has-content' : ''}`}
          onClick={() => setNotesOpen((v) => !v)}
        >
          Notes
        </button>
      </div>
      <PhotoStrip photos={photos} onUpdate={onUpdatePhoto} onDelete={onDeletePhoto} />
      {showNotes && (
        <div className="px-3 pb-3 pl-10">
          <NotesEditor value={item.notes} onChange={onSetNotes} />
        </div>
      )}
    </div>
  );
}
