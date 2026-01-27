import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================
// STAP 7: DOMAIN KNOWLEDGE - PATTERN-AWARE OCR CORRECTION
// Standalone function to apply corrections to raw OCR text
// ============================================================

interface OCRCorrectionRequest {
  rawText: string;
  mediaType: 'vinyl' | 'cd';
}

interface OCRCorrection {
  original: string;
  corrected: string;
  reason: string;
  confidence: number;
}

interface DetectedMatrixCodes {
  ifpiCodes: string[];
  catalogNumbers: string[];
  matrixNumbers: string[];
  pressPlantCodes: string[];
  stamperCodes: string[];
  masteringCodes: string[];
  unknownCodes: string[];
  corrections: OCRCorrection[];
}

interface OCRCorrectionResult {
  success: boolean;
  correctedText: string;
  rawText: string;
  detectedCodes: DetectedMatrixCodes;
  confidence: number;
  corrections: OCRCorrection[];
  detectedPatterns: string[];
  processingTime: number;
}

/**
 * Known pressing plant patterns
 */
const PRESSING_PLANT_PATTERNS = [
  // IFPI Codes
  { name: 'IFPI_L_CODE', regex: /IFPI\s*L[A-Z0-9]{3,4}/gi },
  { name: 'IFPI_MASTERING', regex: /IFPI\s*[A-Z0-9]{4,5}/gi },
  
  // Plants
  { name: 'PDO', regex: /PDO[\s-]*(?:DE|GERMANY)?[\s-]*[A-Z0-9]*/gi },
  { name: 'SONOPRESS', regex: /SONOPRESS[\s-]*[A-Z0-9-]*/gi },
  { name: 'MPO', regex: /MPO[\s-]*[A-Z0-9]*/gi },
  { name: 'EMI', regex: /EMI[\s-]*(?:SWINDON)?[\s-]*[A-Z0-9]*/gi },
  { name: 'NIMBUS', regex: /NIMBUS[\s-]*[A-Z0-9]*/gi },
  { name: 'DAMONT', regex: /DAMONT[\s-]*[A-Z0-9]*/gi },
  { name: 'SANYO', regex: /SANYO[\s-]*[A-Z0-9]*/gi },
  { name: 'JVC', regex: /JVC[\s-]*[A-Z0-9]*/gi },
  { name: 'PHILIPS', regex: /PHILIPS[\s-]*[A-Z0-9]*/gi },
  { name: 'CAPITOL', regex: /(?:CAPITOL|JACKSONVILLE|JAX)[\s-]*[A-Z0-9]*/gi },
];

/**
 * Apply character-level OCR corrections based on domain knowledge
 */
