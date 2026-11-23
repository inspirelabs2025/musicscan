// Opt-in automatic repricing of Discogs listings, following each user's rule
// (strategy + min/max price). Scheduled hourly. Signed-in users can preview,
// apply their own rules now, or revert a change.
import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { discogsFetch, DiscogsToken, sleep, DISCOGS_DELAY_MS } from '../_shared/discogs-oauth.ts'
import { authorizeCaller, finishRun, startRun } from '../_shared/trading.ts'
import { computeTarget } from './pricing.ts'

const BUDGET_MS = 110_000
const COOLDOWN_MS = 6 * 3600_000
const STALE_MS = 24 * 3600_000
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

async function setDiscogsPrice(token: DiscogsToken, listingId: number, price: number) {
  const url = `https://api.discogs.com/marketplace/listings/${listingId}`
  const cur = await discogsFetch('GET', url, token)
  if (!cur.ok) throw new Error(`Discogs ${cur.status}: ${(await cur.text()).slice(0, 200)}`)
  const l = await cur.json()
  await sleep(DISCOGS_DELAY_MS)
  // Resend the listing's own fields so only the price changes.
  const body: Record<string, unknown> = {
    release_id: l.release?.id, condition: l.condition, price, status: l.status,
  }
  for (const [k, v] of Object.entries({
    sleeve_condition: l.sleeve_condition, comments: l.comments, allow_offers: l.allow_offers,
    external_id: l.external_id, location: l.location, weight: l.weight, format_quantity: l.format_quantity,
  })) if (v !== undefined && v !== null && v !== '') body[k] = v
  const res = await discogsFetch('POST', url, token, body)
  if (!res.ok) throw new Error(`Discogs ${res.status}: ${(await res.text()).slice(0, 200)}`)
  await res.body?.cancel()
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const sc: SupabaseClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const caller = await authorizeCaller(sc, req)
  if (!caller) return json({ error: 'Niet ingelogd' }, 401)
  const userId = caller.kind === 'user' ? caller.userId : null
  let body: any = {}
  try { body = await req.json() } catch { /* cron has empty body */ }
  const action: string = userId ? (body.action ?? 'preview') : 'cron'
  if (!['preview', 'apply_now', 'revert', 'cron'].includes(action)) return json({ error: 'Onbekende actie' }, 400)
  const dryRun = action === 'preview' || body.dryRun === true

  const { data: tokens } = await sc.from('discogs_user_tokens').select('user_id, discogs_username, oauth_token, oauth_token_secret')
  const tokenByUser = new Map((tokens ?? []).map((t) => [t.user_id, t as DiscogsToken]))

  if (action === 'revert') {
    if (typeof body.logId !== 'string') return json({ error: 'logId ontbreekt' }, 400)
    const { data: log } = await sc.from('trading_price_adjustments_log').select('*').eq('id', body.logId).eq('user_id', userId).maybeSingle()
    if (!log || log.status !== 'applied') return json({ error: 'Deze wijziging kan niet worden teruggedraaid' }, 400)
    const token = tokenByUser.get(userId!)
    if (!token) return json({ error: 'Discogs account niet gekoppeld' }, 400)
    try {
      await setDiscogsPrice(token, Number(log.listing_id), Number(log.old_price))
      await sc.from('trading_inventory_items').update({ price: log.old_price }).eq('user_id', userId).eq('listing_id', log.listing_id)
      await sc.from('trading_price_adjustments_log').update({ status: 'reverted' }).eq('id', log.id)
      return json({ ok: true })
    } catch (e) { return json({ error: (e as Error).message }, 502) }
  }

  const runId = dryRun ? undefined : await startRun(sc, 'trading-auto-price', { mode: action })
  const deadline = Date.now() + BUDGET_MS
  const results: any[] = []
  try {
    let rq = sc.from('trading_auto_price_rules')
      .select('*, item:trading_inventory_items(id, user_id, listing_id, artist, title, price, currency, market_price, lowest_price, market_checked_at, status)')
      .eq('enabled', true)
    if (userId) rq = rq.eq('user_id', userId)
    const { data: rules, error } = await rq
    if (error) throw error

    for (const r of rules ?? []) {
      if (Date.now() > deadline) break
      const it = r.item
      if (!it || it.status !== 'For Sale') continue
      const base = { rule_id: r.id, item_id: it.id, label: `${it.artist ?? ''} – ${it.title ?? ''}`, old_price: it.price }
      if (!it.market_checked_at || Date.now() - Date.parse(it.market_checked_at) > STALE_MS) { results.push({ ...base, skipped: 'Marktprijs nog niet bekend' }); continue }
      const target = computeTarget(r, it)
      if (target == null) { results.push({ ...base, skipped: 'Prijs is al goed' }); continue }
      if (!dryRun && action === 'cron' && r.last_applied_at && Date.now() - Date.parse(r.last_applied_at) < COOLDOWN_MS) {
        results.push({ ...base, new_price: target, skipped: 'Wacht 6 uur tussen wijzigingen' }); continue
      }
      if (dryRun) { results.push({ ...base, new_price: target, dry_run: true }); continue }
      const token = tokenByUser.get(r.user_id)
      if (!token) { results.push({ ...base, skipped: 'Discogs niet gekoppeld' }); continue }
      try {
        await setDiscogsPrice(token, Number(it.listing_id), target)
        await sleep(DISCOGS_DELAY_MS)
        await sc.from('trading_inventory_items').update({ price: target }).eq('id', it.id)
        await sc.from('trading_auto_price_rules').update({ last_applied_at: new Date().toISOString() }).eq('id', r.id)
        await sc.from('trading_price_adjustments_log').insert({ user_id: r.user_id, inventory_item_id: it.id, listing_id: it.listing_id, old_price: it.price, new_price: target, strategy: r.strategy, status: 'applied' })
        results.push({ ...base, new_price: target, applied: true })
      } catch (e) {
        await sc.from('trading_price_adjustments_log').insert({ user_id: r.user_id, inventory_item_id: it.id, listing_id: it.listing_id, old_price: it.price, new_price: target, strategy: r.strategy, status: 'failed', error: (e as Error).message })
        results.push({ ...base, new_price: target, error: (e as Error).message })
      }
    }
    await finishRun(sc, runId, { status: 'ok', items_processed: results.filter((x) => x.applied).length, details: { checked: results.length } })
    return json({ ok: true, dryRun, results })
  } catch (e) {
    await finishRun(sc, runId, { status: 'error', error: (e as Error).message })
    return json({ error: (e as Error).message }, 500)
  }
})
