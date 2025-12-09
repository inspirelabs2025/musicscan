import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestPostRequest {
  message: string;
  imageUrl?: string;
  usePage2?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { message, imageUrl, usePage2 } = await req.json() as TestPostRequest;

    if (!message) {
      return new Response(
        JSON.stringify({ success: false, error: "Message is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Fetch credentials based on which page to use
    const tokenKey = usePage2 ? "FACEBOOK_PAGE_2_ACCESS_TOKEN" : "FACEBOOK_PAGE_ACCESS_TOKEN";
    const pageIdKey = usePage2 ? "FACEBOOK_PAGE_2_ID" : "FACEBOOK_PAGE_ID";

    const { data: secrets, error: secretsError } = await supabase
      .from("app_secrets")
      .select("secret_key, secret_value")
      .in("secret_key", [tokenKey, pageIdKey, "FACEBOOK_APP_SECRET"]);

    if (secretsError) {
      console.error("Error fetching secrets:", secretsError);
      throw new Error("Failed to fetch Facebook credentials");
    }

    const secretMap: Record<string, string> = {};
    secrets?.forEach(s => {
      secretMap[s.secret_key] = s.secret_value;
    });

    const pageAccessToken = secretMap[tokenKey];
    const pageId = secretMap[pageIdKey];
    const appSecret = secretMap["FACEBOOK_APP_SECRET"];

    if (!pageAccessToken || !pageId) {
      throw new Error(`Missing credentials for ${usePage2 ? "Page 2" : "Page 1"}`);
    }

    // Generate appsecret_proof
    let appsecretProof = "";
    if (appSecret) {
      const hmac = createHmac("sha256", appSecret);
      hmac.update(pageAccessToken);
      appsecretProof = hmac.digest("hex");
    }

    console.log(`Posting to ${usePage2 ? "Page 2" : "Page 1"} (${pageId})`);

    let fbResponse;
    let fbData;

    if (imageUrl) {
      // Post with image
      const photoUrl = `https://graph.facebook.com/v21.0/${pageId}/photos`;
      const photoParams = new URLSearchParams({
        url: imageUrl,
        message: message,
        access_token: pageAccessToken,
        ...(appsecretProof && { appsecret_proof: appsecretProof })
      });

      fbResponse = await fetch(`${photoUrl}?${photoParams.toString()}`, {
        method: "POST"
      });
    } else {
      // Text-only post
      const feedUrl = `https://graph.facebook.com/v21.0/${pageId}/feed`;
      const feedParams = new URLSearchParams({
        message: message,
        access_token: pageAccessToken,
        ...(appsecretProof && { appsecret_proof: appsecretProof })
      });

      fbResponse = await fetch(`${feedUrl}?${feedParams.toString()}`, {
        method: "POST"
      });
    }

    fbData = await fbResponse.json();

    if (!fbResponse.ok) {
      console.error("Facebook API error:", fbData);
      throw new Error(fbData.error?.message || "Facebook API error");
    }

    console.log("Post successful:", fbData);

    // Log the test post
    await supabase.from("facebook_post_log").insert({
      content_type: "test_post",
      title: `Test post to ${usePage2 ? "Page 2" : "Page 1"}`,
      content: message,
      image_url: imageUrl || null,
      facebook_post_id: fbData.id || fbData.post_id,
      status: "success",
      posted_at: new Date().toISOString(),
      facebook_response: fbData
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        postId: fbData.id || fbData.post_id,
        page: usePage2 ? "Page 2" : "Page 1"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in post-to-facebook-test:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
