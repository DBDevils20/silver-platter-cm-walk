SILVER PLATTER - BACK END SYNC
==============================

STATUS: MOVED TO CLOUDFLARE (2026-06-11)

The live sync backend now runs on Cloudflare Workers - always on,
nothing runs on the office PC anymore:

  Sync URL:  https://silver-platter-sync.rkc-silver-platter.workers.dev
  Sync key:  SP-SYNC-1234

In the app: HOME -> CROSS-DEVICE SYNC -> enter the URL and key above.
This URL is permanent - it does not change.

Walk data is stored in Cloudflare Workers KV (account: a.boyd@tn-tower.com).
Worker source code lives in the app repo under sync-worker\
(github.com/DBDevils20/silver-platter-cm-walk).

EGNYTE MIRROR (runs on the office PC)
- mirror.cjs / run-mirror.cmd: pulls every walk from the Cloudflare backend
  into walks\ (one subfolder per walk: walk.json + photos).
- Runs automatically every 15 minutes via Windows Task Scheduler on the
  office PC (task name: "Silver Platter Egnyte Mirror"). The PC must be on
  and logged in for the mirror to run; the app itself does NOT depend on it.
- Activity log: mirror-log.txt

PLANNED UPGRADE (noted for later)
Replace the PC mirror with a scheduled Cloudflare Worker that uploads
walks directly to Egnyte's cloud REST API - no PC needed. Requires an
Egnyte API token (Egnyte admin -> registered apps / API keys).

WHAT ELSE IS IN THIS FOLDER
- server.cjs / start-sync-server.cmd: the original PC-based test server.
  No longer running; kept for reference. Do not start it unless reverting.
- walks\: the live mirror of walk data (refreshed every 15 minutes).
