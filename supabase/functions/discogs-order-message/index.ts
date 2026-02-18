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
  body?: string,
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

  const headers: Record<string, string> = {
    'Authorization': authHeader,
    'User-Agent': 'MusicScan/1.0 +https://musicscan.app',
  }
  if (body) {
    headers['Content-Type'] = 'application/json'
  }

  return fetch(url, {
    method,
    headers,
    ...(body ? { body } : {}),
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

    // Parse body once
    const { order_id, message, action, mode } = await req.json()

    if (!order_id) {
      return new Response(JSON.stringify({ error: 'order_id is required' }), { status: 400, headers: corsHeaders })
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

    const { oauth_token: accessToken, oauth_token_secret: accessTokenSecret } = tokenData
    const apiUrl = `https://api.discogs.com/marketplace/orders/${order_id}/messages`

    // mode=list → GET messages for this order
    if (mode === 'list') {
      const res = await makeAuthenticatedRequest(
        'GET', apiUrl, consumerKey, consumerSecret, accessToken, accessTokenSecret
      )

      if (!res.ok) {
        const errText = await res.text()
        console.error(`Discogs messages GET error ${res.status}:`, errText)
        return new Response(JSON.stringify({ error: `Discogs API error: ${res.status}` }), {
          status: res.status, headers: corsHeaders
        })
      }

      const data = await res.json()
      
      // Save messages to database (deduplicate before upsert)
      const msgs = data.messages || [];
      if (msgs.length > 0) {
        const seen = new Set<string>();
        const rows = [];
        for (const m of msgs) {
          const sender = m.from?.username || m.actor?.username || null;
          const ts = m.timestamp || null;
          const key = `${order_id}_${sender}_${ts}`;
          if (seen.has(key)) continue;
          seen.add(key);
          rows.push({
            user_id: user.id,
            discogs_order_id: order_id,
            sender_username: sender,
            message: m.message || null,
            subject: m.subject || null,
            original: m.original || null,
            status_id: m.status_id || null,
            message_timestamp: ts,
          });
        }
        
        if (rows.length > 0) {
          const { error: saveErr } = await serviceClient
            .from('discogs_order_messages')
            .upsert(rows, { onConflict: 'discogs_order_id,sender_username,message_timestamp' });
          
          if (saveErr) console.error('Error saving messages:', saveErr.message);
          else console.log(`Saved ${rows.length} messages for order ${order_id}`);
        }
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Default: POST a new message (and optionally update status)
    if (!message && !action) {
      return new Response(JSON.stringify({ error: 'message or action is required' }), {
        status: 400, headers: corsHeaders
      })
    }

    const bodyPayload: Record<string, string> = {}
    if (message) bodyPayload.message = message
    if (action) bodyPayload.status = action // e.g. "Shipped", "Payment Received"

    console.log(`[discogs-order-message] Sending to order ${order_id}:`, bodyPayload)

    const res = await makeAuthenticatedRequest(
      'POST', apiUrl, consumerKey, consumerSecret, accessToken, accessTokenSecret,
      JSON.stringify(bodyPayload)
    )

    if (!res.ok) {
      const errText = await res.text()
      console.error(`Discogs messages POST error ${res.status}:`, errText)
      return new Response(JSON.stringify({ error: `Discogs API error: ${res.status}`, details: errText }), {
        status: res.status, headers: corsHeaders
      })
    }

    const data = await res.json()
    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Discogs order message error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
