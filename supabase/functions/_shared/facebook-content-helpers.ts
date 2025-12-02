// ============================================
// FACEBOOK CONTENT HELPERS
// Shared utilities for dynamic Facebook posts
// ============================================

// Utility functies
export function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function shuffleArray<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

// ============================================
// ARTIEST FACEBOOK PAGE MAPPING (~200+ artiesten)
// ============================================
export const artistFacebookPages: Record<string, string> = {
  // INTERNATIONALE ARTIESTEN (Rock & Classic Rock)
  'AC/DC': 'acdc',
  'Accept': 'accepttheband',
  'Aerosmith': 'Aerosmith',
  'Alice Cooper': 'AliceCooper',
  'Alice In Chains': 'aliceinchains',
  'Arctic Monkeys': 'ArcticMonkeys',
  'Black Sabbath': 'BlackSabbath',
  'Bon Jovi': 'BonJovi',
  'Bruce Springsteen': 'brucespringsteen',
  'Bryan Adams': 'bryanadams',
  'Buffalo Springfield': 'BuffaloSpringfield',
  'Cream': 'CreamOfficial',
  'Creedence Clearwater Revival': 'ccr',
  'Deep Purple': 'officialdeeppurple',
  'Def Leppard': 'DefLeppard',
  'Dire Straits': 'direstraits',
  'Eagles': 'EaglesBand',
  'Eric Clapton': 'ericclapton',
  'Fleetwood Mac': 'FleetwoodMac',
  'Foo Fighters': 'foofighters',
  'Genesis': 'genesis',
  'Green Day': 'GreenDay',
  'Guns N\' Roses': 'gunsnroses',
  'Heart': 'heart',
  'Iron Maiden': 'ironmaiden',
  'Jackson Browne': 'JacksonBrowne',
  'Jane\'s Addiction': 'janesaddiction',
  'Jefferson Airplane': 'JeffersonAirplane',
  'Jethro Tull': 'jethrotull',
  'Jimi Hendrix': 'jimihendrix',
  'Joan Jett & The Blackhearts': 'joanjett',
  'Journey': 'journeymusicofficial',
  'Judas Priest': 'OfficialJudasPriest',
  'King Crimson': 'KingCrimsonOfficial',
  'Kiss': 'KISS',
  'Led Zeppelin': 'ledzeppelin',
  'Linkin Park': 'linkinpark',
  'Lynyrd Skynyrd': 'lynyrdskynyrd',
  'Metallica': 'Metallica',
  'Mötley Crüe': 'motleycrue',
  'Motörhead': 'OfficialMotorhead',
  'Neil Young': 'NeilYoung',
  'Nirvana': 'Nirvana',
  'Oasis': 'oasisofficial',
  'Pearl Jam': 'PearlJam',
  'Pink Floyd': 'pinkfloyd',
  'Queen': 'Queen',
  'Radiohead': 'radiohead',
  'R.E.M.': 'REMhq',
  'Red Hot Chili Peppers': 'ChiliPeppers',
  'Rush': 'rushtheband',
  'Santana': 'carlossantana',
  'Scorpions': 'Scorpions',
  'The Beatles': 'thebeatles',
  'The Byrds': 'TheByrdsOfficial',
  'The Cure': 'thecure',
  'The Doors': 'thedoors',
  'The Rolling Stones': 'therollingstones',
  'The Who': 'thewho',
  'Tom Petty': 'tompetty',
  'U2': 'u2',
  'Van Halen': 'VanHalen',
  'Yes': 'yestheband',
  'ZZ Top': 'ZZTop',

  // METAL & HARD ROCK
  'Amon Amarth': 'amonamarth',
  'Anthrax': 'anthrax',
  'Arch Enemy': 'archenemyofficial',
  'Bad Religion': 'badreligion',
  'Black Flag': 'BlackFlagBand',
  'Blink-182': 'blink182',
  'Dead Kennedys': 'DeadKennedysOfficial',
  'Deftones': 'deftones',
  'Disturbed': 'Disturbed',
  'Epica': 'Epica',
  'Evanescence': 'evanescence',
  'Fall Out Boy': 'falloutboy',
  'Fugazi': 'fugazi',
  'In Flames': 'inflames',
  'Korn': 'Korn',
  'Megadeth': 'Megadeth',
  'Minor Threat': 'MinorThreat',
  'Nightwish': 'nightwish',
  'NOFX': 'nofxofficial',
  'Opeth': 'Opeth',
  'Poison': 'poisonofficial',
  'Slayer': 'slayer',
  'Sum 41': 'sum41',
  'Within Temptation': 'wtofficial',

  // POP & SOUL
  'ABBA': 'ABBA',
  'Adele': 'adele',
  'Aretha Franklin': 'arethafranklin',
  'Bee Gees': 'beegees',
  'Beyoncé': 'beyonce',
  'Billie Eilish': 'billieeilish',
  'Billy Joel': 'billyjoel',
  'Bruno Mars': 'brunomars',
  'Carole King': 'CaroleKing',
  'Céline Dion': 'celinedion',
  'Coldplay': 'coldplay',
  'Culture Club': 'CultureClubOfficial',
  'David Bowie': 'davidbowie',
  'Dolly Parton': 'DollyParton',
  'Drake': 'Drake',
  'Duran Duran': 'duranduran',
  'Ed Sheeran': 'EdSheeranMusic',
  'Elton John': 'EltonJohn',
  'Elvis Presley': 'elvis',
  'Eminem': 'eminem',
  'Eurythmics': 'eurythmics',
  'Frank Sinatra': 'franksinatra',
  'George Michael': 'georgemichael',
  'Harry Styles': 'harrystyles',
  'James Brown': 'jamesbrown',
  'Janis Joplin': 'janisjoplin',
  'Justin Timberlake': 'justintimberlake',
  'Lady Gaga': 'ladygaga',
  'Madonna': 'madonna',
  'Mariah Carey': 'mariahcarey',
  'Marvin Gaye': 'MarvinGaye',
  'Michael Jackson': 'michaeljackson',
  'Phil Collins': 'philcollins',
  'Prince': 'prince',
  'Rihanna': 'rihanna',
  'Stevie Wonder': 'steviewonder',
  'Taylor Swift': 'TaylorSwift',
  'Whitney Houston': 'whitneyhouston',

  // ALTERNATIVE & INDIE
  'Arcade Fire': 'arcadefire',
  'Bauhaus': 'bauhaus',
  'Björk': 'bjork',
  'Blondie': 'BlondieOfficial',
  'Blur': 'blur',
  'Bon Iver': 'boniver',
  'Cocteau Twins': 'cocteautwins',
  'Dead Can Dance': 'DeadCanDance',
  'Depeche Mode': 'depechemode',
  'Dinosaur Jr.': 'dinosaurjr',
  'Echo & the Bunnymen': 'OfficialEATB',
  'Fleet Foxes': 'FleetFoxes',
  'Franz Ferdinand': 'franz',
  'Interpol': 'interpol',
  'Joy Division': 'joydivision',
  'MGMT': 'whoismgmt',
  'Mogwai': 'mogwai',
  'My Bloody Valentine': 'MyBloodyValentine',
  'New Order': 'neworderofficial',
  'Pavement': 'pavementband',
  'Pet Shop Boys': 'petshopboys',
  'Ride': 'rideuk',
  'Slowdive': 'slowdiveofficial',
  'The Mission': 'TheMissionUK',
  'Tortoise': 'tortoiseband',

  // ELECTRONIC & DJ
  'A-ha': 'aha',
  'Aphex Twin': 'AphexTwin',
  'Armin van Buuren': 'arminvanbuuren',
  'Autechre': 'autechre',
  'Avicii': 'avicii',
  'Boards Of Canada': 'boardsofcanada',
  'Calvin Harris': 'CalvinHarris',
  'Daft Punk': 'daftpunk',
  'David Guetta': 'DavidGuetta',
  'Faithless': 'faithless',
  'Kraftwerk': 'Kraftwerk',
  'Martin Garrix': 'martingarrix',
  'Massive Attack': 'massiveattack',
  'Tiësto': 'tiesto',

  // HIP HOP & RAP
  'Coolio': 'Coolio',
  '2Pac': '2pac',
  'Kanye West': 'kanyewest',
  'Kendrick Lamar': 'kendricklamar',
  'Nas': 'Nas',
  'Notorious B.I.G.': 'TheNotoriousBIG',
  'OutKast': 'outkast',
  'Snoop Dogg': 'snoopdogg',

  // JAZZ & BLUES
  'B.B. King': 'BBKing',
  'John Coltrane': 'JohnColtraneOfficial',
  'Miles Davis': 'milesdavis',
  'Gary Moore': 'garymooreofficial',

  // REGGAE & WORLD
  'Bob Dylan': 'bobdylan',
  'Bob Marley & The Wailers': 'bobmarley',
  'Bob Marley': 'bobmarley',
  'Leonard Cohen': 'leonardcohen',
  'Joni Mitchell': 'jonimitchell',

  // NEDERLANDSE ARTIESTEN
  'Acda & De Munnik': 'AcdaEnDeMunnik',
  'André Hazes': 'AndreHazesJr',
  'André Hazes Jr.': 'AndreHazesJr',
  'Anouk': 'AnoukOfficial',
  'BLØF': 'BLOF',
  'Boudewijn de Groot': 'BoudewijndeGroot',
  'Chef\'Special': 'chefspecial',
  'Claw Boys Claw': 'ClawBoysClaw',
  'Cuby & the Blizzards': 'CubyAndTheBlizzards',
  'Danny Vera': 'DannyVera',
  'De Dijk': 'DeDijk',
  'De Jeugd Van Tegenwoordig': 'dejeugdvantegenwoordig',
  'De Staat': 'DeStaat',
  'Diggy Dex': 'DiggyDex',
  'DI-RECT': 'DIRECTband',
  'Doe Maar': 'doemaar',
  'Golden Earring': 'GoldenEarringOfficial',
  'Goldband': 'goldbandofficial',
  'Guus Meeuwis': 'GuusMeeuwis',
  'Herman Brood & His Wild Romance': 'HermanBrood',
  'Ilse DeLange': 'IlseDeLangeOfficial',
  'Kensington': 'kensingtonband',
  'Krezip': 'krezipmusic',
  'Marco Borsato': 'MarcoBorsatoOfficieel',
  'Afrojack': 'djafrojack',
  'BZN': 'BZNOfficial',

  // KLASSIEK & CROSSOVER
  'Andrea Bocelli': 'andreabocelli',
  'Helene Fischer': 'HeleneFischer',
};

