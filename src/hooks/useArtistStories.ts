import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ArtistStory {
  id: string;
  artist_name: string;
  slug: string;
  story_content: string;
  biography?: string;
  music_style?: string[];
  notable_albums?: string[];
  cultural_impact?: string;
  artwork_url?: string;
  is_published: boolean;
  views_count: number;
  reading_time?: number;
  word_count?: number;
  meta_title?: string;
  meta_description?: string;
  created_at: string;
  published_at?: string;
  is_spotlight: boolean;
  spotlight_images?: any[];
  spotlight_description?: string;
  featured_products?: string[];
  discogs_artist_id?: number;
  user_id?: string;
  updated_at?: string;
  is_deep_dive?: boolean;
}

// List of known Dutch artists for filtering
const DUTCH_ARTISTS = [
  'Golden Earring', 'Within Temptation', 'André Hazes', 'Marco Borsato', 'Doe Maar',
  'Anouk', 'Tiësto', 'Armin van Buuren', 'Martin Garrix', 'BLØF', 'Guus Meeuwis',
  'De Dijk', 'Herman Brood', 'Boudewijn de Groot', 'Epica', 'Krezip', 'Kensington',
  'De Staat', 'Chef\'Special', 'Danny Vera', 'Ilse DeLange', 'Nick & Simon',
  'Davina Michelle', 'Floor Jansen', 'Hardwell', 'Afrojack', 'Nicky Romero',
  'Snollebollekes', 'Henk Poort', 'Gordon', 'Frans Bauer', 'Jan Smit', 'Gerard Joling',
  'Acda en de Munnik', 'Het Goede Doel', 'Racoon', 'DI-RECT', 'Cuby + Blizzards',
  'Shocking Blue', 'Focus', 'Kayak', 'Ekseption', 'Volbeat', 'Delain', 'After Forever',
  'The Gathering', 'Gorefest', 'Heidevolk', 'Asrai', 'Stream of Passion', 'ReVamp'
];

// List of known French artists for filtering
const FRENCH_ARTISTS = [
  'Édith Piaf', 'Edith Piaf', 'Charles Aznavour', 'Jacques Brel', 'Serge Gainsbourg',
  'Georges Brassens', 'Yves Montand', 'Gilbert Bécaud', 'Charles Trenet',
  'Dalida', 'Mireille Mathieu', 'Johnny Hallyday', 'Sylvie Vartan',
  'France Gall', 'Françoise Hardy', 'Jane Birkin', 'Michel Sardou',
  'Claude François', 'Léo Ferré', 'Barbara', 'Juliette Gréco',
  'Daft Punk', 'Air', 'Phoenix', 'M83', 'Justice',
  'Stromae', 'Christine and the Queens', 'Indochine', 'Téléphone',
  'Mylène Farmer', 'Vanessa Paradis', 'Alizée', 'Patricia Kaas',
  'Francis Cabrel', 'Jean-Jacques Goldman', 'Renaud', 'Alain Souchon',
  'David Guetta', 'Martin Solveig', 'Cassius', 'Bob Sinclar',
  'Laurent Garnier', 'Breakbot', 'Kavinsky', 'Gesaffelstein', 'Madeon',
  'MC Solaar', 'IAM', 'NTM', 'PNL', 'Booba', 'Nekfeu',
  'Orelsan', 'Bigflo & Oli', 'Angèle', 'Aya Nakamura',
  'Gojira', 'Alcest', 'Magma', 'Trust', 'Noir Désir',
  'Zaz', 'Pomme', 'Clara Luciani', 'Juliette Armanet', 'Louane'
];

interface UseArtistStoriesOptions {
  search?: string;
  genre?: string;
  country?: string;
  sortBy?: 'newest' | 'popular' | 'alphabetical';
  limit?: number;
}

export const useArtistStories = (options: UseArtistStoriesOptions = {}) => {
  const { search, genre, country, sortBy = 'newest', limit } = options;

  return useQuery({
    queryKey: ['artist-stories', search, genre, country, sortBy, limit],
    queryFn: async () => {
      let query = supabase
        .from('artist_stories')
        .select('*')
        .eq('is_published', true)
        .neq('is_deep_dive', true);

      // Apply search filter
      if (search) {
        query = query.or(`artist_name.ilike.%${search}%,biography.ilike.%${search}%`);
      }

      // Apply genre filter (case-insensitive)
      if (genre) {
        query = query.contains('music_style', [genre.toLowerCase()]);
      }

      // Apply country filter
      if (country === 'nederland') {
        query = query.in('artist_name', DUTCH_ARTISTS);
      } else if (country === 'frankrijk') {
        query = query.in('artist_name', FRENCH_ARTISTS);
      }

      // Apply sorting
      if (sortBy === 'newest') {
        query = query.order('published_at', { ascending: false });
      } else if (sortBy === 'popular') {
        query = query.order('views_count', { ascending: false });
      } else if (sortBy === 'alphabetical') {
        query = query.order('artist_name', { ascending: true });
      }

      // Apply limit
      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching artist stories:', error);
        throw error;
      }

      return data as ArtistStory[];
    },
  });
};

export const useArtistStory = (slug: string) => {
  return useQuery({
    queryKey: ['artist-story', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artist_stories')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (error) {
        console.error('Error fetching artist story:', error);
        throw error;
      }

      // Increment view count
      if (data) {
        await supabase
          .from('artist_stories')
          .update({ views_count: data.views_count + 1 })
          .eq('id', data.id);
      }

      return data as ArtistStory;
    },
  });
};

export const useArtistStoriesStats = () => {
  return useQuery({
    queryKey: ['artist-stories-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artist_stories')
        .select('music_style')
        .eq('is_published', true)
        .neq('is_deep_dive', true);

      if (error) {
        console.error('Error fetching artist stories stats:', error);
        throw error;
      }

      // Extract unique genres
      const genres = new Set<string>();
      data.forEach(story => {
        if (story.music_style) {
          story.music_style.forEach(genre => genres.add(genre));
        }
      });

      return {
        totalStories: data.length,
        genres: Array.from(genres).sort()
      };
    },
  });
};
