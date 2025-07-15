import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface DiscogsSearchResult {
  id: number;
  title: string;
  artist: string;
  year: number;
  label: string;
  catalog_number: string;
  format: string;
  country: string;
  genre: string;
  discogs_url: string;
  marketplace_url: string;
  api_url: string;
  similarity_score: number;
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

export const useDiscogsSearch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<DiscogsSearchResult[]>([]);
  const [searchStrategies, setSearchStrategies] = useState<string[]>([]);
  const [isPricingRetrying, setIsPricingRetrying] = useState(false);
  
  // Mobile-specific tracking to prevent duplicate calls
  const lastSearchRef = useRef<string>('');
  const isCallInProgressRef = useRef(false);

  const searchCatalog = useCallback(async (
    catalogNumber: string,
    artist?: string,
    title?: string,
    includePricing: boolean = true,
    forceRetry: boolean = false
  ) => {
    if (!catalogNumber?.trim()) {
      toast({
        title: "Error",
        description: "Catalogusnummer is vereist voor zoeken",
        variant: "destructive"
      });
      return null;
    }

    // Mobile-specific deduplication: prevent duplicate calls (unless force retry)
    const searchKey = `${catalogNumber}-${artist}-${title}-${includePricing}`;
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
      toast({
        title: "Discogs Zoeken Mislukt",
        description: error.message || "Er is een fout opgetreden tijdens het zoeken",
        variant: "destructive"
      });
      return null;
    } finally {
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

  return {
    isSearching,
    searchResults,
    searchStrategies,
    searchCatalog,
    setSearchResults,
    retryPricing,
    isPricingRetrying
  };
};