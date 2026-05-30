// Single source of truth for column metadata.
// `key` matches the Shoe field name verbatim — UI looks it up via `shoe[key]`.
import type { Shoe } from './types';
import {
  formatIdr,
  formatGrams,
  formatNum,
  formatMm,
  formatPct,
} from './format';

export type ColumnKey =
  | 'brand'
  | 'version'
  | 'type'
  | 'her'
  | 'fer'
  | 'avgEr'
  | 'hsa'
  | 'fsa'
  | 'avgSa'
  | 'herMinusFer'
  | 'trac'
  | 'mSoft'
  | 'flexStiff'
  | 'torsRigid'
  | 'weightG'
  | 'heel'
  | 'fore'
  | 'drop'
  | 'drem'
  | 'oThick'
  | 'mFore'
  | 'width'
  | 'toe'
  | 'upFoam'
  | 'oDurPct'
  | 'oStay'
  | 'foam'
  | 'priceIdr'
  | 'valueIdx'
  | 'dailyFit'
  | 'maxFit'
  | 'superFit';

export type ColumnGroup =
  | 'identity'
  | 'energy'
  | 'feel'
  | 'outsole'
  | 'geomHeight'
  | 'geomWidth'
  | 'materials'
  | 'value'
  | 'fit';

export interface ColumnMeta {
  key: ColumnKey;
  label: string; // friendly UI label
  code?: string; // original short code from the source sheet
  tip: string; // 1–2 sentence plain-English explainer
  align: 'left' | 'right' | 'center';
  group: ColumnGroup;
  numeric: boolean;
  alwaysOn?: boolean; // can't be hidden in the column picker
  format?: (v: unknown) => string;
}

const num = (v: unknown) => formatNum(v as number | undefined);
const num2 = (v: unknown) => formatNum(v as number | undefined, 2);
const pct = (v: unknown) => formatPct(v as number | undefined);
const mm = (v: unknown) => formatMm(v as number | undefined);
const idr = (v: unknown) => formatIdr(v as number | undefined);
const grams = (v: unknown) => formatGrams(v as number | undefined);
const txt = (v: unknown) => (v == null || v === '' ? '—' : String(v));