function applyOCRCorrections(
  rawText: string,
  mediaType: 'vinyl' | 'cd'
): { correctedText: string; corrections: OCRCorrection[] } {
  let text = rawText.toUpperCase().trim();
  const corrections: OCRCorrection[] = [];
  
  // Step 1: Fix common IFPI OCR errors
  // IFPI often misread as 1FP1, lFPl, etc.
  const ifpiVariants = /1FP1|lFPl|IFPІ|ІFP1|1FPI|IFP1/gi;
  text = text.replace(ifpiVariants, (match) => {
    if (match.toUpperCase() !== 'IFPI') {
      corrections.push({
        original: match,
        corrected: 'IFPI',
        reason: 'IFPI text OCR correction',
        confidence: 0.95
      });
    }
    return 'IFPI';
  });
  
  // Step 2: IFPI L-code corrections
  // After "IFPI L", expect letters not numbers in certain positions
  text = text.replace(/IFPI\s*[L1l]([O0])([A-Z0-9]{2,3})/gi, (match, char1, rest) => {
    // First char after L is often a letter O, not zero
    const needsCorrection = char1 === '0';
    const corrected = `IFPI L${needsCorrection ? 'O' : char1}${rest}`;
    if (needsCorrection) {
      corrections.push({
        original: match,
        corrected,
        reason: 'IFPI L-code: expect letter O after L, not zero',
        confidence: 0.85
      });
    }
    return corrected;
  });
  
  // Fix L→1 in IFPI L codes
  text = text.replace(/IFPI\s*1([A-Z0-9]{3,4})/gi, (match, rest) => {
    const corrected = `IFPI L${rest}`;
    corrections.push({
      original: match,
      corrected,
      reason: 'IFPI L-code: 1 is likely L',
      confidence: 0.9
    });
    return corrected;
  });
  
  // Step 3: Catalog number corrections
  // Format: XX-##### or XX #####
  // Between letters and numbers, confused chars are likely numbers
  text = text.replace(/([A-Z]{2,4})[\s-]*([O0I1S5]{1,2})(\d{3,6})/gi, (match, prefix, confused, numbers) => {
    const correctedConfused = confused
      .replace(/O/g, '0')
      .replace(/I/g, '1')
      .replace(/S/g, '5');
    if (correctedConfused !== confused) {
      const corrected = `${prefix}-${correctedConfused}${numbers}`;
      corrections.push({
        original: match,
        corrected,
        reason: 'Catalog number: expect digits between prefix and number',
        confidence: 0.8
      });
      return corrected;
    }
    return match;
  });
  
  // Step 4: Stamper code corrections
  // Isolated single digits that should be letters (stamper codes are A, B, AA, etc.)
  text = text.replace(/\b([0158])\b(?=\s|$)/g, (match, char) => {
    const letterMap: Record<string, string> = { '0': 'O', '1': 'I', '5': 'S', '8': 'B' };
    if (letterMap[char]) {
      corrections.push({
        original: char,
        corrected: letterMap[char],
        reason: 'Isolated character likely stamper code letter, not digit',
        confidence: 0.7
      });
      return letterMap[char];
    }
    return match;
  });
  
  // Step 5: Known plant name corrections
  // PDO
  text = text.replace(/PD[O0]/gi, (match) => {
    if (match.toUpperCase() !== 'PDO') {
      corrections.push({
        original: match,
        corrected: 'PDO',
        reason: 'PDO pressing plant code',
        confidence: 0.95
      });
    }
    return 'PDO';
  });
  
  // Sonopress
  text = text.replace(/S[O0]N[O0]PRESS|5ONOPRESS|50N0PRE55/gi, (match) => {
    if (match.toUpperCase() !== 'SONOPRESS') {
      corrections.push({
        original: match,
        corrected: 'SONOPRESS',
        reason: 'Sonopress pressing plant name',
        confidence: 0.95
      });
    }
    return 'SONOPRESS';
  });
  
  // EMI
  text = text.replace(/EM[1I]|3MI/gi, (match) => {
    if (match.toUpperCase() !== 'EMI') {
      corrections.push({
        original: match,
        corrected: 'EMI',
        reason: 'EMI label/plant name',
        confidence: 0.9
      });
    }
    return 'EMI';
  });
  
  // Philips
  text = text.replace(/PH[1I]L[1I]PS|PHIL1PS|PH1LIPS/gi, (match) => {
    if (match.toUpperCase() !== 'PHILIPS') {
      corrections.push({
        original: match,
        corrected: 'PHILIPS',
        reason: 'Philips pressing plant name',
        confidence: 0.9
      });
    }
    return 'PHILIPS';
  });
  
  // Capitol
  text = text.replace(/CAP[1I]T[O0]L|CAP1TOL|CAPIT0L/gi, (match) => {
    if (match.toUpperCase() !== 'CAPITOL') {
      corrections.push({
        original: match,
        corrected: 'CAPITOL',
        reason: 'Capitol pressing plant name',
        confidence: 0.9
      });
    }
    return 'CAPITOL';
  });
  
  // Nimbus
  text = text.replace(/N[1I]MBUS|NIMBU5/gi, (match) => {
    if (match.toUpperCase() !== 'NIMBUS') {
      corrections.push({
        original: match,
        corrected: 'NIMBUS',
        reason: 'Nimbus pressing plant name',
        confidence: 0.9
      });
    }
    return 'NIMBUS';
  });
  
  return { correctedText: text, corrections };
}

/**
 * Extract and classify matrix codes from corrected text
 */
