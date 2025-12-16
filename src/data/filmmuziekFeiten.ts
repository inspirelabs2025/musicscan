export interface FilmmuziekFeit {
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

export const FILMMUZIEK_FEITEN: FilmmuziekFeit[] = [
  // Jaren '30
  {
    year: 1933,
    title: "King Kong - Max Steiner",
    description: "Max Steiner componeert de eerste volledig orkestrale filmscore voor King Kong en vestigt de standaard voor Hollywood filmcomponisten.",
    decade: "30s",
    slug: "king-kong-max-steiner-1933",
    youtubeId: "VcjzHMhBtf0",
    famousTrack: "King Kong Main Theme",
    relatedArtists: ["Max Steiner"],
    subgenre: "Orkestrale Score",
    historicalContext: "Voor King Kong waren filmscores vaak samengesteld uit bestaande klassieke muziek. Steiner bewees dat originele muziek de filmervaring dramatisch kon versterken."
  },
  {
    year: 1939,
    title: "Gone with the Wind",
    description: "Max Steiner componeert de iconische score voor Gone with the Wind, inclusief het legendarische 'Tara's Theme'.",
    decade: "30s",
    slug: "gone-with-the-wind-1939",
    youtubeId: "mDH_MNa6NmA",
    famousTrack: "Tara's Theme",
    relatedArtists: ["Max Steiner"],
    subgenre: "Orkestrale Score"
  },

  // Jaren '40
  {
    year: 1941,
    title: "Citizen Kane - Bernard Herrmann",
    description: "Bernard Herrmann debuteert als filmcomponist met Citizen Kane en introduceert innovatieve orkestratietechnieken.",
    decade: "40s",
    slug: "citizen-kane-herrmann-1941",
    youtubeId: "G_bWrH1XsRk",
    famousTrack: "Citizen Kane Theme",
    relatedArtists: ["Bernard Herrmann"],
    subgenre: "Orkestrale Score"
  },
  {
    year: 1942,
    title: "Casablanca - As Time Goes By",
    description: "De film Casablanca maakt 'As Time Goes By' tot een tijdloos klassieker dat de kracht van muziek in cinema demonstreert.",
    decade: "40s",
    slug: "casablanca-as-time-goes-by-1942",
    youtubeId: "d22CiKMPpaY",
    famousTrack: "As Time Goes By",
    relatedArtists: ["Dooley Wilson"],
    subgenre: "Musical Soundtrack"
  },

  // Jaren '50
  {
    year: 1954,
    title: "The High and the Mighty - Dimitri Tiomkin",
    description: "Dimitri Tiomkin wint een Oscar voor deze score die het whistling theme populair maakt in Hollywood.",
    decade: "50s",
    slug: "high-and-mighty-tiomkin-1954",
    youtubeId: "Gz9WfXPHnNk",
    famousTrack: "The High and the Mighty Theme",
    relatedArtists: ["Dimitri Tiomkin"],
    subgenre: "Orkestrale Score"
  },
  {
    year: 1958,
    title: "Vertigo - Bernard Herrmann",
    description: "Bernard Herrmann creëert een meesterwerk van psychologische spanning met zijn hypnotiserende score voor Hitchcock's Vertigo.",
    decade: "50s",
    slug: "vertigo-herrmann-1958",
    youtubeId: "2kPn01Hd32Y",
    famousTrack: "Scene d'Amour",
    relatedArtists: ["Bernard Herrmann"],
    subgenre: "Orkestrale Score",
    historicalContext: "De spiraalvormige, obsessieve muziek van Vertigo wordt beschouwd als een van de meest invloedrijke filmscores ooit."
  },

  // Jaren '60
  {
    year: 1960,
    title: "Psycho - Het beroemde douchescène thema",
    description: "Bernard Herrmann's strijkers-only score voor Psycho bevat het meest iconische horror muziekmoment ooit.",
    decade: "60s",
    slug: "psycho-herrmann-1960",
    youtubeId: "0WtDmbr9xyY",
    famousTrack: "The Murder",
    relatedArtists: ["Bernard Herrmann"],
    subgenre: "Orkestrale Score",
    historicalContext: "Hitchcock wilde oorspronkelijk geen muziek bij de douchescène. Herrmann overtuigde hem en creëerde filmgeschiedenis."
  },
  {
    year: 1962,
    title: "Lawrence of Arabia - Maurice Jarre",
    description: "Maurice Jarre wint zijn eerste Oscar voor deze epische score die perfect past bij David Lean's woestijnbeelden.",
    decade: "60s",
    slug: "lawrence-of-arabia-jarre-1962",
    youtubeId: "lLkbCh96E2I",
    famousTrack: "Overture",
    relatedArtists: ["Maurice Jarre"],
    subgenre: "Orkestrale Score"
  },
  {
    year: 1964,
    title: "Goldfinger - James Bond Theme",
    description: "John Barry perfectioneert het James Bond thema en Shirley Bassey levert een iconische titelsong.",
    decade: "60s",
    slug: "goldfinger-barry-1964",
    youtubeId: "6D1nK7q2i8I",
    famousTrack: "Goldfinger",
    relatedArtists: ["John Barry", "Shirley Bassey"],
    subgenre: "Orkestrale Score"
  },
  {
    year: 1966,
    title: "The Good, the Bad and the Ugly - Ennio Morricone",
    description: "Ennio Morricone revolutioneert filmuziek met zijn unieke Spaghetti Western sound inclusief het legendarische fluitthema.",
    decade: "60s",
    slug: "good-bad-ugly-morricone-1966",
    youtubeId: "h1PfrmCGFnk",
    famousTrack: "The Ecstasy of Gold",
    relatedArtists: ["Ennio Morricone"],
    subgenre: "Orkestrale Score",
    historicalContext: "Morricone's gebruik van onconventionele instrumenten en vocale effecten creëerde een geheel nieuw genre van filmmuziek."
  },
  {
    year: 1968,
    title: "2001: A Space Odyssey - Also sprach Zarathustra",
    description: "Stanley Kubrick gebruikt bestaande klassieke muziek op revolutionaire wijze, met name Strauss' Also sprach Zarathustra.",
    decade: "60s",
    slug: "2001-space-odyssey-1968",
    youtubeId: "e-QFj59PON4",
    famousTrack: "Also sprach Zarathustra",
    relatedArtists: ["Richard Strauss", "Johann Strauss II"],
    subgenre: "Klassieke Compilatie"
  },

  // Jaren '70
  {
    year: 1972,
    title: "The Godfather - Nino Rota",
    description: "Nino Rota componeert het onvergetelijke thema voor The Godfather dat synoniem werd met de maffia.",
    decade: "70s",
    slug: "godfather-rota-1972",
    youtubeId: "HWqKPWO5T4o",
    famousTrack: "The Godfather Waltz",
    relatedArtists: ["Nino Rota"],
    subgenre: "Orkestrale Score"
  },
  {
    year: 1975,
    title: "Jaws - John Williams",
    description: "John Williams creëert het meest minimalistische en tegelijk meest angstaanjagende filmthema ooit met slechts twee noten.",
    decade: "70s",
    slug: "jaws-williams-1975",
    youtubeId: "ZvCI-gNK_y4",
    famousTrack: "Main Title (Theme From Jaws)",
    relatedArtists: ["John Williams"],
    subgenre: "Orkestrale Score",
    historicalContext: "Spielberg dacht eerst dat Williams een grap maakte met het simpele twee-noten thema. Het werd een van de meest herkenbare melodieën in filmgeschiedenis."
  },
  {
    year: 1977,
    title: "Star Wars - John Williams verandert alles",
    description: "John Williams' symfonische score voor Star Wars brengt het klassieke Hollywood orkest terug en creëert de meest invloedrijke filmscore ooit.",
    decade: "70s",
    slug: "star-wars-williams-1977",
    youtubeId: "_D0ZQPqeJkk",
    famousTrack: "Main Title",
    relatedArtists: ["John Williams"],
    subgenre: "Orkestrale Score",
    historicalContext: "Star Wars kwam uit in een tijd dat synthesizers en pop de filmmuziek domineerden. Williams' orkestrale aanpak veranderde Hollywood voorgoed."
  },
  {
    year: 1977,
    title: "Saturday Night Fever - Disco revolutie",
    description: "De Bee Gees domineren de soundtrack die disco muziek wereldwijd populair maakt en de bestverkochte soundtrack ooit wordt.",
    decade: "70s",
    slug: "saturday-night-fever-1977",
    youtubeId: "fNFzfwLM72c",
    famousTrack: "Stayin' Alive",
    relatedArtists: ["Bee Gees"],
    subgenre: "Pop/Rock Compilatie"
  },
  {
    year: 1978,
    title: "Superman - John Williams' held thema",
    description: "John Williams componeert het definitieve superhelden thema dat alle latere superhelden scores zou beïnvloeden.",
    decade: "70s",
    slug: "superman-williams-1978",
    youtubeId: "e9vrfEoc8_g",
    famousTrack: "Main Title March",
    relatedArtists: ["John Williams"],
    subgenre: "Orkestrale Score"
  },

  // Jaren '80
  {
    year: 1980,
    title: "The Empire Strikes Back - The Imperial March",
    description: "John Williams introduceert The Imperial March, Darth Vader's iconische thema dat synoniem werd met kwaad in cinema.",
    decade: "80s",
    slug: "empire-strikes-back-imperial-march-1980",
    youtubeId: "-bzWSJG93P8",
    famousTrack: "The Imperial March",
    relatedArtists: ["John Williams"],
    subgenre: "Orkestrale Score"
  },
  {
    year: 1981,
    title: "Chariots of Fire - Vangelis",
    description: "Vangelis wint een Oscar voor zijn elektronische score die bewijst dat synthesizers net zo emotioneel kunnen zijn als orkesten.",
    decade: "80s",
    slug: "chariots-of-fire-vangelis-1981",
    youtubeId: "CSav51fVlKU",
    famousTrack: "Titles",
    relatedArtists: ["Vangelis"],
    subgenre: "Elektronische Score",
    historicalContext: "Chariots of Fire bewees dat elektronische muziek net zo geschikt was voor serieuze cinema als traditionele orkestmuziek."
  },
  {
    year: 1982,
    title: "Blade Runner - Vangelis' meesterwerk",
    description: "Vangelis creëert een atmosferische, futuristische score die het sci-fi genre voorgoed zou beïnvloeden.",
    decade: "80s",
    slug: "blade-runner-vangelis-1982",
    youtubeId: "RScZrvTebeA",
    famousTrack: "Blade Runner Blues",
    relatedArtists: ["Vangelis"],
    subgenre: "Elektronische Score"
  },
  {
    year: 1982,
    title: "E.T. - Flying Theme",
    description: "John Williams levert opnieuw een iconisch thema met het vliegscène muziek dat generaties zou ontroeren.",
    decade: "80s",
    slug: "et-williams-1982",
    youtubeId: "dI4zJpRgnGw",
    famousTrack: "Flying",
    relatedArtists: ["John Williams"],
    subgenre: "Orkestrale Score"
  },
  {
    year: 1984,
    title: "The Terminator - Brad Fiedel",
    description: "Brad Fiedel creëert een industriële, synthesizer-gedreven score die perfect past bij de dystopische wereld van The Terminator.",
    decade: "80s",
    slug: "terminator-fiedel-1984",
    youtubeId: "XcNXq5DUZnk",
    famousTrack: "Main Title",
    relatedArtists: ["Brad Fiedel"],
    subgenre: "Elektronische Score"
  },
  {
    year: 1985,
    title: "Back to the Future - Alan Silvestri",
    description: "Alan Silvestri componeert een energieke, avontuurlijke score die perfect past bij de tijdreisfilm.",
    decade: "80s",
    slug: "back-to-future-silvestri-1985",
    youtubeId: "e8TZbze72Bc",
    famousTrack: "Main Title",
    relatedArtists: ["Alan Silvestri"],
    subgenre: "Orkestrale Score"
  },
  {
    year: 1986,
    title: "Top Gun - Take My Breath Away",
    description: "Berlin's 'Take My Breath Away' wint een Oscar en de soundtrack wordt een mega-seller.",
    decade: "80s",
    slug: "top-gun-1986",
    youtubeId: "Bx51eegLTY8",
    famousTrack: "Take My Breath Away",
    relatedArtists: ["Berlin", "Kenny Loggins", "Harold Faltermeyer"],
    subgenre: "Pop/Rock Compilatie"
  },
  {
    year: 1989,
    title: "Batman - Danny Elfman",
    description: "Danny Elfman creëert een donkere, gotische score die Tim Burton's visie op Batman perfect vastlegt.",
    decade: "80s",
    slug: "batman-elfman-1989",
    youtubeId: "kRZAk2rfESU",
    famousTrack: "The Batman Theme",
    relatedArtists: ["Danny Elfman"],
    subgenre: "Orkestrale Score"
  },

  // Jaren '90
  {
    year: 1991,
    title: "Terminator 2 - Brad Fiedel",
    description: "Brad Fiedel bouwt voort op zijn originele Terminator score met een nog epischer geluid.",
    decade: "90s",
    slug: "terminator-2-fiedel-1991",
    youtubeId: "pVZ2NShfCE8",
    famousTrack: "Main Title",
    relatedArtists: ["Brad Fiedel"],
    subgenre: "Elektronische Score"
  },
  {
    year: 1993,
    title: "Jurassic Park - John Williams",
    description: "John Williams componeert een majestueuze score die de wonderbaarlijke terugkeer van dinosauriërs viert.",
    decade: "90s",
    slug: "jurassic-park-williams-1993",
    youtubeId: "D8zlUUrFK-M",
    famousTrack: "Theme from Jurassic Park",
    relatedArtists: ["John Williams"],
    subgenre: "Orkestrale Score"
  },
  {
    year: 1993,
    title: "Schindler's List - John Williams",
    description: "John Williams levert zijn meest emotionele werk met Itzhak Perlman op viool voor dit Holocaust drama.",
    decade: "90s",
    slug: "schindlers-list-williams-1993",
    youtubeId: "XNSsv86lsok",
    famousTrack: "Theme from Schindler's List",
    relatedArtists: ["John Williams", "Itzhak Perlman"],
    subgenre: "Orkestrale Score"
  },
  {
    year: 1994,
    title: "The Lion King - Hans Zimmer wint Oscar",
    description: "Hans Zimmer combineert Afrikaanse muziek met orkestrale elementen en wint samen met Elton John de Oscar.",
    decade: "90s",
    slug: "lion-king-zimmer-1994",
    youtubeId: "GibiNy4d4gc",
    famousTrack: "Circle of Life",
    relatedArtists: ["Hans Zimmer", "Elton John", "Tim Rice"],
    subgenre: "Musical Soundtrack",
    historicalContext: "The Lion King markeerde het begin van Hans Zimmer's dominantie in Hollywood."
  },
  {
    year: 1994,
    title: "Pulp Fiction - Surf muziek revival",
    description: "Quentin Tarantino's eclectische soundtrack brengt vergeten surf en soul muziek terug naar het mainstream.",
    decade: "90s",
    slug: "pulp-fiction-1994",
    youtubeId: "k4he79krseU",
    famousTrack: "Misirlou",
    relatedArtists: ["Dick Dale", "Chuck Berry", "Urge Overkill"],
    subgenre: "Pop/Rock Compilatie"
  },
  {
    year: 1995,
    title: "Braveheart - James Horner",
    description: "James Horner creëert een emotioneel Schots epos met traditionele instrumenten en orkest.",
    decade: "90s",
    slug: "braveheart-horner-1995",
    youtubeId: "3mfSD6X4IYQ",
    famousTrack: "Freedom/The Execution",
    relatedArtists: ["James Horner"],
    subgenre: "Orkestrale Score"
  },
  {
    year: 1997,
    title: "Titanic - My Heart Will Go On",
    description: "James Horner en Céline Dion creëren de bestverkochte filmsong ooit.",
    decade: "90s",
    slug: "titanic-horner-1997",
    youtubeId: "3gK_2XdjOdY",
    famousTrack: "My Heart Will Go On",
    relatedArtists: ["James Horner", "Céline Dion"],
    subgenre: "Orkestrale Score",
    historicalContext: "De soundtrack werd de bestverkochte primair instrumentale soundtrack ooit."
  },
  {
    year: 1998,
    title: "Armageddon - I Don't Want to Miss a Thing",
    description: "Aerosmith scoort een wereldwijde nummer 1 hit met deze power ballad.",
    decade: "90s",
    slug: "armageddon-1998",
    youtubeId: "JkK8g6FMEXE",
    famousTrack: "I Don't Want to Miss a Thing",
    relatedArtists: ["Aerosmith"],
    subgenre: "Pop/Rock Compilatie"
  },

  // Jaren '00
  {
    year: 2000,
    title: "Gladiator - Hans Zimmer & Lisa Gerrard",
    description: "Hans Zimmer en Lisa Gerrard creëren een epische score met wereldmuziek invloeden die het actie-epische genre definieert.",
    decade: "00s",
    slug: "gladiator-zimmer-2000",
    youtubeId: "xbHPTPUpQ1I",
    famousTrack: "Now We Are Free",
    relatedArtists: ["Hans Zimmer", "Lisa Gerrard"],
    subgenre: "Hybrid Score"
  },
  {
    year: 2001,
    title: "Harry Potter - Hedwig's Theme",
    description: "John Williams creëert een magisch thema dat het Harry Potter universum perfect definieert.",
    decade: "00s",
    slug: "harry-potter-williams-2001",
    youtubeId: "wtHra9tFISY",
    famousTrack: "Hedwig's Theme",
    relatedArtists: ["John Williams"],
    subgenre: "Orkestrale Score"
  },
  {
    year: 2001,
    title: "The Lord of the Rings - Howard Shore",
    description: "Howard Shore begint aan zijn monumentale trilogie die hij met 3 Oscars zou afsluiten.",
    decade: "00s",
    slug: "lord-of-rings-shore-2001",
    youtubeId: "1iYEwFDLVnM",
    famousTrack: "The Fellowship Theme",
    relatedArtists: ["Howard Shore", "Enya"],
    subgenre: "Orkestrale Score",
    historicalContext: "Shore componeerde meer dan 10 uur originele muziek voor de trilogie, een van de meest ambitieuze filmscores ooit."
  },
  {
    year: 2003,
    title: "Pirates of the Caribbean - Klaus Badelt & Hans Zimmer",
    description: "Het avontuurlijke thema wordt instant herkenbaar en definieert een nieuwe franchise.",
    decade: "00s",
    slug: "pirates-caribbean-2003",
    youtubeId: "27mB8verLK8",
    famousTrack: "He's a Pirate",
    relatedArtists: ["Hans Zimmer", "Klaus Badelt"],
    subgenre: "Orkestrale Score"
  },
  {
    year: 2005,
    title: "Batman Begins - Hans Zimmer & James Newton Howard",
    description: "Het duo creëert een donkere, moderne superhelden score die de toon zet voor Christopher Nolan's trilogie.",
    decade: "00s",
    slug: "batman-begins-zimmer-2005",
    youtubeId: "6z2fsw0l-eg",
    famousTrack: "Molossus",
    relatedArtists: ["Hans Zimmer", "James Newton Howard"],
    subgenre: "Hybrid Score"
  },
  {
    year: 2008,
    title: "The Dark Knight - Why So Serious?",
    description: "Hans Zimmer creëert een experimentele score met een enkel cello-noot als Joker's thema.",
    decade: "00s",
    slug: "dark-knight-zimmer-2008",
    youtubeId: "1zyhQjJ5UgY",
    famousTrack: "Why So Serious?",
    relatedArtists: ["Hans Zimmer", "James Newton Howard"],
    subgenre: "Hybrid Score"
  },

  // Jaren '10
  {
    year: 2010,
    title: "Inception - BRAAAM wordt cultureel fenomeen",
    description: "Hans Zimmer's BRAAAM geluid wordt het meest gekopieerde element in trailers en scores.",
    decade: "10s",
    slug: "inception-zimmer-2010",
    youtubeId: "RxabLA7UQ9k",
    famousTrack: "Time",
    relatedArtists: ["Hans Zimmer"],
    subgenre: "Hybrid Score",
    historicalContext: "Het 'BRAAAM' geluid werd zo vaak geïmiteerd dat het een cliché werd, maar de score zelf blijft een meesterwerk."
  },
  {
    year: 2010,
    title: "The Social Network - Trent Reznor & Atticus Ross",
    description: "Nine Inch Nails frontman Trent Reznor wint een Oscar voor zijn elektronische score.",
    decade: "10s",
    slug: "social-network-reznor-2010",
    youtubeId: "yydZb-d8KHA",
    famousTrack: "Hand Covers Bruise",
    relatedArtists: ["Trent Reznor", "Atticus Ross"],
    subgenre: "Elektronische Score"
  },
  {
    year: 2013,
    title: "Gravity - Steven Price",
    description: "Steven Price wint een Oscar voor zijn innovatieve score die stilte en geluid perfect balanceert.",
    decade: "10s",
    slug: "gravity-price-2013",
    youtubeId: "KU_Y6yOlM9M",
    famousTrack: "Gravity",
    relatedArtists: ["Steven Price"],
    subgenre: "Elektronische Score"
  },
  {
    year: 2014,
    title: "Interstellar - Hans Zimmer's orgel",
    description: "Hans Zimmer gebruikt een kerkorgel als hoofdinstrument voor deze sci-fi epic over ruimte en tijd.",
    decade: "10s",
    slug: "interstellar-zimmer-2014",
    youtubeId: "UDVtMYqUAyw",
    famousTrack: "S.T.A.Y.",
    relatedArtists: ["Hans Zimmer"],
    subgenre: "Hybrid Score"
  },
  {
    year: 2014,
    title: "Guardians of the Galaxy - Awesome Mix",
    description: "James Gunn's nostalgische '70s en '80s compilatie wordt een cultureel fenomeen.",
    decade: "10s",
    slug: "guardians-galaxy-2014",
    youtubeId: "X9bOsdHckhg",
    famousTrack: "Hooked on a Feeling",
    relatedArtists: ["Blue Swede", "Marvin Gaye", "The Runaways"],
    subgenre: "Pop/Rock Compilatie"
  },
  {
    year: 2016,
    title: "La La Land - Justin Hurwitz",
    description: "Justin Hurwitz brengt de klassieke Hollywood musical terug met een Oscar-winnende jazz score.",
    decade: "10s",
    slug: "la-la-land-hurwitz-2016",
    youtubeId: "GTWqwSNQCcg",
    famousTrack: "City of Stars",
    relatedArtists: ["Justin Hurwitz", "Ryan Gosling", "Emma Stone"],
    subgenre: "Musical Soundtrack"
  },
  {
    year: 2017,
    title: "Dunkirk - Hans Zimmer's Shepard Tone",
    description: "Hans Zimmer gebruikt de Shepard tone om constante spanning te creëren in dit oorlogsdrama.",
    decade: "10s",
    slug: "dunkirk-zimmer-2017",
    youtubeId: "n1VJ39nVIBk",
    famousTrack: "Supermarine",
    relatedArtists: ["Hans Zimmer"],
    subgenre: "Hybrid Score",
    historicalContext: "De Shepard tone creëert de illusie van een eindeloos stijgende toon, perfect voor de nerveuze sfeer van de film."
  },
  {
    year: 2018,
    title: "Black Panther - Ludwig Göransson",
    description: "Ludwig Göransson wint een Oscar door Afrikaanse muziek te combineren met hip-hop en orkest.",
    decade: "10s",
    slug: "black-panther-goransson-2018",
    youtubeId: "xjDjIWPwcPU",
    famousTrack: "Wakanda",
    relatedArtists: ["Ludwig Göransson", "Kendrick Lamar"],
    subgenre: "Hybrid Score"
  },
  {
    year: 2019,
    title: "Joker - Hildur Guðnadóttir",
    description: "Hildur Guðnadóttir wordt de eerste vrouw in 23 jaar die een Oscar voor beste score wint.",
    decade: "10s",
    slug: "joker-gudnadottir-2019",
    youtubeId: "FqwBw2YxJxI",
    famousTrack: "Bathroom Dance",
    relatedArtists: ["Hildur Guðnadóttir"],
    subgenre: "Minimalistische Score",
    historicalContext: "Guðnadóttir componeerde de score voordat de film werd opgenomen, waardoor Joaquin Phoenix kon acteren op de muziek."
  },

  // Jaren '20
  {
    year: 2021,
    title: "Dune - Hans Zimmer's meesterwerk",
    description: "Hans Zimmer creëert een buitenaardse sound met zelf-uitgevonden instrumenten voor Denis Villeneuve's epos.",
    decade: "20s",
    slug: "dune-zimmer-2021",
    youtubeId: "GoAA0sYkLI0",
    famousTrack: "Paul's Dream",
    relatedArtists: ["Hans Zimmer"],
    subgenre: "Hybrid Score",
    historicalContext: "Zimmer wees Top Gun: Maverick af om aan Dune te werken, zijn levenslange droom project."
  },
  {
    year: 2022,
    title: "Top Gun: Maverick - Harold Faltermeyer keert terug",
    description: "De originele componist keert terug samen met Hans Zimmer en Lady Gaga voor deze nostalgische sequel.",
    decade: "20s",
    slug: "top-gun-maverick-2022",
    youtubeId: "qSqVVswa420",
    famousTrack: "Hold My Hand",
    relatedArtists: ["Lady Gaga", "Hans Zimmer", "Harold Faltermeyer"],
    subgenre: "Pop/Rock Compilatie"
  },
  {
    year: 2023,
    title: "Oppenheimer - Ludwig Göransson",
    description: "Ludwig Göransson wint zijn tweede Oscar voor een intense, angstaanjagende score.",
    decade: "20s",
    slug: "oppenheimer-goransson-2023",
    youtubeId: "lHeg9QGjZZI",
    famousTrack: "Can You Hear The Music",
    relatedArtists: ["Ludwig Göransson"],
    subgenre: "Minimalistische Score"
  }
];

// Helper function to get feit by slug
export const getFilmmuziekFeitBySlug = (slug: string): FilmmuziekFeit | undefined => {
  return FILMMUZIEK_FEITEN.find(feit => feit.slug === slug);
};

// Helper function to get feiten by decade
export const getFilmmuziekFeitenByDecade = (decade: string): FilmmuziekFeit[] => {
  return FILMMUZIEK_FEITEN.filter(feit => feit.decade === decade);
};

// Helper function to get feiten by subgenre
export const getFilmmuziekFeitenBySubgenre = (subgenre: string): FilmmuziekFeit[] => {
  return FILMMUZIEK_FEITEN.filter(feit => feit.subgenre === subgenre);
};
