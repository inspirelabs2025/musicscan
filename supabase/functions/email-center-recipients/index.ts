import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Returns aggregated recipient sources for the admin email center.
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

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
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

    const url = new URL(req.url)
    const source = url.searchParams.get('source') || 'all'

    const result: Record<string, Array<{ email: string; name?: string | null; meta?: any }>> = {}

    if (source === 'users' || source === 'all') {
      const users: Array<{ email: string; name?: string | null }> = []
      let page = 1
      const perPage = 1000
      for (;;) {
        const { data, error } = await serviceClient.auth.admin.listUsers({ page, perPage })
        if (error) break
        for (const u of data.users || []) {
          if (u.email) users.push({ email: u.email, name: (u.user_metadata?.first_name as string) || null })
        }
        if (!data.users || data.users.length < perPage) break
        page++
        if (page > 20) break // hard safety
      }
      result.users = users
    }

    if (source === 'newsletter' || source === 'all') {
      const { data } = await serviceClient
        .from('newsletter_subscribers')
        .select('email, is_confirmed, unsubscribed_at')
        .is('unsubscribed_at', null)
        .order('subscribed_at', { ascending: false })
        .limit(5000)
      result.newsletter = (data || []).map((r: any) => ({ email: r.email, name: null, meta: { confirmed: r.is_confirmed } }))
    }

    if (source === 'discogs' || source === 'all') {
      const { data } = await serviceClient
        .from('discogs_orders')
        .select('buyer_email, buyer_username')
        .not('buyer_email', 'is', null)
        .limit(5000)
      const seen = new Map<string, { email: string; name?: string | null }>()
      for (const r of data || []) {
        const email = (r as any).buyer_email?.toLowerCase()
        if (email && !seen.has(email)) {
          seen.set(email, { email: (r as any).buyer_email, name: (r as any).buyer_username || null })
        }
      }
      result.discogs = Array.from(seen.values())
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('Email center recipients error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
