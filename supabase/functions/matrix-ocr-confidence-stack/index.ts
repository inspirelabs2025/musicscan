import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OCRVariant {
  name: string;
  imageBase64: string;
  weight: number;
}

interface OCRResult {
  variant: string;
  rawText: string;
  extractedCodes: ExtractedCode[];
  confidence: number;
}

interface ExtractedCode {
  type: 'ifpi' | 'catalog' | 'matrix' | 'stamper' | 'mastering' | 'plant';
  value: string;
  confidence: number;
  position?: number;
}

interface ConsensusResult {
  type: string;
  value: string;
  confidence: number;
  votes: number;
  sources: string[];
}

// Character confusion corrections for OCR
const CHAR_CORRECTIONS: Record<string, string[]> = {
  'O': ['0'],
  '0': ['O'],
  'I': ['1', 'l'],
  '1': ['I', 'l'],
  'l': ['1', 'I'],
  'S': ['5'],
  '5': ['S'],
  'B': ['8'],
  '8': ['B'],
  'G': ['6'],
  '6': ['G'],
  'Z': ['2'],
  '2': ['Z'],
};

// Known patterns for validation
const PATTERNS = {
  ifpiMould: /^L\d{3,5}$/i,
  ifpiMastering: /^LF\d{4,6}$/i,
  ifpiSid: /^IFPI\s*[A-Z0-9]{4,6}$/i,
  catalogNumber: /^[A-Z]{1,4}[\s-]?\d{4,8}$/i,
  matrixNumber: /^[A-Z0-9]{2,6}[\s-]?\d{4,10}[\s-]?[A-Z0-9]{0,4}$/i,
  stamperCode: /^[A-Z]{1,2}\d?$/i,
  plantCode: /^(PDO|PMDC|EMI|SONO|NIMBUS|PHILIPS|CAPITOL|DADC)/i,
};

function normalizeForComparison(text: string): string {
  return text.toUpperCase().replace(/[\s\-\.]/g, '');
}

