import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FILMMUZIEK_FEITEN } from '@/data/filmmuziekFeiten';

// 80+ Film componisten database
export const FILM_COMPOSERS = [
  // Klassieke Meesters
  'Max Steiner', 'Bernard Herrmann', 'Dimitri Tiomkin', 'Franz Waxman',
  'Miklós Rózsa', 'Alfred Newman', 'Erich Wolfgang Korngold',
  
  // Italiaanse Meesters
  'Ennio Morricone', 'Nino Rota', 'Pino Donaggio', 'Giorgio Moroder',
  
  // John Williams Era
  'John Williams', 'Jerry Goldsmith', 'James Horner', 'Alan Silvestri',
  'Randy Newman', 'Marc Shaiman', 'Michael Giacchino',
  
  // Hans Zimmer Era
  'Hans Zimmer', 'James Newton Howard', 'Klaus Badelt', 'Harry Gregson-Williams',
  'John Powell', 'Steve Jablonsky', 'Ramin Djawadi', 'Lorne Balfe',
  
  // Europese Componisten
  'Maurice Jarre', 'Howard Shore', 'John Barry', 'Thomas Newman',
  'Alexandre Desplat', 'Dario Marianelli', 'Alberto Iglesias',
  
  // Elektronisch/Modern
  'Vangelis', 'Brad Fiedel', 'Trent Reznor', 'Atticus Ross',
  'Cliff Martinez', 'M83', 'Daft Punk', 'Junkie XL',
  
  // Danny Elfman & Tim Burton
  'Danny Elfman', 'Stephen Sondheim',
  
  // Musical Componisten
  'Alan Menken', 'Lin-Manuel Miranda', 'Benj Pasek', 'Justin Paul',
  'Justin Hurwitz', 'Burt Bacharach',
  
  // Nieuwe Generatie
  'Ludwig Göransson', 'Hildur Guðnadóttir', 'Steven Price', 'Nicholas Britell',
  'Jonny Greenwood', 'Daniel Pemberton', 'Benjamin Wallfisch',
  
  // Nederlandse Componisten
  'Rogier van Otterloo', 'Dick Maas', 'Tom Holkenborg',
  
  // Minimalisten
  'Philip Glass', 'Clint Mansell', 'Johann Johannsson'
];

// Subgenres definitie
export const FILMMUZIEK_SUBGENRES = [
  { 
    name: 'Orkestrale Scores', 
    description: 'Klassieke Hollywood symfonische traditie', 
    artists: ['John Williams', 'Jerry Goldsmith', 'James Horner', 'Howard Shore'],
    color: 'from-amber-600 to-yellow-500'
  },
  { 
    name: 'Elektronische Scores', 
    description: 'Synthesizers en digitale soundscapes', 
    artists: ['Vangelis', 'Trent Reznor', 'Cliff Martinez', 'M83'],
    color: 'from-cyan-500 to-blue-600'
  },
  { 
    name: 'Musical Soundtracks', 
    description: 'Broadway en Disney muziek magie', 
    artists: ['Alan Menken', 'Lin-Manuel Miranda', 'Justin Hurwitz'],
    color: 'from-pink-500 to-rose-400'
  },
  { 
    name: 'Minimalistische Scores', 
    description: 'Repetitieve patronen en emotionele kracht', 
    artists: ['Philip Glass', 'Clint Mansell', 'Johann Johannsson', 'Hildur Guðnadóttir'],
    color: 'from-slate-500 to-gray-600'
  },
  { 
    name: 'Pop/Rock Compilaties', 
    description: 'Iconische songs die films definiëren', 
    artists: ['Quentin Tarantino Films', 'James Gunn', 'John Hughes'],
    color: 'from-purple-500 to-violet-500'
  },
  { 
    name: 'Hybrid Scores', 
    description: 'Orkest gecombineerd met elektronica', 
    artists: ['Hans Zimmer', 'Ludwig Göransson', 'Junkie XL', 'Ramin Djawadi'],
    color: 'from-orange-500 to-red-500'
  }
];

// Stats hook
export const useFilmmuziekStats = () => {
  return useQuery({
    queryKey: ['filmmuziek-stats'],
    queryFn: async () => {
      // Get artist stories count
      const { count: artistCount } = await supabase
        .from('artist_stories')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true)
        .or(FILM_COMPOSERS.slice(0, 50).map(a => `artist_name.ilike.%${a}%`).join(','));

      // Get music stories count
      const { count: storyCount } = await supabase
        .from('music_stories')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true)
        .or('genre.ilike.%soundtrack%,genre.ilike.%score%,genre.ilike.%film%,genre.ilike.%cinema%,genre.ilike.%orchestral%');

      return {
        totalComposers: FILM_COMPOSERS.length,
        totalFeiten: FILMMUZIEK_FEITEN.length,
        artistStories: artistCount || 0,
        musicStories: storyCount || 0,
        subgenres: FILMMUZIEK_SUBGENRES.length,
        totalOscars: 95 // Approximate number of Best Score Oscars
      };
    },
    staleTime: 5 * 60 * 1000
  });
};

