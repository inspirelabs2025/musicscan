import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BOT_NAMES = [
  'Emma de Vries', 'Lars Janssen', 'Sophie van Dijk', 'Max Bakker', 'Lisa Vermeer',
  'Tom de Jong', 'Nina Peters', 'Daan Mulder', 'Eva Visser', 'Jesse Smit',
  'Fleur Hendriks', 'Luuk van Leeuwen', 'Zoë Dekker', 'Finn Brouwer', 'Liv Jansen'
];

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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const created = [];
    const errors = [];

    for (const botName of BOT_NAMES) {
      try {
        const email = `${botName.toLowerCase().replace(/ /g, '.')}.@musicscan.bot`;
        const password = `bot-${crypto.randomUUID()}`;

        // Check if bot already exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('first_name', botName.split(' ')[0])
          .eq('is_bot', true)
          .single();

        if (existingProfile) {
          console.log(`Bot ${botName} already exists, skipping`);
          continue;
        }

        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            first_name: botName.split(' ')[0],
            full_name: botName
          }
        });

        if (authError) {
          console.error(`Failed to create auth user for ${botName}:`, authError);
          errors.push({ name: botName, error: authError.message });
          continue;
        }

        // Update profile to mark as bot and ensure name is set
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            is_bot: true, 
            is_public: false,
            first_name: botName.split(' ')[0]
          })
          .eq('user_id', authData.user.id);

        if (profileError) {
          console.error(`Failed to update profile for ${botName}:`, profileError);
          errors.push({ name: botName, error: profileError.message });
          continue;
        }

        created.push({
          name: botName,
          email,
          user_id: authData.user.id
        });

        console.log(`✅ Created bot user: ${botName}`);

      } catch (error) {
        console.error(`Error creating bot ${botName}:`, error);
        errors.push({ name: botName, error: error.message });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        created_count: created.length,
        error_count: errors.length,
        created,
        errors
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in create-bot-users:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});