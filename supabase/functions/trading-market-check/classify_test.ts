import { assertEquals } from 'jsr:@std/assert@1'
import { classify } from '../_shared/trading.ts'

Deno.test('more than the threshold above market is overpriced', () => {
  assertEquals(classify(30, 24, 10), { signal: 'overpriced', deviation: 25 })
})

Deno.test('more than the threshold below market is underpriced', () => {
  assertEquals(classify(12, 25, 10), { signal: 'underpriced', deviation: -52 })
})

Deno.test('within the threshold is fair', () => {
  assertEquals(classify(22, 21.5, 10).signal, 'fair')
  assertEquals(classify(27.5, 25, 10).signal, 'fair') // exactly +10% stays fair
})

Deno.test('no market price means unknown', () => {
  assertEquals(classify(20, null, 10), { signal: 'unknown', deviation: null })
})
