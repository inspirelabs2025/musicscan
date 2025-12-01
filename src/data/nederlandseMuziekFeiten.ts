import { Star, Award, Mic2, Radio, Disc3, Music2 } from "lucide-react";

export interface MuziekFeit {
  year: number;
  title: string;
  description: string;
  longDescription?: string;
  category: string;
  decade: string;
  funFact?: string;
  icon: "star" | "award" | "mic" | "radio" | "disc" | "music";
  slug: string;
  relatedArtists?: string[];
}

// 50+ Nederlandse muziek feiten met slugs voor detail pagina's
export const NL_MUZIEK_FEITEN: MuziekFeit[] = [
  // 1950s
  { 
    year: 1956, 
    title: "Johnny Jordaan debuteert", 
    description: "Johnny Jordaan brengt zijn eerste plaat uit en wordt de stem van Amsterdam. Zijn levensliederen worden tijdloos.", 
    longDescription: "Johnny Jordaan, geboren als Johannes Hendricus van Musscher, groeide op in de Jordaan wijk van Amsterdam. Zijn authentieke vertolkingen van het Amsterdamse levenslied maakten hem tot een icoon. Nummers als 'Geef mij maar Amsterdam' en 'Bij ons in de Jordaan' werden hymnes voor de stad. Zijn unieke stem en oprechte voordracht raakten generaties Nederlanders.",
    category: "Levenslied", 
    decade: "50s", 
    icon: "mic", 
    funFact: "Hij werd geboren op de Lindengracht in Amsterdam",
    slug: "johnny-jordaan-debuteert-1956",
    relatedArtists: ["Johnny Jordaan"]
  },
  { 
    year: 1958, 
    title: "Willy Alberti's doorbraak", 
    description: "Willy Alberti scoort zijn eerste grote hit en wordt een van Nederlands meest geliefde zangers.", 
    longDescription: "Willy Alberti, de 'zingende gondelier', bracht de Italiaanse romantiek naar Nederland. Zijn warme stem en emotionele voordracht maakten hem tot een superster. Samen met zijn dochter Willeke vormde hij later een onvergetelijk duo dat miljoenen Nederlanders ontroerde.",
    category: "Levenslied", 
    decade: "50s", 
    icon: "star",
    slug: "willy-alberti-doorbraak-1958",
    relatedArtists: ["Willy Alberti"]
  },
  
  // 1960s
  { 
    year: 1960, 
    title: "The Cats opgericht", 
    description: "In Volendam wordt The Cats opgericht, die later uitgroeit tot een van de succesvolste Nederlandse bands.", 
    longDescription: "The Cats werden opgericht in het vissersdorp Volendam, dat later bekend zou worden als de 'muziekhoofdstad' van Nederland. De band combineerde rock, pop en romantische ballads tot een uniek geluid. Hits als 'One Way Wind' en 'Be My Day' werden internationaal bekend.",
    category: "Pop", 
    decade: "60s", 
    icon: "music",
    slug: "the-cats-opgericht-1960",
    relatedArtists: ["The Cats"]
  },
  { 
    year: 1964, 
    title: "Nederbiet explosie", 
    description: "Nederlandse bands volgen massaal de Beatles. Bands als The Motions en Q65 domineren de hitlijsten.", 
    longDescription: "De Beatlemania sloeg ook in Nederland toe en inspireerde honderden jonge muzikanten om gitaren op te pakken. Bands als The Motions, Q65, The Golden Earrings (later Golden Earring), en Cuby + Blizzards brachten de Britse beat sound naar Nederland, maar voegden hun eigen karakter toe. De Nederbiet beweging legde de basis voor decennia Nederlandse rockmuziek.",
    category: "Beat", 
    decade: "60s", 
    icon: "radio", 
    funFact: "Meer dan 100 beatbands ontstonden in dit jaar",
    slug: "nederbiet-explosie-1964",
    relatedArtists: ["The Motions", "Q65", "Golden Earring"]
  },
  { 
    year: 1966, 
    title: "Rob de Nijs breekt door", 
    description: "Rob de Nijs scoort zijn eerste hit 'Ritme van de Regen' en wordt een blijvende Nederlandse popster.", 
    longDescription: "Rob de Nijs begon zijn carrière als teenager en groeide uit tot een van de langstzittende sterren in de Nederlandse muziekgeschiedenis. Zijn hits spannen decennia en generaties, van 'Ritme van de Regen' tot 'Banger Hart'. Hij bewees dat je in het Nederlands net zo goed pop kunt maken als in het Engels.",
    category: "Pop", 
    decade: "60s", 
    icon: "star",
    slug: "rob-de-nijs-doorbraak-1966",
    relatedArtists: ["Rob de Nijs"]
  },
  { 
    year: 1969, 
    title: "Venus #1 in de VS", 
    description: "Shocking Blue bereikt als eerste Nederlandse band de #1 positie in de Amerikaanse Billboard Hot 100 met Venus.", 
    longDescription: "Shocking Blue, met zangeres Mariska Veres, schreef geschiedenis toen Venus de nummer 1 positie bereikte in Amerika. Dit was een ongekende prestatie voor een Nederlandse band. Het nummer werd later gecoverd door Bananarama en blijft een van de meest herkenbare Nederlandse exporthits ooit. De iconische openingsriff is wereldwijd bekend.",
    category: "Rock", 
    decade: "60s", 
    icon: "award", 
    funFact: "Het nummer werd later gecoverd door Bananarama",
    slug: "venus-nummer-1-vs-1969",
    relatedArtists: ["Shocking Blue"]
  },
  { 
    year: 1969, 
    title: "Focus opgericht", 
    description: "Jan Akkerman en Thijs van Leer richten Focus op, die later wereldfaam bereikt met Hocus Pocus.", 
    longDescription: "Focus combineerde rock met klassieke muziek en jazz tot een uniek progressief geluid. Jan Akkerman's virtuoze gitaarspel en Thijs van Leer's Hammond orgel en jodelen creëerden een herkenbare sound. 'Hocus Pocus' en 'Sylvia' werden wereldhits en Focus tourde met de grootste namen in de rock.",
    category: "Prog Rock", 
    decade: "60s", 
    icon: "music",
    slug: "focus-opgericht-1969",
    relatedArtists: ["Focus", "Jan Akkerman"]
  },
  
  // 1970s
  { 
    year: 1970, 
    title: "George Baker's Little Green Bag", 
    description: "George Baker Selection scoort internationaal met Little Green Bag, later gebruikt in Reservoir Dogs.", 
    longDescription: "George Baker Selection bracht met 'Little Green Bag' een nummer uit dat decennia later een tweede leven zou krijgen. Quentin Tarantino gebruikte het in de openingsscène van Reservoir Dogs, waardoor een nieuwe generatie het nummer ontdekte. De groovy beat en catchy melodie maken het tijdloos.",
    category: "Pop", 
    decade: "70s", 
    icon: "disc", 
    funFact: "De film van Tarantino maakte het nummer opnieuw populair",
    slug: "little-green-bag-1970",
    relatedArtists: ["George Baker Selection"]
  },
  { 
    year: 1971, 
    title: "Mouth & MacNeal gevormd", 
    description: "Het duo scoort direct met How Do You Do? en vertegenwoordigt Nederland op het Songfestival.", 
    longDescription: "Mouth & MacNeal werden een van de meest succesvolle Nederlandse duo's van de jaren 70. Hun catchy popsongs scoorden niet alleen in Nederland maar ook internationaal. 'How Do You Do?' werd een wereldhit en hun Songfestival bijdrage 'I See a Star' eindigde op een verdienstelijke derde plaats.",
    category: "Pop", 
    decade: "70s", 
    icon: "mic",
    slug: "mouth-macneal-1971",
    relatedArtists: ["Mouth & MacNeal"]
  },
  { 
    year: 1973, 
    title: "Radar Love wereldhit", 
    description: "Golden Earring scoort met Radar Love een wereldwijde hit. Het nummer wordt een van de meest gedraaide rocksongs ooit.", 
    longDescription: "Radar Love is misschien wel de ultieme Nederlandse rockklassieker. Het nummer over een telepathische verbinding tussen geliefden tijdens het rijden werd een favoriet op Amerikaanse classic rock radiostations. De drijvende beat en het epische gitaarwerk maken het perfect voor lange ritten. Golden Earring bewees dat Nederlandse rock internationaal kon meekomen.",
    category: "Rock", 
    decade: "70s", 
    icon: "award", 
    funFact: "Het nummer gaat over een telepathische verbinding tijdens het rijden",
    slug: "radar-love-1973",
    relatedArtists: ["Golden Earring"]
  },
  { 
    year: 1974, 
    title: "Teach-In wint Songfestival", 
    description: "Nederland wint het Eurovisie Songfestival met 'Ding-A-Dong' van Teach-In.", 
    longDescription: "Teach-In bracht Nederland de tweede Eurovisie overwinning met het vrolijke 'Ding-A-Dong'. Het nummer was typisch jaren 70 bubblegum pop en sloeg in heel Europa aan. De overwinning zorgde voor een golf van trots en bevestigde Nederland's positie in de Europese popmuziek.",
    category: "Pop", 
    decade: "70s", 
    icon: "award",
    slug: "teach-in-songfestival-1974",
    relatedArtists: ["Teach-In"]
  },
  { 
    year: 1975, 
    title: "Boudewijn de Groot's Avond", 
    description: "Boudewijn de Groot brengt 'Avond' uit, dat uitgroeit tot een van de mooiste Nederlandse liedjes ooit.", 
    longDescription: "Boudewijn de Groot was al een gevestigde naam toen hij 'Avond' uitbracht, maar dit nummer tilde zijn status naar een nieuw niveau. De poëtische tekst over het einde van een dag, gecombineerd met de melancholische melodie, raakt iets universeels. Het nummer wordt nog steeds beschouwd als een van de hoogtepunten van de Nederlandstalige muziek.",
    category: "Nederpop", 
    decade: "70s", 
    icon: "star",
    slug: "avond-boudewijn-de-groot-1975",
    relatedArtists: ["Boudewijn de Groot"]
  },
  { 
    year: 1976, 
    title: "Pussycat scoort Mississippi", 
    description: "Pussycat bereikt met Mississippi de #1 positie in meerdere landen en verkoopt miljoenen platen.", 
    longDescription: "Pussycat, de band rond de drie zussen Kowalczyk uit Limburg, scoorde met 'Mississippi' een megahit. Het nummer bereikte de nummer 1 positie in vele Europese landen en verkocht miljoenen exemplaren. De zachte country-pop sound was vernieuwend voor die tijd en bewees dat ook buiten de Randstad grote sterren konden opstaan.",
    category: "Country Pop", 
    decade: "70s", 
    icon: "disc",
    slug: "pussycat-mississippi-1976",
    relatedArtists: ["Pussycat"]
  },
  { 
    year: 1977, 
    title: "Herman Brood doorbraak", 
    description: "Herman Brood & His Wild Romance brengen 'Street' uit en veranderen de Nederlandse rockscene voorgoed.", 
    longDescription: "Herman Brood bracht een rauwe energie naar de Nederlandse muziekscene die eerder niet bestond. Zijn levensstijl was even legendarisch als zijn muziek. 'Saturday Night' werd een anthem en Brood werd een cultheld. Naast muzikant was hij ook een gevierd kunstschilder wiens werk nog steeds wordt verzameld.",
    category: "Rock", 
    decade: "70s", 
    icon: "star", 
    funFact: "Brood was ook een gevierd schilder",
    slug: "herman-brood-doorbraak-1977",
    relatedArtists: ["Herman Brood"]
  },
  { 
    year: 1979, 
    title: "Luv' internationale hit", 
    description: "Luv' scoort met 'You're the Greatest Lover' een internationale hit en wordt Nederlands succesvolste meidengroep.", 
    longDescription: "Luv' was een fenomeen in de late jaren 70. De drie dames combineerden catchy discopop met strakke choreografie. Ze scoorden hit na hit en werden internationaal bekend. Hun succes baande de weg voor latere Nederlandse meidengroepen en popacts.",
    category: "Disco", 
    decade: "70s", 
    icon: "disc",
    slug: "luv-internationale-hit-1979",
    relatedArtists: ["Luv'"]
  },
  
  // 1980s
  { 
    year: 1981, 
    title: "Doe Maar opgericht", 
    description: "Doe Maar wordt opgericht en introduceert ska en reggae invloeden in de Nederlandse popmuziek.", 
    longDescription: "Doe Maar combineerde ska, reggae en new wave met Nederlandstalige teksten over alledaagse onderwerpen. Deze mix was revolutionair en sloeg in als een bom. Ernst Jansz, Henny Vrienten en later Joost Belinfante creëerden een geluid dat de jeugd direct aansprak.",
    category: "Nederpop", 
    decade: "80s", 
    icon: "music",
    slug: "doe-maar-opgericht-1981",
    relatedArtists: ["Doe Maar"]
  },
  { 
    year: 1982, 
    title: "Doe Maar Mania", 
    description: "Doe Maar domineert de hitlijsten met 'Skunk' en veroorzaakt massahysterie onder tieners.", 
    longDescription: "De Doe Maar gekte bereikte zijn hoogtepunt in 1982. Tienermeisjes gilden bij concerten, albums vlogen over de toonbank en de band kon geen stap zetten zonder belaagd te worden. Het was de eerste echte popmania in Nederland sinds de Beatles. Nummers als 'Smoorverliefd' en 'Doris Day' werden volksliederen.",
    category: "Nederpop", 
    decade: "80s", 
    icon: "award", 
    funFact: "Fans werden 'Doe Maar-meisjes' genoemd",
    slug: "doe-maar-mania-1982",
    relatedArtists: ["Doe Maar"]
  },
  { 
    year: 1983, 
    title: "Het Goede Doel's België", 
    description: "Het Goede Doel brengt 'België' uit, dat een cult-klassieker wordt in de Nederpop.", 
    longDescription: "Het Goede Doel, rond frontman Henk Westbroek, bracht intelligent geschreven new wave naar Nederland. 'België (Is Er Leven Op Plansen?)' met zijn absurdistische tekst werd een cultklassieker. De band bewees dat je slim en toegankelijk tegelijk kon zijn.",
    category: "New Wave", 
    decade: "80s", 
    icon: "radio",
    slug: "het-goede-doel-belgie-1983",
    relatedArtists: ["Het Goede Doel"]
  },
  { 
    year: 1984, 
    title: "André Hazes doorbraak", 
    description: "André Hazes scoort zijn eerste grote hit 'Eenzame Kerst' en wordt de koning van het levenslied.", 
    longDescription: "André Hazes groeide uit tot de onbetwiste koning van het Nederlandse levenslied. Zijn emotionele voordracht en herkenbare teksten raakten miljoenen mensen. Van 'Bloed, Zweet en Tranen' tot 'Zij Gelooft in Mij', Hazes schreef de soundtrack van het Nederlandse volksleven. Zijn concerten waren legendarische happening.",
    category: "Levenslied", 
    decade: "80s", 
    icon: "star", 
    funFact: "Hij verkocht meer dan 10 miljoen platen",
    slug: "andre-hazes-doorbraak-1984",
    relatedArtists: ["André Hazes"]
  },
  { 
    year: 1985, 
    title: "Frank Boeijen's Kronenburg Park", 
    description: "De Frank Boeijen Groep brengt 'Kronenburg Park' uit, een tijdloze Nederlandse klassieker.", 
    longDescription: "Frank Boeijen combineerde poëtische teksten met toegankelijke melodieën. 'Kronenburg Park', over het gelijknamige park in Arnhem, werd een van de meest geliefde Nederlandse nummers. De nostalgische sfeer en de herkenbare thema's van opgroeien resoneren nog steeds.",
    category: "Pop", 
    decade: "80s", 
    icon: "music",
    slug: "kronenburg-park-1985",
    relatedArtists: ["Frank Boeijen Groep"]
  },
  { 
    year: 1986, 
    title: "BZN's recordverkoop", 
    description: "BZN bereikt ongekende albums verkopen en wordt een van de best verkopende Nederlandse acts.", 
    longDescription: "BZN uit Volendam was een verkoopfenomeen. Hun romantische ballads en uptempo nummers vonden een massaal publiek, niet alleen in Nederland maar ook in Duitsland en andere landen. Albums gingen platina en concerten waren uitverkocht. Ze bewezen dat Volendam niet voor niets de muziekhoofdstad van Nederland wordt genoemd.",
    category: "Pop", 
    decade: "80s", 
    icon: "disc",
    slug: "bzn-recordverkoop-1986",
    relatedArtists: ["BZN"]
  },
  { 
    year: 1988, 
    title: "Gabber ontstaat in Rotterdam", 
    description: "In Rotterdam ontstaat de gabber-scene, een hardcore techno stroming die wereldwijd invloed krijgt.", 
    longDescription: "Rotterdam werd de bakermat van gabber, een extreme vorm van techno met snelle beats en harde kicks. Labels als Rotterdam Records en artiesten als Paul Elstak en Rotterdam Terror Corps definieerden het genre. De gabber scene had zijn eigen mode (trainingsbroeken, Nike Air Max) en cultuur die wereldwijd werd gekopieerd.",
    category: "Electronic", 
    decade: "80s", 
    icon: "radio", 
    funFact: "Rotterdam wordt het epicentrum van hardcore",
    slug: "gabber-rotterdam-1988",
    relatedArtists: ["Paul Elstak", "Rotterdam Terror Corps"]
  },
  
  // 1990s
  { 
    year: 1990, 
    title: "Marco Borsato debuut", 
    description: "Marco Borsato brengt zijn debuutalbum uit en begint zijn reis naar Nederlands grootste popster.", 
    longDescription: "Marco Borsato begon met Italiaanse covers maar vond zijn ware roeping in Nederlandstalige pop. Hij groeide uit tot de grootste popster die Nederland ooit heeft gekend, met uitverkochte stadion tours en een ongeëvenaarde hitreeks. Zijn emotionele ballads werden de soundtrack van talloze bruiloften en begrafenissen.",
    category: "Pop", 
    decade: "90s", 
    icon: "star",
    slug: "marco-borsato-debuut-1990",
    relatedArtists: ["Marco Borsato"]
  },
  { 
    year: 1992, 
    title: "Urban Dance Squad internationaal", 
    description: "Urban Dance Squad krijgt internationale erkenning en beïnvloedt bands als Rage Against the Machine.", 
    longDescription: "Urban Dance Squad uit Utrecht was hun tijd ver vooruit. Hun mix van rap, rock en funk beïnvloedde talloze internationale bands. Rage Against the Machine en Red Hot Chili Peppers noemden hen als inspiratie. Helaas bleef het grote commerciële succes in eigen land relatief beperkt.",
    category: "Rap-Rock", 
    decade: "90s", 
    icon: "award",
    slug: "urban-dance-squad-1992",
    relatedArtists: ["Urban Dance Squad"]
  },
  { 
    year: 1993, 
    title: "Tiësto begint DJ carrière", 
    description: "Tiësto begint zijn carrière als DJ in Nederlandse clubs en legt de basis voor zijn wereldheerschappij.", 
    longDescription: "Tijs Verwest, beter bekend als Tiësto, begon zijn carrière in kleine Nederlandse clubs. Niemand kon toen voorspellen dat hij zou uitgroeien tot een van de invloedrijkste DJ's aller tijden. Zijn residenties bij grote clubs en zijn radioshow In Search of Sunrise legden de basis voor zijn latere werelddominantie.",
    category: "Trance", 
    decade: "90s", 
    icon: "disc",
    slug: "tiesto-start-1993",
    relatedArtists: ["Tiësto"]
  },
  { 
    year: 1994, 
    title: "De Dijk viert 10 jaar", 
    description: "De Dijk bestaat 10 jaar en heeft zich gevestigd als een van de beste Nederlandse rockbands.", 
    longDescription: "De Dijk, rond zanger Huub van der Lubbe, bracht soulvolle Nederlandstalige rock. Hun muziek werd de soundtrack voor een generatie met klassiekers als 'Als Ze Er Niet Is' en 'Groot Hart'. De band bleef trouw aan hun geluid en hun live reputatie is legendarisch.",
    category: "Rock", 
    decade: "90s", 
    icon: "music",
    slug: "de-dijk-10-jaar-1994",
    relatedArtists: ["De Dijk"]
  },
  { 
    year: 1995, 
    title: "Anouk's debuut", 
    description: "Anouk brengt 'Nobody's Wife' uit en wordt Nederlands internationale rock-export.", 
    longDescription: "Anouk Teeuwe brak door met een geluid dat Nederland niet eerder had gehoord. Haar krachtige stem en no-nonsense attitude maakten haar tot een icoon. 'Nobody's Wife' werd internationaal opgepikt en Anouk bleef decennialang relevant met hits en memorabele Songfestival optredens.",
    category: "Rock", 
    decade: "90s", 
    icon: "star", 
    funFact: "Ze was pas 20 jaar oud",
    slug: "anouk-debuut-1995",
    relatedArtists: ["Anouk"]
  },
  { 
    year: 1996, 
    title: "Within Temptation opgericht", 
    description: "Sharon den Adel en Robert Westerholt starten Within Temptation, pioniers van symphonic metal.", 
    longDescription: "Within Temptation bracht een nieuw geluid naar de metalwereld: symfonische metal met opera-achtige vocalen. Sharon den Adel's stem combineerde met orkestrale arrangementen en heavy gitaren tot iets unieks. De band groeide uit tot een internationale headliner en inspireerde een heel genre.",
    category: "Metal", 
    decade: "90s", 
    icon: "music",
    slug: "within-temptation-opgericht-1996",
    relatedArtists: ["Within Temptation"]
  },
  { 
    year: 1997, 
    title: "Guus Meeuwis doorbraak", 
    description: "Guus Meeuwis scoort met 'Het Is Een Nacht' een mega-hit die nog steeds op elk feest gedraaid wordt.", 
    longDescription: "Guus Meeuwis begon met Vagant maar vond solo zijn grootste succes. 'Het Is Een Nacht' werd een volkslied dat op elk feest, elke bruiloft en elke kroeg wordt meegezongen. Het nummer, gebaseerd op een ware gebeurtenis, raakte een snaar bij miljoenen Nederlanders.",
    category: "Pop", 
    decade: "90s", 
    icon: "star", 
    funFact: "Het nummer is gebaseerd op een ware gebeurtenis",
    slug: "het-is-een-nacht-1997",
    relatedArtists: ["Guus Meeuwis"]
  },
  { 
    year: 1998, 
    title: "Trance Energy eerste editie", 
    description: "Het eerste Trance Energy festival wordt gehouden, een mijlpaal voor de Nederlandse dance scene.", 
    longDescription: "Trance Energy in de Jaarbeurs Utrecht was een keerpunt voor de Nederlandse dance scene. Het festival trok duizenden liefhebbers van het opkomende trance genre en vestigde Nederland als wereldcentrum voor elektronische dansmuziek. De line-ups lezen als een who's who van trance legenden.",
    category: "Electronic", 
    decade: "90s", 
    icon: "radio",
    slug: "trance-energy-1998",
    relatedArtists: ["Tiësto", "Armin van Buuren"]
  },
  { 
    year: 1999, 
    title: "Krezip grote doorbraak", 
    description: "Krezip scoort met 'I Would Stay' en wordt een van de populairste Nederlandse rockbands.", 
    longDescription: "Krezip, met Jacqueline Govaert als frontvrouw, bracht gitaarrock terug in de hitlijsten. 'I Would Stay' werd een gigantische hit en de band groeide uit tot festivalfavorieten. Hun sound was fris en energiek, perfect voor de generatie die opgroeide aan het einde van de jaren 90.",
    category: "Rock", 
    decade: "90s", 
    icon: "star",
    slug: "krezip-doorbraak-1999",
    relatedArtists: ["Krezip"]
  },
  
  // 2000s
  { 
    year: 2000, 
    title: "Armin van Buuren's eerste album", 
    description: "Armin van Buuren brengt zijn debuutalbum uit en A State of Trance begint te groeien.", 
    longDescription: "Armin van Buuren combineerde zijn studie rechten met een opkomende DJ carrière. Zijn radioshow A State of Trance begon klein maar groeide uit tot een wereldwijd fenomeen met miljoenen luisteraars. Zijn debuutalbum markeerde het begin van een carrière die hem tot vijfvoudig nummer 1 DJ ter wereld zou maken.",
    category: "Trance", 
    decade: "00s", 
    icon: "disc",
    slug: "armin-van-buuren-debuut-2000",
    relatedArtists: ["Armin van Buuren"]
  },
  { 
    year: 2001, 
    title: "Tiësto #1 DJ ter wereld", 
    description: "Tiësto wordt uitgeroepen tot beste DJ ter wereld en zet Nederland definitief op de kaart als EDM grootmacht.", 
    longDescription: "Tiësto's kroning tot nummer 1 DJ was een kantelpunt. Hij was de eerste die solo stadions uitverkocht, hij speelde op de Olympische Spelen opening en zijn albums verkochten miljoenen. Hij baande de weg voor een hele generatie Nederlandse DJ's en vestigde Nederland als het wereldcentrum van elektronische dansmuziek.",
    category: "Trance", 
    decade: "00s", 
    icon: "award", 
    funFact: "Hij was de eerste DJ die solo in een stadion optrad",
    slug: "tiesto-nummer-1-2001",
    relatedArtists: ["Tiësto"]
  },
  { 
    year: 2002, 
    title: "De Jeugd van Tegenwoordig start", 
    description: "De Jeugd van Tegenwoordig wordt opgericht en brengt een nieuwe golf Nederlandstalige hiphop.", 
    longDescription: "De Jeugd van Tegenwoordig bracht hiphop naar Nederland die anders klonk dan alles wat er was. Hun absurdistische teksten, vernieuwende beats en energieke live shows maakten hen tot cultfiguren. 'Watskebansen' en 'Sterrenstof' werden volksliederen voor een nieuwe generatie.",
    category: "Hip-Hop", 
    decade: "00s", 
    icon: "mic",
    slug: "jeugd-van-tegenwoordig-2002",
    relatedArtists: ["De Jeugd van Tegenwoordig"]
  },
  { 
    year: 2003, 
    title: "Within Temptation internationaal", 
    description: "Within Temptation bereikt internationale status met het album 'The Silent Force'.", 
    longDescription: "The Silent Force was het album waarmee Within Temptation definitief doorbrak naar een internationaal publiek. De combinatie van Sharon den Adel's engelachtige stem met heavy gitaren en symfonische arrangementen sloeg wereldwijd aan. De band headlinete festivals over de hele wereld.",
    category: "Metal", 
    decade: "00s", 
    icon: "award",
    slug: "within-temptation-internationaal-2003",
    relatedArtists: ["Within Temptation"]
  },
  { 
    year: 2004, 
    title: "Afrojack begint carrière", 
    description: "Afrojack begint te produceren en DJ'en, op weg naar Grammy-nominaties en wereldfaam.", 
    longDescription: "Nick van de Wall, alias Afrojack, begon als teenager te produceren. Zijn electro house sound zou uitgroeien tot een handtekening die je op talloze hits hoort. Grammy nominaties, samenwerkingen met de grootste sterren en een imperium aan muziek volgden.",
    category: "EDM", 
    decade: "00s", 
    icon: "disc",
    slug: "afrojack-start-2004",
    relatedArtists: ["Afrojack"]
  },
  { 
    year: 2005, 
    title: "Blof domineert", 
    description: "BLOF is de best verkopende Nederlandse artiest van het jaar met meerdere hits.", 
    longDescription: "BLOF uit Zeeland groeide uit van regionale band tot nationale supersterren. Hun poëtische teksten en melodieuze rock raakten een breed publiek. Albums als 'Watermakers' en 'Omarm' werden platina en hun concerten waren gebeurtenissen. Ze bewezen dat Nederlandstalige rock commercieel én kwalitatief kon zijn.",
    category: "Pop", 
    decade: "00s", 
    icon: "star",
    slug: "blof-domineert-2005",
    relatedArtists: ["BLØF"]
  },
  { 
    year: 2006, 
    title: "Nick & Simon doorbraak", 
    description: "Nick & Simon worden met 'Kijk Omhoog' een van de populairste Nederlandse duo's.", 
    longDescription: "Nick & Simon uit Volendam brachten de traditie van Volendamse popmuziek naar een nieuwe generatie. Hun harmonieën en romantische ballads sloegen aan bij een breed publiek. Ze werden vaste gasten in televisieshows en hun albums vlogen over de toonbank.",
    category: "Pop", 
    decade: "00s", 
    icon: "mic",
    slug: "nick-simon-doorbraak-2006",
    relatedArtists: ["Nick & Simon"]
  },
  { 
    year: 2007, 
    title: "Hardwell begint op te vallen", 
    description: "Hardwell maakt zijn eerste grote remixes en bouwt aan zijn reputatie in de EDM scene.", 
    longDescription: "Robbert van de Corput, bekend als Hardwell, begon als tiener te DJ'en. Zijn energieke sets en scherpe producties vielen op in de Nederlandse clubscene. De fundering werd gelegd voor een carrière die hem twee keer tot nummer 1 DJ ter wereld zou kronen.",
    category: "EDM", 
    decade: "00s", 
    icon: "disc",
    slug: "hardwell-opkomst-2007",
    relatedArtists: ["Hardwell"]
  },
  { 
    year: 2008, 
    title: "Caro Emerald debuteert", 
    description: "Caro Emerald brengt 'Back It Up' uit en combineert jazz met moderne pop tot een uniek geluid.", 
    longDescription: "Caro Emerald bracht iets totaal nieuws: vintage jazz en swing gecombineerd met moderne productie. Haar debuutalbum 'Deleted Scenes from the Cutting Room Floor' brak records voor de langste tijd op nummer 1 in Nederland. Haar stijl was fris, origineel en onmiddellijk herkenbaar.",
    category: "Jazz Pop", 
    decade: "00s", 
    icon: "star", 
    funFact: "Haar album brak records voor langste #1 positie",
    slug: "caro-emerald-debuut-2008",
    relatedArtists: ["Caro Emerald"]
  },
  { 
    year: 2009, 
    title: "Kensington opgericht", 
    description: "Kensington wordt opgericht en bouwt gestaag aan een trouwe fanbase.", 
    longDescription: "Kensington begon als jonge band met grote ambities. Hun Engelstalige indie rock sound werd steeds verder verfijnd en hun fanbase groeide gestaag. Ze kozen bewust voor een organische groei, wat uiteindelijk resulteerde in uitverkochte Ziggo Dome shows.",
    category: "Rock", 
    decade: "00s", 
    icon: "music",
    slug: "kensington-opgericht-2009",
    relatedArtists: ["Kensington"]
  },
  
  // 2010s
  { 
    year: 2010, 
    title: "Oliver Heldens geboren als DJ", 
    description: "Een jonge Oliver Heldens begint te experimenteren met productie, op weg naar deep house dominantie.", 
    longDescription: "Oliver Heldens ontdekte als tiener zijn passie voor muziekproductie. Zijn experimenten met deep house zouden uitgroeien tot de 'future house' sound die hij zou definiëren. Hits als 'Gecko' en 'Koala' volgden en Heldens werd een van de gevraagdste DJ's ter wereld.",
    category: "Deep House", 
    decade: "10s", 
    icon: "disc",
    slug: "oliver-heldens-start-2010",
    relatedArtists: ["Oliver Heldens"]
  },
  { 
    year: 2011, 
    title: "Hardwell #1 DJ ter wereld", 
    description: "Hardwell klimt naar de top van de DJ rankings en headlinet 's werelds grootste festivals.", 
    longDescription: "Hardwell's harde werk betaalde zich uit toen hij werd uitgeroepen tot nummer 1 DJ ter wereld. Zijn energieke big room sound domineerde festivals van Tomorrowland tot Ultra. Hij bewees dat de Nederlandse DJ traditie in goede handen was bij de nieuwe generatie.",
    category: "EDM", 
    decade: "10s", 
    icon: "award",
    slug: "hardwell-nummer-1-2011",
    relatedArtists: ["Hardwell"]
  },
  { 
    year: 2012, 
    title: "Danny Vera's eerste succes", 
    description: "Danny Vera begint door te breken met authentieke rock en americana invloeden.", 
    longDescription: "Danny Vera bracht een geluid dat je niet vaak hoort in Nederland: authentieke americana en country-rock. Zijn eerlijke songs en rauwe stem vielen op. Het zou nog jaren duren voor zijn grootste succes, maar de fundering werd in deze periode gelegd.",
    category: "Rock", 
    decade: "10s", 
    icon: "music",
    slug: "danny-vera-opkomst-2012",
    relatedArtists: ["Danny Vera"]
  },
  { 
    year: 2013, 
    title: "Martin Garrix - Animals", 
    description: "De toen 17-jarige Martin Garrix verovert de wereld met 'Animals', een #1 hit in meerdere landen.", 
    longDescription: "Martin Garrix was nog scholier toen 'Animals' uitkwam, maar het nummer explodeerde wereldwijd. De iconische drop werd het geluid van een generatie festivalgangers. Garrix bewees dat leeftijd geen belemmering is voor talent en werd een van de jongste superster DJ's ooit.",
    category: "EDM", 
    decade: "10s", 
    icon: "award", 
    funFact: "Hij was nog scholier toen het nummer uitkwam",
    slug: "martin-garrix-animals-2013",
    relatedArtists: ["Martin Garrix"]
  },
  { 
    year: 2014, 
    title: "Chef'Special internationale tournee", 
    description: "Chef'Special toert internationaal en brengt hun feel-good geluid naar een wereldwijd publiek.", 
    longDescription: "Chef'Special uit Haarlem bracht feel-good pop met een positieve boodschap. Hun energieke live shows vielen niet alleen in Nederland op maar ook internationaal. De band tourde door Europa en daarbuiten en bouwde een loyale fanbase.",
    category: "Pop Rock", 
    decade: "10s", 
    icon: "radio",
    slug: "chef-special-internationaal-2014",
    relatedArtists: ["Chef'Special"]
  },
  { 
    year: 2015, 
    title: "Davina Michelle's YouTube start", 
    description: "Davina Michelle begint covers te plaatsen op YouTube, op weg naar nationale bekendheid.", 
    longDescription: "Davina Michelle begon met het uploaden van covers op YouTube. Haar krachtige stem en emotionele vertolkingen vielen op. Wat begon als hobby groeide uit tot een carrière als een van Nederlands populairste zangeressen, met eigen hits en memorabele samenwerkingen.",
    category: "Pop", 
    decade: "10s", 
    icon: "mic",
    slug: "davina-michelle-youtube-2015",
    relatedArtists: ["Davina Michelle"]
  },
  { 
    year: 2016, 
    title: "Kensington in Ziggo Dome", 
    description: "Kensington verkoopt de Ziggo Dome uit en bevestigt hun status als grote Nederlandse rockband.", 
    longDescription: "Na jaren van gestaag groeien bereikte Kensington het ultieme doel: een uitverkochte Ziggo Dome. De show bevestigde hun status als een van de belangrijkste Nederlandse rockbands van hun generatie. Hun succes bewees dat gitaarmuziek nog steeds grote zalen kon vullen.",
    category: "Rock", 
    decade: "10s", 
    icon: "star",
    slug: "kensington-ziggo-dome-2016",
    relatedArtists: ["Kensington"]
  },
  { 
    year: 2017, 
    title: "Snelle's eerste release", 
    description: "Snelle brengt zijn eerste muziek uit en bouwt aan een fanbase via sociale media.", 
    longDescription: "Lars Bos, bekend als Snelle, gebruikte sociale media om zijn muziek te verspreiden. Zijn eerlijke teksten over herkenbare onderwerpen resoneerden met jongeren. Hij bouwde een loyale fanbase die zou uitgroeien tot een van de grootste in Nederland.",
    category: "Hip-Hop", 
    decade: "10s", 
    icon: "mic",
    slug: "snelle-eerste-release-2017",
    relatedArtists: ["Snelle"]
  },
  { 
    year: 2018, 
    title: "Goldband opgericht", 
    description: "Goldband ontstaat en brengt een frisse, excentrieke sound naar de Nederlandse popscene.", 
    longDescription: "Goldband bracht iets dat Nederland niet had: excentrieke, onvoorspelbare pop met absurdistische teksten. Hun live shows werden legendarisch om hun energie en chaos. Ze werden de favorieten van een generatie die verlangde naar iets anders.",
    category: "Alt Pop", 
    decade: "10s", 
    icon: "music",
    slug: "goldband-opgericht-2018",
    relatedArtists: ["Goldband"]
  },
  { 
    year: 2019, 
    title: "Danny Vera's Roller Coaster", 
    description: "Danny Vera scoort met 'Roller Coaster' de langst genoteerde hit in de Top 40 geschiedenis.", 
    longDescription: "Danny Vera's jarenlange doorzettingsvermogen werd beloond toen 'Roller Coaster' de langst genoteerde hit in de Top 40 geschiedenis werd. Het nummer stond meer dan twee jaar in de lijst. De emotionele tekst over het leven raakte miljoenen mensen en Vera werd eindelijk de ster die hij altijd had moeten zijn.",
    category: "Rock", 
    decade: "10s", 
    icon: "award", 
    funFact: "Het nummer stond meer dan 2 jaar in de lijst",
    slug: "danny-vera-roller-coaster-2019",
    relatedArtists: ["Danny Vera"]
  },
  
  // 2020s
  { 
    year: 2020, 
    title: "Snelle domineert tijdens lockdown", 
    description: "Snelle's muziek biedt troost tijdens de pandemie met nummers als 'Smoorverliefd'.", 
    longDescription: "Tijdens de coronapandemie bood Snelle's muziek troost aan miljoenen Nederlanders. Zijn eerlijke nummers over liefde, gemis en hoop resoneerden extra tijdens de lockdowns. Hij groeide uit tot een van de grootste namen in de Nederlandse muziek.",
    category: "Hip-Hop", 
    decade: "20s", 
    icon: "star",
    slug: "snelle-lockdown-2020",
    relatedArtists: ["Snelle"]
  },
  { 
    year: 2021, 
    title: "Froukje's protestlied", 
    description: "Froukje wordt de stem van een generatie met maatschappelijk geëngageerde Nederlandstalige pop.", 
    longDescription: "Froukje bracht Nederlandstalige pop met een boodschap. Haar nummers over klimaat, maatschappij en persoonlijke groei raakten een snaar bij een jonge generatie die verlangde naar muziek met inhoud. Ze werd de stem van Gen Z in Nederland.",
    category: "Indie Pop", 
    decade: "20s", 
    icon: "mic",
    slug: "froukje-protestlied-2021",
    relatedArtists: ["Froukje"]
  },
  { 
    year: 2022, 
    title: "S10 op Eurovision", 
    description: "S10 vertegenwoordigt Nederland op het Eurovisie Songfestival met 'De Diepte' en eindigt in de top 15.", 
    longDescription: "S10, Stien den Hollander, bracht iets bijzonders naar het Songfestival: een volledig Nederlands gezongen nummer met emotionele diepgang. 'De Diepte' raakte miljoenen kijkers en bewees dat taal geen barrière hoeft te zijn voor muzikale connectie.",
    category: "Pop", 
    decade: "20s", 
    icon: "award",
    slug: "s10-eurovision-2022",
    relatedArtists: ["S10"]
  },
  { 
    year: 2023, 
    title: "Goldband's festival dominantie", 
    description: "Goldband headlinet grote festivals en wordt een van de meest gevraagde Nederlandse acts.", 
    longDescription: "Goldband's onconventionele benadering van pop betaalde zich uit met headliner slots op de grootste Nederlandse festivals. Hun chaotische, energieke shows werden legendarisch en ze bewezen dat je commercieel succes kunt hebben zonder concessies te doen aan je eigenheid.",
    category: "Alt Pop", 
    decade: "20s", 
    icon: "star",
    slug: "goldband-festivals-2023",
    relatedArtists: ["Goldband"]
  },
  { 
    year: 2024, 
    title: "Joost Klein viral", 
    description: "Joost Klein gaat viraal met zijn unieke stijl en vertegenwoordigt Nederland op het Songfestival.", 
    longDescription: "Joost Klein's unieke mix van electronic, humor en Friese eigenheid maakte hem tot een viraal fenomeen. Zijn video's bereikten miljoenen views en zijn Songfestival bijdrage 'Europapa' werd een fenomeen. Hij bewees dat authenticiteit en eigenzinnigheid nog steeds winnen.",
    category: "Pop", 
    decade: "20s", 
    icon: "radio", 
    funFact: "Zijn video's bereikten miljoenen views",
    slug: "joost-klein-viral-2024",
    relatedArtists: ["Joost Klein"]
  },
];

