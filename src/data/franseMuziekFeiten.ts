export interface MuziekFeit {
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
}

export const FR_MUZIEK_FEITEN: MuziekFeit[] = [
  // Jaren '40
  {
    year: 1946,
    title: "La Vie en Rose",
    description: "Édith Piaf neemt 'La Vie en Rose' op, dat uitgroeit tot het iconische Franse chanson aller tijden en haar internationale carrière lanceert.",
    decade: "40s",
    slug: "la-vie-en-rose-1946",
    famousTrack: "La Vie en Rose",
    historicalContext: "Na de Tweede Wereldoorlog symboliseerde dit nummer hoop en romantiek voor een heel land.",
    relatedArtists: ["Édith Piaf", "Charles Trenet"]
  },
  {
    year: 1947,
    title: "Charles Trenet's 'La Mer'",
    description: "Charles Trenet schrijft en neemt 'La Mer' op, dat later wereldberoemd wordt als 'Beyond the Sea'.",
    decade: "40s",
    slug: "la-mer-charles-trenet",
    famousTrack: "La Mer",
    relatedArtists: ["Charles Trenet"]
  },
  
  // Jaren '50
  {
    year: 1954,
    title: "Boris Vian's Jazz Revolutie",
    description: "Boris Vian's 'Le Déserteur' wordt verboden maar groeit uit tot een anti-oorlog anthem.",
    decade: "50s",
    slug: "boris-vian-deserteur",
    famousTrack: "Le Déserteur",
    relatedArtists: ["Boris Vian"]
  },
  {
    year: 1956,
    title: "Georges Brassens Doorbraak",
    description: "Georges Brassens wint de Grand Prix de l'Académie Charles Cros en wordt de stem van het Franse chanson.",
    decade: "50s",
    slug: "brassens-doorbraak",
    relatedArtists: ["Georges Brassens", "Jacques Brel"]
  },
  {
    year: 1958,
    title: "Johnny Hallyday's Rock 'n Roll",
    description: "Een 15-jarige Johnny Hallyday begint op te treden en brengt rock 'n roll naar Frankrijk.",
    decade: "50s",
    slug: "johnny-hallyday-debuut",
    relatedArtists: ["Johnny Hallyday"]
  },
  
  // Jaren '60
  {
    year: 1960,
    title: "Yé-yé Beweging Begint",
    description: "De Yé-yé beweging ontstaat met artiesten als France Gall en Françoise Hardy die Franse pop revolutioneren.",
    decade: "60s",
    slug: "ye-ye-beweging",
    historicalContext: "De Franse tienerpopcultuur ontwaakt met eigen identiteit, geïnspireerd door maar onderscheidend van Anglo-Amerikaanse pop.",
    relatedArtists: ["France Gall", "Françoise Hardy", "Sylvie Vartan"]
  },
  {
    year: 1963,
    title: "Salut les Copains",
    description: "Het tijdschrift en radioprogramma 'Salut les Copains' wordt het centrum van de Franse jeugdcultuur.",
    decade: "60s",
    slug: "salut-les-copains",
    relatedArtists: ["Johnny Hallyday", "Sylvie Vartan", "Claude François"]
  },
  {
    year: 1965,
    title: "France Gall Wint Eurovisie",
    description: "France Gall wint het Eurovisiesongfestival met 'Poupée de cire, poupée de son' geschreven door Serge Gainsbourg.",
    decade: "60s",
    slug: "france-gall-eurovisie",
    famousTrack: "Poupée de cire, poupée de son",
    relatedArtists: ["France Gall", "Serge Gainsbourg"]
  },
  {
    year: 1967,
    title: "Je t'aime... moi non plus",
    description: "Serge Gainsbourg neemt het controversiële 'Je t'aime... moi non plus' op met Brigitte Bardot (later Jane Birkin).",
    decade: "60s",
    slug: "je-taime-moi-non-plus",
    famousTrack: "Je t'aime... moi non plus",
    historicalContext: "Het nummer werd in meerdere landen verboden vanwege de expliciete inhoud, maar werd een mondiale hit.",
    relatedArtists: ["Serge Gainsbourg", "Jane Birkin"]
  },
  {
    year: 1968,
    title: "Mei '68 Protest Songs",
    description: "De studentenprotesten van mei 1968 inspireren een golf van protestliederen en politiek geëngageerde muziek.",
    decade: "60s",
    slug: "mei-68-protest",
    historicalContext: "De sociale revolutie van mei '68 transformeerde de Franse cultuur en muziek permanent.",
    relatedArtists: ["Léo Ferré", "Jean Ferrat"]
  },
  
  // Jaren '70
  {
    year: 1971,
    title: "Magma's Zeuhl Genre",
    description: "Magma creëert het unieke 'Zeuhl' genre, een mix van progressive rock, jazz en opera met een fictieve taal.",
    decade: "70s",
    slug: "magma-zeuhl",
    relatedArtists: ["Magma"]
  },
  {
    year: 1973,
    title: "Claude François' Disco Pionier",
    description: "Claude François experimenteert met disco-invloeden en wordt een van de eerste Franse disco-artiesten.",
    decade: "70s",
    slug: "claude-francois-disco",
    famousTrack: "Le Lundi au Soleil",
    relatedArtists: ["Claude François"]
  },
  {
    year: 1975,
    title: "Michel Sardou's Controversiële Hit",
    description: "'Le France' van Michel Sardou wordt een enorme hit ondanks (of dankzij) de politieke controverse.",
    decade: "70s",
    slug: "sardou-le-france",
    relatedArtists: ["Michel Sardou"]
  },
  {
    year: 1977,
    title: "Téléphone Formatie",
    description: "De rockband Téléphone wordt opgericht en brengt authentieke Franse rock naar het grote publiek.",
    decade: "70s",
    slug: "telephone-formatie",
    relatedArtists: ["Téléphone"]
  },
  {
    year: 1978,
    title: "Plastic Bertrand - Ça Plane Pour Moi",
    description: "Het nummer 'Ça Plane Pour Moi' wordt een internationale punk/new wave hit.",
    decade: "70s",
    slug: "ca-plane-pour-moi",
    famousTrack: "Ça Plane Pour Moi",
    relatedArtists: ["Plastic Bertrand"]
  },
  
  // Jaren '80
  {
    year: 1981,
    title: "Indochine's Debuut",
    description: "Indochine brengt hun debuutalbum uit en wordt de belangrijkste Franse new wave band.",
    decade: "80s",
    slug: "indochine-debuut",
    relatedArtists: ["Indochine"]
  },
  {
    year: 1984,
    title: "Mylène Farmer Doorbraak",
    description: "Mylène Farmer lanceert haar carrière en wordt een van de meest succesvolle Franse popartiesten ooit.",
    decade: "80s",
    slug: "mylene-farmer-doorbraak",
    relatedArtists: ["Mylène Farmer"]
  },
  {
    year: 1985,
    title: "Les Rita Mitsouko - Marcia Baïla",
    description: "Les Rita Mitsouko scoort internationaal succes met 'Marcia Baïla'.",
    decade: "80s",
    slug: "rita-mitsouko-marcia-baila",
    famousTrack: "Marcia Baïla",
    relatedArtists: ["Les Rita Mitsouko"]
  },
  {
    year: 1987,
    title: "MC Solaar's Opkomst",
    description: "MC Solaar begint zijn carrière en pioniert Franse hip-hop met poëtische teksten.",
    decade: "80s",
    slug: "mc-solaar-opkomst",
    relatedArtists: ["MC Solaar"]
  },
  {
    year: 1988,
    title: "Vanessa Paradis - Joe le Taxi",
    description: "14-jarige Vanessa Paradis scoort een internationale hit met 'Joe le Taxi'.",
    decade: "80s",
    slug: "vanessa-paradis-joe-le-taxi",
    famousTrack: "Joe le Taxi",
    relatedArtists: ["Vanessa Paradis"]
  },
  
  // Jaren '90
  {
    year: 1990,
    title: "IAM's Marseille Sound",
    description: "IAM brengt hun debuut uit en vestigt Marseille als centrum van Franse hip-hop.",
    decade: "90s",
    slug: "iam-marseille",
    relatedArtists: ["IAM"]
  },
  {
    year: 1991,
    title: "NTM's Authentique",
    description: "Suprême NTM brengt 'Authentik' uit, een mijlpaal in de Franse hip-hop.",
    decade: "90s",
    slug: "ntm-authentik",
    relatedArtists: ["NTM", "Suprême NTM"]
  },
  {
    year: 1993,
    title: "MC Solaar - Prose Combat",
    description: "'Prose Combat' van MC Solaar wordt het best verkochte Franse hip-hop album.",
    decade: "90s",
    slug: "mc-solaar-prose-combat",
    famousTrack: "Nouveau Western",
    relatedArtists: ["MC Solaar"]
  },
  {
    year: 1995,
    title: "Air Formatie",
    description: "Nicolas Godin en Jean-Benoît Dunckel vormen Air en beginnen aan hun 'French Touch' reis.",
    decade: "90s",
    slug: "air-formatie",
    relatedArtists: ["Air"]
  },
  {
    year: 1996,
    title: "Noir Désir - 666.667 Club",
    description: "Noir Désir brengt '666.667 Club' uit en bereikt internationale erkenning.",
    decade: "90s",
    slug: "noir-desir-666667",
    relatedArtists: ["Noir Désir"]
  },
  {
    year: 1997,
    title: "Daft Punk - Homework",
    description: "Daft Punk's debuutalbum 'Homework' lanceert de French House beweging wereldwijd met hits als 'Around the World' en 'Da Funk'.",
    decade: "90s",
    slug: "daft-punk-homework",
    famousTrack: "Around the World",
    youtubeId: "LKYPYj2XX80",
    historicalContext: "Dit album definieerde de 'French Touch' sound en inspireerde een hele generatie electronic producers.",
    relatedArtists: ["Daft Punk", "Cassius", "Bob Sinclar"]
  },
  {
    year: 1998,
    title: "Air - Moon Safari",
    description: "Air's 'Moon Safari' wordt een internationaal succes en definieert ambient electronic pop.",
    decade: "90s",
    slug: "air-moon-safari",
    famousTrack: "Sexy Boy",
    youtubeId: "A_ulZiob5I0",
    relatedArtists: ["Air", "Phoenix"]
  },
  {
    year: 1999,
    title: "Cassius - 1999",
    description: "Cassius consolideert de French House beweging met hun iconische debuutalbum.",
    decade: "90s",
    slug: "cassius-1999",
    famousTrack: "Cassius 1999",
    relatedArtists: ["Cassius", "Daft Punk"]
  },
  
  // Jaren '00
  {
    year: 2000,
    title: "Phoenix Internationale Doorbraak",
    description: "Phoenix brengt 'United' uit en begint aan hun reis naar internationale roem.",
    decade: "00s",
    slug: "phoenix-united",
    relatedArtists: ["Phoenix", "Air"]
  },
  {
    year: 2001,
    title: "Daft Punk - Discovery",
    description: "'Discovery' met anime-geïnspireerde visuals en hits als 'One More Time' wordt een cultureel fenomeen.",
    decade: "00s",
    slug: "daft-punk-discovery",
    famousTrack: "One More Time",
    youtubeId: "FGBhQbmPwH8",
    historicalContext: "Het album combineerde house met pop en disco, en de Interstella 5555 anime film werd iconisch.",
    relatedArtists: ["Daft Punk"]
  },
  {
    year: 2003,
    title: "M83 - Dead Cities, Red Seas & Lost Ghosts",
    description: "M83 definieert shoegaze electronic met dit baanbrekende album.",
    decade: "00s",
    slug: "m83-dead-cities",
    relatedArtists: ["M83"]
  },
  {
    year: 2005,
    title: "Justice Formatie",
    description: "Gaspard Augé en Xavier de Rosnay vormen Justice en brengen vernieuwing in de French electro scene.",
    decade: "00s",
    slug: "justice-formatie",
    relatedArtists: ["Justice", "SebastiAn"]
  },
  {
    year: 2007,
    title: "Justice - Cross",
    description: "Justice's debuutalbum '†' (Cross) wint een Grammy en brengt French electro naar de mainstream.",
    decade: "00s",
    slug: "justice-cross",
    famousTrack: "D.A.N.C.E.",
    youtubeId: "sy1dYFGkPUE",
    relatedArtists: ["Justice"]
  },
  {
    year: 2009,
    title: "Phoenix - Wolfgang Amadeus Phoenix",
    description: "Phoenix wint een Grammy voor 'Wolfgang Amadeus Phoenix' met hits als '1901' en 'Lisztomania'.",
    decade: "00s",
    slug: "phoenix-wolfgang-amadeus",
    famousTrack: "1901",
    youtubeId: "HL548cHH3OY",
    historicalContext: "Dit album bracht Franse indie rock naar de internationale top en won de Grammy voor Best Alternative Album.",
    relatedArtists: ["Phoenix"]
  },
  {
    year: 2009,
    title: "David Guetta - One Love",
    description: "David Guetta's 'One Love' maakt hem tot 's werelds meest gevraagde DJ met hits als 'When Love Takes Over'.",
    decade: "00s",
    slug: "david-guetta-one-love",
    famousTrack: "When Love Takes Over",
    relatedArtists: ["David Guetta"]
  },
  
  // Jaren '10
  {
    year: 2010,
    title: "Stromae - Alors on Danse",
    description: "Belgisch-Rwandese Stromae scoort een pan-Europese nummer 1 hit en wordt een icoon.",
    decade: "10s",
    slug: "stromae-alors-on-danse",
    famousTrack: "Alors on Danse",
    youtubeId: "VHoT4N43jK8",
    relatedArtists: ["Stromae"]
  },
  {
    year: 2011,
    title: "M83 - Midnight City",
    description: "'Midnight City' van M83 wordt een van de meest iconische synth-pop nummers van het decennium.",
    decade: "10s",
    slug: "m83-midnight-city",
    famousTrack: "Midnight City",
    youtubeId: "dX3k_QDnzHE",
    relatedArtists: ["M83"]
  },
  {
    year: 2012,
    title: "Gojira's Metal Doorbraak",
    description: "Gojira's 'L'Enfant Sauvage' brengt Franse metal naar de internationale top.",
    decade: "10s",
    slug: "gojira-enfant-sauvage",
    relatedArtists: ["Gojira"]
  },
  {
    year: 2013,
    title: "Daft Punk - Random Access Memories",
    description: "Daft Punk wint 4 Grammy's waaronder Album en Record of the Year voor 'Get Lucky'.",
    decade: "10s",
    slug: "daft-punk-random-access-memories",
    famousTrack: "Get Lucky",
    youtubeId: "5NV6Rdv1a3I",
    historicalContext: "Het album markeerde een terugkeer naar live instrumentatie en won de belangrijkste Grammy's van het jaar.",
    relatedArtists: ["Daft Punk", "Pharrell Williams", "Nile Rodgers"]
  },
  {
    year: 2014,
    title: "Christine and the Queens",
    description: "Héloïse Letissier doorbreekt met 'Chaleur Humaine' en wordt een queer icoon.",
    decade: "10s",
    slug: "christine-queens-chaleur-humaine",
    famousTrack: "Tilted",
    relatedArtists: ["Christine and the Queens"]
  },
  {
    year: 2016,
    title: "PNL Verandert Franse Rap",
    description: "PNL's 'Dans la Légende' revolutioneert Franse rap met cloud rap en autotune.",
    decade: "10s",
    slug: "pnl-dans-la-legende",
    relatedArtists: ["PNL", "Nekfeu"]
  },
  {
    year: 2017,
    title: "Orelsan - La Fête Est Finie",
    description: "Orelsan wint 3 Victoires de la Musique en domineert de Franse muziekscene.",
    decade: "10s",
    slug: "orelsan-la-fete-est-finie",
    relatedArtists: ["Orelsan", "Bigflo & Oli"]
  },
  {
    year: 2018,
    title: "Aya Nakamura - Djadja",
    description: "'Djadja' wordt het meest gestreamde Franse nummer ooit en maakt Aya Nakamura een superster.",
    decade: "10s",
    slug: "aya-nakamura-djadja",
    famousTrack: "Djadja",
    youtubeId: "iPGgnzc34tY",
    historicalContext: "Het nummer brak records en maakte Aya Nakamura tot de meest gestreamde Franstalige artiest ter wereld.",
    relatedArtists: ["Aya Nakamura"]
  },
  
  // Jaren '20
  {
    year: 2020,
    title: "The Blaze's Visuele Revolutie",
    description: "The Blaze wint internationale prijzen voor hun cinematografische muziekvideo's.",
    decade: "20s",
    slug: "the-blaze-visuele-kunst",
    relatedArtists: ["The Blaze"]
  },
  {
    year: 2021,
    title: "Daft Punk Stopt",
    description: "Na 28 jaar kondigt Daft Punk hun scheiding aan met de video 'Epilogue'.",
    decade: "20s",
    slug: "daft-punk-epilogue",
    historicalContext: "Het einde van een tijdperk - Daft Punk had de electronic muziek permanent veranderd.",
    relatedArtists: ["Daft Punk"]
  },
  {
    year: 2022,
    title: "Stromae's Comeback",
    description: "Stromae keert terug met 'Multitude' na 9 jaar afwezigheid en domineert Europa.",
    decade: "20s",
    slug: "stromae-multitude",
    famousTrack: "Santé",
    relatedArtists: ["Stromae"]
  },
  {
    year: 2023,
    title: "Aya Nakamura Olympic Anthem",
    description: "Aya Nakamura wordt gevraagd voor de opening van de Olympische Spelen in Parijs.",
    decade: "20s",
    slug: "aya-nakamura-olympics",
    relatedArtists: ["Aya Nakamura"]
  },
  {
    year: 2024,
    title: "Franse Muziek op de Olympische Spelen",
    description: "De Olympische Spelen in Parijs vieren Franse muziek met optredens van Aya Nakamura, Phoenix en Gojira.",
    decade: "20s",
    slug: "paris-olympics-muziek",
    historicalContext: "De openingsceremonie toonde de diversiteit van Franse muziek aan de wereld.",
    relatedArtists: ["Aya Nakamura", "Phoenix", "Gojira"]
  }
];

