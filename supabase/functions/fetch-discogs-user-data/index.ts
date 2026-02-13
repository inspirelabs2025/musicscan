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
  method: string,
  url: string,
  consumerKey: string,
  consumerSecret: string,
  accessToken: string,
  accessTokenSecret: string,
): Promise<Response> {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const nonce = generateNonce()

  // Parse URL to separate base URL and query params for signature
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

  // Include query params in signature base
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

    const { target, page = 1, per_page = 50 } = await req.json()

    if (!['collection', 'wantlist', 'inventory'].includes(target)) {
      return new Response(JSON.stringify({ error: 'Invalid target. Use collection, wantlist, or inventory' }), {
        status: 400, headers: corsHeaders
      })
    }

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

    const { oauth_token: accessToken, oauth_token_secret: accessTokenSecret, discogs_username: username } = tokenData
    const clampedPerPage = Math.min(Math.max(per_page, 1), 50)

    let apiUrl: string

    if (target === 'collection') {
      apiUrl = `https://api.discogs.com/users/${username}/collection/folders/0/releases?page=${page}&per_page=${clampedPerPage}&sort=added&sort_order=desc`
    } else if (target === 'wantlist') {
      apiUrl = `https://api.discogs.com/users/${username}/wants?page=${page}&per_page=${clampedPerPage}`
    } else {
      // inventory
      apiUrl = `https://api.discogs.com/users/${username}/inventory?page=${page}&per_page=${clampedPerPage}&status=For+Sale`
    }

    const res = await makeAuthenticatedRequest(
      'GET', apiUrl, consumerKey, consumerSecret, accessToken, accessTokenSecret
    )

    if (!res.ok) {
      const errText = await res.text()
      console.error(`Discogs API error ${res.status}:`, errText)
      return new Response(JSON.stringify({ error: `Discogs API error: ${res.status}` }), {
        status: res.status, headers: corsHeaders
      })
    }

    const data = await res.json()

    // Normalize response - Discogs uses different keys per endpoint
    let items: unknown[]
    if (target === 'collection') {
      items = (data.releases || []).map((r: any) => ({
        id: r.id,
        instance_id: r.instance_id,
        rating: r.rating,
        basic_information: r.basic_information,
        date_added: r.date_added,
      }))
    } else if (target === 'wantlist') {
      items = (data.wants || []).map((w: any) => ({
        id: w.id,
        rating: w.rating,
        basic_information: w.basic_information,
        date_added: w.date_added,
        notes: w.notes,
      }))
    } else {
      // inventory / listings
      items = (data.listings || []).map((l: any) => ({
        id: l.id,
        status: l.status,
        price: l.price,
        condition: l.condition,
        sleeve_condition: l.sleeve_condition,
        comments: l.comments,
        release: l.release,
        posted: l.posted,
        uri: l.uri,
      }))
    }

    const pagination = data.pagination || { page: 1, pages: 1, items: 0, per_page: clampedPerPage }

    return new Response(JSON.stringify({ items, pagination }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Fetch discogs user data error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
