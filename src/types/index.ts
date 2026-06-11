export type ItemState = 'unchecked' | 'checked' | 'flagged';

export interface ChecklistItem {
  id: string;
  label: string;
  state: ItemState;
  notes: string;
}

export interface ChecklistSection {
  id: string;
  number: number;
  title: string;
  freeTextOnly: boolean;
  freeText: string;
  items: ChecklistItem[];
}

export interface EasementRun {
  id: string;
  label: string;
  lengthFt: string;
}

export interface MeasurementsData {
  compoundLength: string;
  compoundWidth: string;
  easementRuns: EasementRun[];
  powerMmpToMeter: string;
  powerMeterToCabinets: string;
  telcoMmpToDmark: string;
  telcoDmarkToCabinets: string;
  towerHeight: string;
  nsdHeight: string;
  cranePadLength: string;
  cranePadWidth: string;
  notes: string;
}

export interface PowerUtility {
  provider: string;
  feedType: '' | 'community' | 'direct';
  buildToPower: string;
  mmpLocation: string;
  boreOrTrench: string;
  notes: string;
}

export interface TelcoUtility {
  providers: string[];
  preferredProvider: string;
  dmarkLocation: string;
  fiberOrCoax: '' | 'fiber' | 'coax';
  boreOrTrench: string;
  notes: string;
}

export interface UtilitiesData {
  power: PowerUtility;
  telco: TelcoUtility;
}

export const PHOTO_CATEGORIES = [
  'GENERAL',
  'TOWER',
  'COMPOUND',
  'POWER',
  'TELCO',
  'ACCESS',
  'STAGING',
  'SAFETY'
] as const;

export type PhotoCategory = (typeof PHOTO_CATEGORIES)[number];

export interface PhotoEntry {
  id: string;
  dataUrl: string;
  caption: string;
  category: PhotoCategory;
  sectionLabel: string;
  itemId?: string | null;
  capturedAt: string;
}

export type RiskSeverity = 'low' | 'medium' | 'high';

export interface RiskEntry {
  id: string;
  section: string;
  item: string;
  severity: RiskSeverity;
  mitigation: string;
  source: 'flag' | 'manual';
  itemId: string | null;
}

export interface SignOffData {
  pmName: string;
  rfEngineerName: string;
  cmName: string;
  certifiedAt: string | null;
}

export type WalkStatus = 'in-progress' | 'complete' | 'submitted';
export type WalkOutcome = 'ready' | 'conditional' | 'not-ready' | null;

export interface SiteWalk {
  id: string;
  siteId: string;
  siteName: string;
  market: string;
  cmName: string;
  pmName: string;
  rfEngineerName: string;
  walkDate: string;
  siteType: string;
  client: string;
  gpsLat: number | null;
  gpsLng: number | null;
  status: WalkStatus;
  outcome: WalkOutcome;
  outcomeReason: string;
  generalComments: string;
  sections: ChecklistSection[];
  measurements: MeasurementsData;
  utilities: UtilitiesData;
  photos: PhotoEntry[];
  risks: RiskEntry[];
  signOff: SignOffData;
  createdAt: string;
  completedAt: string | null;
  lastModified: string;
}
