import type { ChecklistSection, MeasurementsData, UtilitiesData } from '../types';

const SECTION_DEFS: { title: string; items: string[]; freeTextOnly?: boolean }[] = [
  {
    title: 'Site Access & Permissions',
    items: [
      'Site access confirmed (gate, keys, escort)',
      'Lease boundaries verified',
      'Easements identified and assessed',
      'Permits approved and in hand',
      'Utility locates completed (811 confirmed)'
    ]
  },
  {
    title: 'Site Layout',
    items: [
      'Compound layout reviewed against CDs',
      'Pad location and dimensions verified',
      'Tower position and orientation verified',
      'Setbacks confirmed',
      'Clearances confirmed'
    ]
  },
  {
    title: 'Structural & Grounding',
    items: [
      'Soil conditions assessed',
      'Geotech requirements identified or waived',
      'No underground conflicts in work areas',
      'Underground utilities located and marked',
      'Grounding extension path planned'
    ]
  },
  {
    title: 'Power Utilities',
    items: [
      'Provider confirmed',
      'Feed type determined (community vs direct)',
      'Build-to-power point verified',
      'MMP location documented',
      'Meter location feasibility confirmed',
      'Routing confirmed MMP→Meter→Cabinets',
      'Bore vs trench identified',
      'Disconnect and breaker requirements confirmed',
      'Trench/bore path clear of conflicts'
    ]
  },
  {
    title: 'Telco / Backhaul',
    items: [
      'Fiber/coax provider confirmed',
      'All area providers and MMPs documented',
      'D-Mark location confirmed',
      'Routing confirmed Telco MMP→D-Mark→Cabinets',
      'Microwave feasibility assessed',
      'LOS confirmed if microwave applicable',
      'Lease/easement constraints reviewed'
    ]
  },
  {
    title: 'Logistics & Access',
    items: [
      'Access road conditions assessed (width, grade, surface)',
      'Staging and laydown area identified',
      'Crane setup location confirmed with clearances',
      'Concrete truck access confirmed',
      'Traffic control requirements identified',
      'Delivery path and feasibility confirmed'
    ]
  },
  {
    title: 'Environmental',
    items: [
      'Wetland indicators noted',
      'Drainage and ponding assessed',
      'FEMA flood zone confirmed',
      'Vegetation clearing requirements identified',
      'Environmental restrictions noted'
    ]
  },
  {
    title: 'Existing Equipment',
    items: [
      'All existing equipment logged and photographed',
      'Rack space documented',
      'Tower loading capacity vs proposed additions assessed',
      'Interference risks identified',
      'Tie-in points and integration requirements noted'
    ]
  },
  {
    title: 'RF & Tower',
    items: [
      'Antenna heights confirmed against RFDS',
      'Azimuths verified',
      'AGL obstructions assessed',
      'RF conflicts identified',
      'Tower type and condition documented',
      'NSD position confirmed',
      'Crane size estimated'
    ]
  },
  {
    title: 'Cable & Conduit',
    items: [
      'Conduit routes reviewed for all segments',
      'Cable entry points confirmed',
      'Conduit separation requirements met',
      'Ice bridge routing to NSD confirmed',
      'Support spacing and bend radius reviewed'
    ]
  },
  {
    title: 'Shelter & Cabinet',
    items: [
      'Pad dimensions and orientation confirmed',
      'HVAC requirements identified',
      'Access and door swing clearances confirmed',
      'Cabinet orientation relative to tower and utilities confirmed'
    ]
  },
  {
    title: 'Security',
    items: [
      'Fence condition and scope documented',
      'Gate type and access control documented',
      'Lock and key requirements confirmed',
      'Lighting adequacy assessed'
    ]
  },
  {
    title: 'Risks & Safety',
    items: [
      'Safety hazards identified',
      'Schedule-impacting constraints identified',
      'Weather or access constraints noted',
      'Scope conflicts between departments identified',
      'All risks flagged to Risk Register'
    ]
  },
  {
    title: 'Field Documentation',
    items: [
      'Site photos captured (all areas)',
      'Drone completed or waived with reason',
      'Bluebeam/CD markup data captured',
      'Site conditions fully documented',
      'All measurements recorded'
    ]
  },
  {
    title: 'Punch & Open Items',
    items: [
      'Open issues logged with owner and date',
      'Scope changes identified',
      'Follow-up items assigned',
      'Walk readiness status confirmed'
    ]
  },
  {
    title: 'Documents & Notes',
    items: [],
    freeTextOnly: true
  }
];

export function createSections(): ChecklistSection[] {
  return SECTION_DEFS.map((def, si) => ({
    id: `s${si + 1}`,
    number: si + 1,
    title: def.title,
    freeTextOnly: !!def.freeTextOnly,
    freeText: '',
    items: def.items.map((label, ii) => ({
      id: `s${si + 1}-i${ii + 1}`,
      label,
      state: 'unchecked' as const,
      notes: ''
    }))
  }));
}

export function createMeasurements(): MeasurementsData {
  return {
    compoundLength: '',
    compoundWidth: '',
    easementRuns: [],
    powerMmpToMeter: '',
    powerMeterToCabinets: '',
    telcoMmpToDmark: '',
    telcoDmarkToCabinets: '',
    towerHeight: '',
    nsdHeight: '',
    cranePadLength: '',
    cranePadWidth: '',
    notes: ''
  };
}

export function createUtilities(): UtilitiesData {
  return {
    power: {
      provider: '',
      feedType: '',
      buildToPower: '',
      mmpLocation: '',
      boreOrTrench: '',
      notes: ''
    },
    telco: {
      providers: [''],
      preferredProvider: '',
      dmarkLocation: '',
      fiberOrCoax: '',
      boreOrTrench: '',
      notes: ''
    }
  };
}

export const SITE_TYPES = ['MACRO TOWER', 'MONOPOLE', 'ROOFTOP', 'SMALL CELL', 'OTHER'];
export const BORE_TRENCH_OPTIONS = ['BORE', 'TRENCH', 'COMBINATION', 'TBD'];
