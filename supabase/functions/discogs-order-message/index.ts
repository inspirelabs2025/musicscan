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
  contentType = 'application/json',
  bodyParams?: Record<string, string>,
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
  if (bodyParams && contentType === 'application/x-www-form-urlencoded') {
    Object.entries(bodyParams).forEach(([key, value]) => {
      allParams[key] = value
    })
  }

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
    headers['Content-Type'] = contentType
  }

  return fetch(url, {
    method,
    headers,
    ...(body ? { body } : {}),
  })
}

function normalizeMessage(value: string): string {
  return value.replace(/\r\n/g, '\n').trim()
}

async function saveDiscogsMessages(serviceClient: any, userId: string, orderId: string, messages: any[]) {
  if (!messages.length) return

  const seen = new Set<string>()
  const rows = []
  for (const m of messages) {
    const sender = m.from?.username || m.actor?.username || null
    const ts = m.timestamp || null
    const key = `${orderId}_${sender}_${ts}`
    if (seen.has(key)) continue
    seen.add(key)
    rows.push({
      user_id: userId,
      discogs_order_id: orderId,
      sender_username: sender,
      message: m.message || null,
      subject: m.subject || null,
      original: m.original || null,
      status_id: m.status_id || null,
      message_timestamp: ts,
    })
  }

  if (rows.length > 0) {
    const { error: saveErr } = await serviceClient
      .from('discogs_order_messages')
      .upsert(rows, { onConflict: 'discogs_order_id,sender_username,message_timestamp' })

    if (saveErr) console.error('Error saving messages:', saveErr.message)
    else console.log(`Saved ${rows.length} messages for order ${orderId}`)
  }
}

function isFreshMessage(timestamp: string | null | undefined, sentAfterMs: number): boolean {
  if (!timestamp) return false
  const messageMs = Date.parse(timestamp)
  return Number.isFinite(messageMs) && messageMs >= sentAfterMs
}

function findConfirmedSentMessage(messages: any[], ownUsername: string | null, message: string, sentAfterMs: number) {
  const expected = normalizeMessage(message)
  return messages.find((m) => {
    const sender = m.from?.username || m.actor?.username || null
    return sender === ownUsername && normalizeMessage(m.message || '') === expected && isFreshMessage(m.timestamp, sentAfterMs)
  }) || null
}

