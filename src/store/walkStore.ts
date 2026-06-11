import { create } from 'zustand';
import type {
  ChecklistSection,
  ItemState,
  MeasurementsData,
  PhotoEntry,
  PowerUtility,
  RiskEntry,
  SiteWalk,
  TelcoUtility,
  WalkOutcome
} from '../types';
import { dbGetAllWalks, dbPutWalk } from '../db/indexeddb';
import { createMeasurements, createSections, createUtilities } from '../utils/checklistData';

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function nowISO(): string {
  return new Date().toISOString();
}

// Notifies the sync layer after local mutations. Registered at startup
// (callback indirection avoids a circular import with the sync store).
let onWalkMutated: (() => void) | null = null;
export function setOnWalkMutated(fn: () => void): void {
  onWalkMutated = fn;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function walkCompletion(walk: SiteWalk): number {
  const items = walk.sections.filter((s) => !s.freeTextOnly).flatMap((s) => s.items);
  if (items.length === 0) return 0;
  const done = items.filter((i) => i.state !== 'unchecked').length;
  return Math.round((done / items.length) * 100);
}

export function sectionCompletion(section: ChecklistSection): { done: number; total: number } {
  return {
    done: section.items.filter((i) => i.state !== 'unchecked').length,
    total: section.items.length
  };
}

export interface WalkSetupInput {
  siteId: string;
  market: string;
  cmName: string;
  pmName: string;
  rfEngineerName: string;
  walkDate: string;
  siteType: string;
  client: string;
  gpsLat: number | null;
  gpsLng: number | null;
}

function buildWalk(setup: WalkSetupInput): SiteWalk {
  const ts = nowISO();
  return {
    id: uid(),
    siteId: setup.siteId,
    siteName: setup.siteId,
    market: setup.market,
    cmName: setup.cmName,
    pmName: setup.pmName,
    rfEngineerName: setup.rfEngineerName,
    walkDate: setup.walkDate || todayISO(),
    siteType: setup.siteType,
    client: setup.client || 'T-MOBILE',
    gpsLat: setup.gpsLat,
    gpsLng: setup.gpsLng,
    status: 'in-progress',
    outcome: null,
    outcomeReason: '',
    generalComments: '',
    sections: createSections(),
    measurements: createMeasurements(),
    utilities: createUtilities(),
    photos: [],
    risks: [],
    signOff: {
      pmName: setup.pmName,
      rfEngineerName: setup.rfEngineerName,
      cmName: setup.cmName,
      certifiedAt: null
    },
    createdAt: ts,
    completedAt: null,
    lastModified: ts
  };
}

function buildSeedWalk(): SiteWalk {
  const walk = buildWalk({
    siteId: 'TMO-FL-0047',
    market: 'Orlando',
    cmName: 'Demo User',
    pmName: 'A. Reyes',
    rfEngineerName: 'K. Tran',
    walkDate: todayISO(),
    siteType: 'MACRO TOWER',
    client: 'T-MOBILE',
    gpsLat: 28.5384,
    gpsLng: -81.3789
  });
  // Pre-mark some progress so the UI is immediately demonstrable.
  const s1 = walk.sections[0];
  s1.items[0].state = 'checked';
  s1.items[1].state = 'checked';
  s1.items[2].state = 'checked';
  const s2 = walk.sections[1];
  s2.items[0].state = 'checked';
  const s4 = walk.sections[3];
  s4.items[0].state = 'checked';
  const flagged = s4.items[6]; // Bore vs trench identified
  flagged.state = 'flagged';
  flagged.notes = 'Rock shelf suspected along east run — bore feasibility in question.';
  walk.risks.push({
    id: uid(),
    section: `04 · ${s4.title}`,
    item: flagged.label,
    severity: 'medium',
    mitigation: '',
    source: 'flag',
    itemId: flagged.id
  });
  return walk;
}

// Real sites provisioned from project documentation (RFDS / coverage strategy /
// E911 records on Egnyte). Created on any device that doesn't have them yet.
const PROVISIONED_WALKS: { setup: WalkSetupInput; apply: (walk: SiteWalk) => void }[] = [
  {
    setup: {
      siteId: 'A2A2116A',
      market: 'ORLANDO FL',
      cmName: '',
      pmName: '',
      rfEngineerName: '',
      walkDate: todayISO(),
      siteType: 'MONOPOLE',
      client: 'T-MOBILE',
      gpsLat: 29.3877,
      gpsLng: -81.147775
    },
    apply: (walk) => {
      walk.siteName = 'US-FL-5188 · RS I-95 Halifax Plantation';
      walk.measurements.nsdHeight = '158';
      walk.utilities.power.provider = 'FPL';
      walk.utilities.telco.providers = ['Zayo'];
      walk.sections[15].freeText =
        'US-FL-5188 · RS I-95 Halifax Plantation. Landlord: Rowstar LLC / Vertical Bridge — FDOT right-of-way. ' +
        'Address: 277 N I-95, Ormond Beach FL 32174 (E911 mile-marker address — site accessible from interstate only per Volusia County E911). ' +
        '4-sector monopole, NSD RAD center 158 ft. Azimuths 25 / 115 / 205 / 295. ' +
        'Ericsson 4Sec-67F5D998E 6160; FFVV-65C-R2N23 octo + AIR6419 B41 per sector. ' +
        'Power: FPL (account setup in progress). Telco: Zayo AAV. ' +
        'RKC precon site walk completed 7/25/25. FCD Rev 1 issued 10/23/25.';
    }
  },
  {
    setup: {
      siteId: 'A2F2258A',
      market: 'TAMPA FL',
      cmName: '',
      pmName: '',
      rfEngineerName: '',
      walkDate: todayISO(),
      siteType: 'MONOPOLE',
      client: 'T-MOBILE',
      gpsLat: 27.424191,
      gpsLng: -82.369873
    },
    apply: (walk) => {
      walk.siteName = 'ATC 412180 · Schroeder Ranch SR 70';
      walk.measurements.nsdHeight = '180';
      walk.sections[15].freeText =
        'ATC 412180 · Schroeder Ranch SR 70. Landlord: American Tower. ' +
        'Address: 16755 E SR 70, Bradenton FL 34211. Market swap project (POR0845595). ' +
        '4-sector monopole, NSD RAD center 180 ft. Azimuths 40 / 135 / 215 / 310. ' +
        'Ericsson 4Sec-67E5D998E 6160 (no GSM); 840590966 octo + AIR6419 B41 per sector. ' +
        'Structural analysis on file at 79.80% (passing). RKC precon site walk 10/7/25.';
    }
  }
];

interface WalkStoreState {
  walks: SiteWalk[];
  activeWalkId: string | null;
  loaded: boolean;
  load: () => Promise<void>;
  createWalk: (setup: WalkSetupInput) => SiteWalk;
  openWalk: (id: string) => void;
  closeWalk: () => void;
  upsertWalkFromSync: (walk: SiteWalk) => void;
  mutateActive: (fn: (walk: SiteWalk) => void) => void;
  setItemState: (sectionId: string, itemId: string, state: ItemState) => void;
  setItemNotes: (sectionId: string, itemId: string, notes: string) => void;
  setSectionFreeText: (sectionId: string, text: string) => void;
  updateMeasurements: (patch: Partial<MeasurementsData>) => void;
  updatePowerUtility: (patch: Partial<PowerUtility>) => void;
  updateTelcoUtility: (patch: Partial<TelcoUtility>) => void;
  addPhoto: (photo: PhotoEntry) => void;
  updatePhoto: (id: string, patch: Partial<PhotoEntry>) => void;
  deletePhoto: (id: string) => void;
  addRisk: (risk: RiskEntry) => void;
  updateRisk: (id: string, patch: Partial<RiskEntry>) => void;
  deleteRisk: (id: string) => void;
  setOutcome: (outcome: WalkOutcome) => void;
  setOutcomeReason: (reason: string) => void;
  setGeneralComments: (comments: string) => void;
  setSignOffName: (field: 'pmName' | 'rfEngineerName' | 'cmName', value: string) => void;
  certifyWalk: () => void;
}

export const useWalkStore = create<WalkStoreState>((set, get) => ({
  walks: [],
  activeWalkId: null,
  loaded: false,

  load: async () => {
    if (get().loaded) return;
    let walks = await dbGetAllWalks();
    if (walks.length === 0 && !localStorage.getItem('sp-seeded')) {
      const seed = buildSeedWalk();
      seed.id = 'seed-TMO-FL-0047'; // deterministic so devices don't duplicate it via sync
      await dbPutWalk(seed);
      localStorage.setItem('sp-seeded', '1');
      walks = [seed];
    }
    for (const prov of PROVISIONED_WALKS) {
      if (!walks.some((w) => w.siteId === prov.setup.siteId)) {
        const walk = buildWalk(prov.setup);
        walk.id = `prov-${prov.setup.siteId}`; // deterministic so devices don't duplicate it via sync
        prov.apply(walk);
        await dbPutWalk(walk);
        walks.push(walk);
      }
    }
    walks.sort((a, b) => b.lastModified.localeCompare(a.lastModified));
    set({ walks, loaded: true });
  },

  createWalk: (setup) => {
    const walk = buildWalk(setup);
    set((s) => ({ walks: [walk, ...s.walks], activeWalkId: walk.id }));
    void dbPutWalk(walk);
    onWalkMutated?.();
    return walk;
  },

  openWalk: (id) => set({ activeWalkId: id }),
  closeWalk: () => set({ activeWalkId: null }),

  upsertWalkFromSync: (walk) => {
    set((s) => {
      const exists = s.walks.some((w) => w.id === walk.id);
      return { walks: exists ? s.walks.map((w) => (w.id === walk.id ? walk : w)) : [...s.walks, walk] };
    });
    void dbPutWalk(walk);
  },

  mutateActive: (fn) => {
    const { walks, activeWalkId } = get();
    const current = walks.find((w) => w.id === activeWalkId);
    if (!current) return;
    const next = structuredClone(current);
    fn(next);
    next.lastModified = nowISO();
    if (next.status !== 'submitted') {
      const pct = walkCompletion(next);
      next.status = pct === 100 ? 'complete' : 'in-progress';
      if (pct === 100 && !next.completedAt) next.completedAt = nowISO();
    }
    set((s) => ({ walks: s.walks.map((w) => (w.id === next.id ? next : w)) }));
    void dbPutWalk(next);
    onWalkMutated?.();
  },

  setItemState: (sectionId, itemId, state) => {
    get().mutateActive((walk) => {
      const section = walk.sections.find((s) => s.id === sectionId);
      const item = section?.items.find((i) => i.id === itemId);
      if (!section || !item) return;
      const wasFlagged = item.state === 'flagged';
      item.state = state;
      if (state === 'flagged' && !wasFlagged) {
        const exists = walk.risks.some((r) => r.itemId === itemId && r.source === 'flag');
        if (!exists) {
          walk.risks.push({
            id: uid(),
            section: `${String(section.number).padStart(2, '0')} · ${section.title}`,
            item: item.label,
            severity: 'medium',
            mitigation: '',
            source: 'flag',
            itemId
          });
        }
      } else if (wasFlagged && state !== 'flagged') {
        walk.risks = walk.risks.filter((r) => !(r.itemId === itemId && r.source === 'flag'));
      }
    });
  },

  setItemNotes: (sectionId, itemId, notes) => {
    get().mutateActive((walk) => {
      const item = walk.sections.find((s) => s.id === sectionId)?.items.find((i) => i.id === itemId);
      if (item) item.notes = notes;
    });
  },

  setSectionFreeText: (sectionId, text) => {
    get().mutateActive((walk) => {
      const section = walk.sections.find((s) => s.id === sectionId);
      if (section) section.freeText = text;
    });
  },

  updateMeasurements: (patch) => {
    get().mutateActive((walk) => {
      Object.assign(walk.measurements, patch);
    });
  },

  updatePowerUtility: (patch) => {
    get().mutateActive((walk) => {
      Object.assign(walk.utilities.power, patch);
    });
  },

  updateTelcoUtility: (patch) => {
    get().mutateActive((walk) => {
      Object.assign(walk.utilities.telco, patch);
    });
  },

  addPhoto: (photo) => {
    get().mutateActive((walk) => {
      walk.photos.push(photo);
    });
  },

  updatePhoto: (id, patch) => {
    get().mutateActive((walk) => {
      const photo = walk.photos.find((p) => p.id === id);
      if (photo) Object.assign(photo, patch);
    });
  },

  deletePhoto: (id) => {
    get().mutateActive((walk) => {
      walk.photos = walk.photos.filter((p) => p.id !== id);
    });
  },

  addRisk: (risk) => {
    get().mutateActive((walk) => {
      walk.risks.push(risk);
    });
  },

  updateRisk: (id, patch) => {
    get().mutateActive((walk) => {
      const risk = walk.risks.find((r) => r.id === id);
      if (risk) Object.assign(risk, patch);
    });
  },

  deleteRisk: (id) => {
    get().mutateActive((walk) => {
      walk.risks = walk.risks.filter((r) => r.id !== id);
    });
  },

  setOutcome: (outcome) => {
    get().mutateActive((walk) => {
      walk.outcome = outcome;
      if (outcome === 'ready') walk.outcomeReason = '';
    });
  },

  setOutcomeReason: (reason) => {
    get().mutateActive((walk) => {
      walk.outcomeReason = reason;
    });
  },

  setGeneralComments: (comments) => {
    get().mutateActive((walk) => {
      walk.generalComments = comments;
    });
  },

  setSignOffName: (field, value) => {
    get().mutateActive((walk) => {
      walk.signOff[field] = value;
    });
  },

  certifyWalk: () => {
    get().mutateActive((walk) => {
      walk.signOff.certifiedAt = nowISO();
      walk.status = 'submitted';
      if (!walk.completedAt) walk.completedAt = nowISO();
    });
  }
}));

export function useActiveWalk(): SiteWalk | null {
  return useWalkStore((s) => s.walks.find((w) => w.id === s.activeWalkId) ?? null);
}
