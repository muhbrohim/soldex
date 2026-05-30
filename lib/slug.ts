// Slug helpers used for stable shoe IDs.
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function shoeSlug(brand: string, version: string): string {
  return `${slugify(brand)}-${slugify(version)}`;
}
