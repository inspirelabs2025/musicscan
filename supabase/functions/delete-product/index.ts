import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Authorization header
    const authHeader = req.headers.get('Authorization');
    console.log('Authorization header present:', !!authHeader);
    
    if (!authHeader) {
      console.error('No Authorization header found');
      return new Response(
        JSON.stringify({ error: 'Unauthorized: No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create service role client for secure auth validation
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create anon client with the caller token for RLS-backed role checks
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify the caller token server-side via the auth server.
    const token = (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : authHeader) as string;
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token);
    console.log('User verified:', userData?.user?.id ?? 'null', 'Error:', authError?.message);

    const user = userData?.user
      ? { id: userData.user.id, email: userData.user.email }
      : null;

    if (authError || !user?.id) {
      console.error('User authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin using the has_role function
    const { data: isAdmin, error: roleCheckError } = await supabaseClient
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });

    if (roleCheckError || !isAdmin) {
      console.error('Admin check failed:', roleCheckError);
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { productId } = await req.json();

    if (!productId) {
      throw new Error('Product ID is required');
    }

    console.log(`🗑️ Deleting product: ${productId}`);

    const { error } = await supabase
      .from('platform_products')
      .delete()
      .eq('id', productId);

    if (error) throw error;

    console.log(`✅ Product deleted successfully`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error deleting product:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