export const DECADES = ["Alle", "50s", "60s", "70s", "80s", "90s", "00s", "10s", "20s"];

export const DECADE_INFO: Record<string, { name: string; years: string; description: string; color: string }> = {
  "50s": { name: "Jaren 50", years: "1950-1959", description: "De opkomst van het Nederlandse levenslied en de eerste popsterren.", color: "hsl(45, 100%, 50%)" },
  "60s": { name: "Jaren 60", years: "1960-1969", description: "Nederbiet, rock'n'roll en de eerste internationale doorbraken.", color: "hsl(280, 70%, 50%)" },
  "70s": { name: "Jaren 70", years: "1970-1979", description: "Progressieve rock, disco en wereldhits als Radar Love.", color: "hsl(24, 100%, 50%)" },
  "80s": { name: "Jaren 80", years: "1980-1989", description: "Nederpop explosie, Doe Maar mania en de geboorte van gabber.", color: "hsl(330, 80%, 50%)" },
  "90s": { name: "Jaren 90", years: "1990-1999", description: "Trance revolutie, Nederlandse rock en de opkomst van DJ cultuur.", color: "hsl(200, 80%, 50%)" },
  "00s": { name: "Jaren 00", years: "2000-2009", description: "EDM werelddominantie en het gouden tijdperk van Nederlandse DJ's.", color: "hsl(150, 70%, 45%)" },
  "10s": { name: "Jaren 10", years: "2010-2019", description: "Streaming revolutie, Martin Garrix en Danny Vera's recordhit.", color: "hsl(0, 80%, 50%)" },
  "20s": { name: "Jaren 20", years: "2020-2029", description: "Nieuwe generatie, viral hits en Nederlandstalige renaissance.", color: "hsl(260, 70%, 55%)" },
};

export const iconMap = {
  star: Star,
  award: Award,
  mic: Mic2,
  radio: Radio,
  disc: Disc3,
  music: Music2,
};
