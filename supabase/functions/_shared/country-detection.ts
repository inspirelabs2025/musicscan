/**
 * AI-based country detection for artists
 * Returns ISO 3166-1 alpha-2 country code (NL, US, UK, FR, DE, etc.)
 */

export async function detectArtistCountry(
  artistName: string,
  lovableApiKey: string
): Promise<string | null> {
  if (!artistName || !lovableApiKey) {
    console.log('⚠️ detectArtistCountry: missing artistName or API key');
    return null;
  }

  const prompt = `Bepaal de nationaliteit van artiest/band "${artistName}".

REGELS:
- Voor bands: land waar de band is opgericht
- Voor solo artiesten: geboorteland of land waar ze voornamelijk actief zijn
- Bij internationale bands: land van oorsprong/oprichting
- Bij twijfel of onbekend: geef "XX" terug

Geef ALLEEN de ISO 3166-1 alpha-2 landcode terug.

Voorbeelden:
- The Beatles → GB (Groot-Brittannië)
- Marco Borsato → NL (Nederland)
- Edith Piaf → FR (Frankrijk)
- Eagles → US (Verenigde Staten)
- ABBA → SE (Zweden)
- Rammstein → DE (Duitsland)
- AC/DC → AU (Australië)
- U2 → IE (Ierland)
- Stromae → BE (België)

Antwoord met ALLEEN de 2-letter code, niets anders.`;

  try {
    console.log(`🌍 Detecting country for artist: ${artistName}`);
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'Je bent een muziekexpert. Antwoord ALLEEN met een ISO 3166-1 alpha-2 landcode (2 hoofdletters). Geen andere tekst.' 
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 10,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      console.error(`❌ Country detection API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const rawCode = data.choices?.[0]?.message?.content?.trim().toUpperCase();
    
    // Validate that it's a valid 2-letter code
    if (rawCode && /^[A-Z]{2}$/.test(rawCode) && rawCode !== 'XX') {
      console.log(`✅ Country detected for ${artistName}: ${rawCode}`);
      return rawCode;
    }
    
    console.log(`⚠️ Unknown country for ${artistName}: ${rawCode || 'empty response'}`);
    return null;
  } catch (error) {
    console.error(`❌ Country detection error for ${artistName}:`, error);
    return null;
  }
}

/**
 * Batch detect countries for multiple artists
 * Returns a map of artistName -> countryCode
 */
export async function detectArtistCountriesBatch(
  artistNames: string[],
  lovableApiKey: string,
  delayMs: number = 500
): Promise<Map<string, string | null>> {
  const results = new Map<string, string | null>();
  
  for (const artistName of artistNames) {
    const countryCode = await detectArtistCountry(artistName, lovableApiKey);
    results.set(artistName, countryCode);
    
    // Rate limiting
    if (delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return results;
}