function areEquivalent(a: string, b: string): boolean {
  const normA = normalizeForComparison(a);
  const normB = normalizeForComparison(b);
  
  if (normA === normB) return true;
  
  // Check with character substitutions
  for (let i = 0; i < normA.length && i < normB.length; i++) {
    const charA = normA[i];
    const charB = normB[i];
    
    if (charA !== charB) {
      const possibleA = CHAR_CORRECTIONS[charA] || [];
      const possibleB = CHAR_CORRECTIONS[charB] || [];
      
      if (!possibleA.includes(charB) && !possibleB.includes(charA)) {
        // Check if rest is similar enough (Levenshtein distance)
        const distance = levenshteinDistance(normA, normB);
        return distance <= Math.max(1, Math.floor(normA.length * 0.15));
      }
    }
  }
  
  return Math.abs(normA.length - normB.length) <= 1;
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

function extractCodesFromText(text: string, variantName: string): ExtractedCode[] {
  const codes: ExtractedCode[] = [];
  const lines = text.split(/[\n\r]+/).map(l => l.trim()).filter(l => l.length > 2);
  
  for (const line of lines) {
    // IFPI codes
    const ifpiMatch = line.match(/IFPI\s*([A-Z0-9]{4,8})/i);
    if (ifpiMatch) {
      codes.push({
        type: 'ifpi',
        value: `IFPI ${ifpiMatch[1].toUpperCase()}`,
        confidence: 0.9,
      });
    }
    
    // L-codes (mould SID)
    const lCodeMatch = line.match(/\bL[F]?\s*(\d{3,6})\b/i);
    if (lCodeMatch) {
      const prefix = line.match(/LF/i) ? 'LF' : 'L';
      codes.push({
        type: 'ifpi',
        value: `${prefix}${lCodeMatch[1]}`,
        confidence: 0.85,
      });
    }
    
    // Plant codes
    const plantMatch = line.match(/(PDO|PMDC|EMI|SONOPRESS|NIMBUS|PHILIPS|CAPITOL|DADC|MPO|CINRAM)/i);
    if (plantMatch) {
      codes.push({
        type: 'plant',
        value: plantMatch[1].toUpperCase(),
        confidence: 0.95,
      });
    }
    
    // Catalog numbers (various formats)
    const catalogMatch = line.match(/\b([A-Z]{1,4})[\s\-]?(\d{4,10})\b/i);
    if (catalogMatch && !ifpiMatch && !lCodeMatch) {
      codes.push({
        type: 'catalog',
        value: `${catalogMatch[1].toUpperCase()}-${catalogMatch[2]}`,
        confidence: 0.75,
      });
    }
    
    // Matrix numbers (alphanumeric sequences)
    const matrixMatch = line.match(/\b([A-Z0-9]{2,4}[\s\-]?\d{5,12}[\s\-]?[A-Z0-9]{0,4})\b/i);
    if (matrixMatch && matrixMatch[1].length >= 8) {
      codes.push({
        type: 'matrix',
        value: matrixMatch[1].toUpperCase().replace(/\s+/g, '-'),
        confidence: 0.7,
      });
    }
    
    // Stamper codes (A, B, AA, 1A, etc.)
    const stamperMatch = line.match(/\b([A-Z]{1,2}\d?)\b/);
    if (stamperMatch && stamperMatch[1].length <= 3) {
      // Only if it looks like a standalone stamper code
      const val = stamperMatch[1].toUpperCase();
      if (/^[A-Z]{1,2}\d?$/.test(val) && !PATTERNS.plantCode.test(line)) {
        codes.push({
          type: 'stamper',
          value: val,
          confidence: 0.6,
        });
      }
    }
  }
  
  return codes;
}

function stackResults(results: OCRResult[]): ConsensusResult[] {
  const codeGroups: Map<string, {
    type: string;
    variants: Map<string, { value: string; weight: number; sources: string[] }>;
  }> = new Map();
  
  // Group codes by type and find equivalent values
  for (const result of results) {
    for (const code of result.extractedCodes) {
      if (!codeGroups.has(code.type)) {
        codeGroups.set(code.type, { type: code.type, variants: new Map() });
      }
      
      const group = codeGroups.get(code.type)!;
      let foundEquivalent = false;
      
      // Check if this value is equivalent to an existing one
      for (const [existingNorm, existing] of group.variants) {
        if (areEquivalent(code.value, existing.value)) {
          existing.weight += result.confidence * code.confidence;
          existing.sources.push(result.variant);
          foundEquivalent = true;
          break;
        }
      }
      
      if (!foundEquivalent) {
        const norm = normalizeForComparison(code.value);
        group.variants.set(norm, {
          value: code.value,
          weight: result.confidence * code.confidence,
          sources: [result.variant],
        });
      }
    }
  }
  
  // Pick highest consensus for each type
  const consensus: ConsensusResult[] = [];
  
  for (const [type, group] of codeGroups) {
    let bestValue = '';
    let bestWeight = 0;
    let bestSources: string[] = [];
    
    for (const [, variant] of group.variants) {
      // Weight by both confidence and number of sources (votes)
      const totalWeight = variant.weight * (1 + variant.sources.length * 0.2);
      
      if (totalWeight > bestWeight) {
        bestWeight = totalWeight;
        bestValue = variant.value;
        bestSources = variant.sources;
      }
    }
    
    if (bestValue) {
      // Normalize confidence to 0-1 range
      const maxPossibleWeight = results.length * 1.0 * 1.0 * (1 + results.length * 0.2);
      const normalizedConfidence = Math.min(0.99, bestWeight / maxPossibleWeight);
      
      consensus.push({
        type,
        value: bestValue,
        confidence: normalizedConfidence,
        votes: bestSources.length,
        sources: [...new Set(bestSources)],
      });
    }
  }
  
  // Sort by confidence
  return consensus.sort((a, b) => b.confidence - a.confidence);
}

function applyDomainCorrections(consensus: ConsensusResult[]): ConsensusResult[] {
  return consensus.map(result => {
    let correctedValue = result.value;
    
    // Apply pattern-specific corrections
    if (result.type === 'ifpi') {
      // IFPI codes should be uppercase, specific format
      correctedValue = correctedValue.toUpperCase();
      
      // L-codes: ensure numeric part is correct
      if (correctedValue.startsWith('L') && !correctedValue.startsWith('LF')) {
        correctedValue = correctedValue.replace(/[O]/g, '0').replace(/[I]/g, '1');
      }
      
      // LF-codes (mastering)
      if (correctedValue.startsWith('LF')) {
        correctedValue = correctedValue.replace(/[O]/g, '0').replace(/[I]/g, '1');
      }
    }
    
    if (result.type === 'catalog') {
      // Catalog numbers: letters should be letters, numbers should be numbers
      const parts = correctedValue.split('-');
      if (parts.length >= 2) {
        parts[0] = parts[0].replace(/[0]/g, 'O').replace(/[1]/g, 'I');
        parts[1] = parts[1].replace(/[O]/g, '0').replace(/[I]/g, '1').replace(/[S]/g, '5');
        correctedValue = parts.join('-');
      }
    }
    
    return {
      ...result,
      value: correctedValue,
    };
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      variants,
      rawOcrResults,
      mediaType = 'cd'
    }: { 
      variants?: OCRVariant[];
      rawOcrResults?: OCRResult[];
      mediaType?: 'cd' | 'vinyl';
    } = await req.json();

    console.log(`🔄 Confidence stacking for ${mediaType}`);
    console.log(`📊 Received ${rawOcrResults?.length || 0} OCR results to stack`);

    // If we receive pre-computed OCR results, just stack them
    if (rawOcrResults && rawOcrResults.length > 0) {
      const consensus = stackResults(rawOcrResults);
      const correctedConsensus = applyDomainCorrections(consensus);
      
      console.log(`✅ Stacked ${rawOcrResults.length} variants → ${correctedConsensus.length} consensus codes`);
      
      return new Response(JSON.stringify({
        success: true,
        consensus: correctedConsensus,
        variantsProcessed: rawOcrResults.length,
        stats: {
          totalCodesFound: rawOcrResults.reduce((sum, r) => sum + r.extractedCodes.length, 0),
          consensusCodesReturned: correctedConsensus.length,
          highConfidenceCodes: correctedConsensus.filter(c => c.confidence > 0.7).length,
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If we receive image variants, we need to describe expected OCR workflow
    if (variants && variants.length > 0) {
      console.log(`📷 Received ${variants.length} image variants for OCR`);
      
      // Return guidance on how to use the variants
      return new Response(JSON.stringify({
        success: true,
        message: 'Image variants received. Run OCR on each variant and call this endpoint again with rawOcrResults.',
        variantsReceived: variants.map(v => ({ name: v.name, weight: v.weight })),
        expectedFormat: {
          rawOcrResults: [
            {
              variant: 'variant_name',
              rawText: 'OCR text output',
              extractedCodes: [{ type: 'ifpi', value: 'L123', confidence: 0.9 }],
              confidence: 0.85
            }
          ]
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Provide either rawOcrResults (for stacking) or variants (for guidance)'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Confidence stacking error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
