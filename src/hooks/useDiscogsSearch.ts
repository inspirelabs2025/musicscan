import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface DiscogsSearchResult {
  id: number;
  discogs_id?: number; // Added for proper database mapping
  title: string;
  artist: string;
  year: number | null;
  label?: string;
  catalog_number: string;
  format?: string;
  country?: string;
  genre?: string;
  discogs_url: string;
  marketplace_url?: string;
  sell_url?: string;
  api_url: string;
  similarity_score: number;
  search_strategy?: string;
  pricing_stats?: {
    lowest_price: string | null;
    median_price: string | null;
    highest_price: string | null;
    have_count: number;
    want_count: number;
    ratings_count: number;
    avg_rating: number;
    last_sold: string | null;
  };
}

// Cache interface for browser storage
interface CachedSearchResult {
  results: DiscogsSearchResult[];
  strategies: string[];
  timestamp: number;
  searchKey: string;
}

export const useDiscogsSearch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<DiscogsSearchResult[]>([]);
  const [searchStrategies, setSearchStrategies] = useState<string[]>([]);
  const [isPricingRetrying, setIsPricingRetrying] = useState(false);
  
  // Mobile-specific tracking to prevent duplicate calls
  const lastSearchRef = useRef<string>('');
  const isCallInProgressRef = useRef(false);
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cache management
  const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
  const CACHE_PREFIX = 'discogs_search_';

  const getCachedResult = useCallback((searchKey: string): CachedSearchResult | null => {
    try {
      const cached = localStorage.getItem(CACHE_PREFIX + searchKey);
      if (!cached) return null;

      const parsedCache: CachedSearchResult = JSON.parse(cached);
      const isExpired = Date.now() - parsedCache.timestamp > CACHE_DURATION;
      
      if (isExpired) {
        localStorage.removeItem(CACHE_PREFIX + searchKey);
        return null;
      }

      console.log('🎯 Cache HIT for:', searchKey);
      return parsedCache;
    } catch (error) {
      console.warn('Cache read error:', error);
      return null;
    }
  }, [CACHE_DURATION, CACHE_PREFIX]);

  const setCachedResult = useCallback((searchKey: string, results: DiscogsSearchResult[], strategies: string[]) => {
    try {
      const cacheData: CachedSearchResult = {
        results,
        strategies,
        timestamp: Date.now(),
        searchKey
      };
      localStorage.setItem(CACHE_PREFIX + searchKey, JSON.stringify(cacheData));
      console.log('💾 Cached results for:', searchKey);
    } catch (error) {
      console.warn('Cache write error:', error);
    }
  }, [CACHE_PREFIX]);

  // Clear corrupted cache entries
  const clearCache = useCallback(() => {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
      console.log('🗑️ Cleared all Discogs search cache');
    } catch (error) {
      console.warn('Cache clear error:', error);
    }
  }, [CACHE_PREFIX]);

  // Reset all states and clear timeouts
  const resetSearchState = useCallback(() => {
    setIsSearching(false);
    setSearchResults([]);
    setSearchStrategies([]);
    setIsPricingRetrying(false);
    isCallInProgressRef.current = false;
    lastSearchRef.current = '';
    
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }
  }, []);

  const searchCatalog = useCallback(async (
    catalogNumber: string,
    artist?: string,
    title?: string,
    includePricing: boolean = true,
    forceRetry: boolean = false
  ) => {
    if (!catalogNumber?.trim() && !artist?.trim() && !title?.trim()) {
      toast({
        title: "Error",
        description: "Minimaal artist + title of catalogusnummer is vereist voor zoeken",
        variant: "destructive"
      });
      return null;
    }

    // Mobile-specific deduplication: prevent duplicate calls (unless force retry)
    const searchKey = `${catalogNumber}-${artist}-${title}-${includePricing}`;
    
    // Check cache first (skip if force retry)
    if (!forceRetry) {
      const cachedResult = getCachedResult(searchKey);
      if (cachedResult) {
        setSearchResults(cachedResult.results);
        setSearchStrategies(cachedResult.strategies);
        toast({
          title: "Resultaten Geladen (Cache) ⚡",
          description: `${cachedResult.results.length} resultaten uit cache`,
          variant: "default"
        });
        return { results: cachedResult.results, strategies_used: cachedResult.strategies };
      }
    }
    
    if (!forceRetry && (isCallInProgressRef.current || lastSearchRef.current === searchKey)) {
      console.log('🚫 [MOBILE] Duplicate search call prevented:', searchKey);
      return null;
    }
    
    if (forceRetry) {
      console.log('🔄 [FORCE RETRY] Bypassing duplicate prevention for retry:', searchKey);
      // Reset to allow retry
      lastSearchRef.current = '';
    }
    
    lastSearchRef.current = searchKey;
    isCallInProgressRef.current = true;
    setIsSearching(true);
    setSearchResults([]);
    setSearchStrategies([]);
    
    // Mobile-optimized timeout
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const SEARCH_TIMEOUT = isMobile ? 20000 : 35000; // 20s mobile, 35s desktop
    callTimeoutRef.current = setTimeout(() => {
      console.log('⏰ Search timeout, resetting state');
      resetSearchState();
      toast({
        title: "Zoeken Onderbroken",
        description: "De zoekopdracht duurde te lang. Probeer opnieuw.",
        variant: "destructive"
      });
    }, SEARCH_TIMEOUT);
    
    try {
      console.log('🔍 [MOBILE] Starting Discogs search:', { catalogNumber, artist, title, includePricing, searchKey });
      
      const { data, error } = await supabase.functions.invoke('test-catalog-search', {
        body: {
          catalog_number: catalogNumber.trim(),
          artist: artist?.trim(),
          title: title?.trim(),
          include_pricing: includePricing
        }
      });

      if (error) {
        console.error('❌ Discogs search error:', error);
        throw error;
      }

      console.log('✅ Discogs search completed:', data);

      setSearchResults(data.results || []);
      setSearchStrategies(data.strategies_used || []);
      
      // Cache successful results
      if (data.results?.length > 0) {
        setCachedResult(searchKey, data.results, data.strategies_used || []);
      }
      
      // Check if pricing failed and retry automatically
      const hasPricingResults = data.results?.some((result: any) => result.pricing_stats?.lowest_price);
      if (includePricing && data.results?.length > 0 && !hasPricingResults) {
        console.log('🔄 No pricing found, attempting automatic retry...');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        
        try {
          const retryData = await supabase.functions.invoke('test-catalog-search', {
            body: {
              catalog_number: catalogNumber.trim(),
              artist: artist?.trim(),
              title: title?.trim(),
              include_pricing: true,
              retry_pricing: true
            }
          });
          
          if (retryData.data?.results) {
            setSearchResults(retryData.data.results);
            // Update cache with pricing results
            setCachedResult(searchKey, retryData.data.results, data.strategies_used || []);
            console.log('✅ Pricing retry completed');
          }
        } catch (retryError) {
          console.error('❌ Pricing retry failed:', retryError);
        }
      }
      
      toast({
        title: "Discogs Zoeken Voltooid! 🎵",
        description: `${data.results?.length || 0} resultaten gevonden`,
        variant: "default"
      });

      return data;
    } catch (error) {
      console.error('❌ Discogs search failed:', error);
      
      // Clear cache on error to prevent corruption
      clearCache();
      
      toast({
        title: "Discogs Zoeken Mislukt",
        description: error.message || "Er is een fout opgetreden tijdens het zoeken",
        variant: "destructive"
      });
      return null;
    } finally {
      // Clear timeout and reset state
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
      }
      setIsSearching(false);
      isCallInProgressRef.current = false;
    }
  }, []);

  const retryPricing = useCallback(async (discogsId: number) => {
    if (!discogsId) return null;
    
    setIsPricingRetrying(true);
    
    try {
      console.log('🔄 Retrying pricing for Discogs ID:', discogsId);
      
      const { data, error } = await supabase.functions.invoke('test-catalog-search', {
        body: {
          discogs_id: discogsId,
          retry_pricing_only: true
        }
      });

      if (error) throw error;

      if (data.pricing_stats) {
        // Update the search results with new pricing
        setSearchResults(prev => prev.map(result => 
          result.id === discogsId 
            ? { ...result, pricing_stats: data.pricing_stats }
            : result
        ));
        
        toast({
          title: "Prijzen Bijgewerkt! 💰",
          description: "Nieuwe prijsinformatie opgehaald",
          variant: "default"
        });
      }

      return data;
    } catch (error) {
      console.error('❌ Pricing retry failed:', error);
      toast({
        title: "Prijzen Ophalen Mislukt",
        description: "Kon geen nieuwe prijsinformatie ophalen",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsPricingRetrying(false);
    }
  }, []);

  // Search by Discogs ID directly
  const searchByDiscogsId = useCallback(async (discogsId: string) => {
    console.log('🆔 Searching by Discogs ID:', discogsId);
    
    setIsSearching(true);
    setSearchResults([]);
    setSearchStrategies([]);
    resetSearchState();
    
    try {
      console.log('📡 Calling test-catalog-search with direct Discogs ID');
      const { data, error } = await supabase.functions.invoke('test-catalog-search', {
        body: { 
          direct_discogs_id: discogsId,
          include_pricing: true,
          retry_pricing: true
        }
      });

      if (error) {
        console.error('❌ Discogs ID search error:', error);
        throw error;
      }

      console.log('✅ Discogs ID search successful:', data);
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0]; // Should only be one result
        const formattedResult: DiscogsSearchResult = {
          id: parseInt(result.discogs_id),
          discogs_id: parseInt(result.discogs_id),
          discogs_url: result.discogs_url,
          sell_url: result.sell_url,
          api_url: result.api_url,
          title: result.title || '',
          artist: result.artist || '',
          year: result.year ? parseInt(result.year) : null,
          similarity_score: 1.0, // Perfect match since it's direct ID
          search_strategy: 'Direct Discogs ID',
          catalog_number: result.catalog_number || '',
          pricing_stats: result.pricing_stats
        };
        
        setSearchResults([formattedResult]);
        setSearchStrategies(['Direct Discogs ID']);
        console.log('✅ Formatted Discogs ID result:', formattedResult);
      }

    } catch (error: any) {
      console.error('❌ Discogs ID search failed:', error);
      setSearchResults([]);
      setSearchStrategies([]);
    } finally {
      setIsSearching(false);
    }
  }, [resetSearchState]);

  return {
    isSearching,
    searchResults,
    searchStrategies,
    searchCatalog,
    searchByDiscogsId,
    setSearchResults,
    retryPricing,
    isPricingRetrying,
    clearCache,
    resetSearchState
  };
};