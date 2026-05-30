export type ShoeType = 'R' | 'D' | 'DC' | 'C' | 'S' | 'M' | string;

export interface Shoe {
  id: string;
  brand: string;
  version: string;
  type?: ShoeType;
  her?: number;
  fer?: number;
  hsa?: number;
  fsa?: number;
  weightG?: number;
  priceIdr?: number;
  heel?: number;
  fore?: number;
  drop?: number;
  width?: number;
  toe?: number;
  mFore?: number;
  oThick?: number;
  drem?: number;
  oDurPct?: number;
  oStay?: number;
  trac?: number;
  mSoft?: number;
  flexStiff?: number;
  torsRigid?: number;
  minus?: string;
  foam?: string;
  myApprox?: number;
  upFoam?: number;
  reBuy?: string;
  conclusion?: string;
  // Pre-requisite booleans (RunRepeat-style). null = unknown.
  hasPlate?: boolean | null;
  hasRocker?: boolean | null;
  categories?: string[];
  // derived
  avgEr?: number;
  avgSa?: number;
  herMinusFer?: number;
  valueIdx?: number;
  // profile fit (0–100), computed at load time from preferences matrix
  dailyFit?: number;
  maxFit?: number;
  superFit?: number;
}

export interface Meta {
  generatedAt: string;
  shoeCount: number;
  brands: string[];
  foams: string[];
  types: string[];
  categories: string[];
  ranges: Record<string, [number, number]>;
}

export interface Filters {
  q: string;
  brands: string[];
  types: string[];
  foams: string[];
  categories: string[];
  priceMax?: number;
  priceMin?: number;
  weightMax?: number;
  herMin?: number;
  ferMin?: number;
  dropMin?: number;
  dropMax?: number;
}

export const EMPTY_FILTERS: Filters = {
  q: '',
  brands: [],
  types: [],
  foams: [],
  categories: [],
};
