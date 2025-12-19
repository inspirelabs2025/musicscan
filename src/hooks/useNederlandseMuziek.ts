import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface NederlandseRelease {
  id: string;
  artist: string;
  title: string;
  year?: number;
  genre?: string;
  label?: string;
  format?: string;
  cover_url?: string;
  country: string;
}

export interface NederlandsBlogPost {
  id: string;
  slug: string;
  yaml_frontmatter: any;
  views_count: number;
  album_cover_url?: string;
  published_at: string;
}

export interface NederlandseSingle {
  id: string;
  slug: string;
  title: string;
  artist: string;
  single_name: string;
  artwork_url?: string;
  created_at: string;
}

export interface NederlandseArtiest {
  id: string;
  name: string;
  slug: string;
  artwork_url?: string;
  music_style?: string[];
  biography?: string;
  views_count?: number;
}

// Dutch releases from user collections
export const useNederlandseReleases = () => {
  return useQuery({
    queryKey: ["nederlandse-releases"],
    queryFn: async (): Promise<NederlandseRelease[]> => {
      const { data, error } = await supabase
        .from("releases")
        .select("id, artist, title, year, genre, label, format, cover_url, country")
        .eq("country", "Netherlands")
        .order("year", { ascending: false })
        .limit(200);

      if (error) throw error;
      return data || [];
    },
  });
};

// Dutch album stories - using country_code = 'NL'
export const useNederlandseVerhalen = () => {
  return useQuery({
    queryKey: ["nederlandse-verhalen"],
    queryFn: async (): Promise<NederlandsBlogPost[]> => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, slug, yaml_frontmatter, views_count, album_cover_url, published_at")
        .eq("is_published", true)
        .eq("country_code", "NL")
        .or("album_type.is.null,album_type.neq.news")
        .order("published_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    },
  });
};

// Dutch singles - using country_code = 'NL'
export const useNederlandseSingles = () => {
  return useQuery({
    queryKey: ["nederlandse-singles"],
    queryFn: async (): Promise<NederlandseSingle[]> => {
      const { data, error } = await supabase
        .from("music_stories")
        .select("id, slug, title, artist, single_name, artwork_url, created_at")
        .eq("is_published", true)
        .eq("country_code", "NL")
        .not("single_name", "is", null)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data || []).map(s => ({
        id: s.id,
        slug: s.slug,
        title: s.title || s.single_name,
        artist: s.artist || 'Onbekend',
        single_name: s.single_name,
        artwork_url: s.artwork_url,
        created_at: s.created_at,
      }));
    },
  });
};

// Dutch artists - using country_code = 'NL'
export const useNederlandseArtiesten = () => {
  return useQuery({
    queryKey: ["nederlandse-artiesten"],
    queryFn: async (): Promise<NederlandseArtiest[]> => {
      const { data, error } = await supabase
        .from("artist_stories")
        .select("id, artist_name, slug, artwork_url, music_style, biography, views_count")
        .eq("is_published", true)
        .eq("country_code", "NL")
        .order("views_count", { ascending: false, nullsFirst: false });

      if (error) throw error;
      
      return (data || []).map(story => ({
        id: story.id,
        name: story.artist_name,
        slug: story.slug,
        artwork_url: story.artwork_url,
        music_style: story.music_style,
        biography: story.biography,
        views_count: story.views_count,
      }));
    },
  });
};

// Dutch genres from releases
export const useNederlandseGenres = () => {
  return useQuery({
    queryKey: ["nederlandse-genres"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("releases")
        .select("genre")
        .eq("country", "Netherlands")
        .not("genre", "is", null);

      if (error) throw error;

      // Count genres
      const genreCounts: Record<string, number> = {};
      (data || []).forEach(item => {
        if (item.genre) {
          const genres = item.genre.split(',').map((g: string) => g.trim());
          genres.forEach((genre: string) => {
            genreCounts[genre] = (genreCounts[genre] || 0) + 1;
          });
        }
      });

      return Object.entries(genreCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 12);
    },
  });
};

// Comprehensive Dutch music stats - using country_code
export const useNederlandseStats = () => {
  return useQuery({
    queryKey: ["nederlandse-stats"],
    queryFn: async () => {
      const [
        releasesResult, 
        verhalenResult, 
        singlesResult, 
        artistenResult
      ] = await Promise.all([
        // User releases from Netherlands
        supabase
          .from("releases")
          .select("id", { count: "exact", head: true })
          .eq("country", "Netherlands"),
        // Albums with country_code = 'NL'
        supabase
          .from("blog_posts")
          .select("id", { count: "exact", head: true })
          .eq("is_published", true)
          .eq("country_code", "NL")
          .or("album_type.is.null,album_type.neq.news"),
        // Singles with country_code = 'NL'
        supabase
          .from("music_stories")
          .select("id", { count: "exact", head: true })
          .eq("is_published", true)
          .eq("country_code", "NL")
          .not("single_name", "is", null),
        // Artists with country_code = 'NL'
        supabase
          .from("artist_stories")
          .select("id", { count: "exact", head: true })
          .eq("is_published", true)
          .eq("country_code", "NL"),
      ]);

      return {
        totalReleases: releasesResult.count || 0,
        totalVerhalen: verhalenResult.count || 0,
        totalSingles: singlesResult.count || 0,
        totalArtiesten: artistenResult.count || 0,
      };
    },
  });
};
