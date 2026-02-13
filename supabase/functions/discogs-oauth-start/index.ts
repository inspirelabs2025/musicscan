import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// OAuth 1.0a signature helper
function percentEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/\*/g, '%2A')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
}

async function hmacSha1(key: string, data: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(key)
  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyData, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data))
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
}

function generateNonce(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('')
}

async function makeOAuthRequest(
  method: string,
  url: string,
  consumerKey: string,
  consumerSecret: string,
  token = '',
  tokenSecret = '',
  extraParams: Record<string, string> = {}
): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const nonce = generateNonce()

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_version: '1.0',
    ...extraParams,
  }
  if (token) oauthParams.oauth_token = token

  const allParams = { ...oauthParams }
  const paramString = Object.keys(allParams)
    .sort()
    .map(k => `${percentEncode(k)}=${percentEncode(allParams[k])}`)
    .join('&')

  const baseString = `${method}&${percentEncode(url)}&${percentEncode(paramString)}`
  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`
  const signature = await hmacSha1(signingKey, baseString)
  oauthParams.oauth_signature = signature

  const authHeader = 'OAuth ' + Object.keys(oauthParams)
    .map(k => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
    .join(', ')

  const res = await fetch(url, {
    method,
    headers: {
      'Authorization': authHeader,
      'User-Agent': 'MusicScan/1.0 +https://musicscan.app',
    },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Discogs API error ${res.status}: ${body}`)
  }

  return await res.text()
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

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token)
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }
    const userId = claimsData.claims.sub as string

    const consumerKey = Deno.env.get('DISCOGS_CONSUMER_KEY')!
    const consumerSecret = Deno.env.get('DISCOGS_CONSUMER_SECRET')!

    // Parse callback URL from request body
    const body = await req.json().catch(() => ({}))
    const callbackUrl = body.callback_url || 'https://musicscan.lovable.app/mijn-collectie?discogs=callback'

    // Step 1: Get request token
    const requestTokenUrl = 'https://api.discogs.com/oauth/request_token'
    const responseBody = await makeOAuthRequest(
      'GET',
      requestTokenUrl,
      consumerKey,
      consumerSecret,
      '',
      '',
      { oauth_callback: callbackUrl }
    )

    const params = new URLSearchParams(responseBody)
    const oauthToken = params.get('oauth_token')!
    const oauthTokenSecret = params.get('oauth_token_secret')!

    // Step 2: Store temp token in database
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    await serviceClient.from('discogs_oauth_temp').insert({
      user_id: userId,
      oauth_token: oauthToken,
      oauth_token_secret: oauthTokenSecret,
    })

    // Step 3: Return authorize URL
    const authorizeUrl = `https://www.discogs.com/oauth/authorize?oauth_token=${oauthToken}`

    return new Response(JSON.stringify({
      authorize_url: authorizeUrl,
      oauth_token: oauthToken,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('OAuth start error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