export const COLUMN_META: Record<ColumnKey, ColumnMeta> = {
  brand: {
    key: 'brand',
    label: 'Brand',
    tip: 'Shoe brand. Always shown.',
    align: 'left',
    group: 'identity',
    numeric: false,
    alwaysOn: true,
    format: txt,
  },
  version: {
    key: 'version',
    label: 'Model',
    tip: 'Specific model / version name. Always shown.',
    align: 'left',
    group: 'identity',
    numeric: false,
    alwaysOn: true,
    format: txt,
  },
  type: {
    key: 'type',
    label: 'Type',
    code: 'ty',
    tip: 'Owner-assigned category: R race · D daily · DC daily-cushion · C cushion · S speed · M maximalist · RET retired.',
    align: 'center',
    group: 'identity',
    numeric: false,
    format: txt,
  },

  // Energy & shock
  her: {
    key: 'her',
    label: 'Heel ER %',
    code: 'HER',
    tip: 'Heel energy return: percent of impact energy the heel gives back on landing. Higher = bouncier.',
    align: 'right',
    group: 'energy',
    numeric: true,
    format: num,
  },
  fer: {
    key: 'fer',
    label: 'Fore ER %',
    code: 'FER',
    tip: 'Forefoot energy return at toe-off. Higher = more push when you roll off the front.',
    align: 'right',
    group: 'energy',
    numeric: true,
    format: num,
  },
  avgEr: {
    key: 'avgEr',
    label: 'Avg ER %',
    code: 'avgEr',
    tip: 'Average of HER and FER. A single overall bounce number.',
    align: 'right',
    group: 'energy',
    numeric: true,
    format: num,
  },
  hsa: {
    key: 'hsa',
    label: 'Heel SA',
    code: 'HSA',
    tip: 'Heel shock absorption: how much impact energy the heel dampens (not returned). Higher = softer landing.',
    align: 'right',
    group: 'energy',
    numeric: true,
    format: (v) => (v == null ? '—' : String(v)),
  },
  fsa: {
    key: 'fsa',
    label: 'Fore SA',
    code: 'FSA',
    tip: 'Forefoot shock absorption. Higher = more cushioned push-off.',
    align: 'right',
    group: 'energy',
    numeric: true,
    format: (v) => (v == null ? '—' : String(v)),
  },
  avgSa: {
    key: 'avgSa',
    label: 'Avg SA',
    code: 'avgSa',
    tip: 'Average of HSA and FSA. Overall cushioning.',
    align: 'right',
    group: 'energy',
    numeric: true,
    format: num,
  },
  herMinusFer: {
    key: 'herMinusFer',
    label: 'HER − FER',
    code: 'minus',
    tip: 'Heel ER minus Forefoot ER. Positive = heel bouncier than forefoot (heel-strike friendly). Negative = forefoot bouncier (toe-off friendly).',
    align: 'right',
    group: 'energy',
    numeric: true,
    format: num,
  },

  // Feel / stiffness
  mSoft: {
    key: 'mSoft',
    label: 'Midsole softness',
    code: 'm-soft',
    tip: 'How soft the midsole foam compresses underfoot. Higher = plusher / squishier.',
    align: 'right',
    group: 'feel',
    numeric: true,
    format: num,
  },
  flexStiff: {
    key: 'flexStiff',
    label: 'Bend stiffness',
    code: 'flexStiff',
    tip: 'Longitudinal (toe-to-heel) bending resistance. Higher = stiffer plate feel. Different from twist rigidity.',
    align: 'right',
    group: 'feel',
    numeric: true,
    format: num,
  },
  torsRigid: {
    key: 'torsRigid',
    label: 'Twist rigidity',
    code: 'torsRigid',
    tip: 'Torsional (medial-to-lateral) rigidity. Higher = more stable side-to-side on uneven ground. Different from bend stiffness.',
    align: 'right',
    group: 'feel',
    numeric: true,
    format: num,
  },

  // Outsole
  oDurPct: {
    key: 'oDurPct',
    label: 'Outsole dur %',
    code: 'o-dur%',
    tip: 'Outsole durability: percent of rubber surviving the wear test. Quantity of rubber left before bald. Different from outsole bond.',
    align: 'right',
    group: 'outsole',
    numeric: true,
    format: num2,
  },
  oStay: {
    key: 'oStay',
    label: 'Outsole bond',
    code: 'o-stay',
    tip: 'How well the outsole stays glued to the midsole over use. Quality of the bond, not the rubber amount. Higher = less peeling.',
    align: 'right',
    group: 'outsole',
    numeric: true,
    format: num,
  },
  trac: {
    key: 'trac',
    label: 'Traction',
    code: 'TRAC',
    tip: 'Grip score on the test surface (0–1). Higher = better traction.',
    align: 'right',
    group: 'outsole',
    numeric: true,
    format: num2,
  },

  // Geometry — heights
  weightG: {
    key: 'weightG',
    label: 'Weight',
    code: 'W',
    tip: 'Single-shoe weight in grams (US M9 reference where noted).',
    align: 'right',
    group: 'geomHeight',
    numeric: true,
    format: grams,
  },
  heel: {
    key: 'heel',
    label: 'Heel stack',
    code: 'heel',
    tip: 'Midsole thickness under the heel, in mm.',
    align: 'right',
    group: 'geomHeight',
    numeric: true,
    format: mm,
  },
  fore: {
    key: 'fore',
    label: 'Fore stack',
    code: 'fore',
    tip: 'Midsole thickness under the forefoot, in mm.',
    align: 'right',
    group: 'geomHeight',
    numeric: true,
    format: mm,
  },
  drop: {
    key: 'drop',
    label: 'Drop',
    code: 'drop',
    tip: 'Heel-to-toe height difference (heel stack − fore stack), in mm.',
    align: 'right',
    group: 'geomHeight',
    numeric: true,
    format: mm,
  },
  drem: {
    key: 'drem',
    label: 'Drop remaining',
    code: 'drem',
    tip: 'Effective drop after midsole compression under load, in mm. How much drop is left when you stand on it.',
    align: 'right',
    group: 'geomHeight',
    numeric: true,
    format: num,
  },
  oThick: {
    key: 'oThick',
    label: 'Outsole thick',
    code: 'o-thick',
    tip: 'Rubber layer thickness under the foot, in mm.',
    align: 'right',
    group: 'geomHeight',
    numeric: true,
    format: num,
  },

  // Geometry — widths
  mFore: {
    key: 'mFore',
    label: 'Midsole fore width',
    code: 'm-fore',
    tip: 'Midsole width at the forefoot, in mm. The bottom platform.',
    align: 'right',
    group: 'geomWidth',
    numeric: true,
    format: num,
  },
  width: {
    key: 'width',
    label: 'Upper fore width',
    code: 'width',
    tip: 'Upper width at the forefoot, in mm. Where your foot actually sits.',
    align: 'right',
    group: 'geomWidth',
    numeric: true,
    format: num,
  },
  toe: {
    key: 'toe',
    label: 'Toebox',
    code: 'toe',
    tip: 'Toebox width at the metatarsals, in mm.',
    align: 'right',
    group: 'geomWidth',
    numeric: true,
    format: num,
  },
  upFoam: {
    key: 'upFoam',
    label: 'Forefoot flare',
    code: 'up-foam',
    tip: 'Midsole-fore width minus upper-fore width, in mm. Positive = midsole flares out wider than the upper (planted, stable). Community rule of thumb: Daily/easy trainers tend smaller, Max/Super shoes tend larger. Not a score.',
    align: 'right',
    group: 'geomWidth',
    numeric: true,
    format: num,
  },

  // Materials
  foam: {
    key: 'foam',
    label: 'Foam',
    code: 'FOAM',
    tip: 'Primary midsole foam compound (e.g. PEBA, eTPU, EVA).',
    align: 'left',
    group: 'materials',
    numeric: false,
    format: txt,
  },

  // Value
  priceIdr: {
    key: 'priceIdr',
    label: 'Price',
    code: 'Pr',
    tip: 'Retail price in Indonesian Rupiah at the owner’s entry time.',
    align: 'right',
    group: 'value',
    numeric: true,
    format: idr,
  },
  valueIdx: {
    key: 'valueIdx',
    label: 'Value / Mio Rp',
    code: 'val/M',
    tip: 'Avg ER divided by price in millions of IDR. Higher = more performance per rupiah. Composite, not a recommendation.',
    align: 'right',
    group: 'value',
    numeric: true,
    format: num,
  },

  dailyFit: {
    key: 'dailyFit',
    label: 'Daily fit',
    code: 'dailyFit',
    tip: 'How well this shoe matches the owner’s stated DAILY profile: flexible, firm, light, durable, smaller flare, cheaper. 0–100; higher = closer fit. Excludes rocker and plate (unmeasured). See /docs/preferences.',
    align: 'right',
    group: 'fit',
    numeric: true,
    format: (v) => (v == null ? '—' : `${v}`),
  },
  maxFit: {
    key: 'maxFit',
    label: 'Max fit',
    code: 'maxFit',
    tip: 'How well this shoe matches the owner’s stated MAX profile: rigid, firm, heavy OK, durable, larger flare, cheaper. 0–100; higher = closer fit. Excludes rocker and plate (unmeasured). See /docs/preferences.',
    align: 'right',
    group: 'fit',
    numeric: true,
    format: (v) => (v == null ? '—' : `${v}`),
  },
  superFit: {
    key: 'superFit',
    label: 'Super fit',
    code: 'superFit',
    tip: 'How well this shoe matches the owner’s stated SUPER profile: rigid, soft, light, durable, larger flare. Rocker + plate are required pre-reqs but unmeasured — treat score as ceiling. See /docs/preferences.',
    align: 'right',
    group: 'fit',
    numeric: true,
    format: (v) => (v == null ? '—' : `${v}`),
  },
};

