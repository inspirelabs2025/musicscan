import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Recipient {
  email: string
  name?: string | null
}

interface SendRequest {
  subject: string
  html_content: string
  recipients: Recipient[]
  test_mode?: boolean
  campaign_id?: string // when retrying an existing campaign
  bg_color?: string
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

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY is not configured')

    const body: SendRequest = await req.json()
    const { subject, html_content, recipients, test_mode, bg_color } = body

    if (!subject || !html_content) {
      return new Response(JSON.stringify({ error: 'subject and html_content are required' }), { status: 400, headers: corsHeaders })
    }

    // Deduplicate and validate
    const seen = new Set<string>()
    const cleanRecipients: Recipient[] = []
    for (const r of recipients || []) {
      const email = (r?.email || '').trim().toLowerCase()
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue
      if (seen.has(email)) continue
      seen.add(email)
      cleanRecipients.push({ email, name: r.name || null })
    }

    if (cleanRecipients.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid recipients' }), { status: 400, headers: corsHeaders })
    }

    // Create campaign
    const { data: campaign, error: campError } = await serviceClient
      .from('email_center_campaigns')
      .insert({
        subject,
        html_content,
        bg_color: bg_color || '#f4f4f5',
        status: 'sending',
        total_count: cleanRecipients.length,
        test_mode: !!test_mode,
        created_by: user.id,
      })
      .select()
      .single()

    if (campError || !campaign) {
      console.error('Campaign create error', campError)
      return new Response(JSON.stringify({ error: 'Could not create campaign' }), { status: 500, headers: corsHeaders })
    }

    // Insert sends as pending
    const sendsRows = cleanRecipients.map(r => ({
      campaign_id: campaign.id,
      recipient_email: r.email,
      recipient_name: r.name,
      status: 'pending',
    }))
    const { data: sends, error: sendsError } = await serviceClient
      .from('email_center_sends')
      .insert(sendsRows)
      .select()

    if (sendsError || !sends) {
      console.error('Sends insert error', sendsError)
      return new Response(JSON.stringify({ error: 'Could not create sends' }), { status: 500, headers: corsHeaders })
    }

    const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') || 'noreply@musicscan.app'

    const wrapHtml = (content: string, name?: string | null) => {
      const personalizedContent = content
        .replace(/\{\{name\}\}/g, name || 'there')
        .replace(/\{\{username\}\}/g, name || 'there')
      const bg = bg_color || '#f4f4f5'
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:${bg};font-family:Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;padding:30px 20px;"><div style="background:#ffffff;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">${personalizedContent}</div><p style="text-align:center;font-size:12px;color:#999;margin-top:20px;">MusicScan &bull; <a href="https://musicscan.app" style="color:#7c3aed;">musicscan.app</a></p></div></body></html>`
    }

    let sentCount = 0
    let failedCount = 0

    for (const send of sends) {
      try {
        if (sentCount > 0 || failedCount > 0) {
          await new Promise(r => setTimeout(r, 200))
        }

        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `MusicScan <${ADMIN_EMAIL}>`,
            to: [send.recipient_email],
            subject,
            html: wrapHtml(html_content, send.recipient_name),
          }),
        })

        if (res.ok) {
          sentCount++
          let resendEmailId: string | null = null
          try {
            const json = await res.json()
            resendEmailId = json?.id ?? null
          } catch (_) { /* ignore */ }
          await serviceClient
            .from('email_center_sends')
            .update({ status: 'sent', sent_at: new Date().toISOString(), resend_email_id: resendEmailId })
            .eq('id', send.id)
        } else {
          const errBody = await res.text()
          failedCount++
          await serviceClient
            .from('email_center_sends')
            .update({ status: 'failed', error_message: errBody.substring(0, 500) })
            .eq('id', send.id)
        }
      } catch (err: any) {
        failedCount++
        await serviceClient
          .from('email_center_sends')
          .update({ status: 'failed', error_message: (err?.message || 'Unknown error').substring(0, 500) })
          .eq('id', send.id)
      }
    }

    await serviceClient
      .from('email_center_campaigns')
      .update({
        sent_count: sentCount,
        failed_count: failedCount,
        status: 'completed',
        sent_at: new Date().toISOString(),
      })
      .eq('id', campaign.id)

    return new Response(JSON.stringify({
      campaign_id: campaign.id,
      sent: sentCount,
      failed: failedCount,
      total: cleanRecipients.length,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error: any) {
    console.error('Email center send error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
