import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const OCR_PROMPT = `You are an OCR system that reads engraved text from CD inner rings.

**CRITICAL ANTI-HALLUCINATION RULES:**
- ONLY report text you can ACTUALLY SEE in the image
- DO NOT invent, guess, or hallucinate any text
- If you cannot clearly read something, report it with LOW confidence or skip it
- DO NOT use example codes from this prompt - only report what's IN THE IMAGE
- If unsure, report "unknown" with low confidence rather than guessing

**CD TEXT LOCATIONS - CHECK ALL AREAS:**
1. OUTER RING (furthest from hole): CATALOG/MATRIX numbers - long numeric codes
   - Examples: "4904512 04 6", "538 972-2", "82876 54321 2"
   - Usually 7-15 digits with spaces/dashes
   
2. MIDDLE RING: IFPI codes - ALWAYS look for "IFPI" text!
   - Format: "IFPI L" + 3 digits (mould SID) OR "IFPI" + 4 digits (mastering SID)
   - Examples: "IFPI L028", "IFPI L551", "IFPI 0110", "IFPI 4A11"
   - May appear as "IFPI" on one line and code below, or combined
   - Often STAMPED (raised text) not engraved
   
3. INNER RING (closest to center hole): Additional SID codes, stamper marks
   - May have second IFPI code, date codes, or plant identifiers

**IFPI DETECTION TIPS:**
- IFPI codes can be VERY small and hard to read
- Look for the letters "I F P I" arranged around the ring
- The code after "IFPI L" is 3 alphanumeric characters
- The code after just "IFPI" (no L) is 4 alphanumeric characters
- IFPI codes are SEPARATE from matrix/catalog numbers

**CHARACTER SET:** A-Z 0-9 - / . ( ) + space

**OUTPUT - ONLY valid JSON:**
{
  "raw_text": "text exactly as seen | separated",
  "clean_text": "cleaned text",
  "segments": [
    {"text": "ACTUAL TEXT FROM IMAGE", "type": "catalog|ifpi|matrix|unknown", "confidence": 0.0-1.0}
  ],
  "overall_confidence": 0.0-1.0,
  "notes": "describe what you see in EACH ring area (outer, middle, inner)"
}

REMEMBER: Check ALL ring areas. IFPI codes are often in a DIFFERENT location than matrix numbers.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      enhancedImage, 
      ocrLayer, 
      ocrLayerInverted, 
      zoomedRing, 
      zoomedRingEnhanced,
      zoomedIfpiRing,
      zoomedIfpiRingEnhanced 
    } = await req.json();

    if (!enhancedImage && !ocrLayer && !zoomedRing && !zoomedIfpiRing) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Run OCR with multiple images for better results
    const runMultiImageOCR = async (images: { data: string; name: string }[]) => {
      // Build content array with all images
      const imageContent = images.map(img => ({
        type: "image_url" as const,
        image_url: { url: img.data }
      }));

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
                  text: `I'm providing ${images.length} views of a CD inner ring. 

CRITICAL: Only report text you can ACTUALLY READ in these images. DO NOT HALLUCINATE OR GUESS.

Look for:
1. A long numeric MATRIX/CATALOG number (like "4904512 04 6") - usually in the OUTER area
2. IFPI codes (like "IFPI L028")

If you cannot clearly read something, skip it or mark it with very low confidence.
Return only valid JSON with what you can ACTUALLY SEE.`
                },
                ...imageContent
              ]
            }
          ],
          max_tokens: 1500,
          temperature: 0,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Multi-image OCR failed:`, response.status, errorText);
        throw new Error(`OCR failed: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      console.log("AI response:", content.substring(0, 500));
      
      let parsed;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
          parsed.images_analyzed = images.length;
        } else {
          throw new Error("No JSON found in response");
        }
      } catch (parseError) {
        console.error(`Failed to parse OCR response:`, content);
        parsed = {
          raw_text: content,
          clean_text: content,
          segments: [],
          overall_confidence: 0.1,
          images_analyzed: images.length
        };
      }
      
      return parsed;
    };

    // Collect all available images - include both matrix and IFPI zones
    const imagesToAnalyze: { data: string; name: string }[] = [];
    
    // PRIORITY 1: Zoomed IFPI ring crops (inner ring for IFPI codes)
    if (zoomedIfpiRingEnhanced) {
      imagesToAnalyze.push({ data: zoomedIfpiRingEnhanced, name: "INNER RING (IFPI zone) - enhanced, 3x zoom - LOOK FOR IFPI CODES HERE" });
    }
    if (zoomedIfpiRing) {
      imagesToAnalyze.push({ data: zoomedIfpiRing, name: "INNER RING (IFPI zone) - original, 3x zoom - CHECK FOR IFPI TEXT" });
    }
    
    // PRIORITY 2: Zoomed matrix ring crops (outer ring for catalog/matrix)
    if (zoomedRingEnhanced) {
      imagesToAnalyze.push({ data: zoomedRingEnhanced, name: "OUTER RING (matrix zone) - enhanced, 2.5x zoom - CATALOG/MATRIX numbers here" });
    }
    if (zoomedRing) {
      imagesToAnalyze.push({ data: zoomedRing, name: "OUTER RING (matrix zone) - original, 2.5x zoom" });
    }
    
    // PRIORITY 3: Full enhanced image (overview)
    if (enhancedImage) {
      imagesToAnalyze.push({ data: enhancedImage, name: "Full disc overview - enhanced" });
    }
    
    // PRIORITY 4: OCR layers (edge-detected)
    if (ocrLayer) {
      imagesToAnalyze.push({ data: ocrLayer, name: "OCR edge-detection layer" });
    }
    
    // Add inverted OCR layer (sometimes reveals hidden text)
    if (ocrLayerInverted) {
      imagesToAnalyze.push({ data: ocrLayerInverted, name: "Inverted OCR layer" });
    }

    let result;
    try {
      if (imagesToAnalyze.length === 0) {
        throw new Error("No images provided");
      }
      
      console.log(`Running OCR with ${imagesToAnalyze.length} images`);
      result = await runMultiImageOCR(imagesToAnalyze);
      
    } catch (ocrError) {
      console.error("OCR error:", ocrError);
      result = {
        raw_text: "",
        clean_text: "",
        segments: [],
        overall_confidence: 0,
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
