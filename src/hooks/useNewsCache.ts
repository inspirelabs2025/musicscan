import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DiscogsRelease {
  id: number;
  title: string;
  artist: string;
  year?: number;
  artwork?: string;
  thumb?: string;
  stored_image?: string;
  format?: string[] | string;
  label?: string[] | string;
  genre?: string[] | string;
  style?: string[];
  country?: string;
  uri?: string;
  database_id?: string;
  release_id?: string;
}

export interface NewsItem {
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  url: string;
  category: string;
}

const fetchNewsFromCache = async (source: 'discogs' | 'perplexity') => {
  console.log(`Fetching ${source} news from cache...`);
  
  // Try to get from cache first
  const { data: cacheData, error: cacheError } = await supabase
    .from('news_cache')
    .select('content, cached_at, expires_at')
    .eq('source', source)
    .gt('expires_at', new Date().toISOString())
    .order('cached_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (cacheError) {
    console.error(`Cache error for ${source}:`, cacheError);
  }

  // If we have valid cached data, use it
  if (cacheData && !cacheError) {
    console.log(`✅ Using cached ${source} data from`, cacheData.cached_at);
    return Array.isArray(cacheData.content) ? cacheData.content : [];
  }

  // Fallback to direct API call if no cache
  console.log(`⚠️ No cache found for ${source}, calling API directly...`);
  
  const functionName = source === 'discogs' ? 'latest-discogs-news' : 'music-news-perplexity';
  const { data: apiData, error: apiError } = await supabase.functions.invoke(functionName);

  if (apiError) {
    console.error(`API error for ${source}:`, apiError);
    throw apiError;
  }

  // Return the API data in the expected format
  if (source === 'discogs') {
    return apiData?.releases || [];
  } else {
    return Array.isArray(apiData) ? apiData : [];
  }
};

export const useDiscogsNews = () => {
  return useQuery({
    queryKey: ["discogs-news"],
    queryFn: () => fetchNewsFromCache('discogs'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const usePerplexityNews = () => {
  return useQuery({
    queryKey: ["perplexity-news"],
    queryFn: () => fetchNewsFromCache('perplexity'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};