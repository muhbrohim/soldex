import shoesJson from '@/public/data/shoes.json';
import metaJson from '@/public/data/meta.json';
import type { Shoe, Meta } from './types';
import { withFits } from './preferences';

export const shoes: Shoe[] = withFits(shoesJson as Shoe[]);
export const meta: Meta = metaJson as unknown as Meta;

export function getShoe(id: string): Shoe | undefined {
  return shoes.find((s) => s.id === id);
}
