import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization');

    console.log('Authorization header present:', !!authHeader);

    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's JWT to check their role
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user has admin role - extract token and pass explicitly
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    console.log('User retrieved:', user ? user.email : 'null', 'Error:', userError?.message);
    
    if (userError || !user) {
      console.error('User authentication failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin role
    const { data: hasAdminRole, error: roleError } = await supabaseClient
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });

    console.log('Admin check:', hasAdminRole, 'Error:', roleError?.message);

    if (roleError || !hasAdminRole) {
      console.error('Admin check failed:', roleError);
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create service role client to bypass RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all shop orders with related data
    const { data: orders, error } = await supabaseAdmin
      .from('shop_orders')
      .select('*, shop_order_items (*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch buyer and seller profiles separately
    const buyerIds = orders?.map(o => o.buyer_id).filter(Boolean) || [];
    const sellerIds = orders?.map(o => o.seller_id).filter(Boolean) || [];
    const allUserIds = [...new Set([...buyerIds, ...sellerIds])];

    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, first_name, avatar_url')
      .in('user_id', allUserIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    }

    // Get emails from auth.users
    const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching auth users:', authError);
    }

    // Combine data
    const ordersWithProfiles = orders?.map(order => {
      const buyerProfile = profiles?.find(p => p.user_id === order.buyer_id);
      const sellerProfile = profiles?.find(p => p.user_id === order.seller_id);
      const buyerAuth = authUsers?.find(u => u.id === order.buyer_id);
      const sellerAuth = authUsers?.find(u => u.id === order.seller_id);

      return {
        ...order,
        buyer: buyerProfile ? {
          ...buyerProfile,
          email: buyerAuth?.email || order.buyer_email,
        } : null,
        seller: sellerProfile ? {
          ...sellerProfile,
          email: sellerAuth?.email || '',
        } : null,
      };
    });

    return new Response(
      JSON.stringify({ orders: ordersWithProfiles }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in admin-shop-orders function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
