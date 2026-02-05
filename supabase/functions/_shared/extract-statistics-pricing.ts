/**
 * Shared helper: Extract pricing data exclusively from the Discogs "Statistics" section.
 * 
 * The Statistics section contains historical sale prices (Low/Median/High) which are
 * the most reliable source. We deliberately avoid scraping marketplace listings,
 * shipping costs, or other currency amounts on the page.
 * 
 * Modern Discogs HTML structure (React SPA):
 * <span class="name_...">Low<!-- -->:</span><span>$0.96</span>
 * <span class="name_...">Median<!-- -->:</span><span>$2.97</span>
 * <span class="name_...">High<!-- -->:</span><span>$11.76</span>
 * 
 * IMPORTANT: ScraperAPI/anonymous requests always return USD prices regardless of
 * ?curr=EUR parameter. We detect the currency and convert to EUR when needed.
 */

// Approximate USD to EUR conversion rate. Updated periodically.
// This is acceptable because Discogs prices are estimates anyway.
const USD_TO_EUR = 0.92;
const GBP_TO_EUR = 1.17;

export interface StatisticsPricing {
  lowest_price: number | null;
  median_price: number | null;
  highest_price: number | null;
  currency: string;
}

/**
 * Isolates the Statistics section from Discogs HTML and extracts Low/Median/High prices.
 * Returns null if the Statistics section is not found — caller should use Discogs API fallback.
 */
export function extractStatisticsPricing(html: string): StatisticsPricing | null {
  // Step 1: Isolate the Statistics section
  const sectionPatterns = [
    /Statistics\s*<\/h[1-6]>/i,
    /id="statistics"/i,
    /class="[^"]*statistics[^"]*"/i,
    />Statistics</i,
    /Statistics\s*<\//i,
    /Last\s*Sold/i,
  ];

  let sectionStart = -1;
  for (const pattern of sectionPatterns) {
    const match = html.search(pattern);
    if (match !== -1) {
      sectionStart = match;
      break;
    }
  }

  if (sectionStart === -1) {
    console.log('📊 Statistics section not found in HTML');
    return null;
  }

  // Take a generous chunk after the match (3000 chars)
  const statisticsBlock = html.substring(sectionStart, sectionStart + 3000);
  console.log(`📊 Found Statistics section at position ${sectionStart}, block length: ${statisticsBlock.length}`);
  
  // Debug: log first 500 chars of the block (text-only, stripped of tags)
  const textOnly = statisticsBlock.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 500);
  console.log(`📊 Statistics block text preview: ${textOnly}`);

  // Step 2: Strip HTML comments (React inserts <!-- --> between text nodes)
  const cleanBlock = statisticsBlock.replace(/<!--[\s\S]*?-->/g, '');

  // Step 3: Extract prices using patterns that handle HTML tags between label and value
  const parsePrice = (value: string | undefined | null): number | null => {
    if (!value) return null;
    const cleaned = value.replace(',', '.').replace(/\s/g, '');
    const num = parseFloat(cleaned);
    return (!isNaN(num) && num > 0 && num < 10000) ? num : null;
  };

  // After stripping comments, the HTML looks like:
  // <span class="name_...">Low:</span><span>$0.96</span>
  // Match: "Low:" followed by optional HTML tags, then optional currency symbol, then digits
  // Detect currency from the block
  const currencyMatch = cleanBlock.match(/Low(?:est)?:\s*(?:<[^>]*>\s*)*(?:<[^>]*>)?\s*([\$€£])/i);
  const detectedCurrency = currencyMatch?.[1] === '€' ? 'EUR' : currencyMatch?.[1] === '£' ? 'GBP' : 'USD';

  const lowMatch = cleanBlock.match(/Low(?:est)?:\s*(?:<[^>]*>\s*)*(?:<[^>]*>)?\s*[\$€£]?\s*([\d.,]+)/i);
  const medianMatch = cleanBlock.match(/Median:\s*(?:<[^>]*>\s*)*(?:<[^>]*>)?\s*[\$€£]?\s*([\d.,]+)/i);
  const highMatch = cleanBlock.match(/High(?:est)?:\s*(?:<[^>]*>\s*)*(?:<[^>]*>)?\s*[\$€£]?\s*([\d.,]+)/i);

  const lowest = parsePrice(lowMatch?.[1]);
  const median = parsePrice(medianMatch?.[1]);
  const highest = parsePrice(highMatch?.[1]);

  console.log(`📊 Statistics extraction (raw): Low=${lowest}, Median=${median}, High=${highest}, Currency=${detectedCurrency}`);

  if (lowest !== null || median !== null || highest !== null) {
    // Convert to EUR if prices are in another currency
    const convertToEur = (price: number | null): number | null => {
      if (price === null) return null;
      if (detectedCurrency === 'EUR') return price;
      if (detectedCurrency === 'GBP') return Math.round(price * GBP_TO_EUR * 100) / 100;
      // USD (default)
      return Math.round(price * USD_TO_EUR * 100) / 100;
    };

    const result = { 
      lowest_price: convertToEur(lowest), 
      median_price: convertToEur(median), 
      highest_price: convertToEur(highest), 
      currency: 'EUR' 
    };
    
    console.log(`📊 Statistics extraction (EUR): Low=${result.lowest_price}, Median=${result.median_price}, High=${result.highest_price}`);
    return result;
  }

  console.log('📊 No prices found within Statistics section');
  return null;
}
