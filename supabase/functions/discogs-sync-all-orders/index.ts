import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function percentEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/!/g, '%21').replace(/\*/g, '%2A')
    .replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29')
}

async function hmacSha1(key: string, data: string): Promise<string> {
  const encoder = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey(
    'raw', encoder.encode(key), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data))
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
}

function generateNonce(): string {
  const a = new Uint8Array(16)
  crypto.getRandomValues(a)
  return Array.from(a, b => b.toString(16).padStart(2, '0')).join('')
}

async function makeAuthenticatedRequest(
  method: string, url: string,
  consumerKey: string, consumerSecret: string,
  accessToken: string, accessTokenSecret: string,
): Promise<Response> {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const nonce = generateNonce()
  const urlObj = new URL(url)
  const baseUrl = `${urlObj.origin}${urlObj.pathname}`

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_token: accessToken,
    oauth_version: '1.0',
  }

  const allParams: Record<string, string> = { ...oauthParams }
  urlObj.searchParams.forEach((value, key) => { allParams[key] = value })

  const paramString = Object.keys(allParams).sort()
    .map(k => `${percentEncode(k)}=${percentEncode(allParams[k])}`).join('&')
  const baseString = `${method}&${percentEncode(baseUrl)}&${percentEncode(paramString)}`
  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(accessTokenSecret)}`
  const signature = await hmacSha1(signingKey, baseString)
  oauthParams.oauth_signature = signature

  const authHeader = 'OAuth ' + Object.keys(oauthParams)
    .map(k => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`).join(', ')

  return fetch(url, {
    method,
    headers: {
      'Authorization': authHeader,
      'User-Agent': 'MusicScan/1.0 +https://musicscan.app',
    },
  })
}

function mapOrder(userId: string, o: any) {
  return {
    id: `${userId}_${o.id}`,
    user_id: userId,
    discogs_order_id: o.id,
    buyer_username: o.buyer?.username || null,
    buyer_email: o.buyer?.email || null,
    seller_username: o.seller?.username || null,
    status: o.status || null,
    total_value: o.total?.value || null,
    total_currency: o.total?.currency || 'EUR',
    shipping_value: o.shipping?.value || null,
    shipping_method: o.shipping?.method || null,
    shipping_address: o.shipping_address || null,
    fee_value: o.fee?.value || null,
    fee_currency: o.fee?.currency || null,
    tracking_number: o.tracking?.number || null,
    tracking_url: o.tracking?.url || null,
    tracking_carrier: o.tracking?.carrier || null,
    items: o.items || null,
    additional_instructions: o.additional_instructions || null,
    archived: o.archived || false,
    discogs_created_at: o.created || null,
    last_activity_at: o.last_activity || null,
    updated_at: new Date().toISOString(),
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: roleData } = await serviceClient
      .from('user_roles').select('role')
      .eq('user_id', user.id).eq('role', 'admin').maybeSingle()
    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403, headers: corsHeaders })
    }

    const body = await req.json().catch(() => ({}))
    const targetUserId: string | undefined = body.user_id // optional, default: all connected
    const maxPages: number = Math.min(body.max_pages || 200, 500)

    const consumerKey = Deno.env.get('DISCOGS_CONSUMER_KEY')!
    const consumerSecret = Deno.env.get('DISCOGS_CONSUMER_SECRET')!

    let tokensQuery = serviceClient.from('discogs_user_tokens').select('*')
    if (targetUserId) tokensQuery = tokensQuery.eq('user_id', targetUserId)
    const { data: tokens, error: tokensError } = await tokensQuery
    if (tokensError) throw tokensError
    if (!tokens?.length) {
      return new Response(JSON.stringify({ error: 'No connected Discogs accounts' }), { status: 400, headers: corsHeaders })
    }

    const summary: any[] = []

    for (const t of tokens) {
      let page = 1
      let totalPages = 1
      let saved = 0
      let withEmail = 0
      const accessToken = t.oauth_token
      const accessTokenSecret = t.oauth_token_secret

      while (page <= totalPages && page <= maxPages) {
        const apiUrl = `https://api.discogs.com/marketplace/orders?page=${page}&per_page=100&sort=last_activity&sort_order=desc&status=All`
        const res = await makeAuthenticatedRequest('GET', apiUrl, consumerKey, consumerSecret, accessToken, accessTokenSecret)

        if (!res.ok) {
          const errText = await res.text()
          console.error(`[sync-all-orders] user=${t.user_id} page=${page} status=${res.status}:`, errText)
          summary.push({ user_id: t.user_id, username: t.discogs_username, error: `Discogs ${res.status}`, page })
          break
        }

        const data = await res.json()
        totalPages = data.pagination?.pages || 1
        const orders = data.orders || []
        if (orders.length === 0) break

        const rows = orders.map((o: any) => mapOrder(t.user_id, o))
        withEmail += rows.filter((r: any) => r.buyer_email).length

        const { error: upErr } = await serviceClient
          .from('discogs_orders')
          .upsert(rows, { onConflict: 'user_id,discogs_order_id' })
        if (upErr) {
          console.error('upsert error:', upErr.message)
        } else {
          saved += rows.length
        }

        console.log(`[sync-all-orders] user=${t.discogs_username} page=${page}/${totalPages} saved=${rows.length}`)
        page++
        // Discogs rate limit: ~60 req/min authenticated → ~1.1s
        await new Promise(r => setTimeout(r, 1100))
      }

      summary.push({
        user_id: t.user_id,
        username: t.discogs_username,
        pages_fetched: page - 1,
        total_pages: totalPages,
        orders_saved: saved,
        orders_with_email: withEmail,
      })
    }

    return new Response(JSON.stringify({ ok: true, summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('[sync-all-orders] error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