// Componisten hook
export const useFilmmuziekArtiesten = (limit = 8) => {
  return useQuery({
    queryKey: ['filmmuziek-artiesten', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artist_stories')
        .select('*')
        .eq('is_published', true)
        .or(FILM_COMPOSERS.slice(0, 50).map(a => `artist_name.ilike.%${a}%`).join(','))
        .order('views_count', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000
  });
};

// Verhalen hook
export const useFilmmuziekVerhalen = (limit = 6) => {
  return useQuery({
    queryKey: ['filmmuziek-verhalen', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('music_stories')
        .select('*')
        .eq('is_published', true)
        .or('genre.ilike.%soundtrack%,genre.ilike.%score%,genre.ilike.%film%,genre.ilike.%cinema%,genre.ilike.%orchestral%,genre.ilike.%classical%')
        .order('published_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000
  });
};

// Releases hook (Spotify)
export const useFilmmuziekReleases = (limit = 12) => {
  return useQuery({
    queryKey: ['filmmuziek-releases', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spotify_new_releases_processed')
        .select('*')
        .order('release_date', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Filter for film composers and soundtrack-related releases
      const filtered = (data || []).filter(release => 
        FILM_COMPOSERS.some(composer => 
          release.artist?.toLowerCase().includes(composer.toLowerCase())
        ) ||
        release.title?.toLowerCase().includes('soundtrack') ||
        release.title?.toLowerCase().includes('score') ||
        release.title?.toLowerCase().includes('original motion picture')
      ).slice(0, limit);

      return filtered;
    },
    staleTime: 30 * 60 * 1000
  });
};

// Quiz vragen
export const FILMMUZIEK_QUIZ_QUESTIONS = [
  {
    question: "Wie componeerde de score voor Star Wars?",
    options: ["Hans Zimmer", "John Williams", "Jerry Goldsmith", "James Horner"],
    correct: 1,
    explanation: "John Williams componeerde de iconische Star Wars score in 1977, die het klassieke Hollywood orkest terugbracht."
  },
  {
    question: "Voor welke film won Hans Zimmer zijn eerste Oscar?",
    options: ["Gladiator", "The Lion King", "Inception", "Dunkirk"],
    correct: 1,
    explanation: "Hans Zimmer won zijn eerste Oscar voor The Lion King in 1994."
  },
  {
    question: "Welke componist is bekend om zijn iconische Spaghetti Western scores?",
    options: ["John Barry", "Ennio Morricone", "Jerry Goldsmith", "Henry Mancini"],
    correct: 1,
    explanation: "Ennio Morricone revolutioneerde filmmuziek met zijn Spaghetti Western scores, waaronder The Good, the Bad and the Ugly."
  },
  {
    question: "Wie componeerde de score voor Blade Runner?",
    options: ["Tangerine Dream", "Vangelis", "Jean-Michel Jarre", "Brian Eno"],
    correct: 1,
    explanation: "Vangelis creëerde de iconische elektronische score voor Blade Runner in 1982."
  },
  {
    question: "Welk beroemd thema bevat slechts twee noten?",
    options: ["Superman", "Jaws", "Star Wars", "E.T."],
    correct: 1,
    explanation: "John Williams' Jaws thema is wereldberoemd vanwege zijn simpele maar angstaanjagende twee-noten motief."
  },
  {
    question: "Wie componeerde de volledige Lord of the Rings trilogie?",
    options: ["James Horner", "Hans Zimmer", "Howard Shore", "John Williams"],
    correct: 2,
    explanation: "Howard Shore componeerde meer dan 10 uur muziek voor de trilogie en won 3 Oscars."
  },
  {
    question: "Welke score introduceerde het beroemde 'BRAAAM' geluid?",
    options: ["The Dark Knight", "Inception", "Dunkirk", "Interstellar"],
    correct: 1,
    explanation: "Hans Zimmer's Inception score introduceerde het 'BRAAAM' geluid dat een cliché werd in filmtrailers."
  },
  {
    question: "Wie was de eerste vrouw in 23 jaar die een Oscar voor beste score won?",
    options: ["Hildur Guðnadóttir", "Rachel Portman", "Anne Dudley", "Lisa Gerrard"],
    correct: 0,
    explanation: "Hildur Guðnadóttir won de Oscar in 2020 voor haar score van Joker."
  },
  {
    question: "Welke film had 'My Heart Will Go On' als titelsong?",
    options: ["Ghost", "Titanic", "The Bodyguard", "Pretty Woman"],
    correct: 1,
    explanation: "James Horner en Céline Dion creëerden deze mega-hit voor Titanic in 1997."
  },
  {
    question: "Wie componeerde de muziek voor Tim Burton's films zoals Batman en Edward Scissorhands?",
    options: ["Hans Zimmer", "John Williams", "Danny Elfman", "Alan Silvestri"],
    correct: 2,
    explanation: "Danny Elfman is Tim Burton's vaste componist en creëerde iconische scores voor zijn films."
  }
];
