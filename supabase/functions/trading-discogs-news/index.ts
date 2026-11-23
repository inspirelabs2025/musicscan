// Sends Discogs news as alerts (and push) to users with a Discogs connection
// or Trading Desk settings. Source: the Discogs blog feed; when that is not
// reachable, Discogs-related articles from MusicScan's own news section.
// Scheduled every 3 hours.
import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { authorizeCaller, createAlert, finishRun, isAdmin, startRun } from '../_shared/trading.ts'

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

interface NewsItem { title: string; link: string; summary: string; published: string }

const decode = (s: string) => s
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, '')
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;|&#8217;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&#8211;/g, '–').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()

const FEED_URL = 'https://blog.discogs.com/en/feed/'
const feedInfo: Record<string, unknown> = {}
const NEWS_SITES = [
  'musicbusinessworldwide.com', 'digitalmusicnews.com', 'billboard.com', 'completemusicupdate.com',
  'musically.com', 'thevinylfactory.com', 'recordcollectornews.com', 'musicweek.com', 'pitchfork.com',
  'rollingstone.com', 'nme.com', 'loudersound.com', 'goldminemag.com',
]

/** Direct RSS read; the feed sits behind a bot check, so this often fails. */
async function feedItems(): Promise<NewsItem[]> {
  try {
    const res = await fetch(FEED_URL, { headers: { 'User-Agent': 'MusicScan/1.0 +https://musicscans.com', Accept: 'application/rss+xml' } })
    feedInfo.direct_status = res.status
    const xml = await res.text()
    if (!res.ok || !xml.includes('<item>')) return []
    return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 5).map((m) => {
      const tag = (t: string) => decode(m[1].match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`))?.[1] ?? '')
      return { title: tag('title'), link: tag('link'), summary: tag('description').slice(0, 180), published: new Date(tag('pubDate')).toISOString() }
    }).filter((i) => i.title && i.link)
  } catch (e) { feedInfo.direct_error = (e as Error).message; return [] }
}

/** Fallback: recent Discogs blog posts, or news about Discogs, via Firecrawl web search. */
async function searchItems(): Promise<NewsItem[]> {
  const key = Deno.env.get('FIRECRAWL_API_KEY')
  if (!key) return []
  const attempts = [
    { query: 'site:blog.discogs.com', tbs: 'qdr:m' },
    { query: 'Discogs blog news', tbs: 'qdr:w' },
    { query: 'Discogs marketplace news', tbs: 'qdr:w' },
  ]
  let web: any[] = []
  const tried: unknown[] = []
  for (const a of attempts) {
    const res = await fetch('https://api.firecrawl.dev/v2/search', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...a, limit: 8 }),
    })
    const data = await res.json().catch(() => null)
    const found: any[] = res.ok ? (data?.data?.web ?? []) : []
    tried.push({ ...a, status: res.status, results: found.length, ...(res.ok ? {} : { error: JSON.stringify(data)?.slice(0, 160) }) })
    web = found.filter((w) => {
      if (typeof w.url !== 'string') return false
      let host = ''
      try { host = new URL(w.url).hostname.replace(/^www\./, '') } catch { return false }
      if (host === 'blog.discogs.com') return /\/[a-z]{2}\/[^/?#]+/.test(new URL(w.url).pathname)
      // Other trusted music-industry news sites, only when the article is about Discogs.
      return NEWS_SITES.includes(host) && /discogs/i.test(`${w.title ?? ''} ${w.description ?? ''}`)
    })
    if (web.length) break
  }
  feedInfo.search = tried
  return web
    .filter((w) => !/\/(category|tag|author|page)\//.test(w.url))
    .map((w) => ({
      title: decode(String(w.title ?? '')).replace(/\s*[-|–]\s*Discogs.*$/i, ''),
      link: w.url.replace(/[?&]srsltid=[^&]*/, '').replace(/\?$/, ''),
      summary: decode(String(w.description ?? '')).slice(0, 180),
      published: new Date().toISOString(),
    }))
    .filter((i) => i.title)
}

async function discogsBlog(): Promise<NewsItem[]> {
  const direct = await feedItems()
  if (direct.length) return direct
  return searchItems()
}

async function siteNews(sc: SupabaseClient): Promise<NewsItem[]> {
  const since = new Date(Date.now() - 3 * 86400_000).toISOString()
  const { data } = await sc.from('news_blog_posts').select('title, slug, summary, published_at')
    .or('title.ilike.%discogs%,summary.ilike.%discogs%').gte('published_at', since)
    .order('published_at', { ascending: false }).limit(3)
  return (data ?? []).map((n) => ({ title: n.title, link: `/nieuws/${n.slug}`, summary: (n.summary ?? '').slice(0, 180), published: n.published_at }))
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const sc = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const caller = await authorizeCaller(sc, req)
  if (!caller) return json({ error: 'Niet ingelogd' }, 401)
  if (caller.kind === 'user' && !(await isAdmin(sc, caller.userId))) return json({ error: 'Alleen voor beheerders' }, 403)
  const runId = await startRun(sc, 'trading-discogs-news')
  try {
    let source = 'discogs-blog'
    let items = (await discogsBlog()).filter((i) => Date.now() - Date.parse(i.published) < 3 * 86400_000)
    if (!items.length) { source = 'musicscan-news'; items = await siteNews(sc) }

    const [{ data: tok }, { data: prefs }] = await Promise.all([
      sc.from('discogs_user_tokens').select('user_id'),
      sc.from('trading_alert_preferences').select('user_id'),
    ])
    const users = [...new Set([...(tok ?? []), ...(prefs ?? [])].map((r) => r.user_id))]
    let alerts = 0
    for (const item of items.slice(0, 3)) {
      const key = `news:${item.link.replace(/[?#].*$/, '').slice(-150)}`
      for (const uid of users) {
        if (await createAlert(sc, {
          user_id: uid, type: 'discogs_news', title: `Discogs-nieuws: ${item.title}`,
          body: item.summary, link: item.link, data: { source }, dedupe_key: key,
        })) alerts++
      }
    }
    await finishRun(sc, runId, { status: 'ok', users_processed: users.length, items_processed: items.length, alerts_created: alerts, details: { source, ...feedInfo } })
    return json({ ok: true, source, items: items.length, alerts })
  } catch (e) {
    await finishRun(sc, runId, { status: 'error', error: (e as Error).message })
    return json({ error: (e as Error).message }, 500)
  }
})
