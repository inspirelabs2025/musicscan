/**
 * Parallel Matrix Processing Hook
 * 
 * Runs the Matrix Enhancer pipeline in the background when a matrix photo is detected.
 * Provides results that can be merged with the standard AI analysis.
 */

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { processMatrixImage, DEFAULT_PARAMS, MatrixProcessingResult } from '@/utils/matrixEnhancementPipeline';
import { detectMatrixPhoto, MatrixPhotoDetectionResult } from '@/utils/matrixPhotoDetector';

export interface EnhancedMatrixData {
  matrixNumber: string | null;
  ifpiCodes: string[];
  discogsId?: number;
  discogsUrl?: string;
  artist?: string;
  title?: string;
  catalogNumber?: string;
  label?: string;
  year?: number;
  country?: string;
  genre?: string;
  coverImage?: string;
  matchConfidence?: number;
}

export interface ParallelMatrixResult {
  detection: MatrixPhotoDetectionResult | null;
  enhancement: MatrixProcessingResult | null;
  ocrResult: {
    rawText: string;
    cleanText: string;
    segments: Array<{
      text: string;
      type: string;
      confidence: number;
    }>;
    overallConfidence: number;
  } | null;
  discogsResult: EnhancedMatrixData | null;
  processingTimeMs: number;
  status: 'idle' | 'detecting' | 'enhancing' | 'ocr' | 'discogs' | 'complete' | 'error';
  error: string | null;
}

