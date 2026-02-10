import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface MarketplaceListing {
  price: number;
  currency: string;
  condition_media: string;
  condition_sleeve: string;
  seller: string;
  ships_from: string;
}

function extractListingsFromHTML(html: string): { total_for_sale: number; listings: MarketplaceListing[] } {
  const listings: MarketplaceListing[] = [];

  // Extract total for sale count
  let totalForSale = 0;
  const totalMatch = html.match(/(\d+)\s+(?:items?|results?|for sale|te koop)/i);
  if (totalMatch) totalForSale = parseInt(totalMatch[1], 10);

  // Extract individual listing rows from the sell page
  const rowRegex = /<tr[^>]*class="[^"]*shortcut_navigable[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;

  while ((rowMatch = rowRegex.exec(html)) !== null && listings.length < 10) {
    const row = rowMatch[1];

    // Extract price - look for converted price or main price span
    let price = 0;
    const convertedPriceMatch = row.match(/approximately\s*€([\d,.]+)/i)
      || row.match(/about\s*€([\d,.]+)/i)
      || row.match(/≈\s*€([\d,.]+)/i);
    if (convertedPriceMatch) {
      price = parseFloat(convertedPriceMatch[1].replace(',', ''));
    }
    if (price === 0) {
      const priceMatch = row.match(/€([\d,.]+)/);
      if (priceMatch) {
        price = parseFloat(priceMatch[1].replace(',', ''));
      }
    }
    if (price === 0) {
      const anyPrice = row.match(/class="[^"]*price[^"]*"[^>]*>[^<]*?([\d,.]+)/i);
      if (anyPrice) price = parseFloat(anyPrice[1].replace(',', ''));
    }

    // Extract condition - Discogs uses abbreviated forms like "VG+", "NM", "M"
    // and full forms like "Very Good Plus (VG+)"
    let conditionMedia = '';
    let conditionSleeve = '';
    
    // Look for "Media: ..." and "Sleeve: ..." or the p.item_condition spans
    const condBlock = row.match(/<p[^>]*class="[^"]*item_condition[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
    if (condBlock) {
      const block = condBlock[1];
      // Media condition tooltip or text
      const mediaMatch = block.match(/Media[^<]*<[^>]*>([^<]+)/i)
        || block.match(/data-condition="([^"]+)"/i);
      if (mediaMatch) conditionMedia = mediaMatch[1].trim();
      
      const sleeveMatch = block.match(/Sleeve[^<]*<[^>]*>([^<]+)/i);
      if (sleeveMatch) conditionSleeve = sleeveMatch[1].trim();
    }
    
    // Fallback: look for condition abbreviations in spans with tooltips
    if (!conditionMedia) {
      const condSpans = row.match(/title="([^"]*(?:Mint|Good|Fair|Poor)[^"]*)"/gi);
      if (condSpans && condSpans.length >= 1) {
        const m1 = condSpans[0].match(/title="([^"]+)"/);
        if (m1) conditionMedia = m1[1];
        if (condSpans.length >= 2) {
          const m2 = condSpans[1].match(/title="([^"]+)"/);
          if (m2) conditionSleeve = m2[1];
        }
      }
    }

    // Extract seller name
    let seller = '';
    const sellerMatch = row.match(/seller_info[\s\S]*?<a[^>]*>([^<]+)/i)
      || row.match(/<td[^>]*class="[^"]*seller_info[^"]*"[\s\S]*?<a[^>]*title="([^"]+)"/i)
      || row.match(/<a[^>]*href="\/seller\/([^/"]+)/i);
    if (sellerMatch) seller = sellerMatch[1].trim();

    // Extract ships from / country
    let shipsFrom = '';
    const shipsMatch = row.match(/Ships\s*From:\s*<\/span>\s*([^<]+)/i)
      || row.match(/data-ship-from="([^"]+)"/i)
      || row.match(/seller_info[\s\S]*?<\/a>[\s\S]*?<br\s*\/?>\s*([A-Z][a-zA-Z\s]+)/);
    if (shipsMatch) shipsFrom = shipsMatch[1].trim();

    if (price > 0) {
      listings.push({
        price,
        currency: "EUR",
        condition_media: conditionMedia || 'Not specified',
        condition_sleeve: conditionSleeve || 'Not specified',
        seller: seller || 'Unknown',
        ships_from: shipsFrom || 'Unknown',
      });
    }
  }

  if (totalForSale === 0 && listings.length > 0) {
    totalForSale = listings.length;
  }

  return { total_for_sale: totalForSale, listings };
}

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

    console.log(`🏪 Fetching marketplace listings for Discogs ID: ${discogs_id}`);

    const scraperApiKey = Deno.env.get("SCRAPERAPI_KEY");

    // Strategy 1: ScraperAPI - scrape the sell page
    if (scraperApiKey) {
      try {
        const sellPageUrl = `https://www.discogs.com/sell/release/${discogs_id}?sort=price%2Casc&limit=10&curr=EUR`;
        const scraperUrl = `https://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(sellPageUrl)}&render=false&keep_headers=true`;

        console.log(`🌐 Scraping sell page...`);
        const resp = await fetch(scraperUrl, {
          headers: { "User-Agent": "MusicScan/1.0 +https://musicscan.app" },
        });

        if (resp.ok) {
          const html = await resp.text();
          const result = extractListingsFromHTML(html);

          console.log(`✅ Extracted ${result.listings.length} listings, total_for_sale: ${result.total_for_sale}`);

          return new Response(JSON.stringify({
            total_for_sale: result.total_for_sale,
            listings: result.listings,
            source: "scraperapi",
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else {
          console.log(`⚠️ ScraperAPI returned ${resp.status}`);
        }
      } catch (e) {
        console.error("ScraperAPI error:", e);
      }
    }

    // Strategy 2: Discogs API fallback - just return the count
    const discogsToken = Deno.env.get("DISCOGS_TOKEN");
    if (discogsToken) {
      try {
        const apiResp = await fetch(`https://api.discogs.com/marketplace/stats/${discogs_id}?curr_abbr=EUR`, {
          headers: {
            Authorization: `Discogs token=${discogsToken}`,
            "User-Agent": "MusicScan/1.0 +https://musicscan.app",
          },
        });

        if (apiResp.ok) {
          const data = await apiResp.json();
          console.log(`📡 Discogs API fallback: num_for_sale=${data.num_for_sale}, lowest=${data.lowest_price?.value}`);

          return new Response(JSON.stringify({
            total_for_sale: data.num_for_sale || 0,
            listings: [],
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
      total_for_sale: 0,
      listings: [],
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
