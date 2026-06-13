# Silver Platter CM Site Walk — Engineering Handoff

This document is for a developer taking over hosting and moving the backend
off the original author's PC. Read it top to bottom before changing anything.

---

## 1. What this app is

A mobile-first offline PWA used by Construction Managers during T-Mobile
wireless site walks. React + Vite + TypeScript, Zustand state, IndexedDB for
offline storage, jsPDF report export. 100% client-side app; the only server
piece is a small sync API so walks move between devices.

- **Live app:** https://dbdevils20.github.io/silver-platter-cm-walk/
- **Repo:** github.com/DBDevils20/silver-platter-cm-walk (public)
- **Current version:** see `package.json` `version` (shown in the app footer)

---

## 2. The three moving parts (and where each runs today)

| Part | What it is | Where it runs now | On the author's PC? |
|------|-----------|-------------------|---------------------|
| **Frontend** | The PWA itself | GitHub Pages (`gh-pages` branch) | No — fully hosted |
| **Sync backend** | Cloudflare Worker + Workers KV; stores walks, REST API | Cloudflare (`workers.dev`) | No — fully hosted |
| **Egnyte mirror** | Scheduled task that copies walks from the backend into an Egnyte folder | Windows Task Scheduler on the author's PC | **YES — this is the only PC dependency** |

> **The actual migration ask:** only the **Egnyte mirror** is tied to the PC.
> The frontend and sync backend already run in the cloud — they just need
> their **accounts** transferred (see §6). The recommended permanent fix for
> the mirror is in §7.

---

## 3. Repository layout

```
silver-platter-cm-walk/
├── src/                  Frontend app
│   ├── screens/          8 screens (Home, Setup, Checklist, Measures, Utilities, Docs, SignOff, Login)
│   ├── components/       Reusable UI (PhotoCapture, PhotoStrip, MeasureInput, BottomNav, SyncPanel, …)
│   ├── store/            Zustand stores — walkStore (data), authStore (login), syncStore (cross-device sync)
│   ├── auth/users.ts     Hardcoded login list (placeholder auth — see §8)
│   ├── utils/            pdfExport, checklistData, measureParse, siteDocs
│   └── db/indexeddb.ts   Offline persistence
├── sync-worker/          Cloudflare Worker backend (the sync API)
│   ├── src/worker.js     The API (GET/PUT /api/walks)
│   └── wrangler.toml     Worker config (KV namespace binding, SYNC_KEY)
├── pc-mirror/            The PC-based Egnyte mirror (to be replaced — see §7)
├── public/               PWA icons, manifest. NOTE: public/docs/ is gitignored (confidential site PDFs)
└── vite.config.ts        Build + PWA service worker config
```

---

## 4. Local development

```bash
npm install
npm run dev            # local dev server (sync points at the live Worker by default)
npm run build          # type-check + production build into dist/
```

Node 18+ required. No backend needed for frontend work — sync defaults to the
hosted Worker.

---

## 5. Deploy procedures (current)

### Frontend → GitHub Pages
The app is served from a subpath, so the build needs a base path, and the SPA
needs a 404 fallback. From the repo root:

```bash
# 1. Build with the Pages base path
DEPLOY_BASE=/silver-platter-cm-walk/ npm run build      # (PowerShell: $env:DEPLOY_BASE="/silver-platter-cm-walk/"; npm run build)
# 2. SPA + Jekyll prep
cp dist/index.html dist/404.html
touch dist/.nojekyll
# 3. Publish the dist/ folder to the gh-pages branch (force-push)
#    (init a throwaway git repo inside dist/, commit, push to gh-pages, delete .git)
# 4. Rebuild locally with the default base so `npm run dev` works again
npm run build
```

> Devices update on the SECOND app launch after a deploy (service worker caches
> the old version and swaps on next start). The version in the footer confirms
> which build a device is actually running. Bump `package.json` version on every
> user-facing change so this is diagnosable.

**Recommended improvement:** replace this manual dance with a GitHub Action that
builds and deploys to `gh-pages` on every push to `main`. (GitHub's
`actions/deploy-pages` + setting `base` from the workflow.)

### Sync backend → Cloudflare
```bash
cd sync-worker
wrangler deploy        # requires `wrangler login` to the Cloudflare account that owns the Worker
```

---

## 6. Accounts that must be transferred

These are the human/access pieces that can't be handed over in code:

1. **GitHub** — repo `DBDevils20/silver-platter-cm-walk`. Either add the new
   owner as a collaborator (Settings → Collaborators) or transfer the repo to a
   company GitHub org. Pages is served from the `gh-pages` branch — keep that.
2. **Cloudflare** — the Worker `silver-platter-sync` and its KV namespace live
   under the author's Cloudflare account. Options: add the new dev to that
   account, or **redeploy the Worker fresh under a company Cloudflare account**
   (recommended — clean ownership). If redeployed, the Worker URL changes; the
   app's built-in sync URL in `src/store/syncStore.ts` must be updated to match,
   and the KV data migrated (export walks via `GET /api/walks` + per-id, re-PUT
   to the new Worker — the same approach the mirror uses).
3. **Sync key** — currently `SP-SYNC-1234` (in `wrangler.toml` and
   `syncStore.ts`). Rotate it on handoff. It's a shared secret, not real auth.

See the credentials checklist the author sends separately for the specific
logins.

---

## 7. Recommended: retire the PC mirror entirely

The `pc-mirror/` scheduled task only exists to make walk data visible inside
Egnyte. It requires the author's PC to be on. **The permanent fix** (already
scoped, not yet built):

> Add a **scheduled Cloudflare Worker** (cron trigger) that reads updated walks
> from KV and uploads `walk.json` + photos directly to Egnyte's **cloud REST
> API**. No PC anywhere in the loop.

Requirement: an **Egnyte API token** from the RKC Egnyte admin console
(registered app / API key). Once you have that, this is a small addition to the
existing Worker — store the token as a Worker secret (`wrangler secret put`),
add a `scheduled()` handler, and POST to Egnyte's file API. Then delete the
Windows scheduled task ("Silver Platter Egnyte Mirror") and the `pc-mirror/`
folder.

Until then, the mirror in `pc-mirror/` is the reference: it runs every 15 min
via Task Scheduler and pulls from the Worker into the Egnyte folder.

---

## 8. Known limitations / good first improvements

- **Auth is placeholder.** `src/auth/users.ts` is a hardcoded list, all
  passwords `1234`, checked client-side. Fine as a field turnstile; replace with
  real auth (hashed creds or an identity provider) before any sensitive use.
- **Confidential docs are excluded from the repo.** `public/docs/` is
  gitignored; the in-app document register (`src/utils/siteDocs.ts`) is
  intentionally empty on the public deployment. If the app moves to private
  hosting, site PDFs can be re-added there.
- **Per-device data + last-write-wins.** Sync resolves conflicts per whole walk
  by `lastModified`. No field-level merge. Fine for one-CM-per-walk; revisit if
  multiple people edit one walk simultaneously.
- **No automated tests.** Verification has been manual (build + browser).

---

## 9. Quick-start checklist for the new owner

1. Clone the repo, `npm install`, `npm run dev` — confirm the app runs.
2. Get added to (or take over) the **GitHub** and **Cloudflare** accounts (§6).
3. Rotate the **sync key** (§6.3).
4. Decide hosting: keep GitHub Pages + Cloudflare, or move both to company infra.
5. Get an **Egnyte API token** and build the scheduled-Worker mirror (§7); then
   shut down the author's PC scheduled task.
6. (Optional but recommended) add a GitHub Action for one-step frontend deploys.
