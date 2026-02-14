import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { logCreditAlert } from "../_shared/credit-alert.ts"
import { checkScanRate } from "../_shared/rate-check.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { encode as encodeBase64 } from "https://deno.land/std@0.168.0/encoding/base64.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-device-fingerprint',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// ============= RIGHTS SOCIETY GATING =============
// Maps rights societies to primary (home market) and compatible (broader) country/region patterns
// Two-level matching: primary → +15 pts, compatible → 0 pts (neutral), not in list → score 0 (exclude)
const EU_COUNTRIES = ['europe', 'eu', 'germany', 'france', 'uk', 'united kingdom', 'italy', 'spain', 'belgium', 'austria', 'sweden', 'denmark', 'portugal', 'greece', 'ireland', 'finland', 'norway', 'switzerland', 'czech republic', 'poland', 'hungary', 'netherlands', 'holland'];
const RIGHTS_SOCIETY_REGIONS: Record<string, { primary: string[]; regions: string[]; label: string }> = {
  'STEMRA':     { primary: ['netherlands', 'holland'], regions: EU_COUNTRIES, label: 'NL/EU' },
  'BIEM':       { primary: [], regions: EU_COUNTRIES, label: 'EU' },
  'BUMA':       { primary: ['netherlands', 'holland'], regions: ['netherlands', 'holland', 'europe', 'eu'], label: 'NL/EU' },
  'GEMA':       { primary: ['germany', 'austria'], regions: EU_COUNTRIES, label: 'DE/EU' },
  'SACEM':      { primary: ['france'], regions: EU_COUNTRIES, label: 'FR/EU' },
  'PRS':        { primary: ['uk', 'united kingdom', 'ireland'], regions: EU_COUNTRIES, label: 'UK/EU' },
  'MCPS':       { primary: ['uk', 'united kingdom', 'ireland'], regions: EU_COUNTRIES, label: 'UK/EU' },
  'JASRAC':     { primary: ['japan'], regions: ['japan'], label: 'JP' },
  'ASCAP':      { primary: ['us', 'usa', 'united states'], regions: ['us', 'usa', 'united states'], label: 'US' },
  'BMI':        { primary: ['us', 'usa', 'united states'], regions: ['us', 'usa', 'united states'], label: 'US' },
  'SOCAN':      { primary: ['canada'], regions: ['canada'], label: 'CA' },
  'APRA':       { primary: ['australia', 'new zealand'], regions: ['australia', 'new zealand'], label: 'AU/NZ' },
  'AMCOS':      { primary: ['australia', 'new zealand'], regions: ['australia', 'new zealand'], label: 'AU/NZ' },
  'SABAM':      { primary: ['belgium'], regions: EU_COUNTRIES, label: 'BE/EU' },
  'SIAE':       { primary: ['italy'], regions: EU_COUNTRIES, label: 'IT/EU' },
  'SGAE':       { primary: ['spain', 'portugal'], regions: EU_COUNTRIES, label: 'ES/EU' },
};

/**
 * Detect rights societies from extracted text arrays
 * Returns array of detected society names (normalized to uppercase keys)
 */
function detectRightsSocieties(rightsSocietiesField: string[], allTexts: string[]): string[] {
  const detected = new Set<string>();
  
  // First check the explicitly extracted rights_societies field
  for (const rs of rightsSocietiesField) {
    const upper = rs.toUpperCase();
    for (const society of Object.keys(RIGHTS_SOCIETY_REGIONS)) {
      if (upper.includes(society)) {
        detected.add(society);
      }
    }
  }
  
  // Also scan all raw text for rights society mentions
  const allTextJoined = allTexts.join(' ').toUpperCase();
  for (const society of Object.keys(RIGHTS_SOCIETY_REGIONS)) {
    if (allTextJoined.includes(society)) {
      detected.add(society);
    }
  }
  
  // Handle compound "BIEM/STEMRA" pattern
  if (detected.has('BIEM') && detected.has('STEMRA')) {
    // Both detected, keep both — STEMRA is the stronger NL indicator
  }
  
  return [...detected];
}

interface AnalysisRequest {
  photoUrls: string[]
  mediaType: 'vinyl' | 'cd'
  conditionGrade?: string
  skipSave?: boolean
  externalRightsSocieties?: string[]
}

