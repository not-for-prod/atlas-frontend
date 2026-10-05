import { cardDesigns, type CardDesign } from '../../model';
export function parseCardDesign(value: string | string[] | undefined): CardDesign | undefined {
  return typeof value === 'string' ? cardDesigns.find((design) => design === value) : undefined;
}
