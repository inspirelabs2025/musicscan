import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FranseRelease {
  id: string;
  artist: string;
  title: string;
  year: number | null;
  genre: string | null;
  format: string | null;
  label: string | null;
  country: string | null;
  front_image: string | null;
  discogs_id: number | null;
}

export interface FransBlogPost {
  id: string;
  slug: string;
  markdown_content: string;
  yaml_frontmatter: any;
  album_cover_url: string | null;
  published_at: string | null;
  views_count: number | null;
}

export interface FranseArtiest {
  id: string;
  artist_name: string;
  slug: string;
  biography?: string;
  artwork_url?: string;
  music_style?: string[];
}

// Comprehensive list of French artists
export const FRENCH_ARTISTS = [
  // Klassieke Chanson
  'Édith Piaf', 'Edith Piaf', 'Charles Aznavour', 'Jacques Brel', 'Serge Gainsbourg',
  'Georges Brassens', 'Yves Montand', 'Gilbert Bécaud', 'Charles Trenet',
  'Dalida', 'Mireille Mathieu', 'Johnny Hallyday', 'Sylvie Vartan',
  'France Gall', 'Françoise Hardy', 'Jane Birkin', 'Michel Sardou',
  'Claude François', 'Léo Ferré', 'Barbara', 'Juliette Gréco',
  
  // Franse Pop/Rock
  'Daft Punk', 'Air', 'Phoenix', 'M83', 'Justice',
  'Stromae', 'Christine and the Queens', 'Indochine', 'Téléphone',
  'Mylène Farmer', 'Vanessa Paradis', 'Alizée', 'Patricia Kaas',
  'Francis Cabrel', 'Jean-Jacques Goldman', 'Renaud', 'Alain Souchon',
  'Laurent Voulzy', 'Michel Polnareff', 'Véronique Sanson', 'Christophe',
  'Etienne Daho', 'Les Rita Mitsouko', 'Noir Désir', 'Mano Negra',
  
  // Electronic/House
  'David Guetta', 'Martin Solveig', 'Cassius', 'Bob Sinclar',
  'Laurent Garnier', 'Pedro Winter', 'Breakbot', 'Kavinsky',
  'Gesaffelstein', 'Madeon', 'The Blaze', 'Polo & Pan',
  'SebastiAn', 'Busy P', 'DJ Mehdi', 'Mr. Oizo',
  
  // Hip Hop/Rap
  'MC Solaar', 'IAM', 'NTM', 'Suprême NTM', 'PNL', 'Booba', 'Nekfeu',
  'Orelsan', 'Bigflo & Oli', 'Angèle', 'Aya Nakamura',
  'Rohff', 'La Fouine', 'Soprano', 'Jul', 'Ninho', 'Damso',
  'Maître Gims', 'Gims', 'Sexion d\'Assaut', 'Black M',
  
  // Metal/Rock
  'Gojira', 'Alcest', 'Magma', 'Trust', 'Noir Désir',
  'Deathspell Omega', 'Blut Aus Nord', 'Peste Noire', 'Les Discrets',
  
  // Klassiek/Opera
  'Claude Debussy', 'Maurice Ravel', 'Erik Satie', 'Hector Berlioz',
  'Camille Saint-Saëns', 'Gabriel Fauré', 'Francis Poulenc',
  
  // Modern Pop
  'Zaz', 'Pomme', 'Clara Luciani', 'Juliette Armanet', 'Louane',
  'Vianney', 'Amir', 'Kendji Girac', 'Jain', 'Christine and the Queens'
];

export const useFranseReleases = () => {
  return useQuery({
    queryKey: ['franse-releases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cd_scan')
        .select('id, artist, title, year, genre, format, label, country, front_image, discogs_id')
        .eq('country', 'France')
        .not('front_image', 'is', null)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching French releases:', error);
        throw error;
      }

      return (data || []) as FranseRelease[];
    },
  });
};

export const useFranseVerhalen = () => {
  return useQuery({
    queryKey: ['franse-verhalen'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, slug, markdown_content, yaml_frontmatter, album_cover_url, published_at, views_count')
        .eq('is_published', true)
        .order('published_at', { ascending: false });

      if (error) {
        console.error('Error fetching French stories:', error);
        throw error;
      }

      // Filter for French artists
      const frenchPosts = (data || []).filter(post => {
        const frontmatter = post.yaml_frontmatter as any;
        const artist = frontmatter?.artist || '';
        return FRENCH_ARTISTS.some(fa => 
          artist.toLowerCase().includes(fa.toLowerCase()) ||
          fa.toLowerCase().includes(artist.toLowerCase())
        );
      });

      return frenchPosts as FransBlogPost[];
    },
  });
};

export const useFranseArtiesten = () => {
  return useQuery({
    queryKey: ['franse-artiesten'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artist_stories')
        .select('id, artist_name, slug, biography, artwork_url, music_style')
        .eq('is_published', true);

      if (error) {
        console.error('Error fetching French artists:', error);
        throw error;
      }

      // Filter for French artists
      const frenchArtists = (data || []).filter(artist =>
        FRENCH_ARTISTS.some(fa => 
          artist.artist_name.toLowerCase().includes(fa.toLowerCase()) ||
          fa.toLowerCase().includes(artist.artist_name.toLowerCase())
        )
      );

      return frenchArtists as FranseArtiest[];
    },
  });
};

export const useFranseGenres = () => {
  return useQuery({
    queryKey: ['franse-genres'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cd_scan')
        .select('genre')
        .eq('country', 'France')
        .not('genre', 'is', null);

      if (error) {
        console.error('Error fetching French genres:', error);
        throw error;
      }

      // Count genres
      const genreCounts: Record<string, number> = {};
      (data || []).forEach(item => {
        if (item.genre) {
          const genre = item.genre.trim();
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        }
      });

      // Sort by count and return top 12
      return Object.entries(genreCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([genre, count]) => ({ genre, count }));
    },
  });
};

export const useFranseStats = () => {
  return useQuery({
    queryKey: ['franse-stats'],
    queryFn: async () => {
      // Get French releases count
      const { count: releasesCount } = await supabase
        .from('cd_scan')
        .select('*', { count: 'exact', head: true })
        .eq('country', 'France');

      // Get blog posts and filter for French artists
      const { data: blogPosts } = await supabase
        .from('blog_posts')
        .select('yaml_frontmatter')
        .eq('is_published', true);

      const frenchPosts = (blogPosts || []).filter(post => {
        const frontmatter = post.yaml_frontmatter as any;
        const artist = frontmatter?.artist || '';
        return FRENCH_ARTISTS.some(fa => 
          artist.toLowerCase().includes(fa.toLowerCase())
        );
      });

      // Get French artists count
      const { data: artists } = await supabase
        .from('artist_stories')
        .select('artist_name')
        .eq('is_published', true);

      const frenchArtistsCount = (artists || []).filter(artist =>
        FRENCH_ARTISTS.some(fa => 
          artist.artist_name.toLowerCase().includes(fa.toLowerCase())
        )
      ).length;

      return {
        releases: releasesCount || 0,
        verhalen: frenchPosts.length,
        artiesten: frenchArtistsCount
      };
    },
  });
};