interface StructuredAnalysisData {
  artist: string | null
  title: string | null
  label: string | null
  catalogNumber: string | null
  year: number | null
  barcode: string | null
  matrixNumber: string | null
  genre: string | null
  format: string | null
  country: string | null
  confidence: number
  alternativeSearchTerms: string[]
  extractedText: string[]
  imageQuality: 'excellent' | 'good' | 'fair' | 'poor'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get the authorization header to extract user info
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('❌ No authorization header provided')
      throw new Error('No authorization header provided')
    }

    // Extract JWT token and get user info
    const jwt = authHeader.replace('Bearer ', '')
    console.log('🔐 Attempting to get user from JWT token...')

    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt)

    if (userError) {
      console.error('❌ User authentication error:', userError)
      throw new Error(`Invalid authentication token: ${userError.message}`)
    }

    if (!user) {
      console.error('❌ No user found in token')
      throw new Error('Invalid authentication token: No user found')
    }

    console.log('✅ User authenticated successfully:', {
      userId: user.id,
      email: user.email,
      role: user.role
    })

    // Check AI scan usage limits
    console.log('🔍 Checking AI scan usage limits for user:', user.id)

    const { data: usageCheck, error: usageError } = await supabase.rpc('check_usage_limit', {
      p_user_id: user.id,
      p_usage_type: 'ai_scans'
    });

    if (usageError) {
      console.error('❌ Usage check error:', usageError);
      throw new Error('Failed to check usage limits');
    }

    const limitCheck = usageCheck[0];
    console.log('📊 Usage check result:', limitCheck);

    if (!limitCheck.can_use) {
      console.log(`🚫 Usage limit reached: ${limitCheck.current_usage}/${limitCheck.limit_amount} for ${limitCheck.plan_name}`);

      return new Response(JSON.stringify({
        error: 'USAGE_LIMIT_EXCEEDED',
        message: `Je hebt je limiet van ${limitCheck.limit_amount} AI scans deze maand bereikt. Upgrade je plan voor meer scans.`,
        usage: {
          current: limitCheck.current_usage,
          limit: limitCheck.limit_amount,
          plan: limitCheck.plan_name
        }
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Rate tracking for abuse detection (non-blocking, alert-only)
    await checkScanRate(req, user.id, "photo");

    // Skipping direct checks against auth.users (restricted schema). JWT already validated above.

    const { photoUrls, mediaType, conditionGrade: rawConditionGrade, skipSave, externalRightsSocieties }: AnalysisRequest = await req.json()
    const conditionGrade = rawConditionGrade || 'Not Graded'

    console.log('🤖 Starting AI photo analysis V2 for:', {
      photoCount: photoUrls.length,
      mediaType,
      conditionGrade,
      skipSave: !!skipSave,
      userId: user.id,
      userEmail: user.email
    })

    let scanId: string | null = null;

    if (!skipSave) {
      // Create initial record with version marker and user_id
      console.log('📝 Creating scan record in database...')
      console.log('🔍 User ID being inserted:', user.id)
      console.log('🔍 User ID type:', typeof user.id)

      const insertData = {
        user_id: user.id,
        photo_urls: photoUrls,
        media_type: mediaType,
        condition_grade: conditionGrade,
        status: 'pending',
        analysis_data: { version: 'v2', phase: 'initialization' }
      }

      console.log('📦 Insert data being sent:', insertData)

      const { data: scanRecord, error: insertError } = await supabase
        .from('ai_scan_results')
        .insert(insertData)
        .select()
        .single()

      if (insertError) {
        console.error('❌ Database insert error:', {
          error: insertError,
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          userId: user.id
        })
        throw new Error(`Failed to create scan record: ${insertError.message}`)
      }

      console.log('✅ Scan record created successfully:', scanRecord.id)
      scanId = scanRecord.id
    } else {
      console.log('⏭️ skipSave=true — skipping database record creation')
    }

    try {
      // Multi-pass analysis
      console.log('🔍 Starting multi-pass analysis...')

      // Pass 1: General release identification
      const generalAnalysis = await analyzePhotosWithOpenAI(photoUrls, mediaType, 'general')

      if (!generalAnalysis.success) {
        if (!skipSave && scanId) {
          await supabase
            .from('ai_scan_results')
            .update({
              status: 'failed',
              error_message: generalAnalysis.error
            })
            .eq('id', scanId)
        }

        return new Response(
          JSON.stringify({
            success: false,
            error: generalAnalysis.error,
            scanId
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Pass 2: Detail extraction
      const detailAnalysis = await analyzePhotosWithOpenAI(photoUrls, mediaType, 'details')

      // Pass 3: Dedicated matrix/SID extraction with preprocessing
      // For BOTH CD and LP, we now preprocess the matrix photo for better OCR
      let matrixPhotoUrls = photoUrls;
      
      // Try to preprocess the matrix photo (last photo for vinyl, photo 3 for CD)
      const matrixPhotoIndex = mediaType === 'vinyl' ? photoUrls.length - 1 : Math.min(2, photoUrls.length - 1);
      const matrixPhotoUrl = photoUrls[matrixPhotoIndex];
      
      if (matrixPhotoUrl) {
        try {
          console.log(`🔧 Preprocessing ${mediaType} matrix photo (index ${matrixPhotoIndex})...`);
          
          const preprocessResponse = await fetch(
            `${supabaseUrl}/functions/v1/preprocess-matrix-photo`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                imageUrl: matrixPhotoUrl,
                mediaType: mediaType
              })
            }
          );
          
          if (preprocessResponse.ok) {
            const preprocessResult = await preprocessResponse.json();
            if (preprocessResult.success && preprocessResult.enhancedImageBase64) {
              console.log(`✅ Matrix photo preprocessed in ${preprocessResult.processingTime}ms`);
              console.log(`📊 Pipeline steps: ${preprocessResult.pipeline?.join(' → ')}`);
              
              // Replace the matrix photo URL with the enhanced base64 for the matrix pass
              matrixPhotoUrls = [...photoUrls];
              matrixPhotoUrls[matrixPhotoIndex] = preprocessResult.enhancedImageBase64;
            } else {
              console.log('⚠️ Preprocessing returned no enhanced image, using original');
            }
          } else {
            console.log(`⚠️ Preprocessing failed (${preprocessResponse.status}), using original photo`);
          }
        } catch (preprocessError) {
          console.log('⚠️ Preprocessing error (continuing with original):', preprocessError.message);
        }
      }

      // Run matrix analysis with potentially preprocessed image
      const matrixAnalysis = await analyzePhotosWithOpenAI(matrixPhotoUrls, mediaType, 'matrix')

      if (matrixAnalysis && !matrixAnalysis.success) {
        console.log('⚠️ Matrix pass failed (continuing):', matrixAnalysis.error)
      }

      // Merge analysis results
      const combinedData = mergeAnalysisResults(
        generalAnalysis.data,
        detailAnalysis.success ? detailAnalysis.data : null,
        matrixAnalysis?.success ? matrixAnalysis.data : null
      )

      // Merge external rights societies (e.g., from Magic Mike chat detection) into combined data
      if (externalRightsSocieties && externalRightsSocieties.length > 0) {
        console.log(`🏛️ Merging ${externalRightsSocieties.length} external rights societies:`, externalRightsSocieties);
        combinedData.rightsSocieties = [
          ...(combinedData.rightsSocieties || []),
          ...externalRightsSocieties,
        ];
        // Also inject into externalRightsSocieties for scoring function access
        (combinedData as any).externalRightsSocieties = externalRightsSocieties;
      }
      // === POST-PROCESSING: Extract missed fields from raw text ===
      // The AI often reads text but fails to classify it into structured fields.
      // Parse extractedText and extractedDetails to fill gaps.
      const allText = [
        ...(combinedData.extractedText || []),
        ...(combinedData.extractedDetails?.codes || []),
        ...(combinedData.extractedDetails?.smallText || []),
        ...(combinedData.extractedDetails?.markings || []),
        ...(combinedData.copyrightLines || []),
        ...(combinedData.discLabelText || []),
        ...(combinedData.backCoverText || []),
        combinedData.spineText || '',
        combinedData.madeInText || '',
      ].filter(Boolean).join(' ');

      // Known label names to detect from extracted text
      const knownLabels = [
        'CBS', 'Columbia', 'Sony', 'Warner', 'Atlantic', 'Polydor', 'Philips', 'Decca',
        'EMI', 'RCA', 'Mercury', 'Motown', 'Island', 'Virgin', 'A&M', 'Elektra',
        'Capitol', 'Geffen', 'Epic', 'Arista', 'MCA', 'Reprise', 'Asylum', 'Chrysalis',
        'Vertigo', 'Harvest', 'Parlophone', 'Apple', 'Stax', 'Chess', 'Blue Note',
        'Def Jam', 'Interscope', 'Sub Pop', 'Rough Trade', 'Factory', '4AD',
        'Fontana', 'London', 'Brunswick', 'Ariola', 'CNR', 'Bovema', 'Negram',
        'Dureco', 'Red Bullet', 'Arcade', 'Telstar', 'Roadrunner',
      ];

      if (!combinedData.label) {
        for (const label of knownLabels) {
          // Match as whole word (case-insensitive)
          const regex = new RegExp(`\\b${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
          if (regex.test(allText)) {
            combinedData.label = label;
            console.log(`🔧 POST-PROCESS: Detected label "${label}" from extracted text`);
            break;
          }
        }
      }

      // Catalog number: look for patterns like "35DP-93", "CDPCSD 167", etc. in codes
      if (!combinedData.catalogNumber) {
        const codes = combinedData.extractedDetails?.codes || [];
        const searchQueries = combinedData.searchQueries || [];
        const allCodes = [...codes, ...searchQueries];
        
        for (const code of allCodes) {
          // Catalog pattern: letters + numbers with optional hyphens, NOT a barcode
          const catnoMatch = code.match(/\b([A-Za-z]{1,6}[\s\-]?\d{1,6}(?:[\-\/]\d{1,4})?)\b/);
          if (catnoMatch) {
            const candidate = catnoMatch[1].trim();
            // Skip if it looks like a barcode (12+ digits) or matrix (already captured)
            const digits = candidate.replace(/[^0-9]/g, '');
            if (digits.length <= 10 && candidate !== combinedData.matrixNumber) {
              combinedData.catalogNumber = candidate;
              console.log(`🔧 POST-PROCESS: Detected catno "${candidate}" from codes/search`);
              break;
            }
          }
        }
      }

      // Country: detect from text patterns like "Made in Japan", "Printed in Holland"
      if (!combinedData.country) {
        const countryPatterns: [RegExp, string][] = [
          [/Made\s+in\s+(Japan|Netherlands|Holland|Germany|UK|USA|France|Italy|Spain|Sweden|Austria|Belgium|Canada|Australia)/i, '$1'],
          [/Printed\s+in\s+(Japan|Netherlands|Holland|Germany|UK|USA|France|Italy|Spain|Sweden|Austria|Belgium|Canada|Australia)/i, '$1'],
          [/Manufactured\s+in\s+(Japan|Netherlands|Holland|Germany|UK|USA|France|Italy|Spain)/i, '$1'],
        ];
        for (const [pattern, _] of countryPatterns) {
          const match = allText.match(pattern);
          if (match) {
            combinedData.country = match[1];
            console.log(`🔧 POST-PROCESS: Detected country "${match[1]}" from extracted text`);
            break;
          }
        }
      }

      // Year: look for copyright symbols followed by 4-digit year
      if (!combinedData.year) {
        // First try explicit copyright lines from general pass
        const copyrightText = (combinedData.copyrightLines || []).join(' ') + ' ' + allText;
        const yearPatterns = [
          /[©℗]\s*(19[5-9]\d|20[0-2]\d)/,
          /\(P\)\s*(19[5-9]\d|20[0-2]\d)/,
          /\(C\)\s*(19[5-9]\d|20[0-2]\d)/,
          /℗\s*(19[5-9]\d|20[0-2]\d)/,
          /©\s*(19[5-9]\d|20[0-2]\d)/,
        ];
        for (const pattern of yearPatterns) {
          const yearMatch = copyrightText.match(pattern);
          if (yearMatch) {
            combinedData.year = parseInt(yearMatch[1]);
            combinedData.yearSource = `copyright: ${yearMatch[0]}`;
            console.log(`🔧 POST-PROCESS: Detected year ${yearMatch[1]} from copyright line`);
            break;
          }
        }
      }

      // Country: also use madeInText from general pass
      if (!combinedData.country && combinedData.madeInText) {
        const madeIn = combinedData.madeInText.match(/(?:Made|Printed|Manufactured)\s+in\s+(\w+)/i);
        if (madeIn) {
          combinedData.country = madeIn[1];
          console.log(`🔧 POST-PROCESS: Country from madeInText: "${madeIn[1]}"`);
        }
      }

      // Genre: detect from known genre keywords in text
      if (!combinedData.genre) {
        const genreKeywords: [RegExp, string][] = [
          [/\b(Rock|Pop|Jazz|Blues|Classical|Folk|Country|Soul|Funk|Reggae|Hip[\s-]?Hop|Electronic|Dance|Metal|Punk|R&B|Gospel)\b/i, '$1'],
        ];
        for (const [pattern, _] of genreKeywords) {
          const match = allText.match(pattern);
          if (match) {
            combinedData.genre = match[1];
            console.log(`🔧 POST-PROCESS: Detected genre "${match[1]}" from extracted text`);
            break;
          }
        }
      }

      // === COLLECTOR-GRADE CROSS-CHECKS ===
      const collectorAudit: Array<{step: string; detail: string; timestamp: string}> = [];
      
      // 1. Barcode normalization: ALWAYS digits-only, never "correct" or add digits
      let barcodeRaw = combinedData.barcode || null;
      let barcodeNormalized = barcodeRaw ? barcodeRaw.replace(/[^0-9]/g, '') : null;
      let barcodeEanValid: boolean | null = null;
      
      if (barcodeNormalized) {
        // Accept 12 or 13 digit barcodes as-is. Never pad or infer.
        if (barcodeNormalized.length === 13) {
          let sum = 0;
          for (let i = 0; i < 12; i++) {
            sum += parseInt(barcodeNormalized[i]) * (i % 2 === 0 ? 1 : 3);
          }
          barcodeEanValid = ((10 - (sum % 10)) % 10) === parseInt(barcodeNormalized[12]);
          collectorAudit.push({ step: 'barcode_ean13', detail: `EAN-13 checksum: ${barcodeEanValid ? 'VALID' : 'INVALID'} (${barcodeNormalized})`, timestamp: new Date().toISOString() });
          if (!barcodeEanValid) {
            // Try with leading 0 stripped (UPC inside EAN)
            const upc = barcodeNormalized.slice(1);
            collectorAudit.push({ step: 'barcode_upc_fallback', detail: `EAN-13 invalid, keeping as search key. UPC candidate: ${upc}`, timestamp: new Date().toISOString() });
          }
        } else if (barcodeNormalized.length === 12) {
          // 12-digit UPC — valid as-is, optionally test EAN-13 with leading 0
          const ean13Candidate = '0' + barcodeNormalized;
          let eanSum = 0;
          for (let i = 0; i < 12; i++) {
            eanSum += parseInt(ean13Candidate[i]) * (i % 2 === 0 ? 1 : 3);
          }
          const eanCheck = ((10 - (eanSum % 10)) % 10) === parseInt(ean13Candidate[12]);
          collectorAudit.push({ step: 'barcode_12digit', detail: `12-digit barcode: ${barcodeNormalized}. EAN-13 with leading 0: ${eanCheck ? 'VALID' : 'INVALID'}`, timestamp: new Date().toISOString() });
        } else if (barcodeNormalized.length < 8) {
          collectorAudit.push({ step: 'barcode_too_short', detail: `Barcode too short (${barcodeNormalized.length} digits) - REJECTED`, timestamp: new Date().toISOString() });
          barcodeNormalized = null;
          combinedData.barcode = null;
        } else {
          collectorAudit.push({ step: 'barcode_normalized', detail: `Barcode: ${barcodeNormalized} (${barcodeNormalized.length} digits)`, timestamp: new Date().toISOString() });
        }
        // Write back the clean digits-only barcode
        if (barcodeNormalized) {
          combinedData.barcode = barcodeNormalized;
        }
      }
      
      // 2. Catalog number cross-check: reject if it's actually a barcode
      let catnoValue = combinedData.catalogNumber || null;
      if (catnoValue && barcodeNormalized) {
        const catnoDigits = catnoValue.replace(/[^0-9]/g, '');
        // Overlap check: if >80% of catno digits match barcode → reject
        if (catnoDigits.length >= 8 && barcodeNormalized.includes(catnoDigits)) {
          collectorAudit.push({ step: 'catno_rejected', detail: `Catno "${catnoValue}" digit overlap >80% with barcode - REJECTED`, timestamp: new Date().toISOString() });
          console.log(`⛔ CROSS-CHECK: Catno "${catnoValue}" overlaps with barcode - REJECTED`);
          catnoValue = null;
          combinedData.catalogNumber = null;
        } else if (catnoDigits === barcodeNormalized) {
          collectorAudit.push({ step: 'catno_rejected', detail: `Catno "${catnoValue}" matches barcode digits exactly - REJECTED`, timestamp: new Date().toISOString() });
          console.log(`⛔ CROSS-CHECK: Catno "${catnoValue}" matches barcode - REJECTED`);
          catnoValue = null;
          combinedData.catalogNumber = null;
        }
      }
      // Also reject catno if it's a pure 12+ digit number (barcode pattern)
      if (catnoValue && /^\d{12,}$/.test(catnoValue.replace(/\s/g, ''))) {
        collectorAudit.push({ step: 'catno_rejected', detail: `Catno "${catnoValue}" is 12+ digits (barcode pattern) - REJECTED`, timestamp: new Date().toISOString() });
        console.log(`⛔ CROSS-CHECK: Catno "${catnoValue}" is barcode-length digits - REJECTED`);
        catnoValue = null;
        combinedData.catalogNumber = null;
      }
      
      // 3. Matrix cross-check: reject if barcode-like pattern
      // IMPROVED: Don't reject matrices with production structure (e.g. C01 468531-10)
      let matrixValue = combinedData.matrixNumber || null;
      if (matrixValue) {
        const matrixDigits = matrixValue.replace(/[^0-9]/g, '');
        const matrixAlpha = matrixValue.replace(/[^a-zA-Z]/g, '');
        
        // Check for production structure: hyphens, slashes, hash marks between alphanumeric groups
        const hasProductionStructure = /[A-Za-z]+\d+[\s\-\/\#]+\d+/i.test(matrixValue.trim()) ||
                                        /\d+[\s\-\/\#]+\d+[\s\-\/\#]+\d+/.test(matrixValue.trim());
        
        // Regex: optional single letter prefix + digits/spaces (8+ digit sequence) → barcode leak
        const barcodeLeakPattern = /^[A-Za-z]?\s?\d[\d\s]{8,}$/;
        
        if (barcodeLeakPattern.test(matrixValue.trim()) && !hasProductionStructure) {
          // Check digit overlap with barcode
          const overlapPct = barcodeNormalized 
            ? (matrixDigits.split('').filter((d: string, i: number) => barcodeNormalized![i] === d).length / Math.max(matrixDigits.length, 1))
            : 0;
          
          if (overlapPct > 0.8 || (matrixAlpha.length <= 1 && !hasProductionStructure)) {
            collectorAudit.push({ step: 'matrix_rejected', detail: `Matrix "${matrixValue}" matches barcode-like pattern (alpha=${matrixAlpha.length}, overlap=${(overlapPct*100).toFixed(0)}%) - REJECTED. Maak een betere hub-foto.`, timestamp: new Date().toISOString() });
            console.log(`⛔ CROSS-CHECK: Matrix "${matrixValue}" is barcode-like (overlap ${(overlapPct*100).toFixed(0)}%) - REJECTED`);
            matrixValue = null;
            combinedData.matrixNumber = null;
          } else {
            console.log(`✅ Matrix "${matrixValue}" has production structure - KEPT despite barcode-like pattern`);
          }
        } else if (matrixDigits.length >= 12 && matrixAlpha.length === 0) {
          // Pure digits >= 12 without any alpha → barcode, not matrix
          collectorAudit.push({ step: 'matrix_rejected', detail: `Matrix "${matrixValue}" is pure digits (${matrixDigits.length} digits, no alpha) - REJECTED`, timestamp: new Date().toISOString() });
          console.log(`⛔ CROSS-CHECK: Matrix "${matrixValue}" is barcode-like - REJECTED`);
          matrixValue = null;
          combinedData.matrixNumber = null;
        } else if (barcodeNormalized && (matrixDigits === barcodeNormalized || matrixDigits.includes(barcodeNormalized))) {
          collectorAudit.push({ step: 'matrix_rejected', detail: `Matrix "${matrixValue}" contains barcode digits - REJECTED`, timestamp: new Date().toISOString() });
          console.log(`⛔ CROSS-CHECK: Matrix "${matrixValue}" contains barcode - REJECTED`);
          matrixValue = null;
          combinedData.matrixNumber = null;
        }
      }
      
      // 4. Label Code source validation: only trust if OCR-detected
      if (combinedData.labelCode) {
        const labelCodeSource = combinedData.labelCodeSource || 'unknown';
        if (labelCodeSource !== 'ocr') {
          collectorAudit.push({ step: 'label_code_unverified', detail: `Label code "${combinedData.labelCode}" source=${labelCodeSource} - flagged as unverified (not from OCR)`, timestamp: new Date().toISOString() });
          // Don't null it out, but flag it in the audit
        } else {
          collectorAudit.push({ step: 'label_code_verified', detail: `Label code "${combinedData.labelCode}" source=OCR ✅`, timestamp: new Date().toISOString() });
        }
      }
      
      // 5. Year validation: only from explicit copyright lines
      if (combinedData.year && !generalAnalysis.data?.yearSource?.includes('copyright') && !generalAnalysis.data?.yearSource?.includes('(P)') && !generalAnalysis.data?.yearSource?.includes('(C)')) {
        collectorAudit.push({ step: 'year_unverified', detail: `Year ${combinedData.year} not from copyright line - flagged as unverified`, timestamp: new Date().toISOString() });
      }

      // Update with analysis progress
      if (!skipSave && scanId) {
        await supabase
          .from('ai_scan_results')
          .update({
            analysis_data: {
              version: 'v2',
              phase: 'analysis_complete',
              generalAnalysis: generalAnalysis.data,
              detailAnalysis: detailAnalysis.success ? detailAnalysis.data : { error: detailAnalysis.error },
              matrixAnalysis: matrixAnalysis
                ? (matrixAnalysis.success ? matrixAnalysis.data : { error: matrixAnalysis.error })
                : null,
              combined: combinedData,
              collector_audit: collectorAudit
            }
          })
          .eq('id', scanId)
      }

      // ─── LOCAL-FIRST LOOKUP: Check own database before Discogs API ───
      let discogsResult: any = null;
      const localMatch = await localFirstLookup(combinedData, collectorAudit);
      
      if (localMatch) {
        console.log(`🏠 Local-first hit! Discogs ID ${localMatch.discogs_id} from own database`);
        collectorAudit.push({ step: 'local_first_hit', detail: `Found in own DB: Discogs ${localMatch.discogs_id} (${localMatch.match_type})`, timestamp: new Date().toISOString() });
        
        // Build discogsResult from local data
        discogsResult = {
          discogsId: localMatch.discogs_id,
          discogsUrl: `https://www.discogs.com/release/${localMatch.discogs_id}`,
          artist: localMatch.artist || combinedData.artist,
          title: localMatch.title || combinedData.title,
          label: localMatch.labels?.[0]?.name || combinedData.label,
          catalogNumber: localMatch.labels?.[0]?.catno || combinedData.catalogNumber,
          year: localMatch.year || combinedData.year,
          confidence: Math.min(localMatch.verification_score >= 2 ? 0.95 : 0.80, 1.0),
          searchMetadata: { source: 'local_database', match_type: localMatch.match_type },
          suggestions: [],
        };
      } else {
        // No local match — fall back to Discogs API
        collectorAudit.push({ step: 'local_first_miss', detail: 'No match in own database, searching Discogs API', timestamp: new Date().toISOString() });
        discogsResult = await searchDiscogsV2(combinedData, mediaType);
      }

      // Update record with final results
      const normalizedYear = typeof discogsResult.year === 'string'
        ? parseInt(discogsResult.year, 10)
        : (discogsResult.year ?? (typeof combinedData.year === 'string' ? parseInt(combinedData.year, 10) : (combinedData.year ?? null)))

      if (!skipSave && scanId) {
        const { error: finalUpdateError } = await supabase
          .from('ai_scan_results')
          .update({
            discogs_id: discogsResult.discogsId ?? null,
            discogs_url: discogsResult.discogsUrl ?? null,
            artist: discogsResult.artist ?? combinedData.artist ?? null,
            title: discogsResult.title ?? combinedData.title ?? null,
            label: discogsResult.label ?? combinedData.label ?? null,
            catalog_number: discogsResult.catalogNumber ?? combinedData.catalogNumber ?? null,
            year: Number.isFinite(normalizedYear as number) ? (normalizedYear as number) : null,
            confidence_score: discogsResult.confidence ?? combinedData.confidence ?? null,
            // Also persist key technical identifiers
            barcode: combinedData.barcode ?? null,
            matrix_number: combinedData.matrixNumber ?? null,
            analysis_data: {
              version: 'v2',
              phase: 'completed',
              generalAnalysis: generalAnalysis.data,
              detailAnalysis: detailAnalysis.data,
              combined: combinedData,
              discogsSearch: discogsResult.searchMetadata
            },
            ai_description: combinedData.description ?? null,
            search_queries: combinedData.searchQueries ?? null,
            status: 'completed'
          })
          .eq('id', scanId)

        if (finalUpdateError) {
          console.error('❌ Final database update failed:', { finalUpdateError, scanId })
          throw new Error(`Final database update failed: ${finalUpdateError.message}`)
        }

        console.log('✅ AI analysis V2 completed for scan:', scanId)

        // Increment usage counter for successful scan
        console.log('📈 Incrementing AI scan usage for user:', user.id)
        const { error: usageError } = await supabase.rpc('increment_usage', {
          p_user_id: user.id,
          p_usage_type: 'ai_scans',
          p_increment: 1
        });

        if (usageError) {
          console.error('⚠️ Failed to increment usage counter:', usageError);
        } else {
          console.log('✅ Usage counter incremented successfully');
        }
      }

      // Automatic artwork enrichment after successful scan (skip if skipSave)
      if (!skipSave && scanId && (discogsResult?.discogsUrl || (combinedData.artist && combinedData.title))) {
        try {
          console.log('🎨 Starting automatic artwork enrichment...');
          const { data: artworkData } = await supabase.functions.invoke('fetch-album-artwork', {
            body: {
              discogs_url: discogsResult?.discogsUrl,
              artist: discogsResult?.artist || combinedData.artist,
              title: discogsResult?.title || combinedData.title,
              media_type: mediaType,
              item_id: scanId,
              item_type: 'ai_scan'
            }
          });

          if (artworkData?.artwork_url) {
            await supabase.from('ai_scan_results')
              .update({ artwork_url: artworkData.artwork_url })
              .eq('id', scanId);
            console.log('✅ Artwork enrichment completed:', artworkData.artwork_url);
          } else {
            console.log('ℹ️ No artwork found during enrichment');
          }
        } catch (error) {
          console.log('❌ Artwork enrichment failed but scan succeeded:', error);
        }
      }

      // 🔗 Automatic release linking - connect scan to central releases table (skip if skipSave)
      let releaseId = null;
      if (!skipSave && scanId && discogsResult?.discogsId) {
        try {
          console.log('🔗 Linking to releases table for Discogs ID:', discogsResult.discogsId);
          const { data: releaseData, error: releaseError } = await supabase.functions.invoke('find-or-create-release', {
            body: {
              discogs_id: discogsResult.discogsId,
              artist: discogsResult.artist || combinedData.artist,
              title: discogsResult.title || combinedData.title,
              label: discogsResult.label || combinedData.label,
              catalog_number: discogsResult.catalogNumber || combinedData.catalogNumber,
              year: discogsResult.year || combinedData.year,
              format: mediaType === 'vinyl' ? 'Vinyl' : 'CD',
              genre: combinedData.genre,
              country: combinedData.country,
              discogs_url: discogsResult.discogsUrl,
            }
          });

          if (releaseError) {
            console.log('⚠️ Release linking function error:', releaseError);
          } else if (releaseData?.release_id) {
            releaseId = releaseData.release_id;
            await supabase.from('ai_scan_results')
              .update({ release_id: releaseId })
              .eq('id', scanId);
            console.log('✅ Linked to release:', releaseId);
          }
        } catch (error) {
          console.log('⚠️ Release linking failed (non-blocking):', error.message);
        }
      }

      // ─── Auto-verify & enrich release ──────────────────────────
      let verificationResult = null;
      if (discogsResult?.discogsId) {
        try {
          console.log(`🔐 Auto-verifying release ${discogsResult.discogsId}...`);
          const verifyRes = await fetch(`${supabaseUrl}/functions/v1/verify-and-enrich-release`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${supabaseServiceKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              discogs_id: discogsResult.discogsId,
              release_id: releaseId,
              scan_data: {
                barcode: combinedData.barcode || null,
                catno: combinedData.catalogNumber || null,
                matrix: combinedData.matrixNumber || null,
              },
            }),
          });
          if (verifyRes.ok) {
            verificationResult = await verifyRes.json();
            console.log(`✅ Enrichment: ${verificationResult.verification?.status} (${verificationResult.verification?.score} confirmations)`);
          } else {
            console.log(`⚠️ Enrichment failed: ${verifyRes.status}`);
          }
        } catch (enrichErr) {
          console.log(`⚠️ Enrichment error (non-fatal):`, enrichErr.message);
        }
      }

      let pricingStats = null;
      if (discogsResult?.discogsId) {
        try {
          console.log('💰 Starting pricing fetch for Discogs ID:', discogsResult.discogsId);
          pricingStats = await fetchDiscogsPricing(discogsResult.discogsId);

          if (pricingStats) {
            console.log('✅ Pricing data fetched:', pricingStats);
          } else {
            console.log('ℹ️ No pricing data available for this release');
          }
        } catch (error) {
          console.log('❌ Pricing fetch failed but scan succeeded:', error);
        }
      }

      // Build missing fields for photo guidance
      const missingFields: string[] = [];
      if (!combinedData.matrixNumber) missingFields.push('matrix');
      if (!combinedData.sidCodeMastering && !combinedData.sidCodeMould) missingFields.push('ifpi');
      if (!combinedData.barcode) missingFields.push('barcode');
      if (!combinedData.catalogNumber) missingFields.push('catno');

      // Build photo guidance
      const photoGuidance = missingFields.map((field: string) => {
        switch (field) {
          case 'matrix': return { field: 'matrix', instruction: 'Fotografeer de spiegelband van de CD (rond het centergat) onder een hoek van 30-45°, met macro, donkere achtergrond. Draai de CD om het licht te vangen.' };
          case 'ifpi': return { field: 'ifpi', instruction: 'Zoom in op de binnenste ring bij het centergat. Gebruik zijlicht om de kleine IFPI codes zichtbaar te maken.' };
          case 'barcode': return { field: 'barcode', instruction: 'Fotografeer de achterkant van de hoes met de barcode duidelijk in beeld.' };
          case 'catno': return { field: 'catno', instruction: 'Zoek het catalogusnummer op de rug of achterkant (bijv. "CDPCSD 167").' };
          default: return null;
        }
      }).filter(Boolean);

      // Determine match status for UI
      const hasMatrixOrIFPI = !!(combinedData.matrixNumber || combinedData.sidCodeMastering || combinedData.sidCodeMould);
      let matchStatus = 'single_match';
      if (!discogsResult.discogsId) {
        matchStatus = missingFields.length >= 2 ? 'needs_more_photos' : 'no_match';
      } else if (!hasMatrixOrIFPI && discogsResult.confidence < 0.85) {
        matchStatus = 'multiple_candidates';
      }

      return new Response(
        JSON.stringify({
          success: true,
          scanId,
          version: 'v2',
          result: {
            discogs_id: discogsResult.discogsId,
            discogs_url: discogsResult.discogsUrl,
            artist: discogsResult.artist,
            title: discogsResult.title,
            label: discogsResult.label,
            catalog_number: discogsResult.catalogNumber,
            year: discogsResult.year,
            confidence_score: discogsResult.confidence,
            ai_description: combinedData.description,
            image_quality: combinedData.imageQuality,
            extracted_details: combinedData.extractedDetails,
            extracted_text: combinedData.extractedText || [],
            // Technical identifiers from OCR
            matrix_number: combinedData.matrixNumber || null,
            sid_code_mastering: combinedData.sidCodeMastering || null,
            sid_code_mould: combinedData.sidCodeMould || null,
            label_code: combinedData.labelCode || null,
            barcode: combinedData.barcode || null,
            genre: combinedData.genre || null,
            country: combinedData.country || null,
            format: combinedData.format || null,
            // Vinyl-specific extras
            stamper_codes: combinedData.stamperCodes || null,
            pressing_plant: combinedData.pressingPlant || null,
            hand_etched: combinedData.handEtched || null,
            matrix_notes: combinedData.matrixNotes || null,
            // Structured text from photos
            copyright_lines: combinedData.copyrightLines || [],
            made_in_text: combinedData.madeInText || null,
            spine_text: combinedData.spineText || null,
            disc_label_text: combinedData.discLabelText || [],
            back_cover_text: combinedData.backCoverText || [],
            rights_societies: combinedData.rightsSocieties || [],
            production_credits: combinedData.productionCredits || [],
            manufacturing_info: combinedData.manufacturingInfo || [],
            // Pricing data from Discogs
            pricing_stats: pricingStats,
            // Collector-grade additions
            match_status: matchStatus,
            missing_fields: missingFields,
            photo_guidance: photoGuidance,
            collector_audit: collectorAudit,
            suggestions: discogsResult.suggestions || null,
            search_metadata: discogsResult.searchMetadata || null,
            verification: verificationResult?.verification || null,
            enrichment_action: verificationResult?.action || null
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } catch (error) {
      console.error('❌ Error during V2 analysis:', error)

      if (!skipSave && scanId) {
        await supabase
          .from('ai_scan_results')
          .update({
            status: 'failed',
            error_message: error.message,
            analysis_data: { version: 'v2', phase: 'error', error: error.message }
          })
          .eq('id', scanId)
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
          scanId,
          version: 'v2'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    console.error('❌ Request error:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'Authentication or request processing failed'
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// ─── LOCAL-FIRST LOOKUP: Search own database before Discogs API ──────
async function localFirstLookup(combinedData: any, audit: any[]): Promise<any | null> {
  try {
    const barcode = combinedData.barcode?.replace(/\D/g, '') || null;
    const catno = combinedData.catalogNumber?.trim() || null;
    const matrix = combinedData.matrixNumber?.trim() || null;

    if (!barcode && !catno && !matrix) {
      console.log('🏠 Local-first: No identifiers to search');
      return null;
    }

    // Strategy 1: Barcode search (highest priority)
    if (barcode && barcode.length >= 8) {
      console.log(`🏠 Local-first: Searching by barcode ${barcode}...`);
      const { data: barcodeHits } = await supabase
        .from('release_enrichments')
        .select('*')
        .contains('barcodes', [barcode])
        .limit(3);

      if (barcodeHits && barcodeHits.length > 0) {
        const best = barcodeHits[0];
        return { ...best, match_type: 'barcode' };
      }
    }

    // Strategy 2: Catalog number search
    if (catno) {
      console.log(`🏠 Local-first: Searching by catno ${catno}...`);
      // Search in labels jsonb array for matching catno
      const { data: catnoHits } = await supabase
        .from('release_enrichments')
        .select('*')
        .filter('labels', 'cs', JSON.stringify([{ catno }]))
        .limit(3);

      if (catnoHits && catnoHits.length > 0) {
        return { ...catnoHits[0], match_type: 'catno' };
      }

      // Fallback: search releases table directly
      const { data: releaseHits } = await supabase
        .from('releases')
        .select('id, discogs_id, artist, title, label, catalog_number, year, country')
        .ilike('catalog_number', catno)
        .not('discogs_id', 'is', null)
        .limit(3);

      if (releaseHits && releaseHits.length > 0) {
        const r = releaseHits[0];
        // Check if enrichment exists for this release
        const { data: enrichment } = await supabase
          .from('release_enrichments')
          .select('*')
          .eq('discogs_id', r.discogs_id)
          .maybeSingle();

        if (enrichment) {
          return { ...enrichment, match_type: 'catno_via_releases' };
        }
        // Return basic info
        return {
          discogs_id: r.discogs_id,
          artist: r.artist,
          title: r.title,
          year: r.year,
          country: r.country,
          labels: [{ name: r.label, catno: r.catalog_number }],
          verification_score: 1,
          match_type: 'catno_releases_only',
        };
      }
    }

    // Strategy 3: Matrix token search (lowest priority, most fuzzy)
    if (matrix && matrix.length >= 4) {
      console.log(`🏠 Local-first: Searching by matrix tokens...`);
      const tokens = matrix.toUpperCase().split(/[\s\-\/]+/).filter((t: string) => t.length >= 3);
      
      if (tokens.length > 0) {
        // Search matrix_variants jsonb for token overlap
        const { data: matrixHits } = await supabase
          .from('release_enrichments')
          .select('*')
          .not('matrix_variants', 'is', null)
          .limit(50);

        if (matrixHits) {
          for (const hit of matrixHits) {
            const variants = hit.matrix_variants || [];
            for (const variant of variants) {
              const variantValue = (variant.value || '').toUpperCase();
              const matchedTokens = tokens.filter((t: string) => variantValue.includes(t));
              if (matchedTokens.length >= 2 || (matchedTokens.length >= 1 && tokens.length === 1)) {
                return { ...hit, match_type: 'matrix' };
              }
            }
          }
        }
      }
    }

    console.log('🏠 Local-first: No match found in own database');
    return null;
  } catch (err) {
    console.log('⚠️ Local-first lookup error (non-fatal):', err.message);
    return null;
  }
}

function toSupabaseRenderImageUrl(url: string, width = 1600, quality = 70): string {
  // Convert Supabase public object URLs into resized render URLs to avoid huge image downloads/timeouts.
  // Example:
  // /storage/v1/object/public/<bucket>/<path>
  // -> /storage/v1/render/image/public/<bucket>/<path>?width=1600&quality=70
  if (!url.includes('/storage/v1/object/public/')) return url

  const renderUrl = url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/')
  const joinChar = renderUrl.includes('?') ? '&' : '?'
  return `${renderUrl}${joinChar}width=${width}&quality=${quality}`
}

async function toOpenAIImageUrl(
  url: string,
  opts?: { width?: number; quality?: number; maxBytes?: number }
): Promise<string> {
  const maxBytes = opts?.maxBytes ?? 2_500_000 // safety guard to avoid huge OpenAI payloads
  const quality = opts?.quality ?? 70

  // Try progressively smaller renders until the image fits.
  const preferredWidth = opts?.width ?? 1600
  const widths = [preferredWidth, 1400, 1200, 1000, 800, 640]
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .filter((v) => v > 0)

  let lastError: string | null = null

  for (const width of widths) {
    const candidateUrl = toSupabaseRenderImageUrl(url, width, quality)

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const res = await fetch(candidateUrl)
        if (!res.ok) throw new Error(`fetch failed: ${res.status}`)

        const contentType = res.headers.get('content-type') ?? 'image/jpeg'
        const bytes = new Uint8Array(await res.arrayBuffer())

        if (bytes.byteLength > maxBytes) {
          console.log('⚠️ Image too large, trying smaller resize:', {
            bytes: bytes.byteLength,
            maxBytes,
            width,
            candidateUrl: candidateUrl.slice(0, 160),
          })
          break // try next smaller width
        }

        return `data:${contentType};base64,${encodeBase64(bytes)}`
      } catch (e) {
        lastError = e?.message ?? String(e)
        console.log('⚠️ Failed to fetch/encode image for OpenAI:', {
          attempt,
          width,
          error: lastError,
          candidateUrl: candidateUrl.slice(0, 160),
        })
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, attempt * 250))
        }
      }
    }
  }

  throw new Error(`Failed to prepare image for OpenAI: ${lastError ?? 'unknown error'}`)
}

function parsePossiblyBrokenJson(raw: string): any {
  const s = (raw ?? '').trim()

  // 1) Normal strict JSON
  try {
    return JSON.parse(s)
  } catch {
    // continue
  }

  // 2) Extract first JSON object and sanitize common issues like unescaped newlines in strings
  const start = s.indexOf('{')
  const end = s.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    const candidate = s
      .slice(start, end + 1)
      .replace(/\r/g, ' ')
      .replace(/\n/g, ' ')
      .replace(/\t/g, ' ')

    return JSON.parse(candidate)
  }

  throw new Error('No JSON object found in model output')
}

async function analyzePhotosWithOpenAI(
  photoUrls: string[],
  mediaType: string,
  analysisType: 'general' | 'details' | 'matrix'
) {
  try {
    console.log(`🔍 Running ${analysisType} analysis with OpenAI Vision V2...`)

    // Keep payload small to avoid 400s due to oversized multimodal inputs
    const urlsForPass = (() => {
      if (analysisType === 'general') return photoUrls.slice(0, 4)
      if (analysisType === 'matrix') return photoUrls.slice(0, 3)
      return photoUrls
    })()

    // We embed resized images as data URLs for ALL passes.
    // This prevents OpenAI from timing out while downloading from Supabase Storage URLs.
    const openAiImageUrls = await Promise.all(
      urlsForPass.map((url) =>
        toOpenAIImageUrl(url, {
          width: analysisType === 'matrix' ? 1800 : 1400,
          quality: 70,
        })
      )
    )

    // Media-specific prompts with structured output
    const systemPrompt = getSystemPrompt(mediaType, analysisType)
    const userPrompt = getUserPrompt(mediaType, analysisType)

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Vision model for image analysis
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: userPrompt,
              },
              ...openAiImageUrls.map((url) => ({
                type: 'image_url',
                image_url: {
                  url,
                  detail: 'high', // Higher detail for better text recognition
                },
              })),
            ],
          },
        ],
        max_tokens: 2000,
        temperature: 0.1,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      console.error('❌ OpenAI API error details:', {
        status: response.status,
        analysisType,
        mediaType,
        urlsSent: openAiImageUrls.length,
        body: errText?.slice(0, 2000) || null,
      })
      if (response.status === 402) {
        await logCreditAlert('ai-photo-analysis-v2', 'credit_depleted')
      } else if (response.status === 429) {
        await logCreditAlert('ai-photo-analysis-v2', 'rate_limit')
      }
      throw new Error(`OpenAI API error: ${response.status}${errText ? ` - ${errText}` : ''}`)
    }

    const data = await response.json()
    const analysis = data.choices?.[0]?.message?.content

    if (!analysis || typeof analysis !== 'string') {
      console.error('❌ OpenAI returned empty/invalid content:', data)
      throw new Error('OpenAI returned empty response')
    }

    console.log(`🤖 OpenAI ${analysisType} analysis V2:`, analysis)

    const finishReason = data.choices?.[0]?.finish_reason
    if (finishReason === 'length') {
      console.error('❌ OpenAI response truncated (finish_reason=length)', { analysisType, mediaType })
      throw new Error('OpenAI response was truncated (length).')
    }

    // Parse JSON response (defensive: the model sometimes returns JSON with unescaped newlines)
    let parsedAnalysis
    try {
      parsedAnalysis = parsePossiblyBrokenJson(analysis)
    } catch (parseError) {
      console.error('❌ Failed to parse JSON response:', {
        parseError,
        analysisPreview: analysis.slice(0, 800),
      })
      throw new Error('Invalid JSON response from OpenAI')
    }

    return {
      success: true,
      data: parsedAnalysis,
    }
  } catch (error) {
    console.error(`❌ OpenAI ${analysisType} analysis error:`, error)
    return {
      success: false,
      error: `AI ${analysisType} analysis failed: ${error.message}`,
    }
  }
}