// ============================================
// STUDIO FACEBOOK PAGE MAPPING
// ============================================
export const studioFacebookPages: Record<string, string> = {
  // Legendarische Studio's
  'Abbey Road': 'AbbeyRoadStudios',
  'Electric Lady': 'ElectricLadyStudios',
  'Sunset Sound': 'SunsetSoundRecorders',
  'Capitol Studios': 'CapitolStudios',
  'Muscle Shoals': 'MuscleShosalsSound',
  'Sun Studio': 'SunStudio',
  'Motown': 'Motown',
  'Chess Records': 'ChessRecords',
  'Olympic Studios': 'olympicstudios',
  'Trident Studios': 'TridentStudios',
  'Record Plant': 'RecordPlantStudios',
  'Power Station': 'ThePowerStation',
  'Hansa Studios': 'HansaStudios',
  'Hit Factory': 'HitFactoryNYC',
  'Sound City': 'SoundCityStudios',
  'A&M Studios': 'AMStudios',
  'Criteria Studios': 'CriteriaStudios',
  'United Western': 'UnitedWesternRecorders',
  'Gold Star Studios': 'GoldStarStudios',
  'Compass Point': 'CompassPointStudios',
  'Air Studios': 'AIRStudiosLondon',
  'Real World Studios': 'RealWorldStudios',
  'Rockfield Studios': 'RockfieldStudios',
  'Ridge Farm': 'RidgeFarmStudio',
  'Polar Studios': 'PolarStudios',
  
  // Nederlandse Studio's
  'Wisseloord': 'WisseloordStudios',
  'Galaxy Studios': 'GalaxyStudios',
  'Electric Monkey': 'ElectricMonkeyStudio',
  
  // Labels
  'Atlantic Records': 'atlanticrecords',
  'Columbia Records': 'ColumbiaRecords',
  'Warner Records': 'warnerrecords',
  'Sony Music': 'sonymusic',
  'Universal Music': 'universalmusic',
  'EMI': 'EMI',
  'Decca Records': 'DeccaRecords',
  'Virgin Records': 'VirginRecords',
  'Island Records': 'IslandRecords',
  'Def Jam': 'defjam',
  'Interscope': 'interscope',
  'Sub Pop': 'subpop',
};

