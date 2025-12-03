import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DANCE_HOUSE_FEITEN } from '@/data/danceHouseMuziekFeiten';

// 100+ Dance/House artiesten database
export const DANCE_HOUSE_ARTISTS = [
  // Pioneers & Legends
  'Frankie Knuckles', 'Larry Heard', 'Marshall Jefferson', 'Jesse Saunders',
  'Juan Atkins', 'Derrick May', 'Kevin Saunderson', 'Jeff Mills', 'Carl Craig',
  'Kraftwerk', 'Giorgio Moroder', 'Donna Summer',
  
  // Dutch Masters
  'Tiësto', 'Armin van Buuren', 'Martin Garrix', 'Hardwell', 'Afrojack',
  'Nicky Romero', 'Oliver Heldens', 'Don Diablo', 'Fedde Le Grand',
  'Ferry Corsten', 'Sander van Doorn', 'Laidback Luke', 'R3hab',
  'Showtek', 'W&W', 'Blasterjaxx', 'Lucas & Steve', 'Sam Feldt',
  'Mesto', 'Brooks', 'Julian Jordan', 'Mike Williams', 'Quintino',
  'Paul Elstak', 'DJ Darkraver', 'Thunderdome', 'Euromasters',
  
  // French House & Electro
  'Daft Punk', 'Justice', 'Cassius', 'Kavinsky', 'SebastiAn', 'Breakbot',
  'Bob Sinclar', 'David Guetta', 'Martin Solveig', 'Madeon', 'Gesaffelstein',
  
  // UK House & Garage
  'Disclosure', 'Fred Again..', 'Four Tet', 'Jamie xx', 'Bicep',
  'Basement Jaxx', 'Orbital', 'Underworld', 'The Prodigy', 'Chemical Brothers',
  'Fatboy Slim', 'Chase & Status', 'Sub Focus', 'Pendulum', 'Andy C',
  'MJ Cole', 'Todd Edwards', 'Artful Dodger', 'Craig David',
  
  // Global EDM
  'Calvin Harris', 'Skrillex', 'Deadmau5', 'Swedish House Mafia',
  'Axwell', 'Sebastian Ingrosso', 'Steve Angello', 'Eric Prydz', 'Avicii',
  'Zedd', 'Marshmello', 'Kygo', 'The Chainsmokers', 'Diplo',
  'Major Lazer', 'DJ Snake', 'Alesso', 'Porter Robinson',
  
  // Techno
  'Carl Cox', 'Richie Hawtin', 'Charlotte de Witte', 'Amelie Lens',
  'Nina Kraviz', 'Adam Beyer', 'Sven Väth', 'Paul Kalkbrenner',
  'Tale Of Us', 'Maceo Plex', 'Pan-Pot', 'Chris Liebing', 'Len Faki',
  'Ben Klock', 'Marcel Dettmann', 'Ellen Allien', 'Dr. Motte', 'Westbam',
  
  // Tech House
  'Fisher', 'CamelPhat', 'Solardo', 'Chris Lake', 'Green Velvet',
  'Patrick Topping', 'Hot Since 82', 'Jamie Jones', 'The Martinez Brothers',
  
  // Trance
  'Paul van Dyk', 'Paul Oakenfold', 'ATB', 'Above & Beyond', 'Dash Berlin',
  'Gareth Emery', 'Markus Schulz', 'Andrew Rayel', 'Cosmic Gate',
  'Giuseppe Ottaviani', 'Aly & Fila', 'John O\'Callaghan',
  
  // Belgian
  'Technotronic', '2 Unlimited', 'Front 242', 'Stromae',
  'Lost Frequencies', 'Netsky', 'Dimitri Vegas & Like Mike',
  
  // Classic Acts
  'A Guy Called Gerald', '808 State', 'The Shamen', 'Faithless',
  'Groove Armada', 'Moby', 'Leftfield', 'Massive Attack', 'Aphex Twin',
  
  // Contemporary
  'Peggy Gou', 'Honey Dijon', 'The Blessed Madonna', 'ANNA',
  'John Summit', 'Dom Dolla', 'Vintage Culture', 'Claptone',
  'Boris Brejcha', 'Solomun', 'Black Coffee', 'Dixon'
];

