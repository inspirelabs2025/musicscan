import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const OCR_PROMPT = `You are an expert OCR system specialized in reading engraved and stamped text from CD inner rings.

**YOUR MISSION:**
Find ALL text on this CD, especially:
1. MATRIX/CATALOG numbers (outer ring) - long numeric codes like "4904512 04 6"
2. IFPI codes (inner/middle ring) - CRITICAL to find these!

**IFPI CODE DETECTION - HIGHEST PRIORITY:**
IFPI codes are MANDATORY to look for. They appear as:
- "IFPI L" followed by 3 characters (mould SID): IFPI L028, IFPI L551, IFPI LV23
- "IFPI" followed by 4 characters (mastering SID): IFPI 0110, IFPI 4A11, IFPI 94Z2
- Sometimes just the letters I-F-P-I spaced around the ring
- Often STAMPED (raised/embossed) rather than engraved - look for subtle shadows
- Located in the MIRROR BAND (shiny area between center hole and data area)
- Can be VERY small (< 2mm) - examine the super-zoom images carefully!

**WHERE TO LOOK:**
- OUTER RING (35-50% from center): Matrix/catalog numbers
- MIDDLE RING (15-35% from center): IFPI mastering SID, additional codes  
- INNER RING (5-15% from center): IFPI mould SID (L-codes), stamper marks
- MIRROR BAND (reflective area near hole): Often contains stamped IFPI
- ABOVE "Germany" or other country text: IFPI codes are often located just above this text

**READING TECHNIQUES FOR TINY EMBOSSED TEXT:**
- SUPER-ZOOM images (5x magnification) show the innermost ring at 3-15% radius
- Embossed text creates subtle directional shadows - look for slight darkness variations
- IFPI letters may be RAISED (embossed) not engraved - they catch light differently
- Text is often lighter than surrounding area due to how embossing reflects light
- Letters may be spaced out: I  F  P  I  L  0  2  8
- The characters are often < 2mm in height - require careful examination
- Look for faint "IFPI" text ABOVE any other visible text like "Germany", "Made in", etc.

**ANTI-HALLUCINATION:**
- Only report what you ACTUALLY see
- Use low confidence (0.3-0.5) for uncertain readings
- Say "possible IFPI" if you see letter-like shapes that could be IFPI

**OUTPUT FORMAT (JSON only):**
{
  "raw_text": "all text found | separated",
  "clean_text": "cleaned combined text",
  "segments": [
    {"text": "4904512 04 6", "type": "catalog", "confidence": 0.9},
    {"text": "IFPI L028", "type": "ifpi", "confidence": 0.7}
  ],
  "overall_confidence": 0.0-1.0,
  "notes": "Describe what you found in each ring area. If no IFPI found, explain where you looked and what you saw."
}`;

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
      zoomedIfpiRingEnhanced,
      superZoomIfpi,
      superZoomIfpiEnhanced
    } = await req.json();

    if (!enhancedImage && !ocrLayer && !zoomedRing && !zoomedIfpiRing && !superZoomIfpi) {
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
    
    // PRIORITY 1 (HIGHEST): Super-zoom IFPI crops (innermost ring, 5x zoom for tiny embossed text)
    if (superZoomIfpiEnhanced) {
      imagesToAnalyze.push({ data: superZoomIfpiEnhanced, name: "SUPER-ZOOM IFPI (innermost ring, 5x zoom, enhanced) - LOOK FOR TINY EMBOSSED IFPI CODES HERE - text is often ABOVE 'Germany'" });
    }
    if (superZoomIfpi) {
      imagesToAnalyze.push({ data: superZoomIfpi, name: "SUPER-ZOOM IFPI (innermost ring, 5x zoom, original) - CHECK FOR FAINT STAMPED IFPI TEXT" });
    }
    
    // PRIORITY 2: Zoomed IFPI ring crops (inner ring for IFPI codes)
    if (zoomedIfpiRingEnhanced) {
      imagesToAnalyze.push({ data: zoomedIfpiRingEnhanced, name: "INNER RING (IFPI zone) - enhanced, 3x zoom - LOOK FOR IFPI CODES HERE" });
    }
    if (zoomedIfpiRing) {
      imagesToAnalyze.push({ data: zoomedIfpiRing, name: "INNER RING (IFPI zone) - original, 3x zoom - CHECK FOR IFPI TEXT" });
    }
    
    // PRIORITY 3: Zoomed matrix ring crops (outer ring for catalog/matrix)
    if (zoomedRingEnhanced) {
      imagesToAnalyze.push({ data: zoomedRingEnhanced, name: "OUTER RING (matrix zone) - enhanced, 2.5x zoom - CATALOG/MATRIX numbers here" });
    }
    if (zoomedRing) {
      imagesToAnalyze.push({ data: zoomedRing, name: "OUTER RING (matrix zone) - original, 2.5x zoom" });
    }
    
    // PRIORITY 4: Full enhanced image (overview)
    if (enhancedImage) {
      imagesToAnalyze.push({ data: enhancedImage, name: "Full disc overview - enhanced" });
    }
    
    // PRIORITY 5: OCR layers (edge-detected)
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
