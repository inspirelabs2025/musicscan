import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface DiscogsSearchResult {
  id: number;
  discogs_id?: number;
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
  
  const lastSearchRef = useRef<string>('');
  const isCallInProgressRef = useRef(false);
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const CACHE_DURATION = 60 * 60 * 1000; // 1 hour
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

      return parsedCache;
    } catch {
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
    } catch {
      // Silent fail for storage errors
    }
  }, [CACHE_PREFIX]);

  const clearCache = useCallback(() => {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch {
      // Silent fail for storage errors
    }
  }, [CACHE_PREFIX]);

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
      return null;
    }
    
    if (forceRetry) {
      lastSearchRef.current = '';
    }
    
    lastSearchRef.current = searchKey;
    isCallInProgressRef.current = true;
    setIsSearching(true);
    setSearchResults([]);
    setSearchStrategies([]);
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const SEARCH_TIMEOUT = isMobile ? 20000 : 35000;
    callTimeoutRef.current = setTimeout(() => {
      resetSearchState();
      toast({
        title: "Zoeken Onderbroken",
        description: "De zoekopdracht duurde te lang. Probeer opnieuw.",
        variant: "destructive"
      });
    }, SEARCH_TIMEOUT);
    
    try {
      // Phase 1: Quick search without pricing for immediate results
      const { data: quickData, error: quickError } = await supabase.functions.invoke('optimized-catalog-search', {
        body: {
          catalog_number: catalogNumber.trim(),
          artist: artist?.trim(),
          title: title?.trim(),
          include_pricing: false // Skip pricing for speed
        }
      });

      if (quickError) throw quickError;

      console.log('⚡ Quick search completed:', quickData);
      
      if (quickData?.results?.length > 0) {
        // Show results immediately without pricing
        setSearchResults(quickData.results);
        setSearchStrategies(quickData.search_strategies || []);
        
        toast({
          title: "Gevonden!",
          description: `${quickData.results.length} resultaat${quickData.results.length > 1 ? 'en' : ''} gevonden${includePricing ? ' - prijzen worden geladen...' : ''}`,
          variant: "default"
        });
        
        // Cache quick results
        setCachedResult(searchKey, quickData.results, quickData.search_strategies || []);
        
        // Phase 2: Load pricing asynchronously if requested
        if (includePricing && quickData.results[0]) {
          console.log('💰 Loading pricing data asynchronously...');
          
          setTimeout(async () => {
            try {
              const { data: pricingData, error: pricingError } = await supabase.functions.invoke('test-catalog-search', {
                body: { 
                  direct_discogs_id: quickData.results[0].discogs_id || quickData.results[0].id,
                  include_pricing: true
                }
              });
              
              if (!pricingError && pricingData?.results?.[0]?.pricing_stats) {
                // Update results with pricing data
                setSearchResults(prev => {
                  const updated = [...prev];
                  if (updated[0]) {
                    updated[0] = {
                      ...updated[0],
                      pricing_stats: pricingData.results[0].pricing_stats
                    };
                  }
                  return updated;
                });
                
                // Update cache with pricing
                const updatedResults = [{...quickData.results[0], pricing_stats: pricingData.results[0].pricing_stats}, ...quickData.results.slice(1)];
                setCachedResult(searchKey, updatedResults, quickData.search_strategies || []);
                
                console.log('✅ Pricing data loaded and applied');
              }
            } catch (pricingError) {
              console.error('⚠️ Pricing load failed (non-critical):', pricingError);
            }
          }, 100);
        }
        
        return { results: quickData.results, strategies_used: quickData.search_strategies };
      } else {
        toast({
          title: "Geen resultaten",
          description: "Geen matches gevonden voor deze zoekopdracht",
          variant: "destructive"
        });
        return null;
      }
    } catch (error: any) {
      clearCache();
      
      toast({
        title: "Discogs Zoeken Mislukt",
        description: error.message || "Er is een fout opgetreden tijdens het zoeken",
        variant: "destructive"
      });
      return null;
    } finally {
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
      }
      setIsSearching(false);
      isCallInProgressRef.current = false;
    }
  }, [getCachedResult, setCachedResult, clearCache, resetSearchState]);

  const retryPricing = useCallback(async (discogsId: number) => {
    if (!discogsId) return null;
    
    setIsPricingRetrying(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('test-catalog-search', {
        body: {
          discogs_id: discogsId,
          retry_pricing_only: true
        }
      });

      if (error) throw error;

      if (data.pricing_stats) {
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
    } catch (error: any) {
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

  const searchByDiscogsId = useCallback(async (discogsId: string) => {
    resetSearchState();
    setIsSearching(true);
    setSearchResults([]);
    setSearchStrategies([]);
    
    try {
      console.log('🆔 Starting optimized Discogs ID search:', discogsId);
      
      // Phase 1: Get release data immediately (without pricing)
      const { data: releaseData, error: releaseError } = await supabase.functions.invoke('optimized-catalog-search', {
        body: { 
          direct_discogs_id: discogsId,
          include_pricing: false // Skip pricing for immediate results
        }
      });

      if (releaseError) throw releaseError;

      console.log('⚡ Release data retrieved:', releaseData);
      
      if (releaseData?.results?.length > 0) {
        const result = releaseData.results[0];
        const formattedResult: DiscogsSearchResult = {
          id: parseInt(result.discogs_id),
          discogs_id: parseInt(result.discogs_id),
          discogs_url: result.discogs_url,
          sell_url: result.sell_url,
          api_url: result.api_url,
          title: result.title || '',
          artist: result.artist || '',
          year: result.year ? parseInt(result.year) : null,
          similarity_score: 1.0,
          search_strategy: 'Direct Discogs ID',
          catalog_number: result.catalog_number || '',
          pricing_stats: result.pricing_stats
        };
        
        // Show results immediately
        setSearchResults([formattedResult]);
        setSearchStrategies(['Direct Discogs ID']);
        
        toast({
          title: "Gevonden!",
          description: `Album gevonden - prijzen worden geladen...`,
          variant: "default"
        });
        
        // Phase 2: Load pricing asynchronously
        setTimeout(async () => {
          try {
            console.log('💰 Loading pricing for Discogs ID:', discogsId);
            
            const { data: pricingData, error: pricingError } = await supabase.functions.invoke('test-catalog-search', {
              body: { 
                direct_discogs_id: discogsId,
                include_pricing: true
              }
            });
            
            if (!pricingError && pricingData?.results?.[0]?.pricing_stats) {
              setSearchResults(prev => {
                const updated = [...prev];
                if (updated[0]) {
                  updated[0] = {
                    ...updated[0],
                    pricing_stats: pricingData.results[0].pricing_stats
                  };
                }
                return updated;
              });
              
              console.log('✅ Pricing data loaded for Discogs ID');
            }
          } catch (pricingError) {
            console.error('⚠️ Pricing load failed (non-critical):', pricingError);
          }
        }, 100);
      }

    } catch (error) {
      console.error('❌ Discogs ID search failed:', error);
      setSearchResults([]);
      setSearchStrategies([]);
      
      toast({
        title: "Zoekfout",
        description: "Kon geen verbinding maken met Discogs",
        variant: "destructive"
      });
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