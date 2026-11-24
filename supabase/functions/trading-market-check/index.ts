// Checks market prices for releases that users sell or want, stores hourly
// snapshots for the charts, labels listings as over/under/fair priced and
// raises alerts (signal change, new copies on the market, wantlist available).
// Scheduled every 15 minutes; a signed-in user can trigger it for own releases.
import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { discogsFetch, DiscogsToken, sleep, DISCOGS_DELAY_MS } from '../_shared/discogs-oauth.ts'
import { authorizeCaller, classify, createAlert, finishRun, fmt, getPrefs, startRun } from '../_shared/trading.ts'

const BUDGET_MS = 110_000
const PRICE_MOVE_PCT = 15
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

async function readJson(res: Response) {
  if (!res.ok) { const t = await res.text(); console.error('discogs', res.status, t.slice(0, 200)); return null }
  return await res.json()
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const sc: SupabaseClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const caller = await authorizeCaller(sc, req)
  if (!caller) return json({ error: 'Niet ingelogd' }, 401)
  const userId = caller.kind === 'user' ? caller.userId : null
  const runId = await startRun(sc, 'trading-market-check', { mode: userId ? 'user' : 'cron' })
  const deadline = Date.now() + BUDGET_MS
  let alerts = 0, checked = 0
  try {
    const { data: tokens } = await sc.from('discogs_user_tokens').select('user_id, discogs_username, oauth_token, oauth_token_secret')
    const tokenByUser = new Map((tokens ?? []).map((t) => [t.user_id, t as DiscogsToken]))
    if (!tokenByUser.size) { await finishRun(sc, runId, { status: 'ok' }); return json({ ok: true, checked: 0 }) }

    let iq = sc.from('trading_inventory_items').select('release_id, market_checked_at, user_id, currency')
      .eq('status', 'For Sale').order('market_checked_at', { ascending: true, nullsFirst: true }).limit(3000)
    let wq = sc.from('trading_wantlist_items').select('release_id, market_checked_at, user_id, currency')
      .order('market_checked_at', { ascending: true, nullsFirst: true }).limit(3000)
    if (userId) { iq = iq.eq('user_id', userId); wq = wq.eq('user_id', userId) }
    const [{ data: inv }, { data: wants }] = await Promise.all([iq, wq])

    // Oldest-checked first; inventory before wantlist on ties.
    const queue = [...(inv ?? []).map((r) => ({ ...r, kind: 'inv' })), ...(wants ?? []).map((r) => ({ ...r, kind: 'want' }))]
      .sort((a, b) => (a.market_checked_at ?? '').localeCompare(b.market_checked_at ?? ''))
    const order: number[] = []
    const meta = new Map<number, { owners: string[]; currency: string; sold: boolean }>()
    for (const r of queue) {
      const id = Number(r.release_id)
      if (!meta.has(id)) { order.push(id); meta.set(id, { owners: [], currency: r.currency || 'EUR', sold: false }) }
      const m = meta.get(id)!
      if (tokenByUser.has(r.user_id)) m.owners.push(r.user_id)
      if (r.kind === 'inv') { m.sold = true; m.currency = r.currency || m.currency }
    }

    // Collection (scanned records with a Discogs id): lowest priority, at most every 12h per release.
    if (Date.now() < deadline) {
      const owners = [...tokenByUser.keys()].filter((u) => !userId || u === userId)
      const since = new Date(Date.now() - 12 * 3600e3).toISOString()
      const [{ data: v }, { data: c }, { data: recent }] = await Promise.all([
        sc.from('vinyl2_scan').select('discogs_id, user_id').in('user_id', owners).not('discogs_id', 'is', null).limit(2000),
        sc.from('cd_scan').select('discogs_id, user_id').in('user_id', owners).not('discogs_id', 'is', null).limit(2000),
        sc.from('trading_price_snapshots').select('release_id').eq('condition', 'all').gte('captured_at', since).limit(5000),
      ])
      const fresh = new Set((recent ?? []).map((r) => Number(r.release_id)))
      for (const r of [...(v ?? []), ...(c ?? [])]) {
        const id = Number(r.discogs_id)
        if (!id || meta.has(id) || fresh.has(id)) continue
        order.push(id); meta.set(id, { owners: [r.user_id], currency: 'EUR', sold: false })
      }
    }

    const firstCheck = new Map<string, { over: number; under: number }>()

    for (const releaseId of order) {
      if (Date.now() > deadline) break
      const m = meta.get(releaseId)!
      const token = tokenByUser.get(m.owners[0])
      if (!token) continue

      const stats = await readJson(await discogsFetch('GET', `https://api.discogs.com/marketplace/stats/${releaseId}?curr_abbr=${m.currency}`, token))
      await sleep(DISCOGS_DELAY_MS)
      let suggestions: Record<string, { value: number; currency: string }> | null = null
      if (m.sold) {
        suggestions = await readJson(await discogsFetch('GET', `https://api.discogs.com/marketplace/price_suggestions/${releaseId}`, token))
        await sleep(DISCOGS_DELAY_MS)
      }
      if (!stats && !suggestions) continue
      checked++
      const now = new Date().toISOString()
      const lowest: number | null = stats?.lowest_price?.value ?? null
      const numForSale: number | null = stats?.num_for_sale ?? null
      const vgPlus = suggestions?.['Very Good Plus (VG+)']?.value ?? null

      // Snapshots: one overall row + one per condition we sell.
      const snaps: Record<string, unknown>[] = [{
        release_id: releaseId, condition: 'all', suggested_price: vgPlus, lowest_price: lowest,
        num_for_sale: numForSale, currency: m.currency, captured_at: now,
      }]

      if (m.sold) {
        const { data: items } = await sc.from('trading_inventory_items')
          .select('id, user_id, listing_id, artist, title, thumb, price, currency, condition, signal, num_for_sale, market_checked_at')
          .eq('release_id', releaseId).eq('status', 'For Sale')
        const conds = new Set<string>()
        for (const it of items ?? []) {
          const prefs = await getPrefs(sc, it.user_id)
          const market = (it.condition && suggestions?.[it.condition]?.value) ?? lowest
          if (it.condition && suggestions?.[it.condition]) conds.add(it.condition)
          const { signal, deviation } = classify(it.price, market, Number(prefs.threshold_pct))
          await sc.from('trading_inventory_items').update({
            market_price: market, lowest_price: lowest, num_for_sale: numForSale,
            prev_num_for_sale: it.num_for_sale, deviation_pct: deviation, signal, market_checked_at: now,
          }).eq('id', it.id)
          const label = `${it.artist ?? ''} – ${it.title ?? ''}`
          const first = !it.market_checked_at
          if (first) {
            const c = firstCheck.get(it.user_id) ?? { over: 0, under: 0 }
            if (signal === 'overpriced') c.over++
            if (signal === 'underpriced') c.under++
            firstCheck.set(it.user_id, c)
          } else if ((signal === 'overpriced' || signal === 'underpriced') && signal !== it.signal) {
            if (await createAlert(sc, {
              user_id: it.user_id, type: signal,
              title: signal === 'overpriced' ? `Te duur: ${label}` : `Te goedkoop: ${label}`,
              body: `Jij vraagt ${fmt(it.price, it.currency)}, de markt zit op ${fmt(market, it.currency)} (${deviation! > 0 ? '+' : ''}${deviation}%).`,
              link: `/trading?tab=listings&item=${it.id}`, release_id: releaseId,
              data: { listing_id: it.listing_id, deviation, market, price: it.price, thumb: it.thumb },
              dedupe_key: `signal:${it.listing_id}:${signal}:${it.price}`,
            })) alerts++
          }
          // Another seller listed this release.
          if (!first && it.num_for_sale != null && numForSale != null && numForSale > it.num_for_sale) {
            const cheaper = lowest != null && it.price != null && lowest < it.price
            if (await createAlert(sc, {
              user_id: it.user_id, type: 'market_listing',
              title: `Nieuw op de markt: ${label}`,
              body: `Nu ${numForSale} te koop (was ${it.num_for_sale}), laagste ${fmt(lowest, it.currency)}. Jij vraagt ${fmt(it.price, it.currency)}${cheaper ? ' – je wordt onderboden.' : ' – jij bent nog het goedkoopst.'}`,
              link: `/trading?tab=listings&item=${it.id}`, release_id: releaseId,
              data: { listing_id: it.listing_id, lowest, num_for_sale: numForSale, price: it.price, thumb: it.thumb },
              dedupe_key: `market:${it.listing_id}:${numForSale}:${lowest}`,
            })) alerts++
          }
        }
        for (const c of conds) {
          snaps.push({ release_id: releaseId, condition: c, suggested_price: suggestions![c].value, lowest_price: lowest, num_for_sale: numForSale, currency: m.currency, captured_at: now })
        }
      }
      // Big price move vs the previous overall snapshot → alert collection + wantlist owners.
      const { data: prevSnap } = await sc.from('trading_price_snapshots').select('lowest_price')
        .eq('release_id', releaseId).eq('condition', 'all').not('lowest_price', 'is', null)
        .order('captured_at', { ascending: false }).limit(1).maybeSingle()
      await sc.from('trading_price_snapshots').insert(snaps)
      const prev = Number(prevSnap?.lowest_price)
      if (lowest != null && prev > 0) {
        const pct = Math.round(((lowest - prev) / prev) * 1000) / 10
        if (Math.abs(pct) >= PRICE_MOVE_PCT) {
          const [{ data: vo }, { data: co }, { data: wo }] = await Promise.all([
            sc.from('vinyl2_scan').select('user_id, artist, title').eq('discogs_id', releaseId).limit(50),
            sc.from('cd_scan').select('user_id, artist, title').eq('discogs_id', releaseId).limit(50),
            sc.from('trading_wantlist_items').select('user_id, artist, title, thumb').eq('release_id', releaseId).limit(50),
          ])
          const who = new Map<string, { label: string; source: string; thumb?: string | null }>()
          for (const r of [...(vo ?? []), ...(co ?? [])]) if (r.user_id && tokenByUser.has(r.user_id)) who.set(r.user_id, { label: `${r.artist ?? ''} – ${r.title ?? ''}`, source: 'collectie' })
          for (const r of wo ?? []) if (tokenByUser.has(r.user_id) && !who.has(r.user_id)) who.set(r.user_id, { label: `${r.artist ?? ''} – ${r.title ?? ''}`, source: 'wantlist', thumb: r.thumb })
          const up = pct > 0
          for (const [uid, w] of who) {
            if (await createAlert(sc, {
              user_id: uid, type: 'price_move',
              title: `${up ? 'Duurder' : 'Goedkoper'}: ${w.label}`,
              body: `Laagste prijs ${up ? 'gestegen' : 'gedaald'} van ${fmt(prev, m.currency)} naar ${fmt(lowest, m.currency)} (${up ? '+' : ''}${pct}%) – uit je ${w.source}.`,
              link: `/trading?tab=changes&buy=${releaseId}`, release_id: releaseId,
              data: { from: prev, to: lowest, pct, thumb: w.thumb ?? null, label: w.label },
              dedupe_key: `move:${releaseId}:${lowest}`,
            })) alerts++
          }
        }
      }

      // Wantlist side.
      const { data: wl } = await sc.from('trading_wantlist_items')
        .select('id, user_id, artist, title, thumb, num_for_sale, market_checked_at').eq('release_id', releaseId)
      for (const w of wl ?? []) {
        await sc.from('trading_wantlist_items').update({
          lowest_price: lowest, num_for_sale: numForSale, prev_num_for_sale: w.num_for_sale, currency: m.currency, market_checked_at: now,
        }).eq('id', w.id)
        if (w.market_checked_at && w.num_for_sale != null && numForSale != null && numForSale > w.num_for_sale) {
          const label = `${w.artist ?? ''} – ${w.title ?? ''}`
          if (await createAlert(sc, {
            user_id: w.user_id, type: 'wantlist_available',
            title: `Nu te koop: ${label}`,
            body: `Er is een exemplaar bijgekomen op Discogs: ${numForSale} te koop, vanaf ${fmt(lowest, m.currency)}.`,
            link: `https://www.discogs.com/sell/release/${releaseId}`, release_id: releaseId,
            data: { lowest, num_for_sale: numForSale, thumb: w.thumb, label },
            dedupe_key: `want:${releaseId}:${numForSale}`,
          })) alerts++
        }
      }
    }

    // One overview after a listing's first check, instead of a flood of alerts.
    const today = new Date().toISOString().slice(0, 10)
    for (const [uid, c] of firstCheck) {
      if (!c.over && !c.under) continue
      if (await createAlert(sc, {
        user_id: uid, type: c.over ? 'overpriced' : 'underpriced',
        title: 'Je prijzen zijn gecheckt',
        body: `${c.over} plaat${c.over === 1 ? '' : 'en'} te duur en ${c.under} te goedkoop ten opzichte van de markt.`,
        link: '/trading?tab=listings', dedupe_key: `summary:${today}:${c.over}:${c.under}`,
        data: c,
      })) alerts++
    }

    await finishRun(sc, runId, { status: 'ok', items_processed: checked, alerts_created: alerts, users_processed: firstCheck.size })
    return json({ ok: true, checked, queued: order.length, alerts })
  } catch (e) {
    await finishRun(sc, runId, { status: 'error', error: (e as Error).message, items_processed: checked, alerts_created: alerts })
    return json({ error: (e as Error).message }, 500)
  }
})