function extractMatrixCodes(
  correctedText: string,
  mediaType: 'vinyl' | 'cd'
): DetectedMatrixCodes {
  const result: DetectedMatrixCodes = {
    ifpiCodes: [],
    catalogNumbers: [],
    matrixNumbers: [],
    pressPlantCodes: [],
    stamperCodes: [],
    masteringCodes: [],
    unknownCodes: [],
    corrections: []
  };
  
  // Extract IFPI codes
  const ifpiMatches = correctedText.match(/IFPI\s*[A-Z0-9]{4,6}/gi);
  if (ifpiMatches) {
    result.ifpiCodes = [...new Set(ifpiMatches.map(m => m.trim()))];
  }
  
  // Extract pressing plant codes
  for (const pattern of PRESSING_PLANT_PATTERNS) {
    if (['PDO', 'SONOPRESS', 'EMI', 'MPO', 'NIMBUS', 'SANYO', 'JVC', 'PHILIPS', 'CAPITOL', 'DAMONT'].includes(pattern.name)) {
      const matches = correctedText.match(pattern.regex);
      if (matches) {
        result.pressPlantCodes.push(...matches.map(m => m.trim()));
      }
    }
  }
  result.pressPlantCodes = [...new Set(result.pressPlantCodes)];
  
  // Extract catalog numbers (format: XX-#####, XX #####, etc.)
  const catalogMatches = correctedText.match(/[A-Z]{2,4}[\s-]*\d{4,8}/gi);
  if (catalogMatches) {
    result.catalogNumbers = [...new Set(catalogMatches.map(m => m.trim()))];
  }
  
  // Extract matrix numbers (alphanumeric sequences)
  const matrixMatches = correctedText.match(/[A-Z0-9]{6,15}/gi);
  if (matrixMatches) {
    // Filter out already matched patterns
    const known = new Set([
      ...result.ifpiCodes,
      ...result.pressPlantCodes,
      ...result.catalogNumbers
    ].map(c => c.toUpperCase().replace(/\s/g, '')));
    
    result.matrixNumbers = matrixMatches
      .filter(m => !known.has(m.toUpperCase().replace(/\s/g, '')))
      .map(m => m.trim());
    result.matrixNumbers = [...new Set(result.matrixNumbers)];
  }
  
  // Extract stamper codes (isolated single/double letters)
  const stamperMatches = correctedText.match(/\b[A-Z]{1,2}\b/g);
  if (stamperMatches) {
    // Filter out common words and keep likely stamper codes
    const validStampers = stamperMatches.filter(s => 
      !['IF', 'PI', 'CD', 'LP', 'UK', 'US', 'DE', 'NL', 'JP', 'FR', 'EU', 'CA'].includes(s) &&
      s.length <= 2
    );
    result.stamperCodes = [...new Set(validStampers)];
  }
  
  // Extract mastering engineer initials (2-3 letter codes)
  const masteringMatches = correctedText.match(/\b[A-Z]{2,3}\b(?=\s*$|\s*[-\\/])/gm);
  if (masteringMatches) {
    result.masteringCodes = [...new Set(masteringMatches)];
  }
  
  return result;
}

/**
 * Calculate confidence based on detected codes
 */
function calculateConfidence(codes: DetectedMatrixCodes): number {
  let score = 0;
  
  if (codes.ifpiCodes.length > 0) score += 30;
  if (codes.pressPlantCodes.length > 0) score += 25;
  if (codes.catalogNumbers.length > 0) score += 20;
  if (codes.matrixNumbers.length > 0) score += 10;
  if (codes.stamperCodes.length > 0) score += 10;
  if (codes.masteringCodes.length > 0) score += 5;
  
  return Math.min(100, score);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { rawText, mediaType }: OCRCorrectionRequest = await req.json();

    if (!rawText) {
      throw new Error('rawText is required');
    }
    if (!mediaType || !['vinyl', 'cd'].includes(mediaType)) {
      throw new Error('mediaType must be "vinyl" or "cd"');
    }

    console.log(`🔤 Applying domain knowledge OCR corrections for ${mediaType}...`);
    console.log(`📝 Raw text (${rawText.length} chars): "${rawText.substring(0, 100)}..."`);

    // Apply corrections
    const { correctedText, corrections } = applyOCRCorrections(rawText, mediaType);
    console.log(`✅ Applied ${corrections.length} corrections`);

    // Extract structured codes
    const detectedCodes = extractMatrixCodes(correctedText, mediaType);
    detectedCodes.corrections = corrections;

    // Calculate confidence
    const confidence = calculateConfidence(detectedCodes);

    // List detected pattern types
    const detectedPatterns: string[] = [];
    if (detectedCodes.ifpiCodes.length > 0) detectedPatterns.push('IFPI');
    if (detectedCodes.pressPlantCodes.length > 0) detectedPatterns.push('PRESSING_PLANT');
    if (detectedCodes.catalogNumbers.length > 0) detectedPatterns.push('CATALOG');
    if (detectedCodes.matrixNumbers.length > 0) detectedPatterns.push('MATRIX');
    if (detectedCodes.stamperCodes.length > 0) detectedPatterns.push('STAMPER');
    if (detectedCodes.masteringCodes.length > 0) detectedPatterns.push('MASTERING');

    console.log(`📊 Detected patterns: ${detectedPatterns.join(', ') || 'none'}`);
    console.log(`🎯 Confidence: ${confidence}%`);
    console.log(`🏭 IFPI: ${detectedCodes.ifpiCodes.join(', ') || 'none'}`);
    console.log(`🏭 Plants: ${detectedCodes.pressPlantCodes.join(', ') || 'none'}`);
    console.log(`📀 Catalog: ${detectedCodes.catalogNumbers.join(', ') || 'none'}`);

    const result: OCRCorrectionResult = {
      success: true,
      correctedText,
      rawText,
      detectedCodes,
      confidence,
      corrections,
      detectedPatterns,
      processingTime: Date.now() - startTime
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ OCR correction error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        processingTime: Date.now() - startTime
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