function getSystemPrompt(mediaType: string, analysisType: 'general' | 'details' | 'matrix'): string {
  const basePrompt = `You are an expert music release identification specialist with deep knowledge of ${mediaType === 'vinyl' ? 'vinyl records, LPs, and vinyl production' : 'CDs and optical disc production'}. `

  if (analysisType === 'general') {
    return basePrompt + `Your task is to identify the release AND extract ALL readable text from the provided images.

RULES:
1. ONLY report text you can LITERALLY READ in the images.
2. If you cannot clearly read a code → return null. NEVER guess codes from memory.
3. You MAY identify artist/title from artwork recognition, but ALL codes/numbers MUST come from OCR.

READ EVERYTHING — specifically look for:
- **Artist & Title**: From front cover artwork/text
- **Label**: Read the label NAME printed on the disc, spine, or back. Also identify label LOGOS (e.g., CBS eye logo, Columbia, EMI).
- **Catalog Number**: Look on the SPINE (rug), back cover, and disc label. Format examples: "35DP-93", "CDPCSD 167", "468 884-2". It is NOT a barcode.
- **Year**: Read copyright lines: "© 1983", "℗ 1983", "(P) 1983", "(C) 1983". Also read "Originally released: 1983". Report the OLDEST year if multiple are shown.
- **Country**: Read "Made in Japan", "Made in Holland", "Printed in Germany", "Made in Austria", "Manufactured in the USA", etc.
- **Barcode**: Read the EAN/UPC digits printed below the barcode bars on the back cover. Must be 12-13 digits.
- **Genre**: Read genre text if printed, or identify from context.
- **Format**: CD, LP, 12", 7", Cassette, etc.

ALSO CAPTURE:
- **allReadableText**: List ALL distinct text strings you can read from ALL photos. Every line of text, every code, every name. This is critical.
- **copyrightLines**: List all copyright/publishing lines verbatim (e.g., "℗ 1983 CBS Inc.", "© 1983 CBS Records")
- **madeInText**: The exact "Made in..." or "Printed in..." text if present
- **spineText**: All text visible on the spine/rug of the case
- **discLabelText**: All text printed on the disc label (NOT engraved in ring)
- **backCoverText**: Key text from the back cover (track titles, credits, codes)
- **rightsSocieties**: Rights societies/collecting organizations visible (e.g., "BUMA/STEMRA", "GEMA", "JASRAC", "ASCAP", "BMI", "SACEM", "SABAM")
- **productionCredits**: Producer, engineer, studio names visible (e.g., "Produced by Mark Knopfler", "Recorded at Power Station")
- **manufacturingInfo**: Manufacturing/pressing info (e.g., "Manufactured by CBS/Sony", "DADC Austria")

RESPOND ONLY IN VALID JSON FORMAT:
{
  "artist": "artist name or null",
  "title": "album/release title or null",
  "label": "record label name or null",
  "catalogNumber": "catalog number ONLY if clearly readable, otherwise null",
  "year": number ONLY if clearly printed/visible (from copyright lines preferred), otherwise null,
  "yearSource": "exact text where year was found, e.g. '℗ 1983 CBS Inc.' or null",
  "genre": "genre or null",
  "format": "format details or null",
  "country": "country from 'Made in...' text, or null",
  "confidence": number between 0-1,
  "description": "detailed analysis",
  "searchQueries": ["array", "of", "search", "terms"],
  "imageQuality": "excellent|good|fair|poor",
  "allReadableText": ["every", "distinct", "readable", "text", "from", "all", "photos"],
  "copyrightLines": ["℗ 1983 CBS Inc.", "© 1983 CBS Records"],
  "madeInText": "Made in Japan" or null,
  "spineText": "text from spine" or null,
  "discLabelText": ["text", "from", "disc", "label"],
  "backCoverText": ["text", "from", "back", "cover"],
  "rightsSocieties": ["BUMA/STEMRA", "GEMA"] or [],
  "productionCredits": ["Produced by...", "Recorded at..."] or [],
  "manufacturingInfo": ["CBS/Sony Inc.", "DADC"] or []
}

A null code field is better than a wrong one. But DO extract everything you CAN read.`
  }

  if (analysisType === 'matrix') {
    if (mediaType === 'cd') {
      return basePrompt + `You are performing a dedicated OCR pass for CD INNER RING identifiers.
The image may have been preprocessed to enhance text visibility.

CRITICAL RULES:
- Only output what you can actually SEE in the inner ring.
- DO NOT invent missing characters. If unclear, use "?" in-place.
- Do NOT copy example values.
- Keep spaces, hyphens, stars, dots, and symbols exactly as seen.
- Look for high-contrast edges where text has been enhanced.

For CDs, carefully distinguish between these DIFFERENT identifiers:

**MATRIX NUMBER** (CRITICAL - located in INNER RING of disc):
- Text ENGRAVED/ETCHED in the transparent inner ring near the center hole
- Often appears in multiple segments around the ring (top/bottom)
- Return BOTH top-arc and bottom-arc readings when possible
- The preprocessing enhances engraved text - look for edge-highlighted characters

**SID CODES**:
- IFPI Mastering SID: starts with "IFPI L" (e.g., "IFPI L123")
- IFPI Mould SID: starts with "IFPI" + 4 chars NOT starting with L (e.g., "IFPI 0123")

**LABEL CODE**:
- "LC" followed by 4-5 digits (e.g., "LC 0309")

RESPOND ONLY IN VALID JSON FORMAT with this exact structure:
{
  "matrixNumberFull": "best full continuous reading (use ? for unclear) or null",
  "matrixNumberTopArc": "top arc reading or null",
  "matrixNumberBottomArc": "bottom arc reading or null",
  "sidCodeMastering": "IFPI L... code or null",
  "sidCodeMould": "IFPI ... code (not starting with L) or null",
  "labelCode": "LC xxxx code or null",
  "confidence": number between 0-1,
  "notes": "brief notes about readability / uncertain parts"
}

Prioritize inner-ring text over printed tracklist text.`
    } else {
      // Vinyl matrix pass
      return basePrompt + `You are performing a dedicated OCR pass for VINYL DEAD WAX / RUNOUT GROOVE identifiers.
The image may have been preprocessed to enhance embossed/etched text visibility.

CRITICAL RULES:
- Only output what you can actually SEE in the dead wax area (between the label and grooves).
- DO NOT invent missing characters. If unclear, use "?" in-place.
- Do NOT copy example values.
- Keep spaces, hyphens, stars, dots, and symbols exactly as seen.
- Look for edge-enhanced relief text where embossed characters have been highlighted.

For VINYL, carefully look for these identifiers in the RUNOUT GROOVE / DEAD WAX area:

**MATRIX NUMBER** (CRITICAL - etched/stamped in runout groove):
- Text ETCHED, STAMPED, or HAND-WRITTEN in the blank area near the label
- May include letters, numbers, and symbols
- Often appears on Side A and Side B separately
- Look for both machine-stamped and hand-etched text

**STAMPER CODES**:
- Often single letters (A, B, AA, AB, etc.) indicating stamper used
- May be in different locations around the runout

**PRESSING PLANT CODES**:
- Often include abbreviations like "PRC", "STERLING", "RL", "SS", etc.

**CATALOG VARIATIONS**:
- Suffixes like -1, -A, -B indicating pressing variations

RESPOND ONLY IN VALID JSON FORMAT with this exact structure:
{
  "matrixNumberFull": "full matrix number reading (use ? for unclear) or null",
  "matrixNumberSideA": "Side A matrix if visible or null",
  "matrixNumberSideB": "Side B matrix if visible or null",
  "stamperCodes": "stamper letter codes or null",
  "pressingPlant": "pressing plant indicators or null",
  "handEtched": "any hand-written/etched text or null",
  "confidence": number between 0-1,
  "notes": "brief notes about readability / uncertain parts"
}

Focus on the dead wax area between the label and the first groove.`
    }
  }

  // details
  return basePrompt + `Your task is to extract detailed technical information and small text details.

ABSOLUTE RULES — VIOLATION = FAILURE:
1. ONLY report codes/numbers you can LITERALLY READ in the images.
2. If a code is partially visible or unclear, use "?" for unclear characters or return null.
3. NEVER fabricate IFPI codes, label codes, barcodes, or matrix numbers. If you cannot read them → null.
4. Round placeholder-looking values like "IFPI L123", "IFPI 1234", "LC 01234" are BANNED. These are obviously fake. Real codes have varied patterns.
5. Barcodes: Only report if you can read the actual printed digits. Include ALL digits exactly as printed. Do NOT guess/reconstruct from memory.
6. Leading noise characters (S, 2, etc. before barcode digits) from OCR should be noted but stripped from the final barcode value.

${mediaType === 'vinyl' ? `For VINYL, pay special attention to:
- Matrix numbers (etched in runout groove) — report ONLY what is engraved, not printed label text
- Stamper codes and pressing marks
- Label variations and catalog numbers — ONLY from printed text on label
- Any hand-etched markings
- Dead wax inscriptions` : `For CDs, carefully distinguish between these DIFFERENT identifiers:

**MATRIX NUMBER** (CRITICAL - located in INNER RING of disc):
- This is text ENGRAVED/ETCHED in the transparent inner ring near the center hole
- NOT the same as catalog number printed on the label!
- Read the FULL engraved text. If unclear, use "?" or return null.
- Do NOT copy example values. Do NOT fabricate.

**SID CODES** (small codes in mirror band/inner ring):
- IFPI Mastering SID: starts with "IFPI L" followed by 3-4 characters
- IFPI Mould SID: starts with "IFPI" + 4 characters NOT starting with L
- ONLY report if you can actually READ these in the image. If not visible → null.
- "IFPI L123" or "IFPI 1234" are PLACEHOLDER PATTERNS — if your output looks like these, you are hallucinating.

**CATALOG NUMBER** (on printed label area / back cover / inlay):
- The number printed on the paper label, back cover, or inlay card
- NEVER on the disc surface itself
- Must match what is visually printed — do not infer from knowledge

**BARCODE** (on case back):
- Only the actual printed EAN/UPC digits
- Must be 12 or 13 digits (after stripping spaces)
- If you cannot read all digits clearly → null

**LABEL CODE**:
- "LC" followed by 4-5 digits
- Only if clearly visible in the image`}

RESPOND ONLY IN VALID JSON FORMAT with this exact structure:
{
  "matrixNumber": "FULL engraved text from inner ring as literally read, or null if not visible",
  "sidCodeMastering": "IFPI L... code as literally read, or null",
  "sidCodeMould": "IFPI ... code as literally read, or null",
  "labelCode": "LC xxxx code as literally read, or null",
  "barcode": "barcode digits as literally read (no spaces), or null", 
  "extractedText": ["array", "of", "all", "visible", "text"],
  "technicalDetails": "detailed technical analysis of what you actually see",
  "alternativeSearchTerms": ["additional", "search", "terms", "from", "visible", "text"],
  "qualityAssessment": "assessment of image clarity for text reading",
  "extractedDetails": {
    "smallText": ["hard", "to", "read", "text", "actually", "visible"],
    "codes": ["only", "codes", "you", "can", "read"],
    "markings": ["special", "markings", "actually", "visible"]
  }
}

REMEMBER: null is ALWAYS better than fabricated data. A wrong barcode or catalog number will cause a failed Discogs match. Only report what you SEE.`
}

