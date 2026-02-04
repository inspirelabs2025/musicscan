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
- Common real matrix codes look like: "4904512 04 6", "538 972-2", "7243 8 56092 2"
- If unsure, report "unknown" with low confidence rather than guessing

**WHERE TEXT IS LOCATED ON CDs:**
- OUTER RING (near data area): Usually has CATALOG/MATRIX numbers - long numeric codes
- MIDDLE RING: IFPI codes (format: "IFPI LXXX" or "IFPI XXXX")  
- INNER RING (near hole): Additional codes, SID codes

**WHAT TO LOOK FOR:**
1. CATALOG/MATRIX NUMBER: Long numeric sequence (7-15 digits), often with spaces
   - Examples of REAL patterns: "4904512 04 6", "538 972-2", "82876 54321 2"
   - Usually the LONGEST code on the disc
   
2. IFPI CODES: "IFPI" followed by L+numbers or 4 digits
   - Examples: "IFPI L028", "IFPI 0110"

3. OTHER TEXT: Country names, dates, stamper codes

**CHARACTER SET:** A-Z 0-9 - / . ( ) + space

**OUTPUT - ONLY valid JSON:**
{
  "raw_text": "text exactly as seen | separated",
  "clean_text": "cleaned text",
  "segments": [
    {"text": "ACTUAL TEXT FROM IMAGE", "type": "catalog|ifpi|matrix|unknown", "confidence": 0.0-1.0}
  ],
  "overall_confidence": 0.0-1.0,
  "notes": "describe what you can and cannot read"
}

REMEMBER: Only report text you can ACTUALLY SEE. Low confidence is better than hallucination.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { enhancedImage, ocrLayer, ocrLayerInverted, zoomedRing, zoomedRingEnhanced } = await req.json();

    if (!enhancedImage && !ocrLayer && !zoomedRing) {
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

    // Collect all available images - prioritize zoomed ring (best for matrix text)
    const imagesToAnalyze: { data: string; name: string }[] = [];
    
    // PRIORITY 1: Zoomed ring crops (best for reading small matrix text)
    if (zoomedRingEnhanced) {
      imagesToAnalyze.push({ data: zoomedRingEnhanced, name: "ZOOMED matrix ring area (enhanced, 2.5x magnification)" });
    }
    if (zoomedRing) {
      imagesToAnalyze.push({ data: zoomedRing, name: "ZOOMED matrix ring area (original, 2.5x magnification)" });
    }
    
    // PRIORITY 2: Full enhanced image
    if (enhancedImage) {
      imagesToAnalyze.push({ data: enhancedImage, name: "Full disc enhanced preview" });
    }
    
    // PRIORITY 3: OCR layers (edge-detected)
    if (ocrLayer) {
      imagesToAnalyze.push({ data: ocrLayer, name: "OCR layer (edge-enhanced)" });
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
