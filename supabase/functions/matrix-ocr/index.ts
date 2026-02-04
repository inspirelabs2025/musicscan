import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const OCR_PROMPT = `You are an expert OCR system specialized in reading CD matrix numbers from enhanced images.

CRITICAL TASK: Extract ALL text visible in this CD inner ring image. CDs typically have MULTIPLE codes engraved - you MUST find ALL of them.

**WHERE TO LOOK - SCAN ALL THESE AREAS:**
1. OUTERMOST RING (near the data area edge): Usually contains the CATALOG NUMBER - the most important identifier
2. MIDDLE RING: Often has IFPI codes and manufacturing info  
3. INNERMOST RING (near center hole): May have SID codes or additional matrix info
4. BETWEEN THE RINGS: Small text, dates, or stamper codes

CHARACTER WHITELIST: A-Z 0-9 - / . ( ) + space

**CODE TYPES TO FIND (most CDs have 2-4 of these):**

1. **CATALOG NUMBER** (MOST IMPORTANT - usually on the OUTER ring):
   - The main release identifier from the record label
   - Usually 6-15 characters, often the LONGEST readable code
   - Examples: "538 972-2", "CDEPC 3252", "7243 8 56092 2 4", "82876 54321 2"
   - May start with label prefixes: EMI, BMG, SONY, POLY, UMG, WEA, etc.
   - Often contains spaces, dashes, or dots between number groups
   
2. **IFPI CODES** (usually MIDDLE ring):
   - Format: "IFPI LXXX" or "IFPI XXXX"
   - L-codes identify the mastering plant
   - 4-digit codes identify the pressing plant
   - Examples: "IFPI L028", "IFPI 0110"
   
3. **MATRIX/MASTERING CODES**:
   - Stamper identifiers, often ending in -1, -2, A1, B1
   - Examples: "DOC-55-001-1", "PMDC", "1-458992 01 A1"

4. **ADDITIONAL TEXT**:
   - "MADE IN..." country names
   - Studio names or mastering engineer initials
   - Dates

**OCR CORRECTIONS:**
- O ↔ 0 (in catalog numbers, usually 0; in IFPI, context-dependent)
- I ↔ 1 (in IFPI = letter I; in numbers = digit 1)
- S ↔ 5, B ↔ 8, Z ↔ 2, G ↔ 6

**CRITICAL INSTRUCTIONS:**
1. Start scanning from the OUTERMOST visible text and work inward
2. The catalog number is often FAINTER and in the outer area - look carefully!
3. Do NOT stop after finding IFPI codes - the catalog number is MORE important
4. If text is faint or partially visible, still report it with lower confidence
5. Report ALL readable text, even if you're not sure what type it is

OUTPUT FORMAT - Return ONLY valid JSON:
{
  "raw_text": "all text found separated by | symbols",
  "clean_text": "cleaned version of all text",
  "segments": [
    {
      "text": "538 972-2",
      "type": "catalog",
      "confidence": 0.85,
      "location": "outer ring"
    },
    {
      "text": "IFPI L028",
      "type": "ifpi",
      "confidence": 0.95,
      "location": "middle ring"
    }
  ],
  "overall_confidence": 0.85,
  "notes": "describe what you see and any challenges"
}

Segment types: "catalog", "ifpi", "matrix", "sid", "unknown"
ALWAYS prioritize finding the catalog number - it's usually on the OUTER ring and longer than IFPI codes.`;

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
                  text: `I'm providing ${images.length} different views of the same CD inner ring:
${images.map((img, i) => `- Image ${i + 1}: ${img.name}`).join('\n')}

Analyze ALL images together and extract ALL text you can find. The CATALOG NUMBER (longest code, usually outer ring) is the MOST IMPORTANT - don't miss it!
Look especially in the OUTER ring area for the catalog number.
Combine findings from all images for the best result.
Return only valid JSON.`
                },
                ...imageContent
              ]
            }
          ],
          max_tokens: 1500,
          temperature: 0.1,
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

    // Collect all available images
    const imagesToAnalyze: { data: string; name: string }[] = [];
    
    // Always include enhanced image first (best for reading actual text)
    if (enhancedImage) {
      imagesToAnalyze.push({ data: enhancedImage, name: "Enhanced preview (contrast-adjusted)" });
    }
    
    // Add OCR layer (edge-detected, good for finding text locations)
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