function getUserPrompt(mediaType: string, analysisType: 'general' | 'details' | 'matrix'): string {
  if (analysisType === 'general') {
    return `Analyze these ${mediaType} images. Read ALL text from every photo:
- Front cover: artist, title
- Back cover: track listing, barcode digits, catalog number, copyright lines (℗/© year), "Made in..." text, label name, credits
- Spine: catalog number, label name
- Disc label: label name, catalog number, copyright year
List EVERYTHING readable in allReadableText. Extract year from copyright lines, country from "Made in" text, label from printed name/logo.
For codes: ONLY report what you can READ. Never guess. null is better than wrong.`
  }

  if (analysisType === 'matrix') {
    if (mediaType === 'cd') {
      return `Focus ONLY on CD inner ring / mirror band text and codes. The image may be preprocessed for enhanced contrast. Read the matrix number segment-by-segment around the ring (top arc + bottom arc if present). Use '?' for unclear characters. Do not guess missing parts.`
    } else {
      return `Focus ONLY on vinyl dead wax / runout groove area between the label and grooves. The image may be preprocessed to enhance embossed text. Look for etched, stamped, or hand-written matrix numbers. Include stamper codes and pressing plant indicators. Use '?' for unclear characters.`
    }
  }

  return `Examine these ${mediaType} images for detailed technical information. Look for small text, codes, matrix numbers, barcodes, and any markings.
CRITICAL RULES:
- ONLY report codes you can LITERALLY READ in the images. 
- If a barcode, IFPI code, label code, or catalog number is not clearly visible → return null.
- NEVER output placeholder-looking values like "IFPI L123", "IFPI 1234", "LC 01234" — these are obvious hallucinations.
- A wrong code is FAR WORSE than a missing code. When in doubt → null.
- For barcodes: strip any leading non-digit noise characters (like "S") but report the raw reading in notes.`
}

