/**
 * Silver Platter — Back End Sync Test server
 *
 * Stores each site walk in its own subfolder under .\walks\ as walk.json,
 * with captured photos additionally extracted as .jpg files for browsing.
 * Because this folder lives on the Egnyte drive, everything written here
 * syncs to Egnyte cloud automatically.
 *
 * Run with:  node server.cjs   (or use start-sync-server.cmd)
 * No dependencies — plain Node.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8787;
const SYNC_KEY = 'SP-SYNC-1234'; // must match the key entered in the app
const ROOT = path.join(__dirname, 'walks');

fs.mkdirSync(ROOT, { recursive: true });

function safeName(value) {
  return String(value).replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 80);
}

function walkFolder(siteId, id) {
  return path.join(ROOT, `${safeName(siteId || 'SITE')}_${safeName(id)}`);
}

function listWalks() {
  const out = [];
  for (const entry of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const file = path.join(ROOT, entry.name, 'walk.json');
    if (!fs.existsSync(file)) continue;
    try {
      const walk = JSON.parse(fs.readFileSync(file, 'utf8'));
      out.push({ id: walk.id, siteId: walk.siteId, status: walk.status, lastModified: walk.lastModified });
    } catch {
      // unreadable walk.json — skip
    }
  }
  return out;
}

function readWalk(id) {
  for (const entry of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const file = path.join(ROOT, entry.name, 'walk.json');
    if (!fs.existsSync(file)) continue;
    try {
      const walk = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (walk.id === id) return walk;
    } catch {
      /* skip */
    }
  }
  return null;
}

function storeWalk(walk) {
  const dir = walkFolder(walk.siteId, walk.id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'walk.json'), JSON.stringify(walk, null, 2), 'utf8');
  // Extract photos as files so the team can browse them in Egnyte.
  const photoDir = path.join(dir, 'photos');
  const photos = Array.isArray(walk.photos) ? walk.photos : [];
  if (photos.length > 0) fs.mkdirSync(photoDir, { recursive: true });
  const keep = new Set();
  for (const photo of photos) {
    const match = /^data:image\/(\w+);base64,(.+)$/.exec(photo.dataUrl || '');
    if (!match) continue;
    const ext = match[1] === 'png' ? 'png' : 'jpg';
    const name = `${safeName(photo.id)}.${ext}`;
    keep.add(name);
    const file = path.join(photoDir, name);
    if (!fs.existsSync(file)) fs.writeFileSync(file, Buffer.from(match[2], 'base64'));
  }
  // Remove photo files for photos deleted in the app.
  if (fs.existsSync(photoDir)) {
    for (const f of fs.readdirSync(photoDir)) {
      if (!keep.has(f)) fs.unlinkSync(path.join(photoDir, f));
    }
  }
}

function send(res, status, body) {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Sync-Key'
  });
  res.end(data);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Sync-Key',
      'Access-Control-Max-Age': '86400'
    });
    res.end();
    return;
  }

  if (url.pathname === '/api/health') {
    send(res, 200, { ok: true, service: 'silver-platter-sync', time: new Date().toISOString() });
    return;
  }

  if (!url.pathname.startsWith('/api/walks')) {
    send(res, 404, { error: 'not found' });
    return;
  }

  if (req.headers['x-sync-key'] !== SYNC_KEY) {
    send(res, 401, { error: 'invalid sync key' });
    return;
  }

  const idMatch = /^\/api\/walks\/([^/]+)$/.exec(url.pathname);

  if (req.method === 'GET' && url.pathname === '/api/walks') {
    send(res, 200, listWalks());
    return;
  }

  if (req.method === 'GET' && idMatch) {
    const walk = readWalk(decodeURIComponent(idMatch[1]));
    if (!walk) {
      send(res, 404, { error: 'walk not found' });
      return;
    }
    send(res, 200, walk);
    return;
  }

  if (req.method === 'PUT' && idMatch) {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 100 * 1024 * 1024) req.destroy();
    });
    req.on('end', () => {
      try {
        const walk = JSON.parse(body);
        if (!walk.id || walk.id !== decodeURIComponent(idMatch[1])) {
          send(res, 400, { error: 'walk id mismatch' });
          return;
        }
        const existing = readWalk(walk.id);
        if (existing && existing.lastModified >= walk.lastModified) {
          send(res, 200, { stored: false, reason: 'remote copy is newer or equal' });
          return;
        }
        storeWalk(walk);
        send(res, 200, { stored: true });
      } catch (err) {
        send(res, 400, { error: 'invalid walk payload', detail: String(err) });
      }
    });
    return;
  }

  send(res, 405, { error: 'method not allowed' });
});

server.listen(PORT, () => {
  console.log(`Silver Platter sync server listening on http://localhost:${PORT}`);
  console.log(`Walk storage: ${ROOT}`);
});
