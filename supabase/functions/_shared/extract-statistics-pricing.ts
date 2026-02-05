/**
 * Shared helper: Extract pricing data exclusively from the Discogs "Statistics" section.
 * 
 * IMPORTANT: ScraperAPI always returns USD prices. We convert to EUR using Discogs'
 * internal rate (~0.85) which accounts for their rounding. This is an approximation
 * since no API endpoint provides the exact EUR Statistics prices.
 */

// Discogs' internal USD→EUR rate (derived from observed price pairs)
// $2.35→€2, $4.69→€4, $7.52→€7 ≈ 0.85 average
const DISCOGS_USD_TO_EUR = 0.85;
const DISCOGS_GBP_TO_EUR = 1.17;

export interface StatisticsPricing {
  lowest_price: number | null;
  median_price: number | null;
  highest_price: number | null;
  currency: string;
}

/**
 * Isolates the Statistics section from Discogs HTML and extracts Low/Median/High prices.
 * Automatically converts to EUR if USD/GBP is detected.
 */
export function extractStatisticsPricing(html: string): StatisticsPricing | null {
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
    if (match !== -1) { sectionStart = match; break; }
  }

  if (sectionStart === -1) {
    console.log('📊 Statistics section not found in HTML');
    return null;
  }

  const statisticsBlock = html.substring(sectionStart, sectionStart + 3000);
  console.log(`📊 Found Statistics section at position ${sectionStart}`);
  
  const textOnly = statisticsBlock.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 500);
  console.log(`📊 Statistics text: ${textOnly}`);

  const cleanBlock = statisticsBlock.replace(/<!--[\s\S]*?-->/g, '');

  const parsePrice = (value: string | undefined | null): number | null => {
    if (!value) return null;
    const cleaned = value.replace(',', '.').replace(/\s/g, '');
    const num = parseFloat(cleaned);
    return (!isNaN(num) && num > 0 && num < 10000) ? num : null;
  };

  const currencyMatch = cleanBlock.match(/Low(?:est)?:\s*(?:<[^>]*>\s*)*(?:<[^>]*>)?\s*([\$€£])/i);
  const detectedCurrency = currencyMatch?.[1] === '€' ? 'EUR' : currencyMatch?.[1] === '£' ? 'GBP' : 'USD';

  const lowMatch = cleanBlock.match(/Low(?:est)?:\s*(?:<[^>]*>\s*)*(?:<[^>]*>)?\s*[\$€£]?\s*([\d.,]+)/i);
  const medianMatch = cleanBlock.match(/Median:\s*(?:<[^>]*>\s*)*(?:<[^>]*>)?\s*[\$€£]?\s*([\d.,]+)/i);
  const highMatch = cleanBlock.match(/High(?:est)?:\s*(?:<[^>]*>\s*)*(?:<[^>]*>)?\s*[\$€£]?\s*([\d.,]+)/i);

  const lowest = parsePrice(lowMatch?.[1]);
  const median = parsePrice(medianMatch?.[1]);
  const highest = parsePrice(highMatch?.[1]);

  console.log(`📊 Raw: Low=${lowest}, Median=${median}, High=${highest}, Currency=${detectedCurrency}`);

  if (lowest !== null || median !== null || highest !== null) {
    // Convert to EUR using Discogs' internal rate
    const toEur = (price: number | null): number | null => {
      if (price === null) return null;
      if (detectedCurrency === 'EUR') return price;
      const rate = detectedCurrency === 'GBP' ? DISCOGS_GBP_TO_EUR : DISCOGS_USD_TO_EUR;
      return Math.round(price * rate * 100) / 100;
    };

    const result = { 
      lowest_price: toEur(lowest), 
      median_price: toEur(median), 
      highest_price: toEur(highest), 
      currency: 'EUR' 
    };
    
    console.log(`📊 EUR: Low=${result.lowest_price}, Median=${result.median_price}, High=${result.highest_price}`);
    return result;
  }

  console.log('📊 No prices found within Statistics section');
  return null;
}
