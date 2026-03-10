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

    // Extract condition - Discogs uses item_condition block with spans
    let conditionMedia = '';
    let conditionSleeve = '';

    // Strategy 1: Look for item_condition block with spans
    const condBlock = row.match(/<p[^>]*class="[^"]*item_condition[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
    if (condBlock) {
      const block = condBlock[1];

      // Media condition: find spans with condition grade text, skip sleeve spans
      const allSpans = [...block.matchAll(/<span[^>]*>([\s\S]*?)<\/span>/gi)];
      for (const span of allSpans) {
        const text = span[1].replace(/<[^>]+>/g, '').trim().split('\n')[0].trim();
        if (!conditionMedia && /(?:Mint|Near Mint|Very Good|Good|Fair|Poor|Generic)/i.test(text)) {
          if (!span[0].includes('item_sleeve_condition')) {
            conditionMedia = text;
          }
        }
      }

      // Sleeve condition: span with class item_sleeve_condition
      const sleeveMatch = block.match(/<span[^>]*class="[^"]*item_sleeve_condition[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
      if (sleeveMatch) {
        conditionSleeve = sleeveMatch[1].replace(/<[^>]+>/g, '').trim();
      }
    }

    // Strategy 2: Fallback - tooltip titles with condition grades
    if (!conditionMedia) {
      const tooltipMatches = [...row.matchAll(/title="([^"]*(?:Mint|Very Good|Good|Fair|Poor)[^"]*)"/gi)];
      if (tooltipMatches.length >= 1) {
        conditionMedia = tooltipMatches[0][1];
        if (tooltipMatches.length >= 2) {
          conditionSleeve = tooltipMatches[1][1];
        }
      }
    }

    // Strategy 3: Direct abbreviated grade pattern
    if (!conditionMedia) {
      const gradePattern = /\b(M|NM|VG\+|VG|G\+|G|F|P)\s*[\/\(]/;
      const gradeMatch = row.match(gradePattern);
      if (gradeMatch) conditionMedia = gradeMatch[1];
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
