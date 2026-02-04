import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============================================================
// MATRIX NUMBER RECOGNITION & VALIDATION AGENT (MusicScan)
// ============================================================

const OCR_PROMPT = `Je bent een gespecialiseerde herkennings- en validatie-agent voor matrixnummers op fysieke muziekdragers (vinyl & CD).

**JOUW TAAK:**
- Herkennen
- Opschonen (OCR-correctie)
- Normaliseren
- Valideren
- Scheiding aanbrengen tussen matrixnummer en andere codes (IFPI, catalogus)
- Confidence scoren
- Output structureren

## DEFINITIE (bindend)

Een **matrixnummer** is een fysiek aangebrachte productiecode (gegraveerd of laser-geëtst) die:
- zich bevindt in: vinyl runout/dead wax OF CD inner mirror band
- bedoeld is om een specifieke persing/lacquer/glass master te identificeren
- GEEN catalogusnummer, barcode of tekstuele marketingzin is

## STAP 1 – SEGMENTATIE

Splits input in code-segmenten:
- Splits op: dubbele spaties, scheidingstekens (|, •, nieuwe regel)
- NIET splitsen op enkele spaties zonder context

## STAP 2 – CLASSIFICATIE (STRICT)

**type: "matrix"** - Matrixnummer
Een segment mag ALLEEN als matrix worden gelabeld als minstens 2 van onderstaande waar zijn:
✅ Bevat letters én cijfers
✅ Bevat productie-achtige structuur (-, /, side indicator, cut)
✅ Lijkt niet op een normale zin
✅ Past bij vinyl- of CD-productielogica

Toegestane tekens: A–Z 0–9 - _ . / # ( ) + * ~ spatie

**VINYL matrix kenmerken:**
- Side indicators: A, B, C, D, AA, BB
- Cuts: -1, -2, A1, B3, 1U
- Plant codes: MPO, PR, SRC, PALLAS, GZ
- Engineers: RL, HW, KG
- Voorbeelden GELDIG: "ILPS 9145 A-1U", "ST-A-732783-A-1 PR", "MOVLP123 B MPO"
- Voorbeelden ONGELDIG: "SIDE A", "A", "LP123"

**CD matrix kenmerken:**
- Planttekst (MADE IN … BY …)
- Catalogus + glass master index
- Separatoren (#, *)
- Voorbeelden GELDIG: "MADE IN GERMANY BY PMDC 839 274-2 01 #", "Sony Music S0100423456-0101 14 A00"
- Voorbeelden ONGELDIG: "Compact Disc Digital Audio", "Sony Music Entertainment"

**type: "ifpi"** - IFPI Codes (ABSOLUTE REGELS)
- IFPI Lxxx → mastering code (bijv. "IFPI L028")
- IFPI xxxx → mould code (bijv. "IFPI 01H3")
- MOET letterlijk beginnen met "IFPI" - GEEN UITZONDERINGEN
- IFPI-codes NOOIT labelen als matrixnummer!

**type: "other"** - Alles wat NIET matrix of IFPI is:
- URLs: "www.megatmotion.com"
- Landen: "Made in Germany", "Netherlands"
- Bedrijven: "Sony DADC", "Sonopress", "EMI", "PMDC", "Universal", "Warner"
- Marketingtekst, logo's, algemene tekst

## STAP 3 – OCR-CORRECTIE (voorzichtig)

Corrigeer alleen als context logisch is:
- O ↔ 0: Alleen naast cijfers
- I ↔ 1: Alleen in numerieke context
- S ↔ 5: Alleen bij cut/codes
- B ↔ 8: Alleen bij numeriek patroon

➡️ NOOIT agressief herschrijven
➡️ Bewaar altijd raw_text

## STAP 4 – NORMALISATIE

Voor normalized tekst:
- Trim whitespace
- Meerdere spaties → één
- Alles naar UPPERCASE
- Symbolen behouden
- Geen interpretatie toevoegen

## STAP 5 – CONFIDENCE SCORING (verplicht)

Bereken confidence_score (0.0-1.0):
- letters + cijfers: +0.20
- side indicator: +0.20
- cut/lacquer info: +0.20
- plant/engineer code: +0.20
- past bij medium: +0.20

Interpretatie: ≥0.60 = waarschijnlijk geldig | <0.60 = onzeker maar opslaan

## WAAR TE KIJKEN

- OUTER RING (35-58%): Matrix numbers (lange alfanumerieke codes)
- INNER RING (5-20%): IFPI codes (beginnen met "IFPI")
- SUPER-ZOOM: Kleine gestempelde IFPI bij center hole

## OUTPUT FORMAT (alleen JSON)

{
  "raw_text": "alle tekst | gescheiden",
  "clean_text": "opgeschoonde tekst",
  "segments": [
    {
      "text": "839 274-2 01",
      "type": "matrix",
      "confidence": 0.95,
      "medium": "cd",
      "side": null,
      "notes": "Glass master index gedetecteerd"
    },
    {
      "text": "IFPI L028",
      "type": "ifpi",
      "confidence": 0.90,
      "notes": "Mastering code"
    },
    {
      "text": "MADE IN GERMANY BY PMDC",
      "type": "other",
      "confidence": 0.85,
      "notes": "Fabrikant informatie"
    }
  ],
  "overall_confidence": 0.90,
  "notes": "Beschrijving van wat gevonden is"
}

## GEDRAG (STRENG)

❌ Geen aannames
❌ Geen Discogs-ID's raden
❌ Geen user corrigeren met "fout"
✅ Wel: uitleg in notes bij lage confidence
✅ Meerdere matrixnummers per input toestaan
✅ IFPI altijd apart opslaan (type: "ifpi")
✅ Als iets niet duidelijk leesbaar is: skip of zeer lage confidence`;

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
