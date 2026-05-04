import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEMO_EMAIL = 'demo.playstore@musicscan.app';
const DEMO_PASSWORD = 'MusicScanDemo2026!';
const DEMO_FIRST_NAME = 'Play Store';
const DEMO_LAST_NAME = 'Reviewer';
const STARTING_CREDITS = 50;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Check if user already exists
    const { data: existingList } = await supabase.auth.admin.listUsers();
    const existing = existingList?.users?.find((u) => u.email === DEMO_EMAIL);

    let userId: string;
    let action: string;

    if (existing) {
      userId = existing.id;
      // Reset password + ensure email confirmed
      const { error: updErr } = await supabase.auth.admin.updateUserById(userId, {
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: {
          first_name: DEMO_FIRST_NAME,
          last_name: DEMO_LAST_NAME,
          full_name: `${DEMO_FIRST_NAME} ${DEMO_LAST_NAME}`,
        },
      });
      if (updErr) throw updErr;
      action = 'reset';
    } else {
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: {
          first_name: DEMO_FIRST_NAME,
          last_name: DEMO_LAST_NAME,
          full_name: `${DEMO_FIRST_NAME} ${DEMO_LAST_NAME}`,
        },
      });
      if (createErr) throw createErr;
      userId = created.user.id;
      action = 'created';
    }

    // Top up credits to STARTING_CREDITS
    const { data: creditsRow } = await supabase
      .from('user_credits')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle();

    if (creditsRow) {
      await supabase
        .from('user_credits')
        .update({ balance: STARTING_CREDITS })
        .eq('user_id', userId);
    } else {
      await supabase
        .from('user_credits')
        .insert({ user_id: userId, balance: STARTING_CREDITS });
    }

    return new Response(
      JSON.stringify({
        success: true,
        action,
        credentials: {
          email: DEMO_EMAIL,
          password: DEMO_PASSWORD,
          credits: STARTING_CREDITS,
        },
        user_id: userId,
        instructions:
          'Use these credentials in Google Play Console → App content → App access. They never expire and credits are reset on each invocation of this function.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('create-playstore-demo-user error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
