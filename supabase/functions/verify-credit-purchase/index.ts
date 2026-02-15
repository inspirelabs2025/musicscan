import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Same mapping as create-credit-checkout
const CREDIT_PACKAGES: Record<string, number> = {
  "price_1T13ukIWa9kBN7qAxdQu2r1P": 10,
  "price_1T13vOIWa9kBN7qA6P75zHI5": 50,
  "price_1T13vbIWa9kBN7qAcBAIDL43": 100,
  "price_1T13w0IWa9kBN7qA6CeHdAKU": 250,
  "price_1T13wJIWa9kBN7qAXmNQnrjl": 500,
  "price_1T13wYIWa9kBN7qAE41S1xZg": 1000,
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

    // Check if already fulfilled (idempotency)
    const { data: existing } = await supabaseAdmin
      .from("credit_transactions")
      .select("id")
      .eq("reference_id", sessionId)
      .eq("transaction_type", "purchase")
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ success: true, credits: creditsAmount, already_fulfilled: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Add credits using the atomic RPC function
    const { error: creditError } = await supabaseAdmin.rpc("add_user_credits", {
      p_user_id: userId,
      p_amount: creditsAmount,
    });

    if (creditError) {
      console.error("[verify-credit-purchase] Failed to add credits:", creditError);
      throw new Error("Credits konden niet worden toegevoegd");
    }

    // Log transaction
    await supabaseAdmin.from("credit_transactions").insert({
      user_id: userId,
      amount: creditsAmount,
      transaction_type: "purchase",
      reference_id: sessionId,
      description: `Aankoop: ${creditsAmount} credits`,
    });

    console.log(`[verify-credit-purchase] Fulfilled ${creditsAmount} credits for user ${userId}`);

    return new Response(JSON.stringify({ success: true, credits: creditsAmount }), {
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
