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

export interface NederlandseArtiest {
  name: string;
  slug?: string;
  artwork_url?: string;
  music_style?: string[];
  story_content?: string;
  views_count?: number;
}

// List of known Dutch artists for filtering
const DUTCH_ARTISTS = [
  'Within Temptation', 'Golden Earring', 'André Hazes', 'Marco Borsato',
  'Doe Maar', 'Boudewijn de Groot', 'Anouk', 'Herman Brood', 'BZN',
  'Guus Meeuwis', 'Het Goede Doel', 'Frank Boeijen', 'Krezip',
  'De Dijk', 'Volumia!', 'Nick & Simon', 'Jan Smit', 'Trijntje Oosterhuis',
  'Ilse DeLange', 'Acda en de Munnik', 'Blof', 'Ramses Shaffy',
  'Willeke Alberti', 'Gerard Joling', 'Lee Towers', 'Anita Meyer',
  'Tiësto', 'Armin van Buuren', 'Martin Garrix', 'Afrojack', 'Hardwell',
  'Ferry Corsten', 'Fedde Le Grand', 'Nicky Romero', 'Oliver Heldens',
  'Shocking Blue', 'Focus', 'Earth and Fire', 'Kayak', 'Ekseption',
  'The Cats', 'George Baker Selection', 'Pussycat', 'Luv\'',
  'Candy Dulfer', 'Caro Emerald', 'Kovacs', 'Davina Michelle',
  'Snelle', 'Lil Kleine', 'Boef', 'Ronnie Flex', 'Kraantje Pansen',
  'S10', 'Froukje', 'Merol', 'BLØF', 'Chef\'Special', 'Racoon',
  'Kensington', 'Danny Vera', 'Di-Rect', 'Rowwen Hèze', '3Js',
];

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

export const useNederlandseVerhalen = () => {
  return useQuery({
    queryKey: ["nederlandse-verhalen"],
    queryFn: async (): Promise<NederlandsBlogPost[]> => {
      // Fetch all published blog posts and filter for Dutch artists
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, slug, yaml_frontmatter, views_count, album_cover_url, published_at")
        .eq("is_published", true)
        .order("published_at", { ascending: false });

      if (error) throw error;

      // Filter for Dutch artists based on yaml_frontmatter.artist
      const dutchPosts = (data || []).filter(post => {
        const artist = post.yaml_frontmatter?.artist || '';
        return DUTCH_ARTISTS.some(dutch => 
          artist.toLowerCase().includes(dutch.toLowerCase())
        );
      });

      return dutchPosts;
    },
  });
};

export const useNederlandseArtiesten = () => {
  return useQuery({
    queryKey: ["nederlandse-artiesten"],
    queryFn: async (): Promise<NederlandseArtiest[]> => {
      // Fetch artist stories and filter for Dutch artists
      const { data, error } = await supabase
        .from("artist_stories")
        .select("artist_name, slug, artwork_url, music_style, story_content, views_count")
        .eq("is_published", true)
        .order("views_count", { ascending: false });

      if (error) throw error;

      // Filter for Dutch artists
      const dutchArtists = (data || []).filter(story => 
        DUTCH_ARTISTS.some(dutch => 
          story.artist_name.toLowerCase().includes(dutch.toLowerCase())
        )
      ).map(story => ({
        name: story.artist_name,
        slug: story.slug,
        artwork_url: story.artwork_url,
        music_style: story.music_style,
        story_content: story.story_content,
        views_count: story.views_count,
      }));

      // Add artists from releases that don't have stories
      // BUT only if they are in our known Dutch artists list
      const { data: releaseArtists } = await supabase
        .from("releases")
        .select("artist")
        .eq("country", "Netherlands");

      const uniqueReleaseArtists = [...new Set((releaseArtists || []).map(r => r.artist))];
      
      // Only add release artists that are actually Dutch (in our list)
      uniqueReleaseArtists.forEach(artist => {
        const isDutchArtist = DUTCH_ARTISTS.some(dutch => 
          artist.toLowerCase().includes(dutch.toLowerCase()) ||
          dutch.toLowerCase().includes(artist.toLowerCase())
        );
        
        if (isDutchArtist && !dutchArtists.find(a => a.name.toLowerCase() === artist.toLowerCase())) {
          dutchArtists.push({ 
            name: artist,
            slug: undefined,
            artwork_url: undefined,
            music_style: undefined,
            story_content: undefined,
            views_count: undefined
          });
        }
      });

      return dutchArtists;
    },
  });
};

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

export const useNederlandseStats = () => {
  return useQuery({
    queryKey: ["nederlandse-stats"],
    queryFn: async () => {
      const [releasesResult, verhalenResult] = await Promise.all([
        supabase
          .from("releases")
          .select("id", { count: "exact", head: true })
          .eq("country", "Netherlands"),
        supabase
          .from("blog_posts")
          .select("id, yaml_frontmatter")
          .eq("is_published", true),
      ]);

      const totalReleases = releasesResult.count || 0;
      
      // Count Dutch blog posts
      const dutchVerhalen = (verhalenResult.data || []).filter(post => {
        const artist = post.yaml_frontmatter?.artist || '';
        return DUTCH_ARTISTS.some(dutch => 
          artist.toLowerCase().includes(dutch.toLowerCase())
        );
      }).length;

      // Get unique Dutch artists from releases
      const { data: artistData } = await supabase
        .from("releases")
        .select("artist")
        .eq("country", "Netherlands");

      const uniqueArtists = new Set((artistData || []).map(r => r.artist)).size;

      return {
        totalReleases,
        totalVerhalen: dutchVerhalen,
        totalArtiesten: uniqueArtists,
      };
    },
  });
};
