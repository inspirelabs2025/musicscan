import { SupabaseClient } from 'npm:@supabase/supabase-js@2'

export const ALL_ALERT_TYPES = [
  'overpriced', 'underpriced', 'market_listing', 'wishlist_match', 'wantlist_available', 'discogs_news',
] as const
export type AlertType = typeof ALL_ALERT_TYPES[number]

export interface Prefs {
  user_id: string
  enabled_types: string[]
  sound_enabled: boolean
  push_enabled: boolean
  threshold_pct: number
  share_wantlist: boolean
}

const DEFAULT_PREFS = (user_id: string): Prefs => ({
  user_id,
  enabled_types: [...ALL_ALERT_TYPES],
  sound_enabled: true,
  push_enabled: true,
  threshold_pct: 10,
  share_wantlist: true,
})

const prefsCache = new Map<string, Prefs>()
export async function getPrefs(sc: SupabaseClient, userId: string): Promise<Prefs> {
  if (prefsCache.has(userId)) return prefsCache.get(userId)!
  const { data } = await sc.from('trading_alert_preferences').select('*').eq('user_id', userId).maybeSingle()
  const p = (data as Prefs) ?? DEFAULT_PREFS(userId)
  prefsCache.set(userId, p)
  return p
}

export interface NewAlert {
  user_id: string
  type: AlertType
  title: string
  body?: string
  link?: string
  release_id?: number | null
  related_user_id?: string | null
  data?: Record<string, unknown>
  dedupe_key: string
}

/** Insert an alert once (dedupe per user) and push it to the user's devices. Returns true if new. */
export async function createAlert(sc: SupabaseClient, alert: NewAlert): Promise<boolean> {
  const prefs = await getPrefs(sc, alert.user_id)
  if (!prefs.enabled_types.includes(alert.type)) return false
  const { data, error } = await sc
    .from('trading_alerts')
    .upsert({ ...alert, data: alert.data ?? {} }, { onConflict: 'user_id,dedupe_key', ignoreDuplicates: true })
    .select('id')
  if (error) { console.error('createAlert', error.message); return false }
  if (!data || data.length === 0) return false
  if (prefs.push_enabled) {
    const sent = await sendPush(sc, alert.user_id, alert.title, alert.body ?? '', alert.link ?? '/trading')
    if (sent > 0) await sc.from('trading_alerts').update({ pushed_at: new Date().toISOString() }).eq('id', data[0].id)
  }
  return true
}

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/firebase_messaging'

/** Send a push to every registered device of a user. Silently skipped when push is not configured. */
export async function sendPush(sc: SupabaseClient, userId: string, title: string, body: string, link: string): Promise<number> {
  const lovableKey = Deno.env.get('LOVABLE_API_KEY')
  const fcmKey = Deno.env.get('FIREBASE_MESSAGING_API_KEY')
  if (!lovableKey || !fcmKey) return 0
  const { data: devices } = await sc.from('push_subscriptions').select('id, token, platform').eq('user_id', userId)
  if (!devices?.length) return 0
  const url = link.startsWith('http') ? link : `https://musicscans.com${link}`
  let sent = 0
  for (const d of devices) {
    const res = await fetch(`${GATEWAY_URL}/v1/projects/_/messages:send`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        'X-Connection-Api-Key': fcmKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          token: d.token,
          notification: { title, body },
          data: { path: link, url },
          webpush: {
            fcm_options: { link: url },
            notification: { icon: '/favicon.png', badge: '/favicon.png', renotify: true, tag: 'musicscan-trading' },
          },
          android: { priority: 'high', notification: { sound: 'default', default_sound: true } },
          apns: { payload: { aps: { sound: 'default' } } },
        },
      }),
    })
    if (res.ok) { sent++; await res.body?.cancel(); continue }
    const txt = await res.text()
    console.error(`FCM send failed [${res.status}]: ${txt}`)
    if (res.status === 404 || (res.status === 400 && txt.includes('INVALID_ARGUMENT')) || txt.includes('UNREGISTERED')) {
      await sc.from('push_subscriptions').delete().eq('id', d.id)
    }
  }
  return sent
}

export async function startRun(sc: SupabaseClient, job: string, details: Record<string, unknown> = {}) {
  const { data } = await sc.from('trading_job_runs').insert({ job, details }).select('id').single()
  return data?.id as string | undefined
}

export async function finishRun(
  sc: SupabaseClient, id: string | undefined,
  r: { status: 'ok' | 'error'; users_processed?: number; items_processed?: number; alerts_created?: number; error?: string; details?: Record<string, unknown> },
) {
  if (!id) return
  await sc.from('trading_job_runs').update({ ...r, finished_at: new Date().toISOString() }).eq('id', id)
}

export type Caller = { kind: 'user'; userId: string } | { kind: 'cron' }

/**
 * Scheduled runs send the token stored in app_secrets (TRADING_CRON_TOKEN) in
 * the x-trading-cron header; everyone else must be a signed-in user. Returns
 * null when neither applies, so callers can answer 401.
 */
export async function authorizeCaller(sc: SupabaseClient, req: Request): Promise<Caller | null> {
  const cronToken = req.headers.get('x-trading-cron')
  if (cronToken) {
    const { data } = await sc.from('app_secrets').select('secret_value').eq('secret_key', 'TRADING_CRON_TOKEN').maybeSingle()
    const expected = data?.secret_value ?? ''
    if (!expected || expected.length !== cronToken.length) return null
    let diff = 0
    for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ cronToken.charCodeAt(i)
    return diff === 0 ? { kind: 'cron' } : null
  }
  const userId = await callerUserId(sc, req)
  return userId ? { kind: 'user', userId } : null
}

export async function isAdmin(sc: SupabaseClient, userId: string) {
  const { data } = await sc.from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin').maybeSingle()
  return !!data
}

/** Returns the signed-in user id, or null when there is no valid user token. */
export async function callerUserId(sc: SupabaseClient, req: Request): Promise<string | null> {
  const auth = req.headers.get('Authorization') ?? ''
  const token = auth.replace(/^Bearer\s+/i, '')
  if (!token) return null
  const { data } = await sc.auth.getUser(token)
  return data?.user?.id ?? null
}

export const fmt = (n: number | null | undefined, cur = 'EUR') =>
  n == null ? '–' : new Intl.NumberFormat('nl-NL', { style: 'currency', currency: cur || 'EUR' }).format(n)

export function classify(price: number | null, market: number | null, threshold: number) {
  if (price == null || market == null || market <= 0) return { signal: 'unknown', deviation: null as number | null }
  const deviation = Math.round(((price - market) / market) * 1000) / 10
  const signal = deviation > threshold ? 'overpriced' : deviation < -threshold ? 'underpriced' : 'fair'
  return { signal, deviation }
}
