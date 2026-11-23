// Pure repricing rule, shared by the function and its tests.
export interface Rule { strategy: string; undercut_amount: number; offset_pct: number; min_price: number; max_price: number | null }
export interface Item { price: number | null; market_price: number | null; lowest_price: number | null }

/** Target price for a rule, or null when there is nothing to change. */
export function computeTarget(rule: Rule, item: Item): number | null {
  if (item.price == null) return null
  let target: number | null = null
  if (rule.strategy === 'undercut_lowest') {
    if (item.lowest_price == null) return null
    if (item.price <= item.lowest_price) return null // already the cheapest
    target = item.lowest_price - Number(rule.undercut_amount)
  } else if (rule.strategy === 'match_suggested') {
    target = item.market_price
  } else if (rule.strategy === 'market_offset') {
    target = item.market_price == null ? null : item.market_price * (1 + Number(rule.offset_pct) / 100)
  }
  if (target == null) return null
  target = Math.max(target, Number(rule.min_price))
  if (rule.max_price != null) target = Math.min(target, Number(rule.max_price))
  target = Math.round(target * 100) / 100
  return Math.abs(target - item.price) < 0.05 ? null : target
}
