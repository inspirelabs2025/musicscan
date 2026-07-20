// Shared detection for "thin" singles that should be noindex + excluded from sitemaps.
// Rule 1: live/tour/variant keywords, or an ISO date in the slug.
// Rule 2: exact (artist, single_name) duplicates — keep longest story_content
//         (oldest created_at as tiebreaker) as canonical; noindex the rest.
// NOTE: Keep in sync with src/lib/thinSingles.ts (client-side twin).

export const SINGLE_VARIANT_RE =
  /(m72|worldwired|world tour|tour|live in|in concert|concert|bbc rock hour|box set|coffret|interview|fan can|greatest hits|compilation|anthology|version|special|promo|sampler)/i;
export const SLUG_DATE_RE = /\d{4}-\d{2}-\d{2}/;

export function isVariantSingle(slug?: string | null, singleName?: string | null): boolean {
  const s = `${slug || ''} ${singleName || ''}`;
  return SINGLE_VARIANT_RE.test(s) || SLUG_DATE_RE.test(slug || '');
}

export interface DupeRow {
  id: string;
  artist?: string | null;
  single_name?: string | null;
  story_content?: string | null;
  created_at?: string | null;
}

/** Given siblings sharing (artist, single_name), returns true if `row` is NOT the canonical one. */
export function isDuplicateNonCanonical(row: DupeRow, siblings: DupeRow[]): boolean {
  if (!siblings || siblings.length < 2) return false;
  const sorted = [...siblings].sort((x, y) => {
    const lx = (x.story_content || '').length;
    const ly = (y.story_content || '').length;
    if (ly !== lx) return ly - lx;
    return (x.created_at || '').localeCompare(y.created_at || '');
  });
  return sorted[0].id !== row.id;
}

/** Batch variant: returns a Set of IDs to noindex due to duplicates across the full list. */
export function computeDuplicateNoindexIds(rows: DupeRow[]): Set<string> {
  const groups = new Map<string, DupeRow[]>();
  for (const r of rows) {
    const a = (r.artist || '').toLowerCase().trim();
    const n = (r.single_name || '').toLowerCase().trim();
    if (!a || !n) continue;
    const k = `${a}||${n}`;
    let arr = groups.get(k);
    if (!arr) { arr = []; groups.set(k, arr); }
    arr.push(r);
  }
  const noindex = new Set<string>();
  for (const arr of groups.values()) {
    if (arr.length < 2) continue;
    arr.sort((x, y) => {
      const lx = (x.story_content || '').length;
      const ly = (y.story_content || '').length;
      if (ly !== lx) return ly - lx;
      return (x.created_at || '').localeCompare(y.created_at || '');
    });
    for (let i = 1; i < arr.length; i++) noindex.add(arr[i].id);
  }
  return noindex;
}
