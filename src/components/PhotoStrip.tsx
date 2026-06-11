import { useState } from 'react';
import type { PhotoEntry } from '../types';

interface PhotoStripProps {
  photos: PhotoEntry[];
  onUpdate: (id: string, patch: Partial<PhotoEntry>) => void;
  onDelete: (id: string) => void;
  /** Layout of the thumbnail row; default suits checklist rows. */
  stripClassName?: string;
}

export function PhotoStrip({ photos, onUpdate, onDelete, stripClassName }: PhotoStripProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const openPhoto = photos.find((p) => p.id === openId) ?? null;

  if (photos.length === 0) return null;

  return (
    <>
      <div className={stripClassName ?? 'flex gap-2 overflow-x-auto px-3 pb-2 pl-10'}>
        {photos.map((photo) => (
          <button
            key={photo.id}
            type="button"
            className="shrink-0 cursor-pointer border-0 bg-transparent p-0"
            onClick={() => setOpenId(photo.id)}
          >
            <img
              src={photo.dataUrl}
              alt={photo.caption || 'Site photo'}
              className="h-14 w-14 rounded-s border border-line-cold object-cover"
            />
          </button>
        ))}
      </div>

      {openPhoto && (
        <div className="fixed inset-0 z-50 flex flex-col bg-void" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="eyebrow">Photo · Detail</span>
            <button type="button" className="btn btn-ghost !p-1" onClick={() => setOpenId(null)}>
              Close
            </button>
          </div>
          <div className="flex flex-1 items-center justify-center overflow-hidden bg-deck p-2">
            <img
              src={openPhoto.dataUrl}
              alt={openPhoto.caption || 'Site photo'}
              className="max-h-full max-w-full object-contain"
            />
          </div>
          <div className="space-y-3 border-t border-line p-4">
            {openPhoto.sectionLabel && <div className="eyebrow">{openPhoto.sectionLabel}</div>}
            <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-4 tnum">
              {new Date(openPhoto.capturedAt).toLocaleString()}
              {openPhoto.gpsLat != null && openPhoto.gpsLng != null &&
                ` · ${openPhoto.gpsLat.toFixed(5)}, ${openPhoto.gpsLng.toFixed(5)}${openPhoto.gpsSource === 'site' ? ' · Site Coords' : ''}`}
            </div>
            <div>
              <label className="field-label">Caption</label>
              <input
                className="input"
                value={openPhoto.caption}
                onChange={(e) => onUpdate(openPhoto.id, { caption: e.target.value })}
              />
            </div>
            <button
              type="button"
              className="btn btn-secondary w-full !text-alert"
              onClick={() => {
                onDelete(openPhoto.id);
                setOpenId(null);
              }}
            >
              Remove Photo
            </button>
          </div>
        </div>
      )}
    </>
  );
}
