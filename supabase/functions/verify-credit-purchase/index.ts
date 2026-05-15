import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Same mapping as create-credit-checkout
const CREDIT_PACKAGES: Record<string, number> = {
  "price_1TWft6IHZHcZHyKVYrZoAW6P": 10,
  "price_1TWftQIHZHcZHyKVT2yNX3TP": 50,
  "price_1TWfu2IHZHcZHyKVUYQ3tPe4": 100,
  "price_1TWfubIHZHcZHyKVrkM237tC": 250,
  "price_1TWfvHIHZHcZHyKVT1ztzUjR": 500,
  "price_1TWfvaIHZHcZHyKVeUAkKvQj": 1000,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("Niet ingelogd");

    const { sessionId } = await req.json();
    if (!sessionId) throw new Error("Session ID verplicht");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ success: false, error: "Betaling niet voltooid" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check metadata
    const creditsAmount = parseInt(session.metadata?.credits_amount || "0");
    const userId = session.metadata?.user_id;

    if (!creditsAmount || !userId || userId !== user.id) {
      throw new Error("Ongeldige sessie data");
    }

    const { data: result, error: rpcError } = await supabaseAdmin.rpc("purchase_credits", {
      p_user_id: userId,
      p_amount: creditsAmount,
      p_reference_id: sessionId,
      p_description: `Aankoop: ${creditsAmount} credits`,
    });
    if (rpcError) {
      console.error("[verify-credit-purchase] RPC error:", rpcError);
      throw new Error("Credits konden niet worden toegevoegd");
    }
    const row = result && result[0];
    if (row && row.fulfilled === false) {
      return new Response(JSON.stringify({ success: true, credits: creditsAmount, already_fulfilled: true, balance: row.balance }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    console.log(`[verify-credit-purchase] Fulfilled ${creditsAmount} credits for user ${userId}, new balance: ${row?.balance}`);

    return new Response(JSON.stringify({ success: true, credits: creditsAmount, balance: row?.balance }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[verify-credit-purchase] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