export function useParallelMatrixProcessing() {
  const [result, setResult] = useState<ParallelMatrixResult>({
    detection: null,
    enhancement: null,
    ocrResult: null,
    discogsResult: null,
    processingTimeMs: 0,
    status: 'idle',
    error: null
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const abortRef = useRef(false);
  const resultPromiseRef = useRef<Promise<EnhancedMatrixData | null> | null>(null);

  /**
   * Process a file through the full matrix enhancement pipeline in the background
   */
  const processMatrixPhotoInBackground = useCallback(async (
    file: File,
    options: { skipDetection?: boolean; confidenceThreshold?: number } = {}
  ): Promise<EnhancedMatrixData | null> => {
    const { skipDetection = false, confidenceThreshold = 0.5 } = options;
    const startTime = performance.now();
    
    abortRef.current = false;
    setIsProcessing(true);
    
    setResult(prev => ({
      ...prev,
      status: 'detecting',
      error: null
    }));
    
    try {
      // Step 1: Detect if it's a matrix photo (unless skipped)
      let detection: MatrixPhotoDetectionResult | null = null;
      
      if (!skipDetection) {
        setResult(prev => ({ ...prev, status: 'detecting' }));
        detection = await detectMatrixPhoto(file);
        
        if (abortRef.current) return null;
        
        setResult(prev => ({ ...prev, detection }));
        
        if (!detection.isMatrix || detection.confidence < confidenceThreshold) {
          console.log(`📷 File "${file.name}" is not a matrix photo (confidence: ${(detection.confidence * 100).toFixed(0)}%)`);
          setResult(prev => ({
            ...prev,
            status: 'complete',
            processingTimeMs: performance.now() - startTime
          }));
          setIsProcessing(false);
          return null;
        }
        
        console.log(`✅ Matrix photo detected: "${file.name}" (confidence: ${(detection.confidence * 100).toFixed(0)}%)`);
      }
      
      // Step 2: Run enhancement pipeline
      setResult(prev => ({ ...prev, status: 'enhancing' }));
      console.log(`🔧 Starting matrix enhancement for "${file.name}"...`);
      
      const enhancement = await processMatrixImage(file, DEFAULT_PARAMS);
      
      if (abortRef.current) return null;
      
      setResult(prev => ({ ...prev, enhancement }));
      console.log(`✅ Enhancement complete in ${enhancement.processingTimeMs.toFixed(0)}ms`);
      
      // Step 3: Run OCR
      setResult(prev => ({ ...prev, status: 'ocr' }));
      console.log(`📝 Running matrix OCR...`);
      
      const { data: ocrData, error: ocrError } = await supabase.functions.invoke('matrix-ocr', {
        body: {
          enhancedImage: enhancement.enhancedPreview,
          ocrLayer: enhancement.ocrLayer,
          ocrLayerInverted: enhancement.ocrLayerInverted,
          zoomedRing: enhancement.zoomedRing,
          zoomedRingEnhanced: enhancement.zoomedRingEnhanced,
          zoomedIfpiRing: enhancement.zoomedIfpiRing,
          zoomedIfpiRingEnhanced: enhancement.zoomedIfpiRingEnhanced,
          superZoomIfpi: enhancement.superZoomIfpi,
          superZoomIfpiEnhanced: enhancement.superZoomIfpiEnhanced,
        }
      });
      
      if (abortRef.current) return null;
      
      if (ocrError) {
        console.error('❌ Matrix OCR error:', ocrError);
        throw new Error(`OCR failed: ${ocrError.message}`);
      }
      
      const ocrResult = {
        rawText: ocrData.raw_text || '',
        cleanText: ocrData.clean_text || '',
        segments: (ocrData.segments || []).map((s: any) => ({
          text: s.text,
          type: s.type,
          confidence: s.confidence
        })),
        overallConfidence: ocrData.overall_confidence || 0
      };
      
      setResult(prev => ({ ...prev, ocrResult }));
      console.log(`✅ OCR complete: "${ocrResult.cleanText}"`);
      
      // Step 4: Discogs lookup
      setResult(prev => ({ ...prev, status: 'discogs' }));
      
      const matrixSegment = ocrResult.segments.find((s: any) => s.type === 'matrix');
      const matrixText = matrixSegment?.text || ocrResult.cleanText;
      
      if (!matrixText || matrixText.length < 3) {
        console.log('⚠️ No valid matrix text for Discogs lookup');
        setResult(prev => ({
          ...prev,
          status: 'complete',
          processingTimeMs: performance.now() - startTime
        }));
        setIsProcessing(false);
        
        // Return partial result with OCR data
        return {
          matrixNumber: ocrResult.cleanText || null,
          ifpiCodes: ocrResult.segments
            .filter((s: any) => s.type === 'ifpi')
            .map((s: any) => s.text)
        };
      }
      
      // Find IFPI codes
      const ifpiSegments = ocrResult.segments.filter((s: any) => s.type === 'ifpi');
      const ifpiMastering = ifpiSegments.find((s: any) =>
        s.text.toUpperCase().includes('IFPI L') ||
        s.text.toUpperCase().match(/IFPI\s*L[A-Z]?\d/)
      )?.text;
      const ifpiMould = ifpiSegments.find((s: any) =>
        !s.text.toUpperCase().includes('IFPI L') &&
        !s.text.toUpperCase().match(/IFPI\s*L[A-Z]?\d/)
      )?.text;
      
      console.log(`🔍 Discogs lookup: matrix="${matrixText}", IFPI="${ifpiMastering || ''}"/"${ifpiMould || ''}"`);
      
      const { data: discogsData, error: discogsError } = await supabase.functions.invoke('matrix-discogs-lookup', {
        body: {
          matrixNumber: matrixText,
          ifpiMastering,
          ifpiMould
        }
      });
      
      if (abortRef.current) return null;
      
      let discogsResult: EnhancedMatrixData | null = null;
      
      if (discogsError) {
        console.warn('⚠️ Discogs lookup failed:', discogsError);
      } else if (discogsData?.success) {
        discogsResult = {
          matrixNumber: matrixText,
          ifpiCodes: ifpiSegments.map((s: any) => s.text),
          discogsId: discogsData.discogs_id,
          discogsUrl: discogsData.discogs_url,
          artist: discogsData.artist,
          title: discogsData.title,
          catalogNumber: discogsData.catalog_number,
          label: discogsData.label,
          year: discogsData.year,
          country: discogsData.country,
          genre: discogsData.genre,
          coverImage: discogsData.cover_image,
          matchConfidence: discogsData.match_confidence
        };
        
        console.log(`✅ Discogs match: ${discogsResult.artist} - ${discogsResult.title}`);
      } else {
        // No Discogs match, but still return OCR data
        discogsResult = {
          matrixNumber: matrixText,
          ifpiCodes: ifpiSegments.map((s: any) => s.text)
        };
        console.log('ℹ️ No Discogs match found, returning OCR data only');
      }
      
      setResult(prev => ({
        ...prev,
        discogsResult,
        status: 'complete',
        processingTimeMs: performance.now() - startTime
      }));
      
      setIsProcessing(false);
      return discogsResult;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Matrix processing error:', errorMessage);
      
      setResult(prev => ({
        ...prev,
        status: 'error',
        error: errorMessage,
        processingTimeMs: performance.now() - startTime
      }));
      
      setIsProcessing(false);
      return null;
    }
  }, []);

  /**
   * Start processing and store the promise for later retrieval
   */
  const startBackgroundProcessing = useCallback((
    file: File,
    options?: { skipDetection?: boolean; confidenceThreshold?: number }
  ) => {
    resultPromiseRef.current = processMatrixPhotoInBackground(file, options);
    return resultPromiseRef.current;
  }, [processMatrixPhotoInBackground]);

  /**
   * Wait for background processing to complete
   */
  const waitForResult = useCallback(async (): Promise<EnhancedMatrixData | null> => {
    if (resultPromiseRef.current) {
      return resultPromiseRef.current;
    }
    return null;
  }, []);

  /**
   * Cancel ongoing processing
   */
  const cancel = useCallback(() => {
    abortRef.current = true;
    setIsProcessing(false);
    setResult(prev => ({
      ...prev,
      status: 'idle',
      error: 'Processing cancelled'
    }));
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    abortRef.current = true;
    setIsProcessing(false);
    resultPromiseRef.current = null;
    setResult({
      detection: null,
      enhancement: null,
      ocrResult: null,
      discogsResult: null,
      processingTimeMs: 0,
      status: 'idle',
      error: null
    });
  }, []);

  return {
    result,
    isProcessing,
    processMatrixPhotoInBackground,
    startBackgroundProcessing,
    waitForResult,
    cancel,
    reset
  };
}
