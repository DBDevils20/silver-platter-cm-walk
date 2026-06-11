/**
 * Silver Platter sync backend — Cloudflare Worker + Workers KV.
 *
 * Same API as the original Back End Sync Test server:
 *   GET  /api/health
 *   GET  /api/walks          → [{ id, siteId, status, lastModified }]
 *   GET  /api/walks/:id      → full walk JSON
 *   PUT  /api/walks/:id      → upsert (last-write-wins by lastModified)
 *
 * Walks are stored as KV values under walks/<id> with summary fields in the
 * key metadata so listing never has to read full values.
 */

// Pre-deterministic-id records, replaced by prov-*/seed-* equivalents.
// Rejected on write and hidden on read so stale devices can't resurrect them.
const RETIRED_IDS = new Set(['fn8g8sq8mq900835', 'vrlxo7zcmq900838', 'b5uoc005mq8xp456']);

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Sync-Key'
};

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: { ...CORS, 'Access-Control-Max-Age': '86400' } });
    }

    if (url.pathname === '/api/health') {
      return json(200, { ok: true, service: 'silver-platter-sync', time: new Date().toISOString() });
    }

    if (!url.pathname.startsWith('/api/walks')) {
      return json(404, { error: 'not found' });
    }

    if (request.headers.get('x-sync-key') !== env.SYNC_KEY) {
      return json(401, { error: 'invalid sync key' });
    }

    const idMatch = /^\/api\/walks\/([^/]+)$/.exec(url.pathname);

    if (request.method === 'GET' && url.pathname === '/api/walks') {
      const out = [];
      let cursor;
      do {
        const page = await env.WALKS.list({ prefix: 'walks/', cursor });
        for (const key of page.keys) {
          const meta = key.metadata ?? {};
          if (meta.id && !RETIRED_IDS.has(meta.id)) {
            out.push({ id: meta.id, siteId: meta.siteId ?? '', status: meta.status ?? '', lastModified: meta.lastModified ?? '' });
          }
        }
        cursor = page.list_complete ? undefined : page.cursor;
      } while (cursor);
      return json(200, out);
    }

    if (request.method === 'GET' && idMatch) {
      if (RETIRED_IDS.has(decodeURIComponent(idMatch[1]))) return json(410, { error: 'walk retired' });
      const value = await env.WALKS.get(`walks/${decodeURIComponent(idMatch[1])}`);
      if (value === null) return json(404, { error: 'walk not found' });
      return new Response(value, { status: 200, headers: { 'Content-Type': 'application/json', ...CORS } });
    }

    if (request.method === 'PUT' && idMatch) {
      const id = decodeURIComponent(idMatch[1]);
      if (RETIRED_IDS.has(id)) return json(200, { stored: false, reason: 'walk retired' });
      let walk;
      try {
        walk = await request.json();
      } catch {
        return json(400, { error: 'invalid walk payload' });
      }
      if (!walk || walk.id !== id) return json(400, { error: 'walk id mismatch' });

      const key = `walks/${id}`;
      const existingMeta = (await env.WALKS.getWithMetadata(key, { type: 'stream' })).metadata;
      const existingModified = existingMeta?.lastModified ?? '';
      if (existingModified && existingModified >= walk.lastModified) {
        return json(200, { stored: false, reason: 'remote copy is newer or equal' });
      }

      await env.WALKS.put(key, JSON.stringify(walk), {
        metadata: {
          id: walk.id,
          siteId: String(walk.siteId ?? ''),
          status: String(walk.status ?? ''),
          lastModified: String(walk.lastModified ?? '')
        }
      });
      return json(200, { stored: true });
    }

    return json(405, { error: 'method not allowed' });
  }
};
