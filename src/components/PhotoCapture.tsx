import { useRef } from 'react';
import type { ReactNode } from 'react';
import type { PhotoCategory, PhotoEntry } from '../types';
import { uid } from '../store/walkStore';

const MAX_DIMENSION = 1600;

async function downscaleToDataUrl(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = dataUrl;
  });
  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
  if (scale >= 1) return dataUrl;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.82);
}

interface PhotoCaptureProps {
  category?: PhotoCategory;
  sectionLabel?: string;
  itemId?: string | null;
  defaultCaption?: string;
  onCapture: (photo: PhotoEntry) => void;
  className?: string;
  children: ReactNode;
}

/**
 * The file input intentionally omits the `capture` attribute: on phones and
 * tablets the OS then offers both live camera capture and camera-roll upload.
 */
export function PhotoCapture({
  category = 'GENERAL',
  sectionLabel = '',
  itemId = null,
  defaultCaption = '',
  onCapture,
  className,
  children
}: PhotoCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    const dataUrl = await downscaleToDataUrl(file);
    onCapture({
      id: uid(),
      dataUrl,
      caption: defaultCaption,
      category,
      sectionLabel,
      itemId,
      capturedAt: new Date().toISOString()
    });
  }

  return (
    <>
      <button type="button" className={className} onClick={() => inputRef.current?.click()}>
        {children}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          void handleFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </>
  );
}
