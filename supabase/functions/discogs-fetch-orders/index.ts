import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Helper to save orders to database
async function saveOrdersToDb(serviceClient: any, userId: string, orders: any[]) {
  if (!orders?.length) return;
  
  const rows = orders.map((o: any) => ({
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
  }));

  const { error } = await serviceClient
    .from('discogs_orders')
    .upsert(rows, { onConflict: 'user_id,discogs_order_id' });
  
  if (error) console.error('Error saving orders:', error.message);
  else console.log(`Saved ${rows.length} orders to database`);
}

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
  method: string,
  url: string,
  consumerKey: string,
  consumerSecret: string,
  accessToken: string,
  accessTokenSecret: string,
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
  urlObj.searchParams.forEach((value, key) => {
    allParams[key] = value
  })

  const paramString = Object.keys(allParams).sort()
    .map(k => `${percentEncode(k)}=${percentEncode(allParams[k])}`).join('&')
  const baseString = `${method}&${percentEncode(baseUrl)}&${percentEncode(paramString)}`
  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(accessTokenSecret)}`
  const signature = await hmacSha1(signingKey, baseString)
  oauthParams.oauth_signature = signature

  const authHeader = 'OAuth ' + Object.keys(oauthParams)
    .map(k => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
    .join(', ')

  return fetch(url, {
    method,
    headers: {
      'Authorization': authHeader,
      'User-Agent': 'MusicScan/1.0 +https://musicscan.app',
    },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

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

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const { page = 1, per_page = 25, status, sort, sort_order } = await req.json()

    const consumerKey = Deno.env.get('DISCOGS_CONSUMER_KEY')!
    const consumerSecret = Deno.env.get('DISCOGS_CONSUMER_SECRET')!

    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: tokenData, error: tokenError } = await serviceClient
      .from('discogs_user_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (tokenError || !tokenData) {
      return new Response(JSON.stringify({ error: 'Discogs account niet gekoppeld' }), {
        status: 400, headers: corsHeaders
      })
    }

    const { oauth_token: accessToken, oauth_token_secret: accessTokenSecret } = tokenData

    let apiUrl = `https://api.discogs.com/marketplace/orders?page=${page}&per_page=${Math.min(per_page, 50)}&sort=last_activity&sort_order=desc`
    if (status) apiUrl += `&status=${encodeURIComponent(status)}`
    if (sort) apiUrl += `&sort=${encodeURIComponent(sort)}`
    if (sort_order) apiUrl += `&sort_order=${encodeURIComponent(sort_order)}`

    console.log(`[discogs-fetch-orders] Fetching orders page ${page}`)

    const res = await makeAuthenticatedRequest(
      'GET', apiUrl, consumerKey, consumerSecret, accessToken, accessTokenSecret
    )

    if (!res.ok) {
      const errText = await res.text()
      console.error(`[discogs-fetch-orders] API error ${res.status}:`, errText)
      return new Response(JSON.stringify({ error: `Discogs API error: ${res.status}` }), {
        status: res.status, headers: corsHeaders
      })
    }

    const data = await res.json()
    
    // Save orders to database in background
    saveOrdersToDb(serviceClient, user.id, data.orders || []).catch(e => 
      console.error('Background save error:', e.message)
    );

    return new Response(JSON.stringify({
      orders: data.orders || [],
      pagination: data.pagination || { page: 1, pages: 1, items: 0 },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[discogs-fetch-orders] Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
