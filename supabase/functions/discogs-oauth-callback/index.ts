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

    const { oauth_token, oauth_verifier } = await req.json()
    if (!oauth_token || !oauth_verifier) {
      return new Response(JSON.stringify({ error: 'Missing oauth_token or oauth_verifier' }), {
        status: 400, headers: corsHeaders
      })
    }

    const consumerKey = Deno.env.get('DISCOGS_CONSUMER_KEY')!
    const consumerSecret = Deno.env.get('DISCOGS_CONSUMER_SECRET')!

    // Look up temp token secret
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: tempData, error: tempError } = await serviceClient
      .from('discogs_oauth_temp')
      .select('oauth_token_secret')
      .eq('oauth_token', oauth_token)
      .eq('user_id', userId)
      .single()

    if (tempError || !tempData) {
      return new Response(JSON.stringify({ error: 'Token not found or expired' }), {
        status: 400, headers: corsHeaders
      })
    }

    const tokenSecret = tempData.oauth_token_secret

    // Exchange for access token
    const accessTokenUrl = 'https://api.discogs.com/oauth/access_token'
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const nonce = generateNonce()

    const oauthParams: Record<string, string> = {
      oauth_consumer_key: consumerKey,
      oauth_nonce: nonce,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: timestamp,
      oauth_token: oauth_token,
      oauth_verifier: oauth_verifier,
      oauth_version: '1.0',
    }

    const paramString = Object.keys(oauthParams).sort()
      .map(k => `${percentEncode(k)}=${percentEncode(oauthParams[k])}`).join('&')
    const baseString = `POST&${percentEncode(accessTokenUrl)}&${percentEncode(paramString)}`
    const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`
    const signature = await hmacSha1(signingKey, baseString)
    oauthParams.oauth_signature = signature

    const authHeaderValue = 'OAuth ' + Object.keys(oauthParams)
      .map(k => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
      .join(', ')

    const accessRes = await fetch(accessTokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeaderValue,
        'User-Agent': 'MusicScan/1.0 +https://musicscan.app',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    if (!accessRes.ok) {
      const errBody = await accessRes.text()
      throw new Error(`Access token error ${accessRes.status}: ${errBody}`)
    }

    const accessBody = await accessRes.text()
    const accessParams = new URLSearchParams(accessBody)
    const accessToken = accessParams.get('oauth_token')!
    const accessTokenSecret = accessParams.get('oauth_token_secret')!

    // Get Discogs identity
    const identityTimestamp = Math.floor(Date.now() / 1000).toString()
    const identityNonce = generateNonce()
    const identityUrl = 'https://api.discogs.com/oauth/identity'

    const identityOauthParams: Record<string, string> = {
      oauth_consumer_key: consumerKey,
      oauth_nonce: identityNonce,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: identityTimestamp,
      oauth_token: accessToken,
      oauth_version: '1.0',
    }

    const identityParamString = Object.keys(identityOauthParams).sort()
      .map(k => `${percentEncode(k)}=${percentEncode(identityOauthParams[k])}`).join('&')
    const identityBaseString = `GET&${percentEncode(identityUrl)}&${percentEncode(identityParamString)}`
    const identitySigningKey = `${percentEncode(consumerSecret)}&${percentEncode(accessTokenSecret)}`
    const identitySignature = await hmacSha1(identitySigningKey, identityBaseString)
    identityOauthParams.oauth_signature = identitySignature

    const identityAuthHeader = 'OAuth ' + Object.keys(identityOauthParams)
      .map(k => `${percentEncode(k)}="${percentEncode(identityOauthParams[k])}"`)
      .join(', ')

    const identityRes = await fetch(identityUrl, {
      headers: {
        'Authorization': identityAuthHeader,
        'User-Agent': 'MusicScan/1.0 +https://musicscan.app',
      },
    })

    let discogsUsername = null
    let discogsUserId = null
    if (identityRes.ok) {
      const identity = await identityRes.json()
      discogsUsername = identity.username
      discogsUserId = identity.id
    } else {
      await identityRes.text() // consume body
    }

    // Save permanent tokens (upsert)
    const { error: upsertError } = await serviceClient
      .from('discogs_user_tokens')
      .upsert({
        user_id: userId,
        oauth_token: accessToken,
        oauth_token_secret: accessTokenSecret,
        discogs_username: discogsUsername,
        discogs_user_id: discogsUserId,
        connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

    if (upsertError) throw upsertError

    // Clean up temp token
    await serviceClient.from('discogs_oauth_temp')
      .delete().eq('oauth_token', oauth_token)

    return new Response(JSON.stringify({
      success: true,
      discogs_username: discogsUsername,
      discogs_user_id: discogsUserId,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('OAuth callback error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
