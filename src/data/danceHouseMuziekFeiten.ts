export interface DanceHouseFeit {
  year: number;
  title: string;
  description: string;
  decade: string;
  slug: string;
  youtubeId?: string;
  famousTrack?: string;
  spotifyUri?: string;
  imageUrl?: string;
  historicalContext?: string;
  relatedArtists?: string[];
  subgenre?: string;
}

export const DANCE_HOUSE_FEITEN: DanceHouseFeit[] = [
  // Jaren '80
  {
    year: 1981,
    title: "Kraftwerk - Computer World",
    description: "Het Duitse Kraftwerk brengt Computer World uit, een album dat de basis legt voor alle elektronische dansmuziek die zou volgen.",
    decade: "80s",
    slug: "kraftwerk-computer-world-1981",
    youtubeId: "ZtWTUt2RZh0",
    famousTrack: "Computer Love",
    relatedArtists: ["Kraftwerk"],
    subgenre: "Synth-pop",
    historicalContext: "Dit album inspireerde generaties producers en wordt beschouwd als een van de meest invloedrijke elektronische albums ooit."
  },
  {
    year: 1984,
    title: "The Warehouse opent in Chicago",
    description: "Frankie Knuckles begint te draaien in The Warehouse club in Chicago, waar de term 'house music' zijn oorsprong vindt.",
    decade: "80s",
    slug: "the-warehouse-chicago-1984",
    youtubeId: "LOLE1YH5J2s",
    famousTrack: "Your Love",
    relatedArtists: ["Frankie Knuckles", "Larry Heard", "Marshall Jefferson"],
    subgenre: "Chicago House",
    historicalContext: "The Warehouse was een underground club waar voornamelijk zwarte en gay gemeenschappen samenkwamen."
  },
  {
    year: 1986,
    title: "Farley 'Jackmaster' Funk - Love Can't Turn Around",
    description: "Een van de eerste house tracks die de UK charts bereikt en house muziek naar een breder publiek brengt.",
    decade: "80s",
    slug: "love-cant-turn-around-1986",
    youtubeId: "GIa4e-2VYxQ",
    famousTrack: "Love Can't Turn Around",
    relatedArtists: ["Farley Jackmaster Funk", "Jesse Saunders"],
    subgenre: "Chicago House"
  },
  {
    year: 1987,
    title: "Phuture - Acid Tracks",
    description: "DJ Pierre, Spanky en Herb J brengen onder de naam Phuture de eerste acid house track uit, gemaakt met de Roland TB-303.",
    decade: "80s",
    slug: "phuture-acid-tracks-1987",
    youtubeId: "DApPFePIoLQ",
    famousTrack: "Acid Tracks",
    relatedArtists: ["Phuture", "DJ Pierre"],
    subgenre: "Acid House",
    historicalContext: "De TB-303 bassline synthesizer was oorspronkelijk bedoeld voor gitaristen maar werd de signature sound van acid house."
  },
  {
    year: 1988,
    title: "Second Summer of Love",
    description: "Acid house explodeert in het Verenigd Koninkrijk met illegale raves en warehouse parties die een culturele revolutie ontketenen.",
    decade: "80s",
    slug: "second-summer-of-love-1988",
    youtubeId: "NVpbMwKPRro",
    famousTrack: "Voodoo Ray",
    relatedArtists: ["A Guy Called Gerald", "808 State", "The Shamen"],
    subgenre: "Acid House",
    historicalContext: "De Britse rave scene groeide uit tot een massabeweging die de jeugdcultuur fundamenteel veranderde."
  },
  {
    year: 1988,
    title: "Detroit Techno doorbraak",
    description: "Juan Atkins, Derrick May en Kevin Saunderson (The Belleville Three) brengen Detroit techno naar Europa.",
    decade: "80s",
    slug: "detroit-techno-doorbraak-1988",
    youtubeId: "xV5449ewBKs",
    famousTrack: "Strings of Life",
    relatedArtists: ["Derrick May", "Juan Atkins", "Kevin Saunderson"],
    subgenre: "Detroit Techno",
    historicalContext: "Detroit techno combineerde Europese synthesizer muziek met de futuristische visie van een post-industrieel Detroit."
  },
  {
    year: 1989,
    title: "Inner City - Big Fun",
    description: "Kevin Saunderson's Inner City scoort een wereldwijde hit en brengt Detroit techno naar de mainstream.",
    decade: "80s",
    slug: "inner-city-big-fun-1989",
    youtubeId: "ZBR2G-iI3-I",
    famousTrack: "Big Fun",
    relatedArtists: ["Inner City", "Kevin Saunderson"],
    subgenre: "Detroit Techno"
  },

  // Jaren '90
  {
    year: 1990,
    title: "Technotronic - Pump Up The Jam",
    description: "De Belgische act Technotronic scoort een wereldwijde nummer 1 hit en brengt house muziek naar MTV.",
    decade: "90s",
    slug: "technotronic-pump-up-jam-1990",
    youtubeId: "9EcjWd-O4jI",
    famousTrack: "Pump Up The Jam",
    relatedArtists: ["Technotronic", "2 Unlimited"],
    subgenre: "Euro House"
  },
  {
    year: 1991,
    title: "Eerste Love Parade in Berlijn",
    description: "Dr. Motte organiseert de eerste Love Parade met 150 deelnemers. Het zou uitgroeien tot het grootste dance evenement ter wereld.",
    decade: "90s",
    slug: "love-parade-berlijn-1991",
    youtubeId: "q7k9uTh3g7M",
    famousTrack: "My Definition of a Boombastic Jazz Style",
    relatedArtists: ["Dr. Motte", "Westbam", "Sven Väth"],
    subgenre: "Techno",
    historicalContext: "Na de val van de Berlijnse Muur werd Berlijn het epicentrum van de Europese techno scene."
  },
  {
    year: 1992,
    title: "Rotterdam Gabber explosie",
    description: "Nederlandse hardcore gabber muziek ontstaat met labels als Rotterdam Records en Mokum. Het snelste en hardste sub-genre is geboren.",
    decade: "90s",
    slug: "rotterdam-gabber-1992",
    youtubeId: "QeDpjS6AVGA",
    famousTrack: "Poing",
    relatedArtists: ["Rotterdam Termination Source", "Paul Elstak", "Euromasters"],
    subgenre: "Gabber/Hardcore",
    historicalContext: "Gabber werd een uniek Nederlands fenomeen met zijn eigen mode, dans en subcultuur."
  },
  {
    year: 1992,
    title: "The Prodigy - Experience",
    description: "The Prodigy brengt hun debuutalbum uit en wordt een van de meest succesvolle dance acts ooit.",
    decade: "90s",
    slug: "prodigy-experience-1992",
    youtubeId: "rmHDhAohJlQ",
    famousTrack: "Charly",
    relatedArtists: ["The Prodigy", "Liam Howlett"],
    subgenre: "Breakbeat/Rave"
  },
  {
    year: 1993,
    title: "Orbital - Halcyon",
    description: "Het Britse duo Orbital brengt een van de mooiste ambient techno nummers ooit uit.",
    decade: "90s",
    slug: "orbital-halcyon-1993",
    youtubeId: "bV-hSgL1R74",
    famousTrack: "Halcyon + On + On",
    relatedArtists: ["Orbital", "Underworld", "Aphex Twin"],
    subgenre: "Ambient Techno"
  },
  {
    year: 1994,
    title: "2 Unlimited - No Limits",
    description: "Het Nederlandse duo 2 Unlimited bereikt wereldwijde superster status met hun eurodance hits.",
    decade: "90s",
    slug: "2-unlimited-no-limits-1994",
    youtubeId: "RkEXGgdqMz8",
    famousTrack: "No Limit",
    relatedArtists: ["2 Unlimited", "Technotronic", "Snap!"],
    subgenre: "Eurodance"
  },
  {
    year: 1995,
    title: "Chemical Brothers - Exit Planet Dust",
    description: "Tom Rowlands en Ed Simons brengen hun debuutalbum uit en definiëren de big beat sound.",
    decade: "90s",
    slug: "chemical-brothers-exit-planet-dust-1995",
    youtubeId: "tpKCqp9CALQ",
    famousTrack: "Chemical Beats",
    relatedArtists: ["Chemical Brothers", "Fatboy Slim", "The Prodigy"],
    subgenre: "Big Beat"
  },
  {
    year: 1996,
    title: "Underworld - Born Slippy .NUXX",
    description: "Door de film Trainspotting wordt Born Slippy een anthem en brengt elektronische muziek naar een nieuw publiek.",
    decade: "90s",
    slug: "underworld-born-slippy-1996",
    youtubeId: "iTFrCbQGyvM",
    famousTrack: "Born Slippy .NUXX",
    relatedArtists: ["Underworld", "Karl Hyde"],
    subgenre: "Progressive House"
  },
  {
    year: 1997,
    title: "Daft Punk - Homework",
    description: "Het Franse duo Daft Punk revolutioneert de muziekwereld met hun debuutalbum en creëert French House.",
    decade: "90s",
    slug: "daft-punk-homework-1997",
    youtubeId: "yca6UsllMYs",
    famousTrack: "Around the World",
    relatedArtists: ["Daft Punk", "Thomas Bangalter", "Guy-Manuel de Homem-Christo"],
    subgenre: "French House",
    historicalContext: "Homework combineerde disco samples met house beats en werd een blauwdruk voor elektronische muziek."
  },
  {
    year: 1997,
    title: "The Prodigy - The Fat of the Land",
    description: "Met Firestarter en Breathe wordt The Prodigy de grootste dance act ter wereld en veroveren de MTV charts.",
    decade: "90s",
    slug: "prodigy-fat-of-the-land-1997",
    youtubeId: "wmin5WkOuPw",
    famousTrack: "Firestarter",
    relatedArtists: ["The Prodigy", "Keith Flint"],
    subgenre: "Big Beat/Breakbeat"
  },
  {
    year: 1998,
    title: "Fatboy Slim - You've Come A Long Way, Baby",
    description: "Norman Cook scoort met Praise You en Right Here, Right Now twee mega-hits.",
    decade: "90s",
    slug: "fatboy-slim-long-way-baby-1998",
    youtubeId: "ub747pprmJ8",
    famousTrack: "Right Here, Right Now",
    relatedArtists: ["Fatboy Slim", "Norman Cook"],
    subgenre: "Big Beat"
  },
  {
    year: 1999,
    title: "Tiësto's eerste Trance Energy",
    description: "Tiësto wordt de headliner van Trance Energy en begint zijn reis naar wereldwijde erkenning als beste DJ.",
    decade: "90s",
    slug: "tiesto-trance-energy-1999",
    youtubeId: "0_4K8SQUP3k",
    famousTrack: "Flight 643",
    relatedArtists: ["Tiësto", "Armin van Buuren", "Ferry Corsten"],
    subgenre: "Trance",
    historicalContext: "Nederland werd het epicentrum van de trance scene met Tiësto en Armin van Buuren als koplopers."
  },
  {
    year: 1999,
    title: "Basement Jaxx - Remedy",
    description: "Het Britse duo combineert house met Latin, funk en R&B en creëert een unieke sound.",
    decade: "90s",
    slug: "basement-jaxx-remedy-1999",
    youtubeId: "A_PqdH3alZk",
    famousTrack: "Red Alert",
    relatedArtists: ["Basement Jaxx", "Felix Buxton", "Simon Ratcliffe"],
    subgenre: "UK House"
  },

  // Jaren '00
  {
    year: 2000,
    title: "Daft Punk - One More Time",
    description: "Met Discovery en de hit One More Time bereikt Daft Punk nieuwe hoogten en definieert de sound van de jaren 2000.",
    decade: "00s",
    slug: "daft-punk-one-more-time-2000",
    youtubeId: "FGBhQbmPwH8",
    famousTrack: "One More Time",
    relatedArtists: ["Daft Punk"],
    subgenre: "French House"
  },
  {
    year: 2001,
    title: "Sensation White eerste editie",
    description: "ID&T organiseert de eerste Sensation White in de Amsterdam ArenA, waar alle bezoekers volledig in het wit gekleed gaan.",
    decade: "00s",
    slug: "sensation-white-2001",
    youtubeId: "CJ9aMoJaPJM",
    relatedArtists: ["Tiësto", "Armin van Buuren", "Marco V"],
    subgenre: "Trance/House",
    historicalContext: "Sensation groeide uit tot een wereldwijd merk met shows op alle continenten."
  },
  {
    year: 2002,
    title: "Armin van Buuren start A State of Trance",
    description: "Armin van Buuren begint zijn wekelijkse radioshow ASOT, die zou uitgroeien tot het populairste dance radioprogramma ter wereld.",
    decade: "00s",
    slug: "armin-asot-2002",
    youtubeId: "dP0q3DsXob8",
    famousTrack: "Communication",
    relatedArtists: ["Armin van Buuren"],
    subgenre: "Trance"
  },
  {
    year: 2004,
    title: "Tiësto opent Olympische Spelen Athene",
    description: "Tiësto wordt de eerste DJ ooit die optreedt tijdens een Olympische openingsceremonie.",
    decade: "00s",
    slug: "tiesto-olympics-athene-2004",
    youtubeId: "mKSRnVCZCqs",
    famousTrack: "Traffic",
    relatedArtists: ["Tiësto"],
    subgenre: "Trance",
    historicalContext: "Dit moment legitimeerde elektronische dansmuziek als serieuze kunstvorm op het wereldtoneel."
  },
  {
    year: 2005,
    title: "Deadmau5 ontstaat",
    description: "Joel Zimmerman creëert zijn iconische muis-helm persona en begint zijn opkomst als progressive house producer.",
    decade: "00s",
    slug: "deadmau5-ontstaat-2005",
    youtubeId: "QV8eiSA4vqc",
    famousTrack: "Faxing Berlin",
    relatedArtists: ["Deadmau5", "Joel Zimmerman"],
    subgenre: "Progressive House"
  },
  {
    year: 2007,
    title: "Justice - Cross",
    description: "Het Franse duo Justice brengt een van de meest invloedrijke electro albums uit met hun debuut Cross.",
    decade: "00s",
    slug: "justice-cross-2007",
    youtubeId: "sy1dYFGkPUE",
    famousTrack: "D.A.N.C.E.",
    relatedArtists: ["Justice", "Gaspard Augé", "Xavier de Rosnay"],
    subgenre: "Electro House"
  },
  {
    year: 2007,
    title: "David Guetta crossover naar pop",
    description: "David Guetta begint zijn samenwerking met mainstream artiesten en brengt EDM naar de Billboard charts.",
    decade: "00s",
    slug: "david-guetta-crossover-2007",
    youtubeId: "n3htOCjafTc",
    famousTrack: "Love Is Gone",
    relatedArtists: ["David Guetta"],
    subgenre: "Electro House"
  },
  {
    year: 2008,
    title: "Swedish House Mafia formatie",
    description: "Axwell, Sebastian Ingrosso en Steve Angello verenigen zich als Swedish House Mafia en domineren de EDM scene.",
    decade: "00s",
    slug: "swedish-house-mafia-2008",
    youtubeId: "0KdDhk3WWJY",
    famousTrack: "Leave the World Behind",
    relatedArtists: ["Swedish House Mafia", "Axwell", "Sebastian Ingrosso", "Steve Angello"],
    subgenre: "Progressive House"
  },
  {
    year: 2009,
    title: "Skrillex start dubstep revolutie",
    description: "Sonny Moore transformeert van emo-zanger naar Skrillex en introduceert agressieve dubstep aan een nieuw publiek.",
    decade: "00s",
    slug: "skrillex-dubstep-2009",
    youtubeId: "WSeNSzJ2-Jw",
    famousTrack: "Scary Monsters and Nice Sprites",
    relatedArtists: ["Skrillex", "Sonny Moore"],
    subgenre: "Dubstep/Brostep"
  },

  // Jaren '10
  {
    year: 2010,
    title: "Afrojack doorbraak met Take Over Control",
    description: "De Nederlandse DJ/producer Afrojack bereikt internationale faam met zijn hit featuring Eva Simons.",
    decade: "10s",
    slug: "afrojack-take-over-control-2010",
    youtubeId: "TG1gRRcc0IA",
    famousTrack: "Take Over Control",
    relatedArtists: ["Afrojack", "Eva Simons"],
    subgenre: "Electro House"
  },
  {
    year: 2011,
    title: "Avicii - Levels",
    description: "Tim Bergling aka Avicii brengt Levels uit en creëert een van de meest iconische EDM tracks ooit.",
    decade: "10s",
    slug: "avicii-levels-2011",
    youtubeId: "_ovdm2yX4MA",
    famousTrack: "Levels",
    relatedArtists: ["Avicii", "Tim Bergling"],
    subgenre: "Progressive House",
    historicalContext: "Levels markeerde het begin van de EDM-explosie in Amerika en werd een cultureel fenomeen."
  },
  {
    year: 2012,
    title: "Swedish House Mafia afscheidstour",
    description: "Na slechts vier jaar kondigt Swedish House Mafia hun 'One Last Tour' aan, wat uitgroeit tot een legendarische reeks shows.",
    decade: "10s",
    slug: "swedish-house-mafia-one-last-tour-2012",
    youtubeId: "1y6smkh6c-0",
    famousTrack: "Don't You Worry Child",
    relatedArtists: ["Swedish House Mafia"],
    subgenre: "Progressive House"
  },
  {
    year: 2013,
    title: "Martin Garrix - Animals",
    description: "De 17-jarige Martin Garrix breekt door met Animals en wordt de jongste DJ ooit die #1 bereikt in meerdere landen.",
    decade: "10s",
    slug: "martin-garrix-animals-2013",
    youtubeId: "gCYcHz2k5x0",
    famousTrack: "Animals",
    relatedArtists: ["Martin Garrix"],
    subgenre: "Big Room House",
    historicalContext: "Martin Garrix vertegenwoordigt een nieuwe generatie Nederlandse DJ's die de wereld veroveren."
  },
  {
    year: 2013,
    title: "Daft Punk - Random Access Memories",
    description: "Daft Punk keert terug met een album dat disco en live muzikanten combineert. Get Lucky wordt de zomerhit.",
    decade: "10s",
    slug: "daft-punk-random-access-memories-2013",
    youtubeId: "h5EofwRzit0",
    famousTrack: "Get Lucky",
    relatedArtists: ["Daft Punk", "Pharrell Williams", "Nile Rodgers"],
    subgenre: "Disco/Nu-Disco"
  },
  {
    year: 2014,
    title: "Hardwell #1 DJ ter wereld",
    description: "Robbert van de Corput wordt uitgeroepen tot DJ Mag's #1 DJ en bevestigt Nederlandse dominantie in EDM.",
    decade: "10s",
    slug: "hardwell-number-one-2014",
    youtubeId: "xR5mJZf4FVY",
    famousTrack: "Spaceman",
    relatedArtists: ["Hardwell"],
    subgenre: "Big Room House"
  },
  {
    year: 2015,
    title: "Disclosure - Caracal",
    description: "De Britse broers Howard en Guy Lawrence brengen hun tweede album uit en bevestigen hun status als UK house royalty.",
    decade: "10s",
    slug: "disclosure-caracal-2015",
    youtubeId: "nDlHIWfOSdk",
    famousTrack: "Omen",
    relatedArtists: ["Disclosure", "Sam Smith"],
    subgenre: "UK Garage/House"
  },
  {
    year: 2016,
    title: "Underground house revival",
    description: "Labels als Defected en Toolroom leiden een terugkeer naar authentieke house muziek, weg van mainstream EDM.",
    decade: "10s",
    slug: "underground-house-revival-2016",
    youtubeId: "rKYG6-Dq2R8",
    famousTrack: "Cola",
    relatedArtists: ["CamelPhat", "Solardo", "Fisher"],
    subgenre: "Tech House"
  },
  {
    year: 2017,
    title: "Charlotte de Witte doorbraak",
    description: "De Belgische techno DJ Charlotte de Witte wordt een van de meest gevraagde namen in het circuit.",
    decade: "10s",
    slug: "charlotte-de-witte-doorbraak-2017",
    youtubeId: "VPALPvELKjw",
    famousTrack: "Doppler",
    relatedArtists: ["Charlotte de Witte", "Amelie Lens"],
    subgenre: "Techno"
  },
  {
    year: 2018,
    title: "Fisher - Losing It",
    description: "De Australische DJ/producer Fisher scoort een virale hit die tech house naar de mainstream brengt.",
    decade: "10s",
    slug: "fisher-losing-it-2018",
    youtubeId: "FfLfywKwSvQ",
    famousTrack: "Losing It",
    relatedArtists: ["Fisher", "Chris Lake"],
    subgenre: "Tech House"
  },
  {
    year: 2018,
    title: "Avicii overlijdt",
    description: "Tim Bergling overlijdt op 28-jarige leeftijd en laat een onuitwisbare indruk achter op de elektronische muziek.",
    decade: "10s",
    slug: "avicii-overlijdt-2018",
    youtubeId: "vkFHYC6jAEY",
    famousTrack: "Wake Me Up",
    relatedArtists: ["Avicii"],
    subgenre: "Progressive House",
    historicalContext: "Avicii's dood bracht de discussie over mentale gezondheid in de muziekindustrie op de voorgrond."
  },

  // Jaren '20
  {
    year: 2020,
    title: "Virtual raves tijdens COVID-19",
    description: "De pandemie dwingt de dance scene online met virtuele festivals en livestreams die miljoenen bereiken.",
    decade: "20s",
    slug: "virtual-raves-covid-2020",
    youtubeId: "H3ZLb7c_E3U",
    relatedArtists: ["Tiësto", "David Guetta", "Marshmello"],
    subgenre: "Various",
    historicalContext: "Artiesten streamden vanuit iconische locaties en bereikten vaak meer mensen dan fysieke evenementen."
  },
  {
    year: 2021,
    title: "Fred Again.. opkomst",
    description: "Fred Gibson breekt door met emotionele UK garage/house tracks gebaseerd op social media samples.",
    decade: "20s",
    slug: "fred-again-opkomst-2021",
    youtubeId: "wQtV9DfqJsk",
    famousTrack: "Marea (We've Lost Dancing)",
    relatedArtists: ["Fred Again..", "Four Tet", "Skrillex"],
    subgenre: "UK Garage/House"
  },
  {
    year: 2022,
    title: "Swedish House Mafia reunion tour",
    description: "Na 10 jaar keert Swedish House Mafia terug met een nieuw album en wereldtournee.",
    decade: "20s",
    slug: "swedish-house-mafia-reunion-2022",
    youtubeId: "9l-QQwLs8hc",
    famousTrack: "It Gets Better",
    relatedArtists: ["Swedish House Mafia", "The Weeknd"],
    subgenre: "Progressive House"
  },
  {
    year: 2023,
    title: "Fred Again.. & Skrillex Boiler Room",
    description: "Hun legendarische b2b set in New York gaat viral en wordt een van de meest bekeken DJ sets ooit.",
    decade: "20s",
    slug: "fred-again-skrillex-boiler-room-2023",
    youtubeId: "7n1-K93-Zz4",
    relatedArtists: ["Fred Again..", "Skrillex", "Four Tet"],
    subgenre: "UK Garage/Bass",
    historicalContext: "De set symboliseerde de revival van underground dance cultuur in het post-COVID tijdperk."
  },
  {
    year: 2023,
    title: "Daft Punk erfenis",
    description: "Drie jaar na hun split blijft Daft Punk's invloed groeien, met nieuwe generaties die hun werk herontdekken.",
    decade: "20s",
    slug: "daft-punk-erfenis-2023",
    youtubeId: "D8K90hX4PrE",
    famousTrack: "Digital Love",
    relatedArtists: ["Daft Punk"],
    subgenre: "French House"
  },
  {
    year: 2024,
    title: "AI in elektronische muziek",
    description: "Producers experimenteren met AI-tools voor sound design en compositie, wat nieuwe discussies over creativiteit opent.",
    decade: "20s",
    slug: "ai-elektronische-muziek-2024",
    relatedArtists: ["Holly Herndon", "Arca"],
    subgenre: "Experimental Electronic"
  }
];

export const getDanceHouseFeitBySlug = (slug: string): DanceHouseFeit | undefined => {
  return DANCE_HOUSE_FEITEN.find(feit => feit.slug === slug);
};

export const getDanceHouseFeitenByDecade = (decade: string): DanceHouseFeit[] => {
  return DANCE_HOUSE_FEITEN.filter(feit => feit.decade === decade);
};

export const getDanceHouseFeitenBySubgenre = (subgenre: string): DanceHouseFeit[] => {
  return DANCE_HOUSE_FEITEN.filter(feit => feit.subgenre === subgenre);
};