// Subgenres definitie
export const DANCE_HOUSE_SUBGENRES = [
  { 
    name: 'House', 
    description: 'Chicago roots, soulful en deep', 
    artists: ['Frankie Knuckles', 'Larry Heard', 'Disclosure', 'Fisher'],
    color: 'from-orange-500 to-amber-500'
  },
  { 
    name: 'Techno', 
    description: 'Detroit origins, industrieel en hypnotisch', 
    artists: ['Carl Cox', 'Charlotte de Witte', 'Amelie Lens', 'Adam Beyer'],
    color: 'from-slate-700 to-zinc-900'
  },
  { 
    name: 'Trance', 
    description: 'Melodisch en euforisch', 
    artists: ['Tiësto', 'Armin van Buuren', 'Paul van Dyk', 'Above & Beyond'],
    color: 'from-blue-500 to-cyan-400'
  },
  { 
    name: 'EDM', 
    description: 'Festival sound, big room', 
    artists: ['Martin Garrix', 'Hardwell', 'Swedish House Mafia', 'Avicii'],
    color: 'from-purple-500 to-pink-500'
  },
  { 
    name: 'French House', 
    description: 'Filtered disco, funky', 
    artists: ['Daft Punk', 'Justice', 'Cassius', 'Kavinsky'],
    color: 'from-red-500 to-rose-400'
  },
  { 
    name: 'UK Garage / Dubstep', 
    description: 'UK bass cultuur', 
    artists: ['Skrillex', 'Fred Again..', 'Disclosure', 'Chase & Status'],
    color: 'from-emerald-500 to-teal-500'
  }
];

// Stats hook
export const useDanceHouseStats = () => {
  return useQuery({
    queryKey: ['dance-house-stats'],
    queryFn: async () => {
      // Get artist stories count
      const { count: artistCount } = await supabase
        .from('artist_stories')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true)
        .or(DANCE_HOUSE_ARTISTS.slice(0, 50).map(a => `artist_name.ilike.%${a}%`).join(','));

      // Get music stories count
      const { count: storyCount } = await supabase
        .from('music_stories')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true)
        .or('genre.ilike.%house%,genre.ilike.%techno%,genre.ilike.%trance%,genre.ilike.%electronic%,genre.ilike.%dance%,genre.ilike.%edm%');

      return {
        totalArtists: DANCE_HOUSE_ARTISTS.length,
        totalFeiten: DANCE_HOUSE_FEITEN.length,
        artistStories: artistCount || 0,
        musicStories: storyCount || 0,
        subgenres: DANCE_HOUSE_SUBGENRES.length
      };
    },
    staleTime: 5 * 60 * 1000
  });
};

