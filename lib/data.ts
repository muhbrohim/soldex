import shoesJson from '@/public/data/shoes.json';
import metaJson from '@/public/data/meta.json';
import type { Shoe, Meta } from './types';

export const shoes: Shoe[] = shoesJson as Shoe[];
export const meta: Meta = metaJson as unknown as Meta;

export function getShoe(id: string): Shoe | undefined {
  return shoes.find((s) => s.id === id);
}