export const COLUMN_GROUP_LABEL: Record<ColumnGroup, string> = {
  identity: 'Identity',
  energy: 'Energy & shock',
  feel: 'Feel & stiffness',
  outsole: 'Outsole',
  geomHeight: 'Geometry — heights',
  geomWidth: 'Geometry — widths',
  materials: 'Materials',
  value: 'Value',
  fit: 'Profile fit (owner)',
};

// Order columns are listed (in picker + rendered in table when visible)
export const ALL_COLUMNS: ColumnKey[] = [
  'brand',
  'version',
  'type',
  'her',
  'fer',
  'avgEr',
  'hsa',
  'fsa',
  'herMinusFer',
  'mSoft',
  'flexStiff',
  'torsRigid',
  'oDurPct',
  'oStay',
  'trac',
  'weightG',
  'heel',
  'fore',
  'drop',
  'drem',
  'oThick',
  'mFore',
  'width',
  'toe',
  'upFoam',
  'foam',
  'priceIdr',
  'valueIdx',
  'dailyFit',
  'maxFit',
  'superFit',
];

export const DEFAULT_VISIBLE: ColumnKey[] = [
  'brand',
  'version',
  'type',
  'her',
  'fer',
  'avgEr',
  'mSoft',
  'flexStiff',
  'torsRigid',
  'oDurPct',
  'oStay',
  'trac',
  'weightG',
  'drop',
  'upFoam',
  'foam',
  'priceIdr',
  'valueIdx',
  'dailyFit',
  'maxFit',
  'superFit',
];

// Helper: read a Shoe field by ColumnKey safely.
export function getField(s: Shoe, k: ColumnKey): unknown {
  return (s as unknown as Record<string, unknown>)[k];
}
