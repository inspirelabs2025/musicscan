// Client twin of supabase/functions/_shared/thin-singles.ts — keep in sync.
// Detects "thin" singles that should be noindex.

export const SINGLE_VARIANT_RE =
  /(m72|worldwired|world tour|tour|live in|in concert|concert|bbc rock hour|box set|coffret|interview|fan can|greatest hits|compilation|anthology|version|special|promo|sampler)/i;
export const SLUG_DATE_RE = /\d{4}-\d{2}-\d{2}/;

export function isVariantSingle(slug?: string | null, singleName?: string | null): boolean {
  const s = `${slug || ''} ${singleName || ''}`;
  return SINGLE_VARIANT_RE.test(s) || SLUG_DATE_RE.test(slug || '');
}

export interface DupeRow {
  id: string;
  story_content?: string | null;
  created_at?: string | null;
}

/** True when `row` is not the canonical duplicate (longest story_content, oldest created_at tiebreaker). */
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
