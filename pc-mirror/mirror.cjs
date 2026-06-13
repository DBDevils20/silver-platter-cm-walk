/**
 * Silver Platter — Egnyte mirror
 *
 * Pulls all walks from the Cloudflare sync backend and writes them into
 * this folder (one subfolder per walk: walk.json + extracted photos).
 * One-shot: run it and it exits. A Windows scheduled task on the office PC
 * runs it every 15 minutes ("Silver Platter Egnyte Mirror").
 *
 * FUTURE: replace this PC-based job with a scheduled Cloudflare Worker that
 * uploads straight to Egnyte's cloud REST API (needs an Egnyte API token) —
 * then no PC needs to be on.
 */
const fs = require('fs');
const path = require('path');

const BASE = 'https://silver-platter-sync.rkc-silver-platter.workers.dev';
const SYNC_KEY = 'SP-SYNC-1234';
const ROOT = path.join(__dirname, 'walks');
const LOG = path.join(__dirname, 'mirror-log.txt');

function log(msg) {
  const line = `${new Date().toISOString()}  ${msg}`;
  console.log(line);
  try {
    // Keep the log from growing unbounded.
    if (fs.existsSync(LOG) && fs.statSync(LOG).size > 512 * 1024) fs.unlinkSync(LOG);
    fs.appendFileSync(LOG, line + '\r\n');
  } catch {
    /* logging must never break the mirror */
  }
}

function safeName(value) {
  return String(value).replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 80);
}

async function api(pathname) {
  const res = await fetch(BASE + pathname, { headers: { 'X-Sync-Key': SYNC_KEY } });
  if (!res.ok) throw new Error(`${pathname}: HTTP ${res.status}`);
  return res.json();
}

function storeWalk(walk) {
  const dir = path.join(ROOT, `${safeName(walk.siteId || 'SITE')}_${safeName(walk.id)}`);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'walk.json'), JSON.stringify(walk, null, 2), 'utf8');
  const photoDir = path.join(dir, 'photos');
  const photos = Array.isArray(walk.photos) ? walk.photos : [];
  if (photos.length > 0) fs.mkdirSync(photoDir, { recursive: true });
  const keep = new Set();
  for (const photo of photos) {
    const match = /^data:image\/(\w+);base64,(.+)$/.exec(photo.dataUrl || '');
    if (!match) continue;
    const name = `${safeName(photo.id)}.${match[1] === 'png' ? 'png' : 'jpg'}`;
    keep.add(name);
    const file = path.join(photoDir, name);
    if (!fs.existsSync(file)) fs.writeFileSync(file, Buffer.from(match[2], 'base64'));
  }
  if (fs.existsSync(photoDir)) {
    for (const f of fs.readdirSync(photoDir)) {
      if (!keep.has(f)) fs.unlinkSync(path.join(photoDir, f));
    }
  }
}

function localLastModified(siteId, id) {
  const file = path.join(ROOT, `${safeName(siteId || 'SITE')}_${safeName(id)}`, 'walk.json');
  if (!fs.existsSync(file)) return '';
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')).lastModified || '';
  } catch {
    return '';
  }
}

(async () => {
  try {
    fs.mkdirSync(ROOT, { recursive: true });
    const remote = await api('/api/walks');
    let updated = 0;
    for (const summary of remote) {
      const local = localLastModified(summary.siteId, summary.id);
      if (!local || summary.lastModified > local) {
        const walk = await api(`/api/walks/${encodeURIComponent(summary.id)}`);
        storeWalk(walk);
        updated += 1;
        log(`updated ${summary.siteId} (${summary.id})`);
      }
    }
    log(`mirror complete — ${remote.length} walks on backend, ${updated} updated`);
  } catch (err) {
    log(`MIRROR FAILED: ${err.message || err}`);
    process.exitCode = 1;
  }
})();
