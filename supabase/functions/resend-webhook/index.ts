// Resend webhook receiver — verifies Svix signature and updates
// discogs_bulk_email_sends with delivery status.
//
// Events handled:
//   email.delivered        -> status='delivered', delivered_at=event.created_at
//   email.bounced          -> status='bounced',   delivered_at=event.created_at
//   email.complained       -> status='complained',delivered_at=event.created_at
//   email.delivery_delayed -> logged, no DB change
//
// Webhook config in Resend dashboard:
//   URL: https://<project-ref>.functions.supabase.co/resend-webhook
//   Signing secret -> stored as env RESEND_WEBHOOK_SECRET (format: whsec_<base64>)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { decode as decodeBase64 } from 'https://deno.land/std@0.224.0/encoding/base64.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature',
}

async function verifySvixSignature(
  secret: string,
  svixId: string,
  svixTimestamp: string,
  svixSignatureHeader: string,
  body: string,
): Promise<boolean> {
  try {
    // Secret format: "whsec_<base64>". Strip prefix and base64-decode.
    const rawSecret = secret.startsWith('whsec_') ? secret.slice(6) : secret
    const keyBytes = decodeBase64(rawSecret)

    const key = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    )

    const toSign = `${svixId}.${svixTimestamp}.${body}`
    const sigBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(toSign))
    const expected = btoa(String.fromCharCode(...new Uint8Array(sigBuf)))

    // Header format: "v1,<sig> v1,<sig2> ..." — at least one must match.
    const provided = svixSignatureHeader.split(' ')
    for (const part of provided) {
      const [version, sig] = part.split(',')
      if (version === 'v1' && sig && sig === expected) return true
    }
    return false
  } catch (err) {
    console.error('[resend-webhook] signature verify error:', err)
    return false
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const secret = Deno.env.get('RESEND_WEBHOOK_SECRET')
    const svixId = req.headers.get('svix-id')
    const svixTimestamp = req.headers.get('svix-timestamp')
    const svixSignature = req.headers.get('svix-signature')

    const rawBody = await req.text()

    if (secret) {
      if (!svixId || !svixTimestamp || !svixSignature) {
        return new Response(JSON.stringify({ error: 'Missing Svix headers' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      const ok = await verifySvixSignature(secret, svixId, svixTimestamp, svixSignature, rawBody)
      if (!ok) {
        console.warn('[resend-webhook] invalid signature for svix-id', svixId)
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    } else {
      console.warn('[resend-webhook] RESEND_WEBHOOK_SECRET not set — skipping signature verification (DEV ONLY)')
    }

    const payload = JSON.parse(rawBody) as {
      type?: string
      created_at?: string
      data?: { email_id?: string; [k: string]: unknown }
    }

    const eventType = payload.type
    const emailId = payload.data?.email_id
    const eventAt = payload.created_at || new Date().toISOString()

    if (!eventType || !emailId) {
      console.warn('[resend-webhook] missing type or email_id', { eventType, emailId })
      return new Response(JSON.stringify({ ok: true, ignored: 'missing fields' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const statusMap: Record<string, string> = {
      'email.delivered': 'delivered',
      'email.bounced': 'bounced',
      'email.complained': 'complained',
    }

    // delivery_delayed and other events: log only, no DB write.
    if (!statusMap[eventType]) {
      console.log('[resend-webhook] logged event (no status change)', { eventType, emailId })
      return new Response(JSON.stringify({ ok: true, logged: eventType }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const newStatus = statusMap[eventType]
    const { data, error } = await supabase
      .from('discogs_bulk_email_sends')
      .update({ status: newStatus, delivered_at: eventAt })
      .eq('resend_email_id', emailId)
      .select('id')

    if (error) {
      console.error('[resend-webhook] update error', error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!data || data.length === 0) {
      // Not necessarily an error — webhook may fire before our DB has the id,
      // or the email_id belongs to a non-bulk send.
      console.log('[resend-webhook] no matching send for email_id', emailId, 'event', eventType)
    } else {
      console.log('[resend-webhook] updated', data.length, 'row(s) ->', newStatus, 'for', emailId)
    }

    return new Response(JSON.stringify({ ok: true, updated: data?.length ?? 0, status: newStatus }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[resend-webhook] fatal', err)
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
