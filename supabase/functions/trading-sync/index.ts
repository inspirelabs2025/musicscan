// Syncs each connected user's Discogs inventory (For Sale) and wantlist, then
// matches listings against other MusicScan users' wantlists.
// Scheduled hourly; a signed-in user can also trigger it for their own account.
import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { discogsFetch, DiscogsToken, sleep, DISCOGS_DELAY_MS } from '../_shared/discogs-oauth.ts'
import { authorizeCaller, createAlert, finishRun, getPrefs, startRun, fmt } from '../_shared/trading.ts'

const BUDGET_MS = 110_000
const MAX_PAGES = 20

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

async function syncInventory(sc: SupabaseClient, t: DiscogsToken, deadline: number) {
  const seen = new Set<number>()
  let complete = true
  for (let page = 1; page <= MAX_PAGES; page++) {
    if (Date.now() > deadline) { complete = false; break }
    const url = `https://api.discogs.com/users/${encodeURIComponent(t.discogs_username)}/inventory?status=For%20Sale&per_page=100&page=${page}&sort=listed&sort_order=desc`
    const res = await discogsFetch('GET', url, t)
    if (!res.ok) { console.error('inventory', res.status, await res.text()); complete = false; break }
    const data = await res.json()
    const rows = (data.listings ?? []).map((l: any) => {
      seen.add(l.id)
      return {
        user_id: t.user_id,
        listing_id: l.id,
        release_id: l.release?.id,
        artist: l.release?.artist ?? null,
        title: l.release?.title ?? l.release?.description ?? null,
        thumb: l.release?.thumbnail ?? null,
        format: l.release?.format ?? null,
        condition: l.condition ?? null,
        sleeve_condition: l.sleeve_condition ?? null,
        price: l.price?.value ?? null,
        currency: l.price?.currency ?? 'EUR',
        status: l.status ?? 'For Sale',
        listing_uri: l.uri ?? null,
        posted_at: l.posted ?? null,
        last_synced_at: new Date().toISOString(),
      }
    }).filter((r: any) => r.release_id)
    if (rows.length) {
      const { error } = await sc.from('trading_inventory_items').upsert(rows, { onConflict: 'user_id,listing_id' })
      if (error) throw new Error(`inventory upsert: ${error.message}`)
    }
    const pages = data.pagination?.pages ?? 1
    if (page >= pages) break
    await sleep(DISCOGS_DELAY_MS)
  }
  if (complete) {
    // Listings no longer for sale on Discogs leave the desk.
    const { data: existing } = await sc.from('trading_inventory_items').select('id, listing_id').eq('user_id', t.user_id)
    const gone = (existing ?? []).filter((e) => !seen.has(Number(e.listing_id))).map((e) => e.id)
    if (gone.length) await sc.from('trading_inventory_items').delete().in('id', gone)
  }
  return seen.size
}

async function syncWantlist(sc: SupabaseClient, t: DiscogsToken, deadline: number) {
  const seen = new Set<number>()
  let complete = true
  for (let page = 1; page <= MAX_PAGES; page++) {
    if (Date.now() > deadline) { complete = false; break }
    const url = `https://api.discogs.com/users/${encodeURIComponent(t.discogs_username)}/wants?per_page=100&page=${page}`
    const res = await discogsFetch('GET', url, t)
    if (!res.ok) { console.error('wants', res.status, await res.text()); complete = false; break }
    const data = await res.json()
    const rows = (data.wants ?? []).map((w: any) => {
      const b = w.basic_information ?? {}
      seen.add(w.id)
      return {
        user_id: t.user_id,
        release_id: w.id,
        artist: (b.artists ?? []).map((a: any) => a.name).join(', ') || null,
        title: b.title ?? null,
        thumb: b.thumb ?? null,
        year: b.year || null,
        added_at: w.date_added ?? null,
        last_synced_at: new Date().toISOString(),
      }
    })
    if (rows.length) {
      const { error } = await sc.from('trading_wantlist_items').upsert(rows, { onConflict: 'user_id,release_id' })
      if (error) throw new Error(`wantlist upsert: ${error.message}`)
    }
    const pages = data.pagination?.pages ?? 1
    if (page >= pages) break
    await sleep(DISCOGS_DELAY_MS)
  }
  if (complete) {
    const { data: existing } = await sc.from('trading_wantlist_items').select('id, release_id').eq('user_id', t.user_id)
    const gone = (existing ?? []).filter((e) => !seen.has(Number(e.release_id))).map((e) => e.id)
    if (gone.length) await sc.from('trading_wantlist_items').delete().in('id', gone)
  }
  return seen.size
}

async function displayName(sc: SupabaseClient, userId: string, cache: Map<string, string>) {
  if (cache.has(userId)) return cache.get(userId)!
  const [{ data: p }, { data: t }] = await Promise.all([
    sc.from('profiles').select('first_name').eq('user_id', userId).maybeSingle(),
    sc.from('discogs_user_tokens').select('discogs_username').eq('user_id', userId).maybeSingle(),
  ])
  const name = p?.first_name || t?.discogs_username || 'Een verzamelaar'
  cache.set(userId, name)
  return name
}