function mergeAnalysisResults(generalData: any, detailData: any, matrixData?: any) {
  // Handle both CD and vinyl matrix data structures
  const matrixFromMatrixPass = (() => {
    if (!matrixData) return null;
    
    // CD format: matrixNumberFull, matrixNumberTopArc, matrixNumberBottomArc
    if (matrixData.matrixNumberFull) return matrixData.matrixNumberFull;
    if (matrixData.matrixNumberTopArc || matrixData.matrixNumberBottomArc) {
      return [matrixData.matrixNumberTopArc, matrixData.matrixNumberBottomArc]
        .filter(Boolean)
        .join(' | ');
    }
    
    // Vinyl format: matrixNumberFull, matrixNumberSideA, matrixNumberSideB
    if (matrixData.matrixNumberSideA || matrixData.matrixNumberSideB) {
      const parts = [];
      if (matrixData.matrixNumberSideA) parts.push(`A: ${matrixData.matrixNumberSideA}`);
      if (matrixData.matrixNumberSideB) parts.push(`B: ${matrixData.matrixNumberSideB}`);
      return parts.join(' / ');
    }
    
    return null;
  })();

  // Extract vinyl-specific data
  const vinylExtras = matrixData ? {
    stamperCodes: matrixData.stamperCodes ?? null,
    pressingPlant: matrixData.pressingPlant ?? null,
    handEtched: matrixData.handEtched ?? null,
  } : {};
  // 🔧 FIX: Sanitize string "null"/"undefined" from AI responses
  const sanitize = (val: any): string | null => {
    if (val == null) return null;
    const s = String(val).trim();
    if (/^(null|undefined|none|n\/a)$/i.test(s) || s === '') return null;
    return s;
  };

  return {
    // Primary fields from general analysis
    artist: sanitize(generalData?.artist),
    title: sanitize(generalData?.title),
    label: sanitize(generalData?.label),
    catalogNumber: sanitize(generalData?.catalogNumber),
    year: generalData?.year ?? null,
    yearSource: sanitize(generalData?.yearSource),
    genre: sanitize(generalData?.genre),
    format: sanitize(generalData?.format),
    country: sanitize(generalData?.country),

    // Technical details (prefer dedicated matrix pass)
    matrixNumber: matrixFromMatrixPass || detailData?.matrixNumber || null,
    sidCodeMastering: matrixData?.sidCodeMastering ?? detailData?.sidCodeMastering ?? null,
    sidCodeMould: matrixData?.sidCodeMould ?? detailData?.sidCodeMould ?? null,
    labelCode: matrixData?.labelCode ?? detailData?.labelCode ?? null,
    labelCodeSource: matrixData?.labelCode ? 'ocr' : (detailData?.labelCode ? 'ocr' : null),
    barcode: detailData?.barcode ?? null,
    
    // Vinyl-specific extras
    ...vinylExtras,

    // All readable text from general pass + detail pass
    extractedText: [
      ...(generalData?.allReadableText || generalData?.searchQueries || []),
      ...(detailData?.extractedText || [])
    ],
    
    // Structured text extractions from general pass
    copyrightLines: generalData?.copyrightLines || [],
    madeInText: sanitize(generalData?.madeInText),
    spineText: sanitize(generalData?.spineText),
    discLabelText: generalData?.discLabelText || [],
    backCoverText: generalData?.backCoverText || [],
    rightsSocieties: generalData?.rightsSocieties || [],
    productionCredits: generalData?.productionCredits || [],
    manufacturingInfo: generalData?.manufacturingInfo || [],

    // Combined metadata
    confidence: Math.max(generalData?.confidence || 0, 0.1),
    description: generalData?.description ?? null,
    imageQuality: generalData?.imageQuality || 'fair',
    extractedDetails: detailData?.extractedDetails,
    
    // Matrix pass notes for debugging
    matrixNotes: matrixData?.notes ?? null,

    // Enhanced search queries
    searchQueries: [
      ...(generalData?.searchQueries || []),
      ...(detailData?.alternativeSearchTerms || [])
    ].filter((query, index, array) => array.indexOf(query) === index)
  }
}

