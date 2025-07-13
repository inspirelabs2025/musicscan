import { useState } from 'react';
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

  const searchCatalog = async (
    catalogNumber: string,
    artist?: string,
    title?: string,
    includePricing: boolean = true
  ) => {
    if (!catalogNumber?.trim()) {
      toast({
        title: "Error",
        description: "Catalogusnummer is vereist voor zoeken",
        variant: "destructive"
      });
      return null;
    }

    setIsSearching(true);
    setSearchResults([]);
    setSearchStrategies([]);
    
    try {
      console.log('🔍 Starting Discogs search:', { catalogNumber, artist, title, includePricing });
      
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
    }
  };

  return {
    isSearching,
    searchResults,
    searchStrategies,
    searchCatalog,
    setSearchResults
  };
};