export const DECADES = ['40s', '50s', '60s', '70s', '80s', '90s', '00s', '10s', '20s'];

export const DECADE_INFO: Record<string, { title: string; description: string; color: string }> = {
  '40s': {
    title: "Jaren '40",
    description: "De geboorte van het moderne chanson met Édith Piaf en Charles Trenet",
    color: "from-amber-600 to-amber-800"
  },
  '50s': {
    title: "Jaren '50",
    description: "De gouden eeuw van het Franse chanson met Brassens, Brel en Aznavour",
    color: "from-amber-500 to-orange-600"
  },
  '60s': {
    title: "Jaren '60",
    description: "Yé-yé revolutie en Serge Gainsbourg's provocaties",
    color: "from-pink-500 to-rose-600"
  },
  '70s': {
    title: "Jaren '70",
    description: "Progressieve rock met Magma en de opkomst van Franse disco",
    color: "from-orange-500 to-red-600"
  },
  '80s': {
    title: "Jaren '80",
    description: "New wave met Indochine en Mylène Farmer, geboorte van Franse hip-hop",
    color: "from-purple-500 to-indigo-600"
  },
  '90s': {
    title: "Jaren '90",
    description: "French Touch explosie met Daft Punk en Air, IAM domineert hip-hop",
    color: "from-blue-500 to-cyan-600"
  },
  '00s': {
    title: "Jaren '00",
    description: "Phoenix wint Grammy's, Justice vernieuwt electro, David Guetta gaat wereldwijd",
    color: "from-cyan-500 to-teal-600"
  },
  '10s': {
    title: "Jaren '10",
    description: "Daft Punk's comeback, Stromae's doorbraak, PNL transformeert rap",
    color: "from-emerald-500 to-green-600"
  },
  '20s': {
    title: "Jaren '20",
    description: "Aya Nakamura breekt records, Olympische Spelen vieren Franse muziek",
    color: "from-violet-500 to-purple-600"
  }
};
