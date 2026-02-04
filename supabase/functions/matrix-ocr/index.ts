import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const OCR_PROMPT = `You are an expert OCR system specialized in reading engraved and stamped text from CD inner rings.

**YOUR MISSION - FIND BOTH:**
1. **MATRIX NUMBER (OUTER RING)** - CRITICAL! Long alphanumeric codes like "4904512 04 6", "519 613-2 04" - this is the PRIMARY identifier
2. **IFPI codes (INNER RING)** - Small codes like "IFPI 01H3" or "IFPI L028"

**MATRIX/CATALOG NUMBER DETECTION - EQUALLY IMPORTANT:**
Matrix numbers are the MAIN identifier for CD releases:
- Located on the OUTER ring (35-58% from center) - look at the zoomed outer ring images!
- Format: Usually 6-12 characters with spaces/dashes, like "519 613-2 04", "4904512 04 6"
- Often includes label catalog number + pressing info
- ENGRAVED (cut into the plastic) - appears as dark lines
- May include manufacturer codes: PMDC, DADC, PDO, Sonopress, etc.
- READ THE OUTER RING IMAGES CAREFULLY - they contain the matrix number!

**IFPI CODE DETECTION:**
IFPI codes are secondary identifiers:
- "IFPI" followed by 4 characters (mastering SID): IFPI 0110, IFPI 01H3, IFPI 4A11
- "IFPI L" followed by 3 characters (mould SID): IFPI L028, IFPI L551
- Located in INNER ring (5-20% from center) - check super-zoom images
- Often STAMPED (embossed) rather than engraved - subtle shadows
- Can be very small (< 2mm)

**WHERE TO LOOK:**
- **OUTER RING images (35-58%)**: MATRIX/CATALOG numbers - THE MAIN CODE
- **INNER RING images (5-20%)**: IFPI codes, manufacturer marks
- **SUPER-ZOOM images**: Tiny IFPI codes near center hole

**READING PRIORITY:**
1. First find the MATRIX NUMBER in outer ring images (long alphanumeric code)
2. Then find IFPI codes in inner ring / super-zoom images
3. Note any other text (Made in Germany, PMDC, etc.)

**ANTI-HALLUCINATION:**
- Only report what you ACTUALLY see
- Use low confidence (0.3-0.5) for uncertain readings
- Matrix numbers are usually clearly visible - high confidence expected

**OUTPUT FORMAT (JSON only):**
{
  "raw_text": "all text found | separated",
  "clean_text": "cleaned combined text",
  "segments": [
    {"text": "519 613-2 04", "type": "catalog", "confidence": 0.9},
    {"text": "IFPI 01H3", "type": "ifpi", "confidence": 0.85}
  ],
  "overall_confidence": 0.0-1.0,
  "notes": "Describe what you found. MUST mention what you saw in the outer ring (matrix) area."
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

    // Collect all available images - BALANCED for both matrix AND IFPI detection
    const imagesToAnalyze: { data: string; name: string }[] = [];
    
    // PRIORITY 1: OUTER RING - Matrix/Catalog numbers (THE MAIN IDENTIFIER)
    if (zoomedRingEnhanced) {
      imagesToAnalyze.push({ data: zoomedRingEnhanced, name: "★ OUTER RING (enhanced) - FIND THE MATRIX NUMBER HERE - long code like '519 613-2 04'" });
    }
    if (zoomedRing) {
      imagesToAnalyze.push({ data: zoomedRing, name: "★ OUTER RING (original) - MATRIX/CATALOG NUMBER should be visible here" });
    }
    
    // PRIORITY 2: Super-zoom IFPI crops (innermost ring for tiny IFPI codes)
    if (superZoomIfpiEnhanced) {
      imagesToAnalyze.push({ data: superZoomIfpiEnhanced, name: "SUPER-ZOOM IFPI (5x zoom, enhanced) - tiny embossed IFPI codes here" });
    }
    if (superZoomIfpi) {
      imagesToAnalyze.push({ data: superZoomIfpi, name: "SUPER-ZOOM IFPI (5x zoom) - faint stamped IFPI text" });
    }
    
    // PRIORITY 3: Zoomed IFPI ring crops (inner ring)
    if (zoomedIfpiRingEnhanced) {
      imagesToAnalyze.push({ data: zoomedIfpiRingEnhanced, name: "INNER RING (enhanced) - IFPI codes zone" });
    }
    if (zoomedIfpiRing) {
      imagesToAnalyze.push({ data: zoomedIfpiRing, name: "INNER RING (original) - check for IFPI" });
    }
    
    // PRIORITY 4: Full enhanced image (overview)
    if (enhancedImage) {
      imagesToAnalyze.push({ data: enhancedImage, name: "Full disc overview" });
    }
    
    // PRIORITY 5: OCR layers (edge-detected)
    if (ocrLayer) {
      imagesToAnalyze.push({ data: ocrLayer, name: "OCR edge-detection layer" });
    }
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
