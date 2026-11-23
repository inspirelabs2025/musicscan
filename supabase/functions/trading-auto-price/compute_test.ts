import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import { computeTarget } from './pricing.ts'

const rule = (o: Partial<any> = {}) => ({ strategy: 'undercut_lowest', undercut_amount: 0.5, offset_pct: 0, min_price: 10, max_price: null, ...o })

Deno.test('undercut lowest by the set amount', () => {
  assertEquals(computeTarget(rule(), { price: 30, market_price: 25, lowest_price: 20 }), 19.5)
})
Deno.test('never below the minimum price', () => {
  assertEquals(computeTarget(rule({ min_price: 22 }), { price: 30, market_price: 25, lowest_price: 20 }), 22)
})
Deno.test('no change when already the cheapest', () => {
  assertEquals(computeTarget(rule(), { price: 18, market_price: 25, lowest_price: 20 }), null)
})
Deno.test('match suggested price, capped at max', () => {
  assertEquals(computeTarget(rule({ strategy: 'match_suggested', max_price: 24 }), { price: 30, market_price: 25, lowest_price: 20 }), 24)
})
Deno.test('market plus offset percent', () => {
  assertEquals(computeTarget(rule({ strategy: 'market_offset', offset_pct: -10 }), { price: 30, market_price: 25, lowest_price: 20 }), 22.5)
})
