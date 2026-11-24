// @ts-ignore bun test runner types are not part of the app build
import { describe, expect, it } from 'bun:test';
import { computePriceChanges } from './PriceChangesPanel';
const snap = (release_id: number, lowest_price: number, d: string) => ({ release_id, condition: 'all', lowest_price, suggested_price: null, num_for_sale: 1, currency: 'EUR', captured_at: d }) as any;
const item = (release_id: number, baseline?: number) => ({ key: String(release_id), release_id, label: 'x', thumb: null, source: 'Collectie', baseline });
describe('computePriceChanges', () => {
  it('uses the scan price as baseline against the latest snapshot', () => {
    const [c] = computePriceChanges([item(1, 10)], [snap(1, 15, '2026-01-01')]);
    expect(c.pct).toBe(50);
  });
  it('falls back to the first snapshot when there is no baseline', () => {
    const [c] = computePriceChanges([item(2)], [snap(2, 20, '2026-01-01'), snap(2, 10, '2026-01-02')]);
    expect(c.pct).toBe(-50);
  });
  it('skips items without a measurable change', () => {
    expect(computePriceChanges([item(3)], [snap(3, 20, '2026-01-01')])).toHaveLength(0);
  });
});