/** Listing on sale by A ∩ wantlist of B (A ≠ B): alert both sides once. */
export async function runMatches(sc: SupabaseClient, onlyUser?: string) {
  let created = 0
  const names = new Map<string, string>()
  let q = sc.from('trading_inventory_items')
    .select('id, user_id, listing_id, release_id, artist, title, thumb, price, currency, condition, listing_uri')
    .eq('status', 'For Sale').limit(5000)
  const { data: inv } = await q
  if (!inv?.length) return 0
  const releaseIds = [...new Set(inv.map((i) => i.release_id))]
  const wants: any[] = []
  for (let i = 0; i < releaseIds.length; i += 300) {
    const { data } = await sc.from('trading_wantlist_items')
      .select('user_id, release_id, artist, title').in('release_id', releaseIds.slice(i, i + 300))
    wants.push(...(data ?? []))
  }
  for (const w of wants) {
    for (const item of inv.filter((i) => i.release_id === w.release_id && i.user_id !== w.user_id)) {
      if (onlyUser && item.user_id !== onlyUser && w.user_id !== onlyUser) continue
      const [sellerPrefs, buyerPrefs] = await Promise.all([getPrefs(sc, item.user_id), getPrefs(sc, w.user_id)])
      if (!sellerPrefs.share_wantlist || !buyerPrefs.share_wantlist) continue
      const label = `${item.artist ?? w.artist ?? ''} – ${item.title ?? w.title ?? ''}`.trim()
      const buyerName = await displayName(sc, w.user_id, names)
      const sellerName = await displayName(sc, item.user_id, names)
      if (await createAlert(sc, {
        user_id: item.user_id, type: 'wishlist_match',
        title: `${buyerName} zoekt jouw plaat`,
        body: `${label} staat op de wantlist van ${buyerName}. Jij verkoopt hem voor ${fmt(item.price, item.currency)}.`,
        link: '/trading?tab=matches', release_id: item.release_id, related_user_id: w.user_id,
        data: { listing_id: item.listing_id, role: 'seller', other_name: buyerName, thumb: item.thumb, label, price: item.price, currency: item.currency },
        dedupe_key: `match:${item.listing_id}:${w.user_id}`,
      })) created++
      if (await createAlert(sc, {
        user_id: w.user_id, type: 'wantlist_available',
        title: `Gezocht en nu te koop: ${label}`,
        body: `${sellerName} verkoopt een plaat van je wantlist voor ${fmt(item.price, item.currency)} (${item.condition ?? 'conditie onbekend'}).`,
        link: '/trading?tab=matches', release_id: item.release_id, related_user_id: item.user_id,
        data: { listing_id: item.listing_id, role: 'buyer', other_name: sellerName, thumb: item.thumb, label, price: item.price, currency: item.currency, listing_uri: item.listing_uri },
        dedupe_key: `match-buy:${item.listing_id}`,
      })) created++
    }
  }
  return created
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const sc = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const caller = await authorizeCaller(sc, req)
  if (!caller) return json({ error: 'Niet ingelogd' }, 401)
  const userId = caller.kind === 'user' ? caller.userId : null
  let body: any = {}
  try { body = await req.json() } catch { /* scheduled call */ }
  if (body?.only === 'matches') {
    const runId = await startRun(sc, 'trading-matches', { mode: userId ? 'user' : 'cron' })
    const alerts = await runMatches(sc, userId ?? undefined)
    await finishRun(sc, runId, { status: 'ok', alerts_created: alerts })
    return json({ ok: true, alerts })
  }
  const runId = await startRun(sc, 'trading-sync', { mode: userId ? 'user' : 'cron' })
  const deadline = Date.now() + BUDGET_MS
  try {
    let tq = sc.from('discogs_user_tokens').select('user_id, discogs_username, oauth_token, oauth_token_secret')
    if (userId) tq = tq.eq('user_id', userId)
    const { data: tokens, error } = await tq
    if (error) throw error
    if (userId && !tokens?.length) {
      await finishRun(sc, runId, { status: 'ok', details: { reason: 'not_connected' } })
      return json({ error: 'Discogs account niet gekoppeld' }, 400)
    }
    // Least recently synced users first so every account gets its turn.
    const { data: lastSync } = await sc.from('trading_inventory_items').select('user_id, last_synced_at').order('last_synced_at', { ascending: true }).limit(5000)
    const lastByUser = new Map<string, string>()
    for (const r of lastSync ?? []) if (!lastByUser.has(r.user_id)) lastByUser.set(r.user_id, r.last_synced_at)
    const ordered = [...(tokens ?? [])].sort((a, b) => (lastByUser.get(a.user_id) ?? '').localeCompare(lastByUser.get(b.user_id) ?? ''))

    let users = 0, items = 0
    const perUser: Record<string, unknown>[] = []
    for (const t of ordered as DiscogsToken[]) {
      if (Date.now() > deadline) break
      try {
        const inv = await syncInventory(sc, t, deadline)
        await sleep(DISCOGS_DELAY_MS)
        const wants = await syncWantlist(sc, t, deadline)
        users++; items += inv + wants
        perUser.push({ user: t.discogs_username, inventory: inv, wantlist: wants })
      } catch (e) {
        perUser.push({ user: t.discogs_username, error: (e as Error).message })
      }
    }
    const alerts = await runMatches(sc, userId ?? undefined)
    await finishRun(sc, runId, { status: 'ok', users_processed: users, items_processed: items, alerts_created: alerts, details: { perUser } })
    return json({ ok: true, users, items, alerts, perUser })
  } catch (e) {
    await finishRun(sc, runId, { status: 'error', error: (e as Error).message })
    return json({ error: (e as Error).message }, 500)
  }
})
