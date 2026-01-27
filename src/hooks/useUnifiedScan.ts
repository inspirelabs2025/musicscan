import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type MediaType = 'vinyl' | 'cd' | null;
export type ScanMode = 'collection' | 'shop' | 'quick';
export type ScanStatus = 'idle' | 'uploading' | 'analyzing' | 'searching' | 'complete' | 'error';

export interface PricingStats {
  lowest_price: string | null;
  median_price: string | null;
  highest_price: string | null;
  have_count?: number;
  want_count?: number;
  num_for_sale?: number;
  currency?: string;
}

export interface ScanResult {
  artist: string;
  title: string;
  label?: string;
  catalog_number?: string;
  barcode?: string;
  year?: number;
  format?: string;
  genre?: string;
  country?: string;
  discogs_id?: number;
  discogs_url?: string;
  cover_image?: string;
  pricing_stats?: PricingStats;
  similarity_score?: number;
  // Enhanced scan data for UX improvements
  confidence?: {
    artist?: number;
    title?: number;
    overall?: number;
    verified?: boolean;
  };
  ocr_notes?: string;
  raw_spelling?: {
    artist?: string;
    title?: string;
  };
  enhanced_image?: string;
  original_image?: string;
  processing_stats?: {
    enhancementFactor?: number;
    multiShotVariants?: number;
    pixelsEnhanced?: number;
  };
}

export interface UnifiedScanState {
  mediaType: MediaType;
  mode: ScanMode;
  status: ScanStatus;
  files: File[];
  uploadedUrls: string[];
  result: ScanResult | null;
  condition: string;
  advicePrice: number | null;
  manualPrice: number | null;
  useManualPrice: boolean;
  discogsId: string | null;
  error: string | null;
}

const initialState: UnifiedScanState = {
  mediaType: null,
  mode: 'collection',
  status: 'idle',
  files: [],
  uploadedUrls: [],
  result: null,
  condition: '',
  advicePrice: null,
  manualPrice: null,
  useManualPrice: false,
  discogsId: null,
  error: null,
};

const SUPABASE_URL = 'https://ssxbpyqnjfiyubsuonar.supabase.co';

