import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { extractStatisticsPricing } from '../_shared/extract-statistics-pricing.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { discogs_id } = await req.json();
    if (!discogs_id) {
      return new Response(JSON.stringify({ error: "discogs_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`💰 Fetching full pricing for Discogs ID: ${discogs_id}`);

    const scraperApiKey = Deno.env.get("SCRAPERAPI_KEY");
    const discogsToken = Deno.env.get("DISCOGS_TOKEN");

    // Strategy 1: ScraperAPI scraping (gets all 3 prices)
    if (scraperApiKey) {
      try {
        const releasePageUrl = `https://www.discogs.com/release/${discogs_id}?curr=EUR`;
        const scraperUrl = `https://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(releasePageUrl)}&render=false&keep_headers=true`;

        console.log(`🌐 Scraping release page for statistics...`);
        const resp = await fetch(scraperUrl);

        if (resp.ok) {
          const html = await resp.text();
          const stats = extractStatisticsPricing(html);

          if (stats && (stats.lowest_price || stats.median_price || stats.highest_price)) {
            // Extract num_for_sale
            let numForSale = 0;
            const forSaleMatch = html.match(/(\d+)\s*(?:for sale|te koop)/i);
            if (forSaleMatch) numForSale = parseInt(forSaleMatch[1], 10);

            console.log(`✅ Statistics: low=${stats.lowest_price}, med=${stats.median_price}, high=${stats.highest_price}, for_sale=${numForSale}`);

            return new Response(JSON.stringify({
              lowest_price: stats.lowest_price,
              median_price: stats.median_price,
              highest_price: stats.highest_price,
              num_for_sale: numForSale,
              currency: "EUR",
              source: "scraperapi",
            }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          console.log("⚠️ No Statistics section found in scraped HTML");
        } else {
          console.log(`⚠️ ScraperAPI returned ${resp.status}`);
        }
      } catch (e) {
        console.error("ScraperAPI error:", e);
      }
    }

    // Strategy 2: Discogs API fallback (only lowest_price available)
    if (discogsToken) {
      try {
        const apiResp = await fetch(`https://api.discogs.com/releases/${discogs_id}`, {
          headers: {
            Authorization: `Discogs token=${discogsToken}`,
            "User-Agent": "MusicScan/1.0 +https://musicscan.app",
          },
        });

        if (apiResp.ok) {
          const data = await apiResp.json();
          console.log(`📡 Discogs API fallback: lowest_price=${data.lowest_price}`);

          return new Response(JSON.stringify({
            lowest_price: data.lowest_price ? Math.round(data.lowest_price * 0.92 * 100) / 100 : null,
            median_price: null,
            highest_price: null,
            num_for_sale: data.num_for_sale || 0,
            currency: "EUR",
            source: "discogs_api",
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } catch (e) {
        console.error("Discogs API error:", e);
      }
    }

    return new Response(JSON.stringify({
      lowest_price: null,
      median_price: null,
      highest_price: null,
      num_for_sale: 0,
      currency: "EUR",
      source: "none",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
