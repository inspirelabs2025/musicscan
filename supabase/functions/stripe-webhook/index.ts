import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2025-08-27.basil",
  });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const body = await req.text();

  let event: Stripe.Event;
  try {
    if (!signature || !webhookSecret) {
      throw new Error("Missing signature or webhook secret");
    }
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("[stripe-webhook] Signature verification failed:", err.message);
    return new Response(JSON.stringify({ error: `Webhook Error: ${err.message}` }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // Only handle credit purchases
      if (session.metadata?.type !== "credit_purchase") {
        return new Response(JSON.stringify({ received: true, skipped: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (session.payment_status !== "paid") {
        return new Response(JSON.stringify({ received: true, unpaid: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userId = session.metadata?.user_id;
      const creditsAmount = parseInt(session.metadata?.credits_amount || "0");

      if (!userId || !creditsAmount) {
        console.error("[stripe-webhook] Missing metadata:", session.metadata);
        return new Response(JSON.stringify({ error: "Missing metadata" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Idempotency check
      const { data: existing } = await supabaseAdmin
        .from("credit_transactions")
        .select("id")
        .eq("reference_id", session.id)
        .eq("transaction_type", "purchase")
        .maybeSingle();

      if (existing) {
        console.log(`[stripe-webhook] Already fulfilled: ${session.id}`);
        return new Response(JSON.stringify({ received: true, already_fulfilled: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Add credits via atomic RPC
      const { error: creditError } = await supabaseAdmin.rpc("add_user_credits", {
        p_user_id: userId,
        p_amount: creditsAmount,
      });

      if (creditError) {
        console.error("[stripe-webhook] Failed to add credits:", creditError);
        throw new Error("Credits could not be added");
      }

      // Log transaction
      await supabaseAdmin.from("credit_transactions").insert({
        user_id: userId,
        amount: creditsAmount,
        transaction_type: "purchase",
        reference_id: session.id,
        description: `Aankoop: ${creditsAmount} credits (webhook)`,
      });

      console.log(`[stripe-webhook] Fulfilled ${creditsAmount} credits for user ${userId} via webhook`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[stripe-webhook] Handler error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