// ============================================
// GENRE DETECTION
// ============================================
export function detectGenre(artist: string, description: string, tags?: string[]): string | null {
  const text = `${artist} ${description} ${(tags || []).join(' ')}`.toLowerCase();
  
  if (text.match(/metal|heavy|thrash|death|black metal/)) return 'metal';
  if (text.match(/rock|guitar|band|classic rock/)) return 'rock';
  if (text.match(/pop|hit|chart|mainstream/)) return 'pop';
  if (text.match(/hip.?hop|rap|emcee|rapper/)) return 'hiphop';
  if (text.match(/jazz|swing|bebop|fusion/)) return 'jazz';
  if (text.match(/classical|symphony|orchestra|composer/)) return 'classical';
  if (text.match(/electronic|edm|techno|house|trance|dj/)) return 'electronic';
  if (text.match(/country|nashville|americana/)) return 'country';
  if (text.match(/soul|r&b|motown|funk/)) return 'soul';
  if (text.match(/disco|groove|dance/)) return 'disco';
  if (text.match(/punk|hardcore|grunge/)) return 'punk';
  if (text.match(/reggae|ska|dub|roots/)) return 'reggae';
  if (text.match(/blues|delta|chicago blues/)) return 'blues';
  if (text.match(/indie|alternative|shoegaze/)) return 'indie';
  
  return null;
}

