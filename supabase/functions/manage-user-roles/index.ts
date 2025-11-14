import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserWithRoles {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  first_name: string | null;
  avatar_url: string | null;
  roles: string[];
}

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

    // Create anon client to verify user auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    console.log('User retrieved:', user ? user.email : 'null', 'Error:', userError?.message);
    
    if (userError || !user) {
      console.error('User authentication failed:', userError);
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

    // Create service role client for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    
    // Parse request body for action
    const body = req.method === 'POST' ? await req.json() : {};
    const action = body.action || 'list';
    
    console.log('Action:', action, 'Body:', body);

    // LIST - Fetch all users with their roles
    if (action === 'list') {
      const searchQuery = url.searchParams.get('search') || '';
      const roleFilter = url.searchParams.get('role') || '';

      // Fetch all users from auth.users via admin API
      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (authError) {
        throw new Error(`Failed to fetch users: ${authError.message}`);
      }

      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('user_id, first_name, avatar_url');

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      // Fetch all user roles
      const { data: userRoles, error: rolesError } = await supabaseAdmin
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        throw new Error(`Failed to fetch roles: ${rolesError.message}`);
      }

      // Combine data
      const usersWithRoles: UserWithRoles[] = authUsers.users.map(authUser => {
        const profile = profiles?.find(p => p.user_id === authUser.id);
        const roles = userRoles?.filter(r => r.user_id === authUser.id).map(r => r.role) || [];

        return {
          id: authUser.id,
          email: authUser.email || '',
          created_at: authUser.created_at,
          last_sign_in_at: authUser.last_sign_in_at,
          first_name: profile?.first_name || null,
          avatar_url: profile?.avatar_url || null,
          roles: roles,
        };
      });

      // Apply filters
      let filteredUsers = usersWithRoles;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredUsers = filteredUsers.filter(u => 
          u.email.toLowerCase().includes(query) ||
          (u.first_name?.toLowerCase() || '').includes(query)
        );
      }

      if (roleFilter) {
        filteredUsers = filteredUsers.filter(u => u.roles.includes(roleFilter));
      }

      return new Response(
        JSON.stringify({ users: filteredUsers }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ASSIGN - Assign role to user
    if (action === 'assign') {
      const { userId, role } = body;

      if (!userId || !role) {
        return new Response(
          JSON.stringify({ error: 'Missing userId or role' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate role
      const validRoles = ['admin', 'moderator', 'user'];
      if (!validRoles.includes(role)) {
        return new Response(
          JSON.stringify({ error: 'Invalid role' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Insert role (unique constraint will prevent duplicates)
      const { error: insertError } = await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: userId, role });

      if (insertError) {
        // Check if it's a duplicate error
        if (insertError.code === '23505') {
          return new Response(
            JSON.stringify({ error: 'User already has this role' }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        throw insertError;
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Role assigned successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // REMOVE - Remove role from user
    if (action === 'remove') {
      const { userId, role } = body;

      if (!userId || !role) {
        return new Response(
          JSON.stringify({ error: 'Missing userId or role' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error: deleteError } = await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);

      if (deleteError) {
        throw deleteError;
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Role removed successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in manage-user-roles:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
