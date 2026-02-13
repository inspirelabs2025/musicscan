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
  body?: string
): Promise<Response> {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const nonce = generateNonce()

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_token: accessToken,
    oauth_version: '1.0',
  }

  const paramString = Object.keys(oauthParams).sort()
    .map(k => `${percentEncode(k)}=${percentEncode(oauthParams[k])}`).join('&')
  const baseString = `${method}&${percentEncode(url)}&${percentEncode(paramString)}`
  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(accessTokenSecret)}`
  const signature = await hmacSha1(signingKey, baseString)
  oauthParams.oauth_signature = signature

  const authHeader = 'OAuth ' + Object.keys(oauthParams)
    .map(k => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
    .join(', ')

  const headers: Record<string, string> = {
    'Authorization': authHeader,
    'User-Agent': 'MusicScan/1.0 +https://musicscan.app',
  }
  if (body) headers['Content-Type'] = 'application/json'

  return fetch(url, { method, headers, body })
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
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
    const userId = user.id

    const { discogs_ids, target } = await req.json()
    // discogs_ids: number[] - list of Discogs release IDs
    // target: 'collection' | 'wantlist'

    if (!discogs_ids?.length || !['collection', 'wantlist', 'forsale'].includes(target)) {
      return new Response(JSON.stringify({ error: 'Invalid parameters. Need discogs_ids[] and target (collection/wantlist/forsale)' }), {
        status: 400, headers: corsHeaders
      })
    }

    const consumerKey = Deno.env.get('DISCOGS_CONSUMER_KEY')!
    const consumerSecret = Deno.env.get('DISCOGS_CONSUMER_SECRET')!

    // Get user's Discogs tokens
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: tokenData, error: tokenError } = await serviceClient
      .from('discogs_user_tokens')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (tokenError || !tokenData) {
      return new Response(JSON.stringify({ error: 'Discogs account niet gekoppeld' }), {
        status: 400, headers: corsHeaders
      })
    }

    const { oauth_token: accessToken, oauth_token_secret: accessTokenSecret, discogs_username: username } = tokenData

    const results: Array<{ discogs_id: number; success: boolean; error?: string }> = []

    for (const discogsId of discogs_ids) {
      try {
        let url: string
        let method: string
        let body: string | undefined

        if (target === 'collection') {
          url = `https://api.discogs.com/users/${username}/collection/folders/1/releases/${discogsId}`
          method = 'POST'
        } else if (target === 'wantlist') {
          url = `https://api.discogs.com/users/${username}/wants/${discogsId}`
          method = 'PUT'
        } else {
          // forsale: POST /marketplace/listings
          url = `https://api.discogs.com/marketplace/listings`
          method = 'POST'
          body = JSON.stringify({
            release_id: discogsId,
            condition: 'Very Good Plus (VG+)',
            status: 'Draft',
          })
        }
        const res = await makeAuthenticatedRequest(
          method, url, consumerKey, consumerSecret, accessToken, accessTokenSecret, body
        )

        if (res.ok || res.status === 201) {
          await res.text() // consume body
          results.push({ discogs_id: discogsId, success: true })
        } else {
          const errBody = await res.text()
          results.push({ discogs_id: discogsId, success: false, error: `${res.status}: ${errBody}` })
        }
      } catch (err) {
        results.push({ discogs_id: discogsId, success: false, error: err.message })
      }

      // Rate limit: 1 request per second
      if (discogs_ids.indexOf(discogsId) < discogs_ids.length - 1) {
        await delay(1100)
      }
    }

    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    return new Response(JSON.stringify({
      total: discogs_ids.length,
      successful,
      failed,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Export error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