// ============================================
// DECADE DETECTION
// ============================================
export function detectDecade(year: number): string | null {
  if (year >= 1950 && year < 1960) return '50s';
  if (year >= 1960 && year < 1970) return '60s';
  if (year >= 1970 && year < 1980) return '70s';
  if (year >= 1980 && year < 1990) return '80s';
  if (year >= 1990 && year < 2000) return '90s';
  if (year >= 2000 && year < 2010) return '2000s';
  if (year >= 2010 && year < 2020) return '2010s';
  if (year >= 2020) return '2020s';
  return null;
}

// ============================================
// SMART HASHTAG BUILDER (MAX 5)
// ============================================
export function buildSmartHashtags(options: {
  artist?: string;
  genre?: string | null;
  year?: number;
  category?: 'release' | 'history' | 'story' | 'video' | 'news';
  isVinyl?: boolean;
}): string[] {
  const hashtags: string[] = [];
  
  // 1. BRANDED HASHTAG (altijd)
  hashtags.push('#MusicScan');
  
  // 2. ARTIEST HASHTAG (1-2x)
  if (options.artist) {
    const artistHashtag = options.artist
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .split(' ')
      .filter(w => w.length > 0)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join('');
    if (artistHashtag && artistHashtag.length > 2) {
      hashtags.push(`#${artistHashtag}`);
    }
  }
  
  // 3. GENRE/CONTEXT HASHTAG (1x)
  const genreHashtags: Record<string, string[]> = {
    'rock': ['#ClassicRock', '#RockMusic', '#RockHistory'],
    'pop': ['#PopMusic', '#PopHits', '#PopClassics'],
    'hiphop': ['#HipHop', '#RapMusic', '#HipHopClassics'],
    'jazz': ['#Jazz', '#JazzMusic', '#JazzClassics'],
    'electronic': ['#ElectronicMusic', '#EDM', '#DanceMusic'],
    'metal': ['#MetalMusic', '#HeavyMetal', '#MetalClassics'],
    'soul': ['#SoulMusic', '#RnB', '#SoulClassics'],
    'disco': ['#DiscoMusic', '#Disco', '#FunkMusic'],
    'punk': ['#PunkRock', '#PunkMusic', '#Grunge'],
    'reggae': ['#ReggaeMusic', '#Reggae', '#Roots'],
    'blues': ['#BluesMusic', '#Blues', '#BluesRock'],
    'indie': ['#IndieMusic', '#Alternative', '#IndieRock'],
  };
  
  if (options.genre && genreHashtags[options.genre]) {
    hashtags.push(randomPick(genreHashtags[options.genre]));
  } else if (options.isVinyl) {
    hashtags.push(randomPick(['#Vinyl', '#LPCollection', '#VinylRecords', '#VinylCommunity']));
  } else if (options.category === 'history') {
    hashtags.push(randomPick(['#MusicHistory', '#OnThisDay', '#MuziekGeschiedenis']));
  } else if (options.category === 'video') {
    hashtags.push(randomPick(['#MusicVideo', '#BehindTheMusic', '#MusicDocumentary']));
  }
  
  // 4. DECADE HASHTAG (indien relevant)
  if (options.year && hashtags.length < 4) {
    const decade = detectDecade(options.year);
    const decadeHashtags: Record<string, string> = {
      '50s': '#50sMusic',
      '60s': '#60sMusic',
      '70s': '#70sMusic',
      '80s': '#80sMusic',
      '90s': '#90sMusic',
      '2000s': '#2000sMusic',
    };
    if (decade && decadeHashtags[decade]) {
      hashtags.push(decadeHashtags[decade]);
    }
  }
  
  // 5. EVERGREEN HASHTAG (1x, als nog ruimte)
  if (hashtags.length < 5) {
    const evergreen = ['#NowPlaying', '#MusicLovers', '#MusicCommunity', '#MustListen', '#BehindTheMusic'];
    hashtags.push(randomPick(evergreen));
  }
  
  return hashtags.slice(0, 5);
}