// Fetch pricing data for a Discogs release
async function fetchDiscogsPricing(discogsId: number): Promise<{
  lowest_price: number | null;
  median_price: number | null;
  highest_price: number | null;
  num_for_sale: number;
  currency: string;
  blocked?: boolean;
  blocked_reason?: string;
} | null> {
  try {
    console.log(`💰 Fetching pricing for Discogs ID: ${discogsId}`);
    
    const scraperApiKey = Deno.env.get('SCRAPERAPI_KEY');
    const discogsToken = Deno.env.get('DISCOGS_TOKEN');
    
    // Try scraping first if ScraperAPI is available
    if (scraperApiKey) {
      const releasePageUrl = `https://www.discogs.com/release/${discogsId}?curr=EUR`;
      const scraperUrl = `https://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(releasePageUrl)}&render=false&keep_headers=true`;
      
      console.log(`🌐 Scraping pricing from release page: ${releasePageUrl}`);
      
      try {
        const response = await fetch(scraperUrl, {
          headers: {
            'Accept-Language': 'nl-NL,nl;q=0.9,en;q=0.8',
            'Cookie': 'currency=EUR',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (response.ok) {
          const html = await response.text();
          console.log(`📄 Retrieved HTML, length: ${html.length}`);
          
          // Check if release is blocked from sale
          const blockedPatterns = [
            /blocked from sale/i,
            /not permitted to sell/i,
            /This release is blocked/i,
            /not available for sale/i,
            /sale.*?prohibited/i,
          ];
          
          for (const pattern of blockedPatterns) {
            if (pattern.test(html)) {
              console.log('🚫 Release is blocked from sale on Discogs');
              return {
                lowest_price: null,
                median_price: null,
                highest_price: null,
                num_for_sale: 0,
                currency: 'EUR',
                blocked: true,
                blocked_reason: 'Deze release is geblokkeerd voor verkoop op Discogs. Het is niet toegestaan dit item te verkopen op de Discogs Marketplace.'
              };
            }
          }
          
          // Extract pricing exclusively from Statistics section
          const { extractStatisticsPricing } = await import('../_shared/extract-statistics-pricing.ts');
          const statisticsPricing = extractStatisticsPricing(html);
          
          if (statisticsPricing && (statisticsPricing.lowest_price || statisticsPricing.median_price || statisticsPricing.highest_price)) {
            // Extract num_for_sale separately
            let numForSale = 0;
            for (const pattern of [/(\d+)\s+for sale/i, /(\d+)\s+items?\s+for sale/i, /(\d+)\s+available/i]) {
              const match = html.match(pattern);
              if (match?.[1]) { numForSale = parseInt(match[1]); break; }
            }
            
            console.log(`✅ Statistics pricing (EUR): lowest=${statisticsPricing.lowest_price}, median=${statisticsPricing.median_price}, highest=${statisticsPricing.highest_price}, for_sale=${numForSale}`);
            return {
              lowest_price: statisticsPricing.lowest_price,
              median_price: statisticsPricing.median_price,
              highest_price: statisticsPricing.highest_price,
              num_for_sale: numForSale,
              currency: 'EUR'
            };
          }
          
          console.log('⚠️ No Statistics pricing found in scraped HTML');
        }
      } catch (scrapeError) {
        console.error('❌ Scraping failed:', scrapeError);
      }
    }
    
    // Fallback: Use Discogs API with curr=EUR for exact EUR prices
    if (discogsToken) {
      console.log('🔄 Falling back to Discogs API (EUR) for pricing...');
      const userAgent = 'MusicScan/1.0 +https://musicscan.app';
      
      // Try marketplace/stats endpoint first (gives exact EUR prices)
      try {
        const statsUrl = `https://api.discogs.com/marketplace/stats/${discogsId}?curr=EUR`;
        const statsResponse = await fetch(statsUrl, {
          headers: { 'Authorization': `Discogs token=${discogsToken}`, 'User-Agent': userAgent }
        });
        
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          if (statsData.lowest_price?.value) {
            console.log(`✅ Marketplace stats (EUR): lowest=${statsData.lowest_price.value}, num_for_sale=${statsData.num_for_sale}`);
            return {
              lowest_price: statsData.lowest_price.value,
              median_price: null,
              highest_price: null,
              num_for_sale: statsData.num_for_sale || 0,
              currency: 'EUR'
            };
          }
        }
      } catch (e) {
        console.log('⚠️ Marketplace stats failed, trying release endpoint...');
      }
      
      // Fallback to release endpoint with curr=EUR
      const apiUrl = `https://api.discogs.com/releases/${discogsId}?curr=EUR`;
      const apiResponse = await fetch(apiUrl, {
        headers: { 'Authorization': `Discogs token=${discogsToken}`, 'User-Agent': userAgent }
      });
      
      if (apiResponse.ok) {
        const releaseData = await apiResponse.json();
        if (releaseData.lowest_price) {
          console.log(`✅ API pricing (EUR): lowest_price=${releaseData.lowest_price}, num_for_sale=${releaseData.num_for_sale}`);
          return {
            lowest_price: releaseData.lowest_price,
            median_price: null,
            highest_price: null,
            num_for_sale: releaseData.num_for_sale || 0,
            currency: 'EUR'
          };
        }
      }
    }
    
    console.log('⚠️ No pricing data available');
    return null;
  } catch (error) {
    console.error('❌ Pricing fetch error:', error);
    return null;
  }
}

/**
 * MATRIX NORMALIZATION PATCH (CRITICAL)
 * 
 * Before any Discogs matching:
 * 1. Split matrix_raw into tokens by whitespace.
 * 2. Remove leading tokens that:
 *    - have length < 3, OR
 *    - are purely numeric, OR
 *    - do not contain both letters and numbers.
 * 3. Rejoin remaining tokens as matrix_canonical.
 * 4. Use matrix_canonical for all matching and scoring.
 * 5. Matrix match is TRUE if all canonical tokens exist in the Discogs candidate matrix (subset match).
 * 
 * Example:
 * Input: "S 2 SUMCD 4164 01"
 * Canonical: "SUMCD 4164 01"
 */
function normalizeMatrixRaw(matrixRaw: string): { canonical: string; tokens: string[]; raw: string; isValid: boolean; invalidReason?: string } {
  if (!matrixRaw) {
    return { canonical: '', tokens: [], raw: '', isValid: false, invalidReason: 'empty' };
  }
  
  const rawNorm = matrixRaw.toUpperCase().replace(/\s+/g, ' ').trim();
  const tokens = rawNorm.split(' ').filter(Boolean);
  
  // === PATCH A: MATRIX SANITY GUARD ===
  // Check if this looks like a barcode instead of a matrix
  const allDigits = rawNorm.replace(/[^0-9]/g, '');
  const hasSignificantAlphaTokens = tokens.some(t => {
    const hasLetters = /[A-Z]/.test(t);
    const hasNumbers = /[0-9]/.test(t);
    // A significant token has BOTH letters and numbers (like "SUMCD4164")
    // OR is a known catno-like pattern (letters only, 3+ chars)
    return (hasLetters && hasNumbers && t.length >= 4) || 
           (hasLetters && !hasNumbers && t.length >= 3);
  });
  
  // Rule 1: If 12+ consecutive digits and no significant alpha tokens → barcode leak
  if (allDigits.length >= 12 && !hasSignificantAlphaTokens) {
    console.log(`   ⛔ MATRIX SANITY GUARD: Detected barcode-like pattern`);
    console.log(`      Digits: ${allDigits} (${allDigits.length} digits)`);
    console.log(`      No significant alphanumeric tokens found`);
    return { 
      canonical: '', 
      tokens: [], 
      raw: rawNorm, 
      isValid: false, 
      invalidReason: 'barcode_pattern_detected' 
    };
  }
  
  // Rule 2: If it's purely an EAN-13 pattern (exactly 13 digits, no meaningful letters)
  if (allDigits.length === 13 && !hasSignificantAlphaTokens) {
    console.log(`   ⛔ MATRIX SANITY GUARD: Detected EAN-13 pattern`);
    return { 
      canonical: '', 
      tokens: [], 
      raw: rawNorm, 
      isValid: false, 
      invalidReason: 'ean13_pattern_detected' 
    };
  }
  
  // === LEADING NOISE REMOVAL ===
  // Find the first token that looks like a real matrix identifier
  let startIndex = 0;
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    
    // Skip tokens shorter than 3 characters
    if (token.length < 3) {
      startIndex = i + 1;
      continue;
    }
    
    // Check if token has alphanumeric structure (letters AND numbers)
    const hasLetters = /[A-Z]/.test(token);
    const hasNumbers = /[0-9]/.test(token);
    
    // If token has both letters and numbers, this is likely the start of the real matrix
    if (hasLetters && hasNumbers) {
      startIndex = i;
      break;
    }
    
    // If token is ONLY letters (single char like "S") or ONLY numbers ("2"), skip it as noise
    if ((hasLetters && !hasNumbers && token.length < 3) || (!hasLetters && hasNumbers && token.length < 3)) {
      startIndex = i + 1;
      continue;
    }
    
    // If we hit a token that looks like a real identifier (e.g., pure catno), start here
    if (hasLetters || (hasNumbers && token.length >= 3)) {
      startIndex = i;
      break;
    }
  }
  
  const canonicalTokens = tokens.slice(startIndex);
  const canonical = canonicalTokens.join(' ');
  
  // Final sanity check on canonical form
  const canonicalDigits = canonical.replace(/[^0-9]/g, '');
  const canonicalHasAlpha = /[A-Z]/.test(canonical);
  
  // If after cleanup we still have 10+ digits without meaningful letters, it's suspicious
  if (canonicalDigits.length >= 10 && !canonicalHasAlpha) {
    console.log(`   ⛔ MATRIX SANITY GUARD: Canonical still looks like barcode`);
    return { 
      canonical: '', 
      tokens: [], 
      raw: rawNorm, 
      isValid: false, 
      invalidReason: 'canonical_barcode_like' 
    };
  }
  
  const isValid = canonical.length > 0;
  
  console.log(`   🔧 Matrix Normalization:`);
  console.log(`      Raw: "${rawNorm}"`);
  console.log(`      Canonical: "${canonical}"`);
  console.log(`      Tokens removed: ${startIndex} leading noise token(s)`);
  console.log(`      Valid: ${isValid ? '✅' : '❌'}`);
  
  return {
    canonical,
    tokens: canonicalTokens,
    raw: rawNorm,
    isValid
  };
}

/**
 * MusicScan Discogs Matching Protocol v4.0 (CANONICAL · NO FALSE NEGATIVES)
 * 
 * 🎯 KERNPRINCIPE: Barcode + catalog number define the release. Matrix refines, never blocks.
 * 
 * HIËRARCHIE (VERPLICHTE VOLGORDE):
 * 1. BARCODE (PRIMARY) - ❌ NOOIT format filter
 * 2. CATNO + LABEL (HIGH) - ❌ NOOIT format filter  
 * 3. ARTIST + TITLE (FALLBACK) - ⚠️ MAG NOOIT AUTO-SELECTEREN
 * 
 * SCORING (MAX 160):
 * - Matrix match (relaxed subset): +50
 * - Barcode exact: +40
 * - Catno exact: +25
 * - Label exact: +15
 * - Year exact: +10
 * - Country exact: +10
 * - IFPI codes present: +5
 * - Title similarity: +5
 * Total: 160 punten
 * 
 * LOCK CONDITIONS (NON-NEGOTIABLE):
 * - Matrix + Barcode
 * - Matrix + Catno
 * - Barcode + Catno ← REQUIRED (no matrix needed)
 * - Barcode + Label + Year
 * 
 * HARD GATING:
 * - Score < 70 → NO_MATCH
 * - Never require matrix match if barcode + catno match
 * - Fuzzy-only match bij aanwezige identifiers → manual_review_required
 */
async function searchDiscogsV2(analysisData: any, mediaType: 'vinyl' | 'cd' = 'cd') {
  try {
    const formatFilter = mediaType === 'vinyl' ? 'Vinyl' : 'CD';
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎯 MusicScan Protocol v4.0 - ${mediaType.toUpperCase()} MATCHING`);
    console.log(`${'='.repeat(60)}`);
    
    // === NORMALISATIE (ALTIJD UITVOEREN) ===
    const barcodeDigits = analysisData.barcode 
      ? analysisData.barcode.replace(/[^0-9]/g, '') 
      : null;
    let catnoNorm = analysisData.catalogNumber 
      ? analysisData.catalogNumber.toUpperCase().replace(/\s+/g, ' ').trim()
      : null;
    
    // 🔧 MATRIX NORMALIZATION: Remove leading noise tokens
    const matrixRaw = analysisData.matrixNumber || analysisData.matrixNumberFull || '';
    const matrixNormalized = normalizeMatrixRaw(matrixRaw);
    const matrixNorm = matrixNormalized.canonical;
    const matrixTokens = matrixNormalized.tokens;
    
    // === PATCH A: MATRIX VALIDITY CHECK ===
    const matrixValid = matrixNormalized.isValid;
    
    // 🔧 FIX 2: Matrix-als-catno fallback
    // Als catno ontbreekt maar matrix een catno-achtig patroon bevat (letters+cijfers, <12 chars),
    // gebruik het eerste token als catno-zoekopdracht
    if (!catnoNorm && matrixNorm && matrixValid) {
      const matrixFirstToken = matrixTokens[0] || matrixNorm.split(/\s+/)[0];
      const hasLetters = /[A-Z]/i.test(matrixFirstToken);
      const hasDigits = /\d/.test(matrixFirstToken);
      const totalLen = matrixFirstToken.replace(/[^A-Z0-9]/gi, '').length;
      if (hasLetters && hasDigits && totalLen >= 4 && totalLen <= 15) {
        catnoNorm = matrixFirstToken.toUpperCase().trim();
        console.log(`🔧 MATRIX→CATNO FALLBACK: Using "${catnoNorm}" from matrix as catno search`);
      }
    }
    
    console.log('📋 GENORMALISEERDE IDENTIFIERS:');
    console.log(`   barcode_digits: ${barcodeDigits || '(geen)'}`);
    console.log(`   catno_norm: ${catnoNorm || '(geen)'}`);
    console.log(`   matrix_norm: ${matrixNorm || '(geen)'}`);
    console.log(`   matrix_tokens: [${matrixTokens.join(', ')}]`);
    console.log(`   matrix_valid: ${matrixValid ? '✅' : `❌ (${matrixNormalized.invalidReason || 'unknown'})`}`);
    console.log(`   label: ${analysisData.label || '(geen)'}`);
    console.log(`   artist: ${analysisData.artist || '(geen)'}`);
    console.log(`   title: ${analysisData.title || '(geen)'}`);
    
    // Track of we technische identifiers hebben (alleen geldige matrix meetellen)
    const hasTechnicalIdentifiers = !!(barcodeDigits || catnoNorm || (matrixNorm && matrixValid));
    console.log(`\n⚡ Technische identifiers aanwezig: ${hasTechnicalIdentifiers ? 'JA' : 'NEE'}`);
    
    // Search metadata voor debugging en output
    const searchMetadata = {
      protocol_version: '4.0',
      strategies_executed: [] as any[],
      total_searches: 0,
      best_strategy: null as string | null,
      verification_level: null as string | null,
      lock_reason: null as string | null,
      matched_on: [] as string[],
      explain: [] as string[],
      technical_matches: {
        barcode: false,
        matrix: false,
        catno: false,
        label: false,
        year: false,
        country: false
      }
    };

    let bestMatch: any = null;
    let bestConfidencePoints = 0;
    let bestMatchDetails: any = null;
    
    // === STRATEGY 1: BARCODE (PRIMARY, HARD) ===
    // ❌ VERBODEN: format, country, year, fuzzy q
    // ✅ HTTP INTEGRITY: Bij non-200 → STOP met api_error
    let apiError: { status: number; message: string } | null = null;
    
    if (barcodeDigits) {
      console.log(`\n${'─'.repeat(50)}`);
      console.log(`🥇 STRATEGY 1: BARCODE SEARCH (PRIMARY)`);
      console.log(`   Query: barcode=${barcodeDigits}`);
      console.log(`   ❌ NO format filter (protocol requirement)`);
      
      const searchUrl = `https://api.discogs.com/database/search?barcode=${encodeURIComponent(barcodeDigits)}&type=release`;
      searchMetadata.total_searches++;
      
      try {
        const response = await fetch(searchUrl, {
          headers: {
            'User-Agent': 'MusicScan/1.0 +https://musicscan.app',
            'Authorization': `Discogs token=${Deno.env.get('DISCOGS_TOKEN')}`
          }
        });
        
        // HTTP INTEGRITY RULE: status ≠ 200 → STOP
        if (response.status !== 200) {
          console.log(`   🛑 API ERROR: HTTP ${response.status} - STOPPING`);
          apiError = { status: response.status, message: `Discogs API returned ${response.status}` };
        } else {
          const data = await response.json();
          // Parse results ONLY from json.results array
          const results = Array.isArray(data.results) ? data.results : [];
          console.log(`   📊 Results: ${results.length} candidates`);
          
          searchMetadata.strategies_executed.push({
            strategy: 1,
            type: 'barcode',
            query: barcodeDigits,
            results: results.length,
            format_filter: false
          });
          
          if (results.length > 0) {
            // Verify candidates
            for (const candidate of results.slice(0, 5)) {
              const verification = await verifyCandidate(candidate, analysisData, barcodeDigits, catnoNorm, matrixNorm, matrixTokens, matrixValid, true);
              
              if (verification.points > bestConfidencePoints) {
                bestConfidencePoints = verification.points;
                bestMatch = candidate;
                bestMatchDetails = verification;
                searchMetadata.matched_on = verification.matched_on;
                searchMetadata.technical_matches = verification.technical_matches;
                searchMetadata.explain = verification.explain;
              }
              
              // Check LOCK conditions
              if (verification.lock_reason) {
                searchMetadata.verification_level = 'LOCKED';
                searchMetadata.lock_reason = verification.lock_reason;
                console.log(`   🔒 ${verification.lock_reason}`);
                break;
              }
            }
            
            if (searchMetadata.verification_level === 'LOCKED') {
              console.log(`\n✅ LOCKED MATCH via barcode strategy`);
            }
          }
        }
      } catch (err) {
        console.log(`   🛑 FETCH ERROR: ${err.message} - STOPPING`);
        apiError = { status: 0, message: `Network error: ${err.message}` };
      }
    }
    
    // HTTP INTEGRITY: Stop processing if API error occurred
    if (apiError) {
      console.log(`\n🛑 API ERROR - Returning error status (no fallback, no fuzzy)`);
      return {
        status: 'api_error',
        reason: apiError.message,
        action: 'retry_with_backoff_or_manual_review',
        http_status: apiError.status,
        search_metadata: searchMetadata
      };
    }
    
    // === STRATEGY 2: CATNO + LABEL (HIGH) ===
    // ❌ VERBODEN: format filter
    // ✅ HTTP INTEGRITY: Bij non-200 → STOP met api_error
    if (!searchMetadata.verification_level && catnoNorm && !apiError) {
      console.log(`\n${'─'.repeat(50)}`);
      console.log(`🥈 STRATEGY 2: CATNO SEARCH (HIGH)`);
      console.log(`   Query: catno=${catnoNorm}${analysisData.label ? ` + label=${analysisData.label}` : ''}`);
      console.log(`   ❌ NO format filter (protocol requirement)`);
      
      let searchUrl = `https://api.discogs.com/database/search?catno=${encodeURIComponent(catnoNorm)}&type=release`;
      if (analysisData.label) {
        searchUrl += `&label=${encodeURIComponent(analysisData.label)}`;
      }
      searchMetadata.total_searches++;
      
      try {
        const response = await fetch(searchUrl, {
          headers: {
            'User-Agent': 'MusicScan/1.0 +https://musicscan.app',
            'Authorization': `Discogs token=${Deno.env.get('DISCOGS_TOKEN')}`
          }
        });
        
        // HTTP INTEGRITY RULE: status ≠ 200 → STOP
        if (response.status !== 200) {
          console.log(`   🛑 API ERROR: HTTP ${response.status} - STOPPING`);
          apiError = { status: response.status, message: `Discogs API returned ${response.status}` };
        } else {
          const data = await response.json();
          // Parse results ONLY from json.results array
          const results = Array.isArray(data.results) ? data.results : [];
          console.log(`   📊 Results: ${results.length} candidates`);
          
          searchMetadata.strategies_executed.push({
            strategy: 2,
            type: 'catno',
            query: catnoNorm,
            label: analysisData.label || null,
            results: results.length,
            format_filter: false
          });
          
          if (results.length > 0) {
            for (const candidate of results.slice(0, 5)) {
              const verification = await verifyCandidate(candidate, analysisData, barcodeDigits, catnoNorm, matrixNorm, matrixTokens, matrixValid);
              
              if (verification.points > bestConfidencePoints) {
                bestConfidencePoints = verification.points;
                bestMatch = candidate;
                bestMatchDetails = verification;
                searchMetadata.matched_on = verification.matched_on;
                searchMetadata.technical_matches = verification.technical_matches;
                searchMetadata.explain = verification.explain;
              }
              
              if (verification.lock_reason) {
                searchMetadata.verification_level = 'LOCKED';
                searchMetadata.lock_reason = verification.lock_reason;
                console.log(`   🔒 ${verification.lock_reason}`);
                break;
              }
            }
          }
        }
      } catch (err) {
        console.log(`   🛑 FETCH ERROR: ${err.message} - STOPPING`);
        apiError = { status: 0, message: `Network error: ${err.message}` };
      }
    }
    
    // HTTP INTEGRITY: Stop processing if API error occurred in Strategy 2
    if (apiError) {
      console.log(`\n🛑 API ERROR - Returning error status (no fallback, no fuzzy)`);
      return {
        status: 'api_error',
        reason: apiError.message,
        action: 'retry_with_backoff_or_manual_review',
        http_status: apiError.status,
        search_metadata: searchMetadata
      };
    }
    
    // === STRATEGY 3: ARTIST + TITLE (SUGGEST ONLY) ===
    // ⚠️ MAG NOOIT AUTOMATISCH SELECTEREN bij aanwezige technische identifiers
    // ✅ Wordt WEL uitgevoerd om suggesties te tonen bij no_match
    const needsFuzzySearch = !bestMatch && analysisData.artist && analysisData.title && !apiError;
    let suggestions: any[] = [];
    
    if (needsFuzzySearch) {
      console.log(`\n${'─'.repeat(50)}`);
      console.log(`🥉 STRATEGY 3: ARTIST + TITLE (SUGGEST ONLY)`);
      console.log(`   Query: ${analysisData.artist} - ${analysisData.title}`);
      console.log(`   ⚠️ Format filter: ${formatFilter} (alleen voor fuzzy)`);
      
      const searchUrl = `https://api.discogs.com/database/search?artist=${encodeURIComponent(analysisData.artist)}&release_title=${encodeURIComponent(analysisData.title)}&type=release&format=${encodeURIComponent(formatFilter)}`;
      searchMetadata.total_searches++;
      
      try {
        const response = await fetch(searchUrl, {
          headers: {
            'User-Agent': 'MusicScan/1.0 +https://musicscan.app',
            'Authorization': `Discogs token=${Deno.env.get('DISCOGS_TOKEN')}`
          }
        });
        
        if (response.status === 200) {
          const data = await response.json();
          const results = Array.isArray(data.results) ? data.results : [];
          console.log(`   📊 Results: ${results.length} candidates`);
          
          searchMetadata.strategies_executed.push({
            strategy: 3,
            type: 'artist_title',
            query: `${analysisData.artist} - ${analysisData.title}`,
            results: results.length,
            format_filter: formatFilter,
            auto_select_blocked: hasTechnicalIdentifiers
          });
          
          // Build suggestions with dedup and country gating
          const countryHint = (analysisData.country || '').toLowerCase();
          const isEUHint = /holland|netherlands|europe|eu|germany|france|uk|italy|spain|belgium|austria|sweden|denmark|portugal|greece|ireland|finland|norway|switzerland/i.test(countryHint);
          
          // Deduplicate by release_id
          const seenIds = new Set<number>();
          const rawSuggestions = results.slice(0, 15).map((r: any) => {
            if (seenIds.has(r.id)) return null;
            seenIds.add(r.id);
            return {
              id: r.id,
              release_id: r.id,
              title: r.title,
              catno: r.catno,
              label: r.label,
              year: r.year,
              country: r.country,
              thumb: r.thumb,
              score: 0,
              url: `https://www.discogs.com/release/${r.id}`
            };
          }).filter(Boolean);
          
          // Detect rights societies for suggestion sorting
          const sugRightsSocieties = [
            ...(analysisData.rightsSocieties || []),
            ...(analysisData.externalRightsSocieties || []),
          ];
          const sugAllTexts = [
            ...(analysisData.discLabelText || []),
            ...(analysisData.backCoverText || []),
          ].filter(Boolean);
          const sugDetectedSocieties = detectRightsSocieties(sugRightsSocieties, sugAllTexts);
          
          console.log(`   🏛️ Suggestion sorting: detected societies = [${sugDetectedSocieties.join(', ')}]`);
          
          // Sort: primary region first, then EU, then rest
          if (rawSuggestions.length > 1) {
            rawSuggestions.sort((a: any, b: any) => {
              const aCountry = (a.country || '').toLowerCase();
              const bCountry = (b.country || '').toLowerCase();
              
              // Check primary region match from detected rights societies
              let aIsPrimary = false, bIsPrimary = false;
              for (const society of sugDetectedSocieties) {
                const mapping = RIGHTS_SOCIETY_REGIONS[society];
                if (!mapping || !mapping.primary) continue;
                if (mapping.primary.some((p: string) => aCountry.includes(p))) aIsPrimary = true;
                if (mapping.primary.some((p: string) => bCountry.includes(p))) bIsPrimary = true;
              }
              if (aIsPrimary && !bIsPrimary) return -1;
              if (!aIsPrimary && bIsPrimary) return 1;
              
              // Fallback: EU vs non-EU
              if (isEUHint) {
                const euCountries = /europe|eu|netherlands|holland|germany|france|uk|united kingdom|italy|spain|belgium|austria|sweden|denmark|portugal|greece|ireland|finland|norway|switzerland/i;
                const aIsEU = euCountries.test(aCountry);
                const bIsEU = euCountries.test(bCountry);
                if (aIsEU && !bIsEU) return -1;
                if (!aIsEU && bIsEU) return 1;
              }
              return 0;
            });
          }
          
          suggestions = rawSuggestions.slice(0, 4);
          
          if (hasTechnicalIdentifiers) {
            console.log(`   ⚠️ HARD GATE: Technische identifiers aanwezig maar geen directe match`);
            console.log(`   🔍 Verifying strategy 3 candidates against identifiers...`);
            
            // Still verify candidates - track ALL with scores for disambiguation
            const scoredCandidates: Array<{candidate: any, verification: any, points: number}> = [];
            
            for (const candidate of results.slice(0, 10)) {
              const verification = await verifyCandidate(candidate, analysisData, barcodeDigits, catnoNorm, matrixNorm, matrixTokens, matrixValid);
              
              const hasLabel = verification.technical_matches?.label;
              const hasCatno = verification.technical_matches?.catno;
              const hasYear = verification.technical_matches?.year;
              const hasMatrix = verification.technical_matches?.matrix;
              
              console.log(`   📋 Candidate ${candidate.id}: ${candidate.title} | label=${hasLabel} catno=${hasCatno} year=${hasYear} matrix=${hasMatrix} points=${verification.points}`);
              
              if (verification.points >= 30) {
                scoredCandidates.push({ candidate, verification, points: verification.points });
              }
            }
            
            // Sort by points descending
            scoredCandidates.sort((a, b) => b.points - a.points);
            
            if (scoredCandidates.length > 0) {
              const topScore = scoredCandidates[0].points;
              const tiedCandidates = scoredCandidates.filter(c => c.points === topScore);
              
              if (tiedCandidates.length > 1) {
                // DISAMBIGUATION: Multiple candidates tied - use country, format, catno proximity
                console.log(`   🔍 DISAMBIGUATION: ${tiedCandidates.length} candidates tied at ${topScore} pts`);
                
                let bestTied = tiedCandidates[0];
                let bestDisambigScore = 0;
                
                for (const tied of tiedCandidates) {
                  let disambigScore = 0;
                  const rd = tied.verification.releaseDetails;
                  
                  // Country match bonus — with rights society primary region preference
                  if (rd?.country && analysisData.country) {
                    const euPattern = /europe|eu|netherlands|holland|germany|france|uk|united kingdom/i;
                    if (rd.country.toLowerCase().includes(analysisData.country.toLowerCase())) {
                      disambigScore += 10;
                      console.log(`      🌍 ${tied.candidate.id}: Country match "${rd.country}" → +10`);
                    } else if (euPattern.test(analysisData.country) && euPattern.test(rd.country)) {
                      disambigScore += 5;
                    }
                    // Rights society primary region tiebreaker
                    if (detectedSocieties && detectedSocieties.length > 0) {
                      const rdCountry = rd.country.toLowerCase();
                      for (const society of detectedSocieties) {
                        const mapping = RIGHTS_SOCIETY_REGIONS[society];
                        if (!mapping || mapping.primary.length === 0) continue;
                        const inPrimary = mapping.primary.some(r => rdCountry.includes(r) || r.includes(rdCountry));
                        if (inPrimary) {
                          disambigScore += 20;
                          console.log(`      🏠 ${tied.candidate.id}: In ${society} primary region "${rd.country}" → +20 disambig`);
                          break;
                        }
                      }
                    }
                  }
                  
                  // Format match bonus (CD vs Vinyl)
                  if (rd?.formats) {
                    const hasCD = rd.formats.some((f: any) => f.name === 'CD');
                    if (hasCD && mediaType === 'cd') {
                      disambigScore += 5;
                      console.log(`      💿 ${tied.candidate.id}: Format CD match → +5`);
                    }
                  }
                  
                  // Catno proximity bonus: check if matrix digits appear in the catno
                  if (rd?.labels && matrixTokens.length > 0) {
                    for (const label of rd.labels) {
                      if (label.catno) {
                        const catnoDigits = label.catno.replace(/[^0-9]/g, '');
                        for (const token of matrixTokens) {
                          const tokenDigits = token.replace(/[^0-9]/g, '');
                          if (tokenDigits.length >= 4 && catnoDigits.includes(tokenDigits)) {
                            disambigScore += 15;
                            console.log(`      🔗 ${tied.candidate.id}: Matrix-Catno overlap "${token}" in "${label.catno}" → +15`);
                            break;
                          }
                        }
                        if (disambigScore >= 15) break;
                      }
                    }
                  }
                  
                  console.log(`      📊 ${tied.candidate.id}: Disambig score = ${disambigScore}`);
                  
                  if (disambigScore > bestDisambigScore) {
                    bestDisambigScore = disambigScore;
                    bestTied = tied;
                  }
                }
                
                console.log(`   ✅ DISAMBIGUATED: ${bestTied.candidate.id} (disambig: ${bestDisambigScore})`);
                bestConfidencePoints = bestTied.points;
                bestMatch = bestTied.candidate;
                bestMatchDetails = bestTied.verification;
              } else {
                bestConfidencePoints = scoredCandidates[0].points;
                bestMatch = scoredCandidates[0].candidate;
                bestMatchDetails = scoredCandidates[0].verification;
              }
              
              searchMetadata.matched_on = bestMatchDetails.matched_on || [];
              searchMetadata.technical_matches = bestMatchDetails.technical_matches;
              searchMetadata.explain = bestMatchDetails.explain || [];
              searchMetadata.explain.push(`Strategy 3 candidate verified via point-based selection (${bestConfidencePoints} pts)`);
              console.log(`   ✅ BEST MATCH: ${bestMatch.title} (${bestConfidencePoints} pts)`);
            } else {
              console.log(`   ❌ No candidates passed soft verification`);
              searchMetadata.verification_level = 'no_match';
            }
            console.log(`   ✅ ${suggestions.length} suggesties opgeslagen voor review`);
          } else if (results.length > 0) {
            // Only auto-select if NO technical identifiers were present
            for (const candidate of results.slice(0, 5)) {
              const verification = await verifyCandidate(candidate, analysisData, barcodeDigits, catnoNorm, matrixNorm, matrixTokens, matrixValid);
              
              if (verification.points > bestConfidencePoints) {
                bestConfidencePoints = verification.points;
                bestMatch = candidate;
                bestMatchDetails = verification;
                searchMetadata.matched_on = verification.matched_on;
                searchMetadata.technical_matches = verification.technical_matches;
                searchMetadata.explain = verification.explain;
              }
            }
          }
        } else {
          console.log(`   ⚠️ API returned ${response.status} (fallback, not blocking)`);
        }
      } catch (err) {
        console.log(`   ⚠️ Fetch error: ${err.message} (fallback, not blocking)`);
      }
    }
    
    // === FINAL DECISION ===
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 FINAL DECISION`);
    console.log(`${'='.repeat(60)}`);
    
    // HARD GATING RULE 1: TWO-IDENTIFIER MINIMUM (V4 CRITICAL)
    // Must match at least TWO of {barcode, catno, matrix} to accept
    // EXCEPTION 1: If a LOCK condition was met (e.g. Barcode+Label+Year), bypass this rule
    // EXCEPTION 2: If catno matches + label matches + artist/title context → suggested_match
    if (bestMatch && hasTechnicalIdentifiers && !bestMatchDetails?.lock_reason) {
      const identifierMatchCount = [
        searchMetadata.technical_matches.barcode,
        searchMetadata.technical_matches.catno,
        searchMetadata.technical_matches.matrix
      ].filter(Boolean).length;
      
      if (identifierMatchCount < 2) {
        // NEW: Check for catno + label + artist/title soft match
        const hasCatnoMatch = searchMetadata.technical_matches.catno;
        const hasLabelMatch = searchMetadata.technical_matches.label;
        const hasArtistTitleContext = analysisData.artist && analysisData.title;
        
        const hasMatrixMatch = searchMetadata.technical_matches.matrix;
        
        if (hasCatnoMatch && hasLabelMatch && hasArtistTitleContext) {
          // Catno + Label + Artist/Title = suggested_match
          console.log(`🟡 SOFT GATE: catno ✅ + label ✅ + artist/title context → suggested_match`);
          searchMetadata.verification_level = 'suggested_match';
          bestConfidencePoints = Math.min(bestConfidencePoints, Math.floor(160 * 0.79));
          searchMetadata.matched_on.push('soft_gate_catno_label');
          searchMetadata.explain.push('Catno + Label match met artist/title context → suggested_match');
        } else if (hasMatrixMatch && hasLabelMatch && hasArtistTitleContext) {
          // Matrix + Label + Artist/Title = suggested_match (matrix is sterkste identifier na barcode)
          console.log(`🟡 SOFT GATE: matrix ✅ + label ✅ + artist/title context → suggested_match`);
          searchMetadata.verification_level = 'suggested_match';
          bestConfidencePoints = Math.min(bestConfidencePoints, Math.floor(160 * 0.79));
          searchMetadata.matched_on.push('soft_gate_matrix_label');
          searchMetadata.explain.push('Matrix + Label match met artist/title context → suggested_match');
        } else if (hasLabelMatch && searchMetadata.technical_matches.year && hasArtistTitleContext) {
          // Label + Year + Artist/Title = suggested_match (weakest but valid soft gate)
          console.log(`🟡 SOFT GATE: label ✅ + year ✅ + artist/title context → suggested_match`);
          searchMetadata.verification_level = 'suggested_match';
          bestConfidencePoints = Math.min(bestConfidencePoints, Math.floor(160 * 0.60));
          searchMetadata.matched_on.push('soft_gate_label_year');
          searchMetadata.explain.push('Label + Year match met artist/title context → suggested_match');
        } else if (hasCatnoMatch && searchMetadata.technical_matches.year && hasArtistTitleContext) {
          // Catno + Year + Artist/Title = suggested_match (catno is strong technical identifier)
          console.log(`🟡 SOFT GATE: catno ✅ + year ✅ + artist/title context → suggested_match`);
          searchMetadata.verification_level = 'suggested_match';
          bestConfidencePoints = Math.min(bestConfidencePoints, Math.floor(160 * 0.75));
          searchMetadata.matched_on.push('soft_gate_catno_year');
          searchMetadata.explain.push('Catno + Year match met artist/title context → suggested_match');
        } else {
          console.log(`⛔ DISQUALIFIED: Niet genoeg identifier matches (${identifierMatchCount}/2 vereist)`);
          console.log(`   barcode: ${searchMetadata.technical_matches.barcode ? '✅' : '❌'}`);
          console.log(`   catno: ${searchMetadata.technical_matches.catno ? '✅' : '❌'}`);
          console.log(`   matrix: ${searchMetadata.technical_matches.matrix ? '✅' : '❌'}`);
          console.log(`   label: ${searchMetadata.technical_matches.label ? '✅' : '❌'}`);
          console.log(`   → NO_MATCH (mag niet guessen bij technische identifiers)`);
          bestMatch = null;
          bestConfidencePoints = 0;
          searchMetadata.verification_level = 'no_match';
        }
      }
    } else if (bestMatch && bestMatchDetails?.lock_reason) {
      console.log(`🔓 LOCK bypass: Hard gating overruled door "${bestMatchDetails.lock_reason}"`);
    }
    
    // HARD GATING RULE 2: Confidence Threshold
    const CONFIDENCE_THRESHOLD = 70; // Uit 155 punten = ~45%
    
    if (bestMatch && bestConfidencePoints < CONFIDENCE_THRESHOLD && searchMetadata.verification_level !== 'suggested_match') {
      console.log(`⛔ BELOW THRESHOLD: Score ${bestConfidencePoints}/${CONFIDENCE_THRESHOLD} required`);
      
      if (hasTechnicalIdentifiers) {
        console.log(`   Technische identifiers aanwezig → NO_MATCH (niet guessen)`);
        searchMetadata.verification_level = 'no_match';
        bestMatch = null;
      } else {
        console.log(`   Geen technische identifiers → manual_review_required`);
        searchMetadata.verification_level = 'manual_review_required';
      }
    }
    
    // Build final result
    if (bestMatch && searchMetadata.verification_level !== 'no_match' && searchMetadata.verification_level !== 'DISQUALIFIED') {
      // Parse artist/title from Discogs
      let parsedArtist = bestMatch.artist;
      let parsedTitle = bestMatch.title;
      
      if (!parsedArtist && parsedTitle && parsedTitle.includes(' - ')) {
        const parts = parsedTitle.split(' - ');
        if (parts.length >= 2) {
          parsedArtist = parts[0].replace(/\s*\(\d+\)\s*$/, '').trim();
          parsedTitle = parts.slice(1).join(' - ').trim();
        }
      }
      
      const finalArtist = parsedArtist || analysisData.artist;
      const finalTitle = parsedTitle || analysisData.title;
      const confidenceNormalized = bestConfidencePoints / 160; // Normalize to 0-1 (V4 max score)
      
      console.log(`\n✅ MATCH FOUND`);
      console.log(`   Release: ${finalArtist} - ${finalTitle}`);
      console.log(`   Discogs ID: ${bestMatch.id}`);
      console.log(`   Score: ${bestConfidencePoints}/160 (${(confidenceNormalized * 100).toFixed(1)}%)`);
      console.log(`   Verification: ${searchMetadata.verification_level || 'standard'}`);
      console.log(`   Lock Reason: ${searchMetadata.lock_reason || 'N/A'}`);
      console.log(`   Matched On: [${searchMetadata.matched_on.join(', ')}]`);
      
      return {
        discogsId: bestMatch.id,
        discogsUrl: `https://www.discogs.com/release/${bestMatch.id}`,
        artist: finalArtist,
        title: finalTitle,
        label: bestMatch.label?.[0] || analysisData.label,
        catalogNumber: bestMatch.catno || analysisData.catalogNumber,
        year: bestMatch.year || analysisData.year,
        confidence: confidenceNormalized,
        confidencePoints: bestConfidencePoints,
        matrixVerified: searchMetadata.technical_matches.matrix,
        searchMetadata
      };
    }
    
    // NO MATCH
    console.log(`\n❌ NO MATCH`);
    console.log(`   Reason: ${hasTechnicalIdentifiers 
      ? 'Technical identifiers present but no Discogs candidates found' 
      : 'No technical identifiers and fuzzy search failed'}`);
    console.log(`   Action: manual_review_required`);
    if (suggestions.length > 0) {
      console.log(`   ✅ ${suggestions.length} suggesties beschikbaar voor manual review`);
    }
    
    return {
      discogsId: null,
      discogsUrl: null,
      artist: analysisData.artist,
      title: analysisData.title,
      label: analysisData.label,
      catalogNumber: analysisData.catalogNumber,
      year: analysisData.year,
      confidence: 0,
      confidencePoints: 0,
      matrixVerified: false,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
      searchMetadata: {
        ...searchMetadata,
        status: 'no_match',
        reason: hasTechnicalIdentifiers 
          ? 'Release met deze barcode/catno niet gevonden in Discogs'
          : 'Geen match gevonden',
        reason_detail: hasTechnicalIdentifiers
          ? 'De exacte pressing is niet geregistreerd in de Discogs database. Mogelijk een andere pressing of nog niet toegevoegd.'
          : null,
        action: 'manual_review_required',
        suggestions_available: suggestions.length
      }
    };

  } catch (error) {
    console.error('❌ MusicScan Protocol Error:', error);
    
    return {
      discogsId: null,
      discogsUrl: null,
      artist: analysisData.artist,
      title: analysisData.title,
      label: analysisData.label,
      catalogNumber: analysisData.catalogNumber,
      year: analysisData.year,
      confidence: 0,
      matrixVerified: false,
      searchMetadata: { error: error.message, protocol_version: '4.0' }
    };
  }
}