async function convertFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function useUnifiedScan() {
  const [state, setState] = useState<UnifiedScanState>(initialState);
  const abortControllerRef = useRef<AbortController | null>(null);

  const setMediaType = useCallback((mediaType: MediaType) => {
    setState(prev => ({ ...prev, mediaType, files: [], uploadedUrls: [], result: null, status: 'idle', error: null }));
  }, []);

  const setMode = useCallback((mode: ScanMode) => {
    setState(prev => ({ ...prev, mode }));
  }, []);

  const setCondition = useCallback((condition: string) => {
    setState(prev => {
      // Calculate advice price based on condition
      const pricingStats = prev.result?.pricing_stats;
      let advicePrice: number | null = null;
      
      if (pricingStats?.lowest_price) {
        const basePrice = parseFloat(pricingStats.lowest_price.replace(',', '.'));
        if (!isNaN(basePrice)) {
          const conditionMultipliers: Record<string, number> = {
            'Mint (M)': 1.5,
            'Near Mint (NM or M-)': 1.2,
            'Near Mint (NM)': 1.2,
            'Very Good Plus (VG+)': 1.0,
            'Very Good (VG)': 0.8,
            'Good Plus (G+)': 0.6,
            'Good (G)': 0.4,
            'Fair (F) / Poor (P)': 0.2,
          };
          const multiplier = conditionMultipliers[condition] || 1.0;
          advicePrice = Math.round(basePrice * multiplier * 100) / 100;
        }
      }
      
      return { ...prev, condition, advicePrice };
    });
  }, []);

  const setManualPrice = useCallback((price: number | null) => {
    setState(prev => ({ ...prev, manualPrice: price }));
  }, []);

  const toggleManualPrice = useCallback((useManual: boolean) => {
    setState(prev => ({ ...prev, useManualPrice: useManual }));
  }, []);

  const addFile = useCallback((file: File) => {
    setState(prev => {
      const newFiles = [...prev.files, file];
      return { ...prev, files: newFiles };
    });
  }, []);

  const removeFile = useCallback((index: number) => {
    setState(prev => {
      const newFiles = prev.files.filter((_, i) => i !== index);
      const newUrls = prev.uploadedUrls.filter((_, i) => i !== index);
      return { ...prev, files: newFiles, uploadedUrls: newUrls };
    });
  }, []);

  const getRequiredPhotoCount = useCallback(() => {
    return state.mediaType === 'vinyl' ? 3 : 4;
  }, [state.mediaType]);

  // Start analysis when all photos are uploaded
  const startAnalysis = useCallback(async () => {
    if (!state.mediaType || state.files.length === 0) return;

    abortControllerRef.current = new AbortController();
    setState(prev => ({ ...prev, status: 'analyzing', error: null }));

    try {
      // Convert files to base64
      const base64Images = await Promise.all(state.files.map(convertFileToBase64));

      // Determine endpoint
      const endpoint = state.mediaType === 'vinyl'
        ? `${SUPABASE_URL}/functions/v1/analyze-vinyl-images`
        : `${SUPABASE_URL}/functions/v1/analyze-cd-images`;

      // Send for analysis
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Images }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error(`Analysis failed: ${response.status}`);

      const data = await response.json();
      const analysis = data.analysis || data.combinedResults || {};

      // Start Discogs search immediately
      setState(prev => ({ ...prev, status: 'searching' }));

      const catalogNumber = analysis.catalog_number || analysis.catalogNumber || '';
      const artist = analysis.artist || '';
      const title = analysis.title || '';

      if (!catalogNumber && !artist && !title) {
        setState(prev => ({
          ...prev,
          status: 'complete',
          result: {
            artist: 'Niet herkend',
            title: 'Probeer handmatig zoeken',
          },
        }));
        toast({
          title: 'Analyse voltooid',
          description: 'Geen album info gevonden - probeer handmatig te zoeken',
          variant: 'destructive',
        });
        return;
      }

      // Search Discogs
      const { data: searchData, error: searchError } = await supabase.functions.invoke('optimized-catalog-search', {
        body: {
          catalog_number: catalogNumber,
          artist: artist,
          title: title,
          include_pricing: true,
        },
      });

      if (searchError) throw searchError;

      if (searchData?.results?.length > 0) {
        const topResult = searchData.results[0];
        const result: ScanResult = {
          artist: topResult.artist || artist,
          title: topResult.title || title,
          label: topResult.label,
          catalog_number: topResult.catalog_number || catalogNumber,
          barcode: analysis.barcode,
          year: topResult.year,
          format: topResult.format,
          genre: topResult.genre,
          country: topResult.country,
          discogs_id: topResult.discogs_id || topResult.id,
          discogs_url: topResult.discogs_url,
          cover_image: topResult.cover_image,
          pricing_stats: topResult.pricing_stats,
          similarity_score: topResult.similarity_score,
        };

        setState(prev => ({ ...prev, status: 'complete', result }));

        toast({
          title: 'Gevonden!',
          description: `${result.artist} - ${result.title}`,
        });
      } else {
        // No match found, but show analysis results
        setState(prev => ({
          ...prev,
          status: 'complete',
          result: {
            artist: artist || 'Onbekend',
            title: title || 'Onbekend',
            catalog_number: catalogNumber,
            barcode: analysis.barcode,
          },
        }));

        toast({
          title: 'Geen exacte match',
          description: 'Analyse voltooid maar geen Discogs match gevonden',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;

      console.error('Unified scan error:', error);
      setState(prev => ({ ...prev, status: 'error', error: error.message }));

      toast({
        title: 'Scan mislukt',
        description: error.message || 'Er ging iets mis tijdens de scan',
        variant: 'destructive',
      });
    }
  }, [state.mediaType, state.files]);

  // Direct Discogs ID lookup
  const searchByDiscogsId = useCallback(async (discogsId: string) => {
    if (!discogsId) return;

    setState(prev => ({ ...prev, status: 'searching', discogsId, error: null }));

    try {
      const { data, error } = await supabase.functions.invoke('optimized-catalog-search', {
        body: {
          direct_discogs_id: discogsId,
          include_pricing: true,
        },
      });

      if (error) throw error;

      if (data?.results?.length > 0) {
        const topResult = data.results[0];
        const result: ScanResult = {
          artist: topResult.artist,
          title: topResult.title,
          label: topResult.label,
          catalog_number: topResult.catalog_number,
          year: topResult.year,
          format: topResult.format,
          genre: topResult.genre,
          country: topResult.country,
          discogs_id: topResult.discogs_id || parseInt(discogsId),
          discogs_url: topResult.discogs_url,
          cover_image: topResult.cover_image || topResult.release_metadata?.thumb,
          pricing_stats: topResult.pricing_stats,
          similarity_score: 1.0,
        };

        setState(prev => ({ ...prev, status: 'complete', result, mediaType: 'vinyl' }));

        toast({
          title: 'Gevonden!',
          description: `${result.artist} - ${result.title}`,
        });
      } else {
        throw new Error('Discogs ID niet gevonden');
      }
    } catch (error: any) {
      console.error('Discogs ID search error:', error);
      setState(prev => ({ ...prev, status: 'error', error: error.message }));

      toast({
        title: 'Niet gevonden',
        description: error.message || 'Discogs ID niet gevonden',
        variant: 'destructive',
      });
    }
  }, []);

  // Manual search
  const searchManual = useCallback(async (artist: string, title: string, catalogNumber?: string) => {
    if (!artist && !title && !catalogNumber) {
      toast({
        title: 'Vul zoekgegevens in',
        description: 'Minimaal artiest of titel is vereist',
        variant: 'destructive',
      });
      return;
    }

    setState(prev => ({ ...prev, status: 'searching', error: null }));

    try {
      const { data, error } = await supabase.functions.invoke('optimized-catalog-search', {
        body: {
          catalog_number: catalogNumber?.trim() || '',
          artist: artist?.trim(),
          title: title?.trim(),
          include_pricing: true,
        },
      });

      if (error) throw error;

      if (data?.results?.length > 0) {
        const topResult = data.results[0];
        const result: ScanResult = {
          artist: topResult.artist,
          title: topResult.title,
          label: topResult.label,
          catalog_number: topResult.catalog_number,
          year: topResult.year,
          format: topResult.format,
          genre: topResult.genre,
          country: topResult.country,
          discogs_id: topResult.discogs_id || topResult.id,
          discogs_url: topResult.discogs_url,
          cover_image: topResult.cover_image,
          pricing_stats: topResult.pricing_stats,
          similarity_score: topResult.similarity_score,
        };

        setState(prev => ({ ...prev, status: 'complete', result }));

        toast({
          title: 'Gevonden!',
          description: `${result.artist} - ${result.title}`,
        });
      } else {
        toast({
          title: 'Geen resultaten',
          description: 'Probeer andere zoektermen',
          variant: 'destructive',
        });
        setState(prev => ({ ...prev, status: 'idle' }));
      }
    } catch (error: any) {
      console.error('Manual search error:', error);
      setState(prev => ({ ...prev, status: 'error', error: error.message }));

      toast({
        title: 'Zoeken mislukt',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, []);

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    setState(initialState);
  }, []);

  const getActivePrice = useCallback(() => {
    return state.useManualPrice ? state.manualPrice : state.advicePrice;
  }, [state.useManualPrice, state.manualPrice, state.advicePrice]);

  return {
    state,
    setMediaType,
    setMode,
    setCondition,
    setManualPrice,
    toggleManualPrice,
    addFile,
    removeFile,
    getRequiredPhotoCount,
    startAnalysis,
    searchByDiscogsId,
    searchManual,
    reset,
    getActivePrice,
  };
}
