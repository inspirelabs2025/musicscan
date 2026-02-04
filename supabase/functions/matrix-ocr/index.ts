import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const OCR_PROMPT = `You are an expert OCR system specialized in reading CD matrix numbers from enhanced images.

CRITICAL TASK: Extract ALL text visible in this CD inner ring image. CDs typically have MULTIPLE codes engraved - you MUST find ALL of them, not just one.

CHARACTER WHITELIST: A-Z 0-9 - / . ( ) + space

WHAT TO LOOK FOR (CDs usually have 2-4 of these):
1. **CATALOG NUMBER** (MOST IMPORTANT): The main release identifier, usually 6-12 characters
   - Examples: "538 972-2", "CDEPC 3252", "7243 8 56092 2 4", "82876 54321 2"
   - Often contains spaces, dashes, or dots
   - Usually the LONGEST code on the disc
   
2. **IFPI CODES**: Manufacturing plant identifiers
   - Format: "IFPI LXXX" or "IFPI XXXX" (L followed by numbers, or 2 letters + numbers)
   - Examples: "IFPI L028", "IFPI LV23", "IFPI 0110"
   
3. **MATRIX/MASTERING CODES**: Additional production identifiers
   - Often alphanumeric with dashes: "DOC-55-001-1", "PMDC", "MASTERED BY..."
   - May include dates or initials

4. **SID CODES**: Source Identification codes (separate from IFPI)
   - Usually near the center hub

COMMON OCR CONFUSIONS TO CORRECT:
- O ↔ 0 (letter O vs zero) - In catalog numbers, usually 0
- I ↔ 1 (letter I vs one) - In IFPI codes, usually I; in numbers, usually 1
- S ↔ 5, B ↔ 8, Z ↔ 2, G ↔ 6

CRITICAL INSTRUCTIONS:
1. SCAN THE ENTIRE IMAGE - text runs in circles around the center
2. Look for text at DIFFERENT RADII (inner ring, outer ring, near hub)
3. The catalog number is often LARGER or in a different position than IFPI
4. Do NOT stop after finding just the IFPI code - keep looking for more codes
5. If you only find one code, look again - most CDs have at least 2

OUTPUT FORMAT - Return ONLY valid JSON:
{
  "raw_text": "all text found separated by | symbols",
  "clean_text": "cleaned version of all text",
  "segments": [
    {
      "text": "538 972-2",
      "type": "catalog",
      "confidence": 0.88
    },
    {
      "text": "IFPI L028",
      "type": "ifpi",
      "confidence": 0.95
    },
    {
      "text": "DOC-55-001",
      "type": "matrix",
      "confidence": 0.75
    }
  ],
  "overall_confidence": 0.85,
  "layer_used": "normal"
}

Segment types: "catalog" (main number), "ifpi", "matrix", "sid", "unknown"
ALWAYS put the catalog number FIRST in segments if found.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { enhancedImage, ocrLayer, ocrLayerInverted } = await req.json();

    if (!enhancedImage && !ocrLayer) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Try OCR on both normal and inverted layers, pick best result
    const runOCR = async (imageData: string, layerName: string) => {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: OCR_PROMPT
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Extract all matrix codes from this CD inner ring image. Return only valid JSON."
                },
                {
                  type: "image_url",
                  image_url: { url: imageData }
                }
              ]
            }
          ],
          max_tokens: 1000,
          temperature: 0.1, // Low temperature for deterministic OCR
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`OCR request failed for ${layerName}:`, response.status, errorText);
        throw new Error(`OCR failed: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      
      // Parse JSON from response
      let parsed;
      try {
        // Try to extract JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
          parsed.layer_used = layerName;
        } else {
          throw new Error("No JSON found in response");
        }
      } catch (parseError) {
        console.error(`Failed to parse OCR response for ${layerName}:`, content);
        parsed = {
          raw_text: content,
          clean_text: content,
          segments: [],
          overall_confidence: 0.1,
          layer_used: layerName
        };
      }
      
      return parsed;
    };

    // Run OCR on the OCR layer (or enhanced image as fallback)
    const primaryImage = ocrLayer || enhancedImage;
    let result;

    try {
      // Try normal layer first
      result = await runOCR(primaryImage, "normal");
      
      // If confidence is low, try inverted layer
      if (result.overall_confidence < 0.5 && ocrLayerInverted) {
        console.log("Trying inverted layer due to low confidence...");
        const invertedResult = await runOCR(ocrLayerInverted, "inverted");
        
        // Use whichever has higher confidence
        if (invertedResult.overall_confidence > result.overall_confidence) {
          result = invertedResult;
          console.log("Using inverted layer result (higher confidence)");
        }
      }
    } catch (ocrError) {
      console.error("OCR error:", ocrError);
      result = {
        raw_text: "",
        clean_text: "",
        segments: [],
        overall_confidence: 0,
        layer_used: "error",
        error: ocrError instanceof Error ? ocrError.message : "OCR failed"
      };
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Matrix OCR error:", error);
    
    if (error instanceof Error && error.message.includes("Rate limit")) {
      return new Response(
        JSON.stringify({ error: "Te veel verzoeken. Probeer het later opnieuw." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
