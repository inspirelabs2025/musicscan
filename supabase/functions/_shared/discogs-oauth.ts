// Shared OAuth 1.0a (HMAC-SHA1) signing for Discogs user-token requests.
function percentEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/!/g, '%21').replace(/\*/g, '%2A')
    .replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29')
}

async function hmacSha1(key: string, data: string): Promise<string> {
  const enc = new TextEncoder()
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', k, enc.encode(data))
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
}

function nonce(): string {
  const a = new Uint8Array(16)
  crypto.getRandomValues(a)
  return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('')
}

export interface DiscogsToken {
  user_id: string
  discogs_username: string
  oauth_token: string
  oauth_token_secret: string
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Signed Discogs request. Retries 429 with backoff (max 3 attempts). */
export async function discogsFetch(
  method: 'GET' | 'POST',
  url: string,
  token: DiscogsToken,
  body?: unknown,
): Promise<Response> {
  const consumerKey = Deno.env.get('DISCOGS_CONSUMER_KEY')!
  const consumerSecret = Deno.env.get('DISCOGS_CONSUMER_SECRET')!

  for (let attempt = 1; attempt <= 3; attempt++) {
    const u = new URL(url)
    const baseUrl = `${u.origin}${u.pathname}`
    const oauth: Record<string, string> = {
      oauth_consumer_key: consumerKey,
      oauth_nonce: nonce(),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_token: token.oauth_token,
      oauth_version: '1.0',
    }
    const all: Record<string, string> = { ...oauth }
    u.searchParams.forEach((v, k) => { all[k] = v })
    const paramString = Object.keys(all).sort()
      .map((k) => `${percentEncode(k)}=${percentEncode(all[k])}`).join('&')
    const baseString = `${method}&${percentEncode(baseUrl)}&${percentEncode(paramString)}`
    oauth.oauth_signature = await hmacSha1(`${percentEncode(consumerSecret)}&${percentEncode(token.oauth_token_secret)}`, baseString)
    const auth = 'OAuth ' + Object.keys(oauth).map((k) => `${percentEncode(k)}="${percentEncode(oauth[k])}"`).join(', ')

    const res = await fetch(url, {
      method,
      headers: {
        Authorization: auth,
        'User-Agent': 'MusicScan/1.0 +https://musicscans.com',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    if (res.status === 429 && attempt < 3) {
      await res.body?.cancel()
      await sleep(attempt * 5000)
      continue
    }
    return res
  }
  throw new Error('unreachable')
}

/** Keep well under the 60 req/min Discogs limit. */
export const DISCOGS_DELAY_MS = 1100