// ============================================
// ARTIEST @TAG BUILDER
// ============================================
export function getArtistTag(artistName: string): string | null {
  // Direct match
  if (artistFacebookPages[artistName]) {
    return `@${artistFacebookPages[artistName]}`;
  }
  
  // Case-insensitive match
  const lowerName = artistName.toLowerCase();
  for (const [key, value] of Object.entries(artistFacebookPages)) {
    if (key.toLowerCase() === lowerName) {
      return `@${value}`;
    }
  }
  
  // Partial match
  for (const [key, value] of Object.entries(artistFacebookPages)) {
    if (artistName.toLowerCase().includes(key.toLowerCase()) || 
        key.toLowerCase().includes(artistName.toLowerCase())) {
      return `@${value}`;
    }
  }
  
  return null;
}

// ============================================
// STUDIO @TAG BUILDER
// ============================================
export function getStudioTag(text: string): string | null {
  const lowerText = text.toLowerCase();
  
  for (const [studio, page] of Object.entries(studioFacebookPages)) {
    if (lowerText.includes(studio.toLowerCase())) {
      return `@${page}`;
    }
  }
  
  return null;
}

// ============================================
// RANDOM TEKST VARIATIES
// ============================================
export const introVariations = {
  musicHistory: [
    '📅 Wist je dat...',
    '🕰️ Op deze dag in de muziekgeschiedenis...',
    '✨ Vandaag herdenken we...',
    '🎵 Een muzikaal moment uit het verleden...',
    '📆 Terugblik: Op deze datum...',
    '🌟 Historisch muziekmoment...',
    '💫 Uit de muziekarchieven...',
    '🎶 Muziekgeschiedenis vandaag...',
    '⏰ Tijdreis door de muziek...',
    '🎼 Een iconisch moment...',
    '📻 Vandaag, jaren geleden...',
    '🎸 Rock history reminder...',
  ],
  youtube: [
    '🎬 Nieuw ontdekt!',
    '▶️ Check dit uit:',
    '🎥 Muziek moment:',
    '📺 Bekijk nu:',
    '🎵 Pareltje gevonden:',
    '✨ Dit moet je zien:',
    '🔥 Topvideo:',
    '🎤 Geweldige vondst:',
    '💎 Hidden gem:',
    '🌟 Aanrader:',
  ],
  generic: [
    '🎵 Muzieknieuws:',
    '📰 Just in:',
    '✨ Nieuw verhaal:',
    '🎶 Check dit:',
    '💿 Plaat spotlight:',
    '📖 Lees dit:',
    '🔊 Sound check:',
  ],
};

export const ctaVariations = {
  musicHistory: [
    '👉 Ontdek meer muziekgeschiedenis op',
    '🔗 Lees verder op',
    '📖 Meer verhalen op',
    '🎵 Verken de muziekgeschiedenis op',
    '✨ Duik dieper in de historie op',
    '💫 Meer ontdekken?',
    '🎶 Verken meer op',
    '📚 Lees het hele verhaal op',
  ],
  youtube: [
    '👉 Ontdek meer op',
    '🎵 Meer muziekvideo\'s op',
    '✨ Bekijk onze collectie op',
    '🔗 Meer ontdekkingen op',
    '🎬 Meer video\'s op',
  ],
  generic: [
    '👉 Lees meer op',
    '🔗 Bekijk op',
    '✨ Ontdek meer op',
    '📖 Volledig artikel op',
  ],
};

// Profiel mention (altijd toevoegen aan einde)
export const profileMention = '\n\n📌 Via Rogier Visser: https://www.facebook.com/profile.php?id=100086154933382';
