import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const { discogs_ids, cleanup_mode } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // MODE 1: Delete everything from today
    if (cleanup_mode === 'today') {
      console.log(`🗑️ Starting cleanup of ALL items created today`);

      // Delete all blog posts from today
      const { data: deletedBlogs, error: blogsError } = await supabase
        .from('blog_posts')
        .delete()
        .gte('created_at', new Date().toISOString().split('T')[0])
        .lt('created_at', new Date(Date.now() + 86400000).toISOString().split('T')[0])
        .select('id');

      if (blogsError) {
        console.error('Error deleting blogs:', blogsError);
      }

      console.log(`📝 Deleted ${deletedBlogs?.length || 0} blog posts from today`);

      // Delete all products from today
      const { data: deletedProducts, error: deleteError } = await supabase
        .from('platform_products')
        .delete()
        .gte('created_at', new Date().toISOString().split('T')[0])
        .lt('created_at', new Date(Date.now() + 86400000).toISOString().split('T')[0])
        .select('id');

      if (deleteError) {
        console.error('Error deleting products:', deleteError);
        throw deleteError;
      }

      console.log(`✅ Deleted ${deletedProducts?.length || 0} products from today`);

      return new Response(
        JSON.stringify({ 
          products_deleted: deletedProducts?.length || 0,
          blogs_deleted: deletedBlogs?.length || 0,
          message: `Successfully deleted ALL items from today: ${deletedProducts?.length || 0} products and ${deletedBlogs?.length || 0} blogs`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // MODE 2: Delete by discogs_ids (original functionality)
    if (!discogs_ids || !Array.isArray(discogs_ids) || discogs_ids.length === 0) {
      return new Response(
        JSON.stringify({ error: 'discogs_ids array is required or use cleanup_mode: "today"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🗑️ Starting bulk cleanup for ${discogs_ids.length} discogs_ids`);

    // Step 1: Get product IDs
    const { data: products, error: productsError } = await supabase
      .from('platform_products')
      .select('id, discogs_id, title')
      .in('discogs_id', discogs_ids);

    if (productsError) {
      console.error('Error fetching products:', productsError);
      throw productsError;
    }

    console.log(`📦 Found ${products?.length || 0} products to delete`);

    if (!products || products.length === 0) {
      return new Response(
        JSON.stringify({ 
          products_deleted: 0, 
          blogs_deleted: 0,
          message: 'No products found with those discogs_ids'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const productIds = products.map(p => p.id);

    // Step 2: Delete blog posts
    const { data: deletedBlogs, error: blogsError } = await supabase
      .from('blog_posts')
      .delete()
      .in('album_id', productIds)
      .select('id');

    if (blogsError) {
      console.error('Error deleting blogs:', blogsError);
    }

    console.log(`📝 Deleted ${deletedBlogs?.length || 0} blog posts`);

    // Step 3: Delete products
    const { data: deletedProducts, error: deleteError } = await supabase
      .from('platform_products')
      .delete()
      .in('discogs_id', discogs_ids)
      .select('id');

    if (deleteError) {
      console.error('Error deleting products:', deleteError);
      throw deleteError;
    }

    console.log(`✅ Deleted ${deletedProducts?.length || 0} products`);

    return new Response(
      JSON.stringify({ 
        products_deleted: deletedProducts?.length || 0,
        blogs_deleted: deletedBlogs?.length || 0,
        message: `Successfully deleted ${deletedProducts?.length || 0} products and ${deletedBlogs?.length || 0} blogs`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Bulk cleanup error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
