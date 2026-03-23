import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Check admin role
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: roleData } = await serviceClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403, headers: corsHeaders })
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured')
    }

    const { campaignId } = await req.json()
    if (!campaignId) {
      return new Response(JSON.stringify({ error: 'campaignId required' }), { status: 400, headers: corsHeaders })
    }

    // Get campaign
    const { data: campaign, error: campError } = await serviceClient
      .from('discogs_bulk_email_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()

    if (campError || !campaign) {
      return new Response(JSON.stringify({ error: 'Campaign not found' }), { status: 404, headers: corsHeaders })
    }

    // Get pending sends
    const { data: sends, error: sendsError } = await serviceClient
      .from('discogs_bulk_email_sends')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('status', 'pending')

    if (sendsError || !sends || sends.length === 0) {
      return new Response(JSON.stringify({ error: 'No pending sends', sent: 0, failed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Update campaign status to sending
    await serviceClient
      .from('discogs_bulk_email_campaigns')
      .update({ status: 'sending' })
      .eq('id', campaignId)

    let sentCount = 0
    let failedCount = 0
    const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') || 'noreply@musicscan.app'

    for (const send of sends) {
      try {
        // Rate limit: 200ms between sends
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
            to: [send.buyer_email],
            subject: campaign.subject,
            html: campaign.html_content,
          }),
        })

        if (res.ok) {
          sentCount++
          await serviceClient
            .from('discogs_bulk_email_sends')
            .update({ status: 'sent', sent_at: new Date().toISOString() })
            .eq('id', send.id)
        } else {
          const errBody = await res.text()
          failedCount++
          await serviceClient
            .from('discogs_bulk_email_sends')
            .update({ status: 'failed', error_message: errBody.substring(0, 500) })
            .eq('id', send.id)
        }
      } catch (err) {
        failedCount++
        await serviceClient
          .from('discogs_bulk_email_sends')
          .update({ status: 'failed', error_message: err.message?.substring(0, 500) || 'Unknown error' })
          .eq('id', send.id)
      }
    }

    // Update campaign totals
    await serviceClient
      .from('discogs_bulk_email_campaigns')
      .update({
        sent_count: campaign.sent_count + sentCount,
        failed_count: campaign.failed_count + failedCount,
        status: 'completed',
        sent_at: new Date().toISOString(),
      })
      .eq('id', campaignId)

    return new Response(JSON.stringify({ sent: sentCount, failed: failedCount, total: sends.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Bulk email error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
