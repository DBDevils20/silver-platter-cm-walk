import { useRef } from 'react';
import type { ReactNode } from 'react';
import type { PhotoCategory, PhotoEntry } from '../types';
import { uid, useActiveWalk } from '../store/walkStore';

const MAX_DIMENSION = 1600;

interface GpsFix {
  lat: number;
  lng: number;
  source: 'device' | 'site';
}

/** Live GPS fix, falling back to the walk's site coordinates. */
function getGpsFix(siteLat: number | null, siteLng: number | null): Promise<GpsFix | null> {
  const siteFallback: GpsFix | null =
    siteLat !== null && siteLng !== null ? { lat: siteLat, lng: siteLng, source: 'site' } : null;
  if (!navigator.geolocation) return Promise.resolve(siteFallback);
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, source: 'device' }),
      () => resolve(siteFallback),
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 30000 }
    );
  });
}

function formatStampTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function formatCoords(lat: number, lng: number): string {
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(5)}° ${ns}  ${Math.abs(lng).toFixed(5)}° ${ew}`;
}

/**
 * Downscale and burn an evidence stamp (timestamp + coordinates) onto the
 * bottom edge of the image.
 */
async function processPhoto(file: File, gps: GpsFix | null, capturedAt: Date): Promise<string> {
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
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const line1 = formatStampTime(capturedAt);
  const line2 = gps
    ? `${formatCoords(gps.lat, gps.lng)}${gps.source === 'site' ? '  (SITE COORDS)' : ''}`
    : 'GPS UNAVAILABLE';

  const fontSize = Math.max(13, Math.round(canvas.width * 0.024));
  const pad = Math.round(fontSize * 0.6);
  const lineGap = Math.round(fontSize * 1.3);
  const bandH = pad * 2 + lineGap + fontSize;

  ctx.fillStyle = 'rgba(7, 9, 15, 0.72)';
  ctx.fillRect(0, canvas.height - bandH, canvas.width, bandH);
  ctx.font = `600 ${fontSize}px "IBM Plex Mono", ui-monospace, monospace`;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#e8c77a';
  ctx.fillText(line1, pad, canvas.height - bandH + pad + fontSize);
  ctx.fillStyle = '#ecead6';
  ctx.fillText(line2, pad, canvas.height - bandH + pad + fontSize + lineGap);

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
  const walk = useActiveWalk();

  async function handleFile(file: File | undefined) {
    if (!file) return;
    const capturedAt = new Date();
    const gps = await getGpsFix(walk?.gpsLat ?? null, walk?.gpsLng ?? null);
    const dataUrl = await processPhoto(file, gps, capturedAt);
    onCapture({
      id: uid(),
      dataUrl,
      caption: defaultCaption,
      category,
      sectionLabel,
      itemId,
      capturedAt: capturedAt.toISOString(),
      gpsLat: gps?.lat ?? null,
      gpsLng: gps?.lng ?? null,
      gpsSource: gps?.source ?? null
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