/**
 * Verify a Discogs candidate against extracted identifiers
 * Returns confidence points and lock conditions
 */
async function verifyCandidate(
  candidate: any, 
  analysisData: any, 
  barcodeDigits: string | null,
  catnoNorm: string | null,
  matrixNorm: string,
  matrixTokens: string[],
  matrixValid: boolean = true,  // Patch A - Matrix Sanity Guard
  foundViaBarcode: boolean = false  // NEW: candidate was found via barcode search strategy
): Promise<{
  points: number;
  matched_on: string[];
  explain: string[];
  lock_reason: string | null;
  technical_matches: {
    barcode: boolean;
    matrix: boolean;
    catno: boolean;
    label: boolean;
    year: boolean;
    country: boolean;
  };
  releaseDetails: any;
}> {
  const result = {
    points: 0,
    matched_on: [] as string[],
    explain: [] as string[],
    lock_reason: null as string | null,
    technical_matches: {
      barcode: false,
      matrix: false,
      catno: false,
      label: false,
      year: false,
      country: false
    },
    releaseDetails: null as any
  };
  
  try {
    // Fetch full release details
    const releaseResponse = await fetch(`https://api.discogs.com/releases/${candidate.id}`, {
      headers: {
        'User-Agent': 'MusicScan/1.0 +https://musicscan.app',
        'Authorization': `Discogs token=${Deno.env.get('DISCOGS_TOKEN')}`
      }
    });
    
    if (!releaseResponse.ok) {
      console.log(`      ⚠️ Could not fetch release ${candidate.id}`);
      return result;
    }
    
    const releaseDetails = await releaseResponse.json();
    result.releaseDetails = releaseDetails;
    
    console.log(`\n   📀 Verifying candidate: ${candidate.title} (ID: ${candidate.id})`);
    
    // === CHECK MATRIX (50 points) - TOKEN SUBSET MATCHING ===
    // PATCH A: Only check matrix if matrixValid is true (sanity guard passed)
    // Matrix match is TRUE if all canonical tokens exist in the Discogs candidate matrix
    if (matrixValid && matrixNorm && matrixTokens.length > 0 && releaseDetails.identifiers) {
      for (const identifier of releaseDetails.identifiers) {
        if (identifier.type === 'Matrix / Runout' && identifier.value) {
          const discogsMatrixRaw = identifier.value.toUpperCase();
          const discogsMatrixAlphaNum = discogsMatrixRaw.replace(/[^A-Z0-9]/g, '');
          const discogsMatrixTokens = discogsMatrixRaw.split(/[\s\-\/]+/).filter(Boolean);
          
          // Strategy 1: Exact string match (after alphanumeric normalization)
          const extractedMatrixAlphaNum = matrixNorm.replace(/[^A-Z0-9]/g, '');
          if (discogsMatrixAlphaNum === extractedMatrixAlphaNum) {
            result.points += 50;
            result.matched_on.push('matrix');
            result.technical_matches.matrix = true;
            result.explain.push(`Matrix '${matrixNorm}' matched exactly`);
            console.log(`      ✅ Matrix exact match: +50 points`);
            break;
          }
          
          // Strategy 2: Token subset match
          // All canonical tokens from OCR must exist in the Discogs matrix tokens
          const significantTokens = matrixTokens.filter(t => t.length >= 3);
          if (significantTokens.length > 0) {
            const allTokensFound = significantTokens.every(token => {
              const tokenAlphaNum = token.replace(/[^A-Z0-9]/g, '');
              // Check if token exists in Discogs matrix (as substring or exact token match)
              return discogsMatrixAlphaNum.includes(tokenAlphaNum) ||
                     discogsMatrixTokens.some(dt => dt.replace(/[^A-Z0-9]/g, '').includes(tokenAlphaNum));
            });
            
            if (allTokensFound) {
              result.points += 50;
              result.matched_on.push('matrix');
              result.technical_matches.matrix = true;
              result.explain.push(`Matrix tokens [${significantTokens.join(', ')}] all found in '${identifier.value}'`);
              console.log(`      ✅ Matrix token subset match: +50 points`);
              console.log(`         OCR tokens: [${significantTokens.join(', ')}]`);
              console.log(`         Discogs matrix: "${identifier.value}"`);
              break;
            }
          }
          
          // Strategy 3: Contains match (either direction)
          if (discogsMatrixAlphaNum.includes(extractedMatrixAlphaNum) || 
              extractedMatrixAlphaNum.includes(discogsMatrixAlphaNum)) {
            result.points += 50;
            result.matched_on.push('matrix');
            result.technical_matches.matrix = true;
            result.explain.push(`Matrix '${matrixNorm}' contained in Discogs matrix`);
            console.log(`      ✅ Matrix contains match: +50 points`);
            break;
          }
        }
      }
      
      if (!result.technical_matches.matrix) {
        console.log(`      ❌ Matrix NOT matched`);
        console.log(`         OCR canonical: "${matrixNorm}"`);
        console.log(`         OCR tokens: [${matrixTokens.join(', ')}]`);
      }
    } else if (!matrixValid && matrixNorm) {
      // Matrix was detected but failed sanity guard (barcode-like pattern)
      console.log(`      ⛔ Matrix SKIPPED (sanity guard: detected as barcode-like)`);
      console.log(`         Raw: "${matrixNorm}"`);
    }
    
    // === CHECK BARCODE (40 points) ===
    let barcodeMatched = false;
    if (barcodeDigits && releaseDetails.identifiers) {
      for (const identifier of releaseDetails.identifiers) {
        if (identifier.type === 'Barcode' && identifier.value) {
          const discogsBarcode = identifier.value.replace(/[^0-9]/g, '');
          if (discogsBarcode === barcodeDigits) {
            barcodeMatched = true;
            break;
          }
        }
      }
    }
    // If candidate was found via barcode search but identifiers don't list the barcode,
    // still count it as a match — Discogs itself matched it
    if (!barcodeMatched && foundViaBarcode && barcodeDigits) {
      console.log(`      🔄 Barcode not in identifiers but candidate found via barcode search → counting as match`);
      barcodeMatched = true;
    }
    if (barcodeMatched) {
      result.points += 40;
      result.matched_on.push('barcode');
      result.technical_matches.barcode = true;
      result.explain.push('Barcode matched exactly');
      console.log(`      ✅ Barcode match: +40 points`);
    }
    
    // === CHECK CATNO (25 points) ===
    if (catnoNorm && releaseDetails.labels) {
      for (const label of releaseDetails.labels) {
        if (label.catno) {
          const discogsCatno = label.catno.toUpperCase().replace(/\s+/g, ' ').trim();
          if (discogsCatno === catnoNorm || 
              discogsCatno.replace(/[^A-Z0-9]/g, '') === catnoNorm.replace(/[^A-Z0-9]/g, '')) {
            result.points += 25;
            result.matched_on.push('catno');
            result.technical_matches.catno = true;
            result.explain.push('Catalog number matched');
            console.log(`      ✅ Catno match: +25 points`);
            break;
          }
        }
      }
    }
    
    // === MATRIX-CATNO CROSS-REFERENCE (25 points) ===
    // Sometimes the disc hub shows the catalog number, not a traditional matrix
    // Cross-check matrix OCR tokens against candidate catalog numbers
    if (!result.technical_matches.catno && !result.technical_matches.matrix && 
        matrixValid && matrixTokens.length > 0 && releaseDetails.labels) {
      for (const label of releaseDetails.labels) {
        if (label.catno) {
          const discogsCatnoDigits = label.catno.replace(/[^0-9]/g, '');
          const discogsCatnoAlpha = label.catno.toUpperCase().replace(/[^A-Z0-9]/g, '');
          
          // Check if the primary matrix token (digits) appears in the catno
          for (const token of matrixTokens) {
            if (token.length >= 4) {
              const tokenDigits = token.replace(/[^0-9]/g, '');
              const tokenAlpha = token.replace(/[^A-Z0-9]/g, '');
              
              // Digit-based match: e.g. matrix "468531" matches catno "468 531-2"  
              if (tokenDigits.length >= 4 && discogsCatnoDigits.includes(tokenDigits)) {
                result.points += 25;
                result.matched_on.push('matrix_catno_crossref');
                result.technical_matches.catno = true;
                result.explain.push(`Matrix OCR "${token}" matches catalog number "${label.catno}" (cross-reference)`);
                console.log(`      ✅ Matrix-Catno cross-reference: "${token}" found in catno "${label.catno}" → +25 points`);
                break;
              }
              // Alpha-numeric match
              if (tokenAlpha.length >= 4 && discogsCatnoAlpha.includes(tokenAlpha)) {
                result.points += 25;
                result.matched_on.push('matrix_catno_crossref');
                result.technical_matches.catno = true;
                result.explain.push(`Matrix OCR "${token}" matches catalog number "${label.catno}" (cross-reference)`);
                console.log(`      ✅ Matrix-Catno cross-reference: "${token}" found in catno "${label.catno}" → +25 points`);
                break;
              }
            }
          }
          if (result.technical_matches.catno) break;
        }
      }
    }
    
    // === CHECK LABEL (15 points) ===
    if (analysisData.label && releaseDetails.labels) {
      const extractedLabel = analysisData.label.toLowerCase().trim();
      for (const label of releaseDetails.labels) {
        if (label.name) {
          const discogsLabel = label.name.toLowerCase().trim();
          // Bidirectional match: either contains the other
          if (discogsLabel.includes(extractedLabel) || extractedLabel.includes(discogsLabel)) {
            result.points += 15;
            result.matched_on.push('label');
            result.technical_matches.label = true;
            result.explain.push(`Label match: "${analysisData.label}" ↔ "${label.name}"`);
            console.log(`      ✅ Label match: "${analysisData.label}" ↔ "${label.name}" → +15 points`);
            break;
          }
        }
      }
    }
    
    // === CHECK YEAR (10 points) ===
    if (analysisData.year && releaseDetails.year) {
      if (parseInt(analysisData.year) === parseInt(releaseDetails.year)) {
        result.points += 10;
        result.matched_on.push('year');
        result.technical_matches.year = true;
        console.log(`      ✅ Year match: +10 points`);
      }
    }
    
    // === RIGHTS SOCIETY GATING (HARD EXCLUDE / CONFIRM) ===
    // Must run BEFORE country check — overrides country scoring
    const rightsSocieties = [
      ...(analysisData.rightsSocieties || analysisData.rights_societies || []),
      ...(analysisData.externalRightsSocieties || []),
    ];
    const allRawTexts = [
      ...(analysisData.extractedText || []),
      ...(analysisData.copyrightLines || []),
      ...(analysisData.discLabelText || []),
      ...(analysisData.backCoverText || []),
      analysisData.madeInText || '',
    ].filter(Boolean);
    const detectedSocieties = detectRightsSocieties(rightsSocieties, allRawTexts);
    
    if (detectedSocieties.length > 0 && releaseDetails.country) {
      const candidateCountry = releaseDetails.country.toLowerCase();
      let excluded = false;
      let confirmed = false;
      
      for (const society of detectedSocieties) {
        const mapping = RIGHTS_SOCIETY_REGIONS[society];
        if (!mapping) continue;
        
        const isPrimary = mapping.primary.length > 0 && mapping.primary.some(r => 
          candidateCountry.includes(r) || r.includes(candidateCountry)
        );
        const isCompatible = mapping.regions.some(r => 
          candidateCountry.includes(r) || r.includes(candidateCountry)
        );
        
        if (!isCompatible) {
          // HARD EXCLUDE: rights society region incompatible with candidate country
          result.points = 0;
          excluded = true;
          result.explain.push(`⛔ ${society} (${mapping.label}) detected → excludes "${releaseDetails.country}"`);
          console.log(`      ⛔ RIGHTS SOCIETY EXCLUDE: ${society} (${mapping.label}) incompatible with ${releaseDetails.country} → score=0`);
          break;
        } else if (isPrimary && !confirmed) {
          // PRIMARY CONFIRM: candidate is in the home market of this society → +15
          result.points += 15;
          confirmed = true;
          result.matched_on.push('rights_society');
          result.explain.push(`✅ ${society} (${mapping.label}) confirms "${releaseDetails.country}" as PRIMARY region (+15)`);
          console.log(`      ✅ RIGHTS SOCIETY PRIMARY: ${society} confirms ${releaseDetails.country} → +15 points`);
        } else if (!isPrimary && isCompatible && !confirmed) {
          // COMPATIBLE but not primary: no bonus, no exclusion
          confirmed = true; // prevent further checks from adding points
          result.explain.push(`➡️ ${society} (${mapping.label}) compatible with "${releaseDetails.country}" but not primary region (+0)`);
          console.log(`      ➡️ RIGHTS SOCIETY COMPATIBLE (no bonus): ${society} allows ${releaseDetails.country} → +0 points`);
        }
      }
      
      // If excluded, skip remaining checks and return early
      if (excluded) {
        console.log(`      📊 Total: 0/160 points (EXCLUDED by rights society)`);
        return result;
      }
    }
    
    // === CHECK COUNTRY (10 points, or PENALTY for non-EU when EU hint) ===
    if (analysisData.country && releaseDetails.country) {
      const extractedCountry = analysisData.country.toLowerCase();
      const discogsCountry = releaseDetails.country.toLowerCase();
      const euCountryPattern = /europe|eu|netherlands|holland|germany|france|uk|united kingdom|italy|spain|belgium|austria|sweden|denmark|portugal|greece|ireland|finland|norway|switzerland/i;
      const isEUHint = euCountryPattern.test(extractedCountry);
      
      if (extractedCountry === discogsCountry || 
          extractedCountry.includes(discogsCountry) || 
          discogsCountry.includes(extractedCountry)) {
        result.points += 10;
        result.matched_on.push('country');
        result.technical_matches.country = true;
        console.log(`      ✅ Country match: +10 points`);
      } else if (isEUHint && !euCountryPattern.test(discogsCountry)) {
        // Country hint is EU but candidate is non-EU → penalty
        const penalty = 25;
        result.points = Math.max(0, result.points - penalty);
        result.explain.push(`Country penalty: EU hint "${extractedCountry}" but candidate="${discogsCountry}" (-${penalty})`);
        console.log(`      ⚠️ Country penalty: -${penalty} (EU hint but candidate is ${discogsCountry})`);
      }
    }
    
    // === TITLE SIMILARITY (5 points max) ===
    if (analysisData.title && candidate.title) {
      const similarity = calculateTitleSimilarity(analysisData.title, candidate.title);
      if (similarity > 0.7) {
        result.points += 5;
        result.matched_on.push('title');
        console.log(`      ✅ Title similarity (${(similarity * 100).toFixed(0)}%): +5 points`);
      }
    }
    
    // === IFPI CODES (5 points) - V4 NEW ===
    // Check if ANY IFPI codes are present in the candidate (adds confidence)
    if (releaseDetails.identifiers) {
      const hasIfpi = releaseDetails.identifiers.some((id: any) => 
        id.type && (id.type.includes('IFPI') || id.type.includes('Mastering SID Code') || id.type.includes('Mould SID Code'))
      );
      if (hasIfpi) {
        result.points += 5;
        result.matched_on.push('ifpi');
        result.explain.push('IFPI codes detected in release');
        console.log(`      ✅ IFPI codes present: +5 points`);
      }
    }
    
    console.log(`      📊 Total: ${result.points}/160 points`);
    
    // === LOCK CONDITIONS (V4 NON-NEGOTIABLE) ===
    // Priority 1: Barcode + Catno = LOCKED (most reliable, no matrix needed)
    if (result.technical_matches.barcode && result.technical_matches.catno) {
      result.lock_reason = 'Barcode + Catalog match';
      result.explain.push('Barcode and catalog number both matched (no matrix required)');
      console.log(`      🔒 LOCK: Barcode + Catno = verified (highest confidence)`);
    }
    // Priority 2: Matrix-based locks
    else if (result.technical_matches.matrix) {
      if (result.technical_matches.barcode) {
        result.lock_reason = 'Matrix + Barcode match';
      } else if (result.technical_matches.catno) {
        result.lock_reason = 'Matrix + Catalog confirmed';
      } else if (result.technical_matches.label && result.technical_matches.year) {
        result.lock_reason = 'Matrix + Label + Year confirmed';
      }
    }
    // Priority 3: Barcode + Label + Year (when catno missing)
    else if (result.technical_matches.barcode && result.technical_matches.label && result.technical_matches.year) {
      result.lock_reason = 'Barcode + Label + Year match';
      console.log(`      🔒 LOCK: Barcode + Label + Year = verified`);
    }
    
  } catch (err) {
    console.log(`      ❌ Verification error: ${err.message}`);
  }
  
  return result;
}

/**
 * Calculate title similarity using Levenshtein-like approach
 */
function calculateTitleSimilarity(title1: string, title2: string): number {
  const t1 = title1.toLowerCase().replace(/[^a-z0-9]/g, '');
  const t2 = title2.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  if (t1 === t2) return 1.0;
  if (t1.includes(t2) || t2.includes(t1)) return 0.9;
  
  // Simple character overlap
  const chars1 = new Set(t1.split(''));
  const chars2 = new Set(t2.split(''));
  const intersection = [...chars1].filter(c => chars2.has(c)).length;
  const union = new Set([...chars1, ...chars2]).size;
  
  return intersection / union;
}

// Legacy confidence functions removed (V4 protocol uses point-based scoring)
