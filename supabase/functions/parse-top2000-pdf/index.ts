import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParsedEntry {
  position: number;
  artist: string;
  title: string;
  release_year?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const pdfFile = formData.get('pdf') as File;
    const editionYear = parseInt(formData.get('edition_year') as string, 10);
    const startPosition = parseInt(formData.get('start_position') as string, 10) || 1;
    const endPosition = parseInt(formData.get('end_position') as string, 10) || 500;

    if (!pdfFile) {
      return new Response(
        JSON.stringify({ success: false, error: 'Geen PDF bestand ontvangen' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!editionYear || isNaN(editionYear)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Ongeldig editiejaar' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Parsing PDF for Top 2000 ${editionYear}, positions ${startPosition}-${endPosition}, file size: ${pdfFile.size} bytes`);

    // Read PDF as ArrayBuffer and convert to base64 for AI processing
    const arrayBuffer = await pdfFile.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    // Convert to base64 in chunks to avoid stack overflow
    let base64 = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
      base64 += String.fromCharCode(...chunk);
    }
    base64 = btoa(base64);

    // Use AI to extract structured data from PDF
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY niet geconfigureerd');
    }

    console.log('Sending PDF to AI for parsing...');

    // We'll process in chunks to handle large PDFs
    // First, extract text using a simpler approach by sending PDF content to AI
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 45000); // 45s timeout to avoid Supabase 60s hard limit

    let aiResponse: Response;
    try {
      aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
            role: 'system',
            content: `Je extraheert Top 2000 data uit PDFs. Voor elke call krijg je een bereik met start- en eindpositie. \n\nREGELS:\n- Geef ALLEEN posities ${startPosition}-${endPosition}\n- Er zijn precies ${endPosition - startPosition + 1} posities in dit bereik\n- Sla GEEN enkele positie over\n- Als je twijfelt, maak de best mogelijke interpretatie uit de tabel, maar vul de positie toch in\n- Gebruik dit compacte JSON formaat, zonder extra tekst of uitleg:\n{"entries":[{"position":1,"artist":"Queen","title":"Bohemian Rhapsody","release_year":1975}]}`
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Extraheer ALLE posities ${startPosition}-${endPosition} uit deze Top 2000 ${editionYear} PDF.\n\nBELANGRIJK:\n- Doorloop systematisch alle posities in dit bereik (inclusief)\n- Als je een positie niet 100% zeker kunt lezen, maak dan de best mogelijke gok op basis van de tabel\n- Retourneer voor ELKE positie een entry met position, artist, title, release_year. Sla niets over.\n- Return ENKEL geldige JSON met velden: position, artist, title, release_year.`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:application/pdf;base64,${base64}`
                  }
                }
              ]
            }
          ],
          max_tokens: 32000,
          temperature: 0,
        }),
      });
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof DOMException && err.name === 'AbortError') {
        console.error('AI request aborted due to timeout');
        throw new Error('AI parsing duurde te lang (timeout na 45 seconden)');
      }
      console.error('AI fetch error:', err);
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI parsing mislukt: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Geen response van AI ontvangen');
    }

    console.log('AI response received, parsing JSON...');

    // Clean up the response - remove markdown code blocks if present
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.slice(7);
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.slice(3);
    }
    if (cleanContent.endsWith('```')) {
      cleanContent = cleanContent.slice(0, -3);
    }
    cleanContent = cleanContent.trim();

    let parsedResult;
    try {
      parsedResult = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.log('Raw content:', cleanContent.substring(0, 500));
      throw new Error('Kon AI response niet parsen als JSON');
    }

    const entries: any[] = parsedResult.entries || [];

    // Build a position → entry map from AI output
    const entriesByPosition = new Map<number, any>();
    entries.forEach((e, idx) => {
      const rawPos = e.position;
      const inferredPos = Number.isFinite(rawPos) && rawPos > 0 ? rawPos : startPosition + idx;
      if (!entriesByPosition.has(inferredPos)) {
        entriesByPosition.set(inferredPos, e);
      }
    });

    // Ensure we have an entry for every position in the requested range
    const validEntries = [] as ParsedEntry[];
    let missingCount = 0;

    for (let pos = startPosition; pos <= endPosition; pos++) {
      const raw = entriesByPosition.get(pos) || {};

      const artistRaw = raw.artist ?? raw.Artist ?? raw.artist_name ?? '';
      const titleRaw = raw.title ?? raw.Titel ?? raw.song_title ?? raw.track ?? '';
      const releaseYearRaw = raw.release_year ?? raw.year ?? raw.jaar ?? undefined;

      const artist = String(artistRaw || `Onbekende artiest (${pos})`).trim();
      const title = String(titleRaw || `Nog in te vullen (${pos})`).trim();
      const release_year = releaseYearRaw ? parseInt(String(releaseYearRaw), 10) : undefined;

      if (!artistRaw || !titleRaw) {
        missingCount++;
      }

      validEntries.push({
        position: pos,
        artist,
        title,
        release_year,
      });
    }

    console.log(`PDF parser: opgebouwd ${validEntries.length} entries voor posities ${startPosition}-${endPosition}, ontbrekende ruwe regels: ${missingCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        entries: validEntries,
        total: validEntries.length,
        parsing_notes: parsedResult.parsing_notes || null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('PDF parsing error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Onbekende fout bij PDF parsing',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