// Artiesten hook
export const useDanceHouseArtiesten = (limit = 8) => {
  return useQuery({
    queryKey: ['dance-house-artiesten', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artist_stories')
        .select('*')
        .eq('is_published', true)
        .or(DANCE_HOUSE_ARTISTS.slice(0, 50).map(a => `artist_name.ilike.%${a}%`).join(','))
        .order('views_count', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000
  });
};

// Verhalen hook
export const useDanceHouseVerhalen = (limit = 6) => {
  return useQuery({
    queryKey: ['dance-house-verhalen', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('music_stories')
        .select('*')
        .eq('is_published', true)
        .or('genre.ilike.%house%,genre.ilike.%techno%,genre.ilike.%trance%,genre.ilike.%electronic%,genre.ilike.%dance%,genre.ilike.%edm%,genre.ilike.%electro%')
        .order('published_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000
  });
};

// Releases hook (Spotify)
export const useDanceHouseReleases = (limit = 12) => {
  return useQuery({
    queryKey: ['dance-house-releases', limit],
    queryFn: async () => {
      // Filter Spotify releases by dance/house artists
      const { data, error } = await supabase
        .from('spotify_new_releases_processed')
        .select('*')
        .order('release_date', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Filter for dance artists
      const filtered = (data || []).filter(release => 
        DANCE_HOUSE_ARTISTS.some(artist => 
          release.artist?.toLowerCase().includes(artist.toLowerCase())
        )
      ).slice(0, limit);

      return filtered;
    },
    staleTime: 30 * 60 * 1000
  });
};

// Quiz vragen
export const DANCE_HOUSE_QUIZ_QUESTIONS = [
  {
    question: "In welke stad ontstond house muziek?",
    options: ["New York", "Chicago", "Detroit", "London"],
    correct: 1,
    explanation: "House muziek ontstond in de jaren '80 in Chicago, vernoemd naar de club 'The Warehouse'."
  },
  {
    question: "Wie wordt beschouwd als de 'Godfather of House'?",
    options: ["Tiësto", "Frankie Knuckles", "David Guetta", "Carl Cox"],
    correct: 1,
    explanation: "Frankie Knuckles wordt algemeen beschouwd als de Godfather of House vanwege zijn pionierswerk in The Warehouse."
  },
  {
    question: "Welk Nederlandse duo scoorde een wereldhit met 'No Limit'?",
    options: ["Showtek", "2 Unlimited", "W&W", "Blasterjaxx"],
    correct: 1,
    explanation: "2 Unlimited had een wereldwijde hit met 'No Limit' in 1993."
  },
  {
    question: "In welk jaar bracht Daft Punk 'Homework' uit?",
    options: ["1995", "1997", "1999", "2001"],
    correct: 1,
    explanation: "Homework werd uitgebracht in 1997 en markeerde de geboorte van French House."
  },
  {
    question: "Wie was de eerste DJ die optrad bij een Olympische openingsceremonie?",
    options: ["David Guetta", "Tiësto", "Armin van Buuren", "Paul Oakenfold"],
    correct: 1,
    explanation: "Tiësto was de eerste DJ die optrad bij de Olympische Spelen in Athene 2004."
  },
  {
    question: "Welke Nederlandse DJ werd als 17-jarige beroemd met 'Animals'?",
    options: ["Hardwell", "Afrojack", "Martin Garrix", "Oliver Heldens"],
    correct: 2,
    explanation: "Martin Garrix was pas 17 jaar oud toen 'Animals' wereldwijd #1 bereikte."
  },
  {
    question: "Waar vond de eerste Love Parade plaats?",
    options: ["Amsterdam", "Berlijn", "Londen", "Ibiza"],
    correct: 1,
    explanation: "De eerste Love Parade vond plaats in Berlijn in 1989, kort na de val van de muur."
  },
  {
    question: "Welk muziekinstrument is kenmerkend voor acid house?",
    options: ["Roland TR-808", "Roland TB-303", "Moog Minimoog", "Korg M1"],
    correct: 1,
    explanation: "De Roland TB-303 bassline synthesizer creëerde de karakteristieke 'acid' sound."
  },
  {
    question: "Welk Brits duo is bekend van 'Born Slippy .NUXX'?",
    options: ["Chemical Brothers", "Orbital", "Underworld", "Leftfield"],
    correct: 2,
    explanation: "Underworld's 'Born Slippy .NUXX' werd beroemd door de film Trainspotting."
  },
  {
    question: "Wat is de naam van Armin van Buuren's wekelijkse radioshow?",
    options: ["Essential Mix", "A State of Trance", "Group Therapy", "Cream"],
    correct: 1,
    explanation: "A State of Trance (ASOT) is sinds 2001 het populairste trance radioprogramma ter wereld."
  }
];
