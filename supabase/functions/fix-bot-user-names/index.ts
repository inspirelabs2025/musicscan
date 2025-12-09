import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get all bot profiles
    const { data: botProfiles, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, first_name, is_bot')
      .eq('is_bot', true);

    if (profileError) {
      throw new Error(`Failed to fetch bot profiles: ${profileError.message}`);
    }

    if (!botProfiles || botProfiles.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No bot users found',
          updated: 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Found ${botProfiles.length} bot profiles to check`);

    const updated = [];
    const errors = [];

    for (const profile of botProfiles) {
      try {
        // Get user metadata from auth.users
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(
          profile.user_id
        );

        if (authError || !authUser.user) {
          console.error(`Failed to get auth user for ${profile.user_id}:`, authError);
          errors.push({ user_id: profile.user_id, error: authError?.message || 'User not found' });
          continue;
        }

        const firstName = authUser.user.user_metadata?.first_name;

        // Only update if we have a name and the profile doesn't have a first_name
        if (firstName && !profile.first_name) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              first_name: firstName
            })
            .eq('user_id', profile.user_id);

          if (updateError) {
            console.error(`Failed to update profile for ${profile.user_id}:`, updateError);
            errors.push({ user_id: profile.user_id, error: updateError.message });
            continue;
          }

          updated.push({
            user_id: profile.user_id,
            first_name: firstName
          });

          console.log(`✅ Updated bot profile: ${firstName}`);
        } else {
          console.log(`Bot profile ${profile.user_id} already has name or no name in metadata`);
        }

      } catch (error) {
        console.error(`Error processing bot ${profile.user_id}:`, error);
        errors.push({ user_id: profile.user_id, error: error.message });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        updated_count: updated.length,
        error_count: errors.length,
        checked_total: botProfiles.length,
        updated,
        errors
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in fix-bot-user-names:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