async function sendPrivateDiscogsMessage(
  username: string,
  subject: string,
  message: string,
  consumerKey: string,
  consumerSecret: string,
  accessToken: string,
  accessTokenSecret: string,
) {
  const attempts = [
    { url: 'https://api.discogs.com/messages', body: { recipient: username, subject, message }, form: false },
    { url: 'https://api.discogs.com/messages', body: { to: username, subject, message }, form: false },
    { url: 'https://api.discogs.com/messages/compose', body: { recipient: username, subject, message }, form: false },
    { url: 'https://api.discogs.com/messages/compose', body: { to: username, subject, message }, form: false },
    { url: 'https://api.discogs.com/messages', body: { recipient: username, subject, message }, form: true },
    { url: 'https://api.discogs.com/messages', body: { to: username, subject, message }, form: true },
    { url: 'https://api.discogs.com/messages/compose', body: { recipient: username, subject, message }, form: true },
    { url: 'https://api.discogs.com/messages/compose', body: { to: username, subject, message }, form: true },
  ]

  const errors: string[] = []
  for (const attempt of attempts) {
    const body = attempt.form
      ? new URLSearchParams(attempt.body).toString()
      : JSON.stringify(attempt.body)
    const contentType = attempt.form ? 'application/x-www-form-urlencoded' : 'application/json'
    const res = await makeAuthenticatedRequest(
      'POST', attempt.url, consumerKey, consumerSecret, accessToken, accessTokenSecret,
      body, contentType, attempt.form ? attempt.body : undefined,
    )
    const raw = await res.text()
    let data: any = null
    try {
      data = raw ? JSON.parse(raw) : null
    } catch (_) {
      data = raw ? { raw } : null
    }

    if (res.ok) {
      console.log(`[discogs-order-message] Private message sent to ${username} via ${attempt.url}`)
      return { success: true, status: res.status, endpoint: attempt.url, data }
    }

    errors.push(`${attempt.url} ${attempt.form ? 'form' : 'json'} ${res.status}: ${raw.slice(0, 300)}`)
    if (res.status === 401) break
  }

  return { success: false, errors }
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
    const { order_id, buyer_username, subject, message, action, mode } = await req.json()

    if (!order_id && mode !== 'private' && mode !== 'api-probe') {
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

    if (mode === 'api-probe') {
      const probes = []
      for (const probe of [
        { method: 'GET', url: 'https://api.discogs.com/messages' },
        { method: 'GET', url: 'https://api.discogs.com/messages/compose' },
        { method: 'OPTIONS', url: 'https://api.discogs.com/messages' },
        { method: 'OPTIONS', url: 'https://api.discogs.com/messages/compose' },
      ]) {
        const probeRes = await makeAuthenticatedRequest(probe.method, probe.url, consumerKey, consumerSecret, accessToken, accessTokenSecret)
        probes.push({ method: probe.method, url: probe.url, status: probeRes.status, body: (await probeRes.text()).slice(0, 500) })
      }
      return new Response(JSON.stringify({ probes }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (mode === 'private') {
      if (!buyer_username || !subject || !message) {
        return new Response(JSON.stringify({ error: 'buyer_username, subject and message are required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const privateResult = await sendPrivateDiscogsMessage(
        buyer_username, subject, message, consumerKey, consumerSecret, accessToken, accessTokenSecret,
      )

      if (!privateResult.success) {
        return new Response(JSON.stringify({
          error: 'Discogs private message API niet gelukt',
          details: privateResult.errors.join(' | '),
        }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (order_id) {
        await saveDiscogsMessages(serviceClient, user.id, order_id, [{
          from: { username: tokenData.discogs_username || null },
          message,
          subject,
          timestamp: new Date().toISOString(),
        }])
      }

      return new Response(JSON.stringify({ success: true, confirmed: true, private: true, result: privateResult }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

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
      await saveDiscogsMessages(serviceClient, user.id, order_id, data.messages || [])

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

    const rawBody = await res.text()
    let data: any = null
    try {
      data = rawBody ? JSON.parse(rawBody) : null
    } catch (_) {
      data = { raw: rawBody }
    }

    // POST 2xx = success. Verification is best-effort only — never fail the send because of it.
    let confirmedMessage: any = null
    const sentAfterMs = Date.now() - 120000

    if (message) {
      if (data?.message) {
        try {
          await saveDiscogsMessages(serviceClient, user.id, order_id, [data])
        } catch (e) {
          console.warn('saveDiscogsMessages (POST echo) failed', e)
        }
        confirmedMessage = findConfirmedSentMessage([data], tokenData.discogs_username || null, message, sentAfterMs)
      }

      // Discogs can return 2xx without the message becoming visible in the thread.
      // Verify the outbox before reporting success, otherwise the admin UI shows false positives.
      for (let attempt = 1; attempt <= 5 && !confirmedMessage; attempt++) {
        try {
          const verifyRes = await makeAuthenticatedRequest(
            'GET', `${apiUrl}?per_page=25`, consumerKey, consumerSecret, accessToken, accessTokenSecret
          )
          if (verifyRes.ok) {
            const verifyData = await verifyRes.json()
            const messages = verifyData.messages || []
            await saveDiscogsMessages(serviceClient, user.id, order_id, messages)
            confirmedMessage = findConfirmedSentMessage(messages, tokenData.discogs_username || null, message, sentAfterMs)
          } else {
            const verifyErr = await verifyRes.text()
            console.warn(`[discogs-order-message] Verification GET ${verifyRes.status} attempt ${attempt}:`, verifyErr)
          }
        } catch (e) {
          console.warn(`[discogs-order-message] Verification GET attempt ${attempt} failed`, e)
        }

        if (!confirmedMessage && attempt < 5) {
          await new Promise((resolve) => setTimeout(resolve, 1200))
        }
      }

      if (!confirmedMessage) {
        console.error(`[discogs-order-message] POST returned ${res.status}, but message was not found in Discogs thread for order ${order_id}`)
        return new Response(JSON.stringify({
          error: 'Discogs heeft de send-call geaccepteerd, maar het bericht staat niet in de Discogs conversatie.',
          details: 'Niet als verzonden gemarkeerd; probeer een actieve order of controleer of Discogs berichten op deze orderstatus toestaat.',
          discogsStatus: res.status,
          data,
        }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    return new Response(JSON.stringify({ success: true, data, confirmed: !!confirmedMessage, confirmedMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Discogs order message error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
