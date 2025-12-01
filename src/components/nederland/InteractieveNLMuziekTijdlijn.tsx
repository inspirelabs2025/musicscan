import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { 
  ChevronLeft, 
  ChevronRight, 
  Shuffle, 
  Play, 
  Pause,
  Music2,
  Star,
  Award,
  Mic2,
  Radio,
  Disc3,
  Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface MuziekFeit {
  year: number;
  title: string;
  description: string;
  category: string;
  decade: string;
  funFact?: string;
  icon: "star" | "award" | "mic" | "radio" | "disc" | "music";
}

// 50+ Nederlandse muziek feiten
const NL_MUZIEK_FEITEN: MuziekFeit[] = [
  // 1950s
  { year: 1956, title: "Johnny Jordaan debuteert", description: "Johnny Jordaan brengt zijn eerste plaat uit en wordt de stem van Amsterdam. Zijn levensliederen worden tijdloos.", category: "Levenslied", decade: "50s", icon: "mic", funFact: "Hij werd geboren op de Lindengracht in Amsterdam" },
  { year: 1958, title: "Willy Alberti's doorbraak", description: "Willy Alberti scoort zijn eerste grote hit en wordt een van Nederlands meest geliefde zangers.", category: "Levenslied", decade: "50s", icon: "star" },
  
  // 1960s
  { year: 1960, title: "The Cats opgericht", description: "In Volendam wordt The Cats opgericht, die later uitgroeit tot een van de succesvolste Nederlandse bands.", category: "Pop", decade: "60s", icon: "music" },
  { year: 1964, title: "Nederbiet explosie", description: "Nederlandse bands volgen massaal de Beatles. Bands als The Motions en Q65 domineren de hitlijsten.", category: "Beat", decade: "60s", icon: "radio", funFact: "Meer dan 100 beatbands ontstonden in dit jaar" },
  { year: 1966, title: "Rob de Nijs breekt door", description: "Rob de Nijs scoort zijn eerste hit 'Ritme van de Regen' en wordt een blijvende Nederlandse popster.", category: "Pop", decade: "60s", icon: "star" },
  { year: 1969, title: "Venus #1 in de VS", description: "Shocking Blue bereikt als eerste Nederlandse band de #1 positie in de Amerikaanse Billboard Hot 100 met Venus.", category: "Rock", decade: "60s", icon: "award", funFact: "Het nummer werd later gecoverd door Bananarama" },
  { year: 1969, title: "Focus opgericht", description: "Jan Akkerman en Thijs van Leer richten Focus op, die later wereldfaam bereikt met Hocus Pocus.", category: "Prog Rock", decade: "60s", icon: "music" },
  
  // 1970s
  { year: 1970, title: "George Baker's Little Green Bag", description: "George Baker Selection scoort internationaal met Little Green Bag, later gebruikt in Reservoir Dogs.", category: "Pop", decade: "70s", icon: "disc", funFact: "De film van Tarantino maakte het nummer opnieuw populair" },
  { year: 1971, title: "Mouth & MacNeal gevormd", description: "Het duo scoort direct met How Do You Do? en vertegenwoordigt Nederland op het Songfestival.", category: "Pop", decade: "70s", icon: "mic" },
  { year: 1973, title: "Radar Love wereldhit", description: "Golden Earring scoort met Radar Love een wereldwijde hit. Het nummer wordt een van de meest gedraaide rocksongs ooit.", category: "Rock", decade: "70s", icon: "award", funFact: "Het nummer gaat over een telepathische verbinding tijdens het rijden" },
  { year: 1974, title: "Teach-In wint Songfestival", description: "Nederland wint het Eurovisie Songfestival met 'Ding-A-Dong' van Teach-In.", category: "Pop", decade: "70s", icon: "award" },
  { year: 1975, title: "Boudewijn de Groot's Avond", description: "Boudewijn de Groot brengt 'Avond' uit, dat uitgroeit tot een van de mooiste Nederlandse liedjes ooit.", category: "Nederpop", decade: "70s", icon: "star" },
  { year: 1976, title: "Pussycat scoort Mississippi", description: "Pussycat bereikt met Mississippi de #1 positie in meerdere landen en verkoopt miljoenen platen.", category: "Country Pop", decade: "70s", icon: "disc" },
  { year: 1977, title: "Herman Brood doorbraak", description: "Herman Brood & His Wild Romance brengen 'Street' uit en veranderen de Nederlandse rockscene voorgoed.", category: "Rock", decade: "70s", icon: "star", funFact: "Brood was ook een gevierd schilder" },
  { year: 1979, title: "Luv' internationale hit", description: "Luv' scoort met 'You're the Greatest Lover' een internationale hit en wordt Nederlands succesvolste meidengroep.", category: "Disco", decade: "70s", icon: "disc" },
  
  // 1980s
  { year: 1981, title: "Doe Maar opgericht", description: "Doe Maar wordt opgericht en introduceert ska en reggae invloeden in de Nederlandse popmuziek.", category: "Nederpop", decade: "80s", icon: "music" },
  { year: 1982, title: "Doe Maar Mania", description: "Doe Maar domineert de hitlijsten met 'Skunk' en veroorzaakt massahysterie onder tieners.", category: "Nederpop", decade: "80s", icon: "award", funFact: "Fans werden 'Doe Maar-meisjes' genoemd" },
  { year: 1983, title: "Het Goede Doel's België", description: "Het Goede Doel brengt 'België' uit, dat een cult-klassieker wordt in de Nederpop.", category: "New Wave", decade: "80s", icon: "radio" },
  { year: 1984, title: "André Hazes doorbraak", description: "André Hazes scoort zijn eerste grote hit 'Eenzame Kerst' en wordt de koning van het levenslied.", category: "Levenslied", decade: "80s", icon: "star", funFact: "Hij verkocht meer dan 10 miljoen platen" },
  { year: 1985, title: "Frank Boeijen's Kronenburg Park", description: "De Frank Boeijen Groep brengt 'Kronenburg Park' uit, een tijdloze Nederlandse klassieker.", category: "Pop", decade: "80s", icon: "music" },
  { year: 1986, title: "BZN's recordverkoop", description: "BZN bereikt ongekende albums verkopen en wordt een van de best verkopende Nederlandse acts.", category: "Pop", decade: "80s", icon: "disc" },
  { year: 1988, title: "Gabber ontstaat in Rotterdam", description: "In Rotterdam ontstaat de gabber-scene, een hardcore techno stroming die wereldwijd invloed krijgt.", category: "Electronic", decade: "80s", icon: "radio", funFact: "Rotterdam wordt het epicentrum van hardcore" },
  
  // 1990s
  { year: 1990, title: "Marco Borsato debuut", description: "Marco Borsato brengt zijn debuutalbum uit en begint zijn reis naar Nederlands grootste popster.", category: "Pop", decade: "90s", icon: "star" },
  { year: 1992, title: "Urban Dance Squad internationaal", description: "Urban Dance Squad krijgt internationale erkenning en beïnvloedt bands als Rage Against the Machine.", category: "Rap-Rock", decade: "90s", icon: "award" },
  { year: 1993, title: "Tiësto begint DJ carrière", description: "Tiësto begint zijn carrière als DJ in Nederlandse clubs en legt de basis voor zijn wereldheerschappij.", category: "Trance", decade: "90s", icon: "disc" },
  { year: 1994, title: "De Dijk viert 10 jaar", description: "De Dijk bestaat 10 jaar en heeft zich gevestigd als een van de beste Nederlandse rockbands.", category: "Rock", decade: "90s", icon: "music" },
  { year: 1995, title: "Anouk's debuut", description: "Anouk brengt 'Nobody's Wife' uit en wordt Nederlands internationale rock-export.", category: "Rock", decade: "90s", icon: "star", funFact: "Ze was pas 20 jaar oud" },
  { year: 1996, title: "Within Temptation opgericht", description: "Sharon den Adel en Robert Westerholt starten Within Temptation, pioniers van symphonic metal.", category: "Metal", decade: "90s", icon: "music" },
  { year: 1997, title: "Guus Meeuwis doorbraak", description: "Guus Meeuwis scoort met 'Het Is Een Nacht' een mega-hit die nog steeds op elk feest gedraaid wordt.", category: "Pop", decade: "90s", icon: "star", funFact: "Het nummer is gebaseerd op een ware gebeurtenis" },
  { year: 1998, title: "Trance Energy eerste editie", description: "Het eerste Trance Energy festival wordt gehouden, een mijlpaal voor de Nederlandse dance scene.", category: "Electronic", decade: "90s", icon: "radio" },
  { year: 1999, title: "Krezip grote doorbraak", description: "Krezip scoort met 'I Would Stay' en wordt een van de populairste Nederlandse rockbands.", category: "Rock", decade: "90s", icon: "star" },
  
  // 2000s
  { year: 2000, title: "Armin van Buuren's eerste album", description: "Armin van Buuren brengt zijn debuutalbum uit en A State of Trance begint te groeien.", category: "Trance", decade: "00s", icon: "disc" },
  { year: 2001, title: "Tiësto #1 DJ ter wereld", description: "Tiësto wordt uitgeroepen tot beste DJ ter wereld en zet Nederland definitief op de kaart als EDM grootmacht.", category: "Trance", decade: "00s", icon: "award", funFact: "Hij was de eerste DJ die solo in een stadion optrad" },
  { year: 2002, title: "De Jeugd van Tegenwoordig start", description: "De Jeugd van Tegenwoordig wordt opgericht en brengt een nieuwe golf Nederlandstalige hiphop.", category: "Hip-Hop", decade: "00s", icon: "mic" },
  { year: 2003, title: "Within Temptation internationaal", description: "Within Temptation bereikt internationale status met het album 'The Silent Force'.", category: "Metal", decade: "00s", icon: "award" },
  { year: 2004, title: "Afrojack begint carrière", description: "Afrojack begint te produceren en DJ'en, op weg naar Grammy-nominaties en wereldfaam.", category: "EDM", decade: "00s", icon: "disc" },
  { year: 2005, title: "Blof domineert", description: "BLOF is de best verkopende Nederlandse artiest van het jaar met meerdere hits.", category: "Pop", decade: "00s", icon: "star" },
  { year: 2006, title: "Nick & Simon doorbraak", description: "Nick & Simon worden met 'Kijk Omhoog' een van de populairste Nederlandse duo's.", category: "Pop", decade: "00s", icon: "mic" },
  { year: 2007, title: "Hardwell begint op te vallen", description: "Hardwell maakt zijn eerste grote remixes en bouwt aan zijn reputatie in de EDM scene.", category: "EDM", decade: "00s", icon: "disc" },
  { year: 2008, title: "Caro Emerald debuteert", description: "Caro Emerald brengt 'Back It Up' uit en combineert jazz met moderne pop tot een uniek geluid.", category: "Jazz Pop", decade: "00s", icon: "star", funFact: "Haar album brak records voor langste #1 positie" },
  { year: 2009, title: "Kensington opgericht", description: "Kensington wordt opgericht en bouwt gestaag aan een trouwe fanbase.", category: "Rock", decade: "00s", icon: "music" },
  
  // 2010s
  { year: 2010, title: "Oliver Heldens geboren als DJ", description: "Een jonge Oliver Heldens begint te experimenteren met productie, op weg naar deep house dominantie.", category: "Deep House", decade: "10s", icon: "disc" },
  { year: 2011, title: "Hardwell #1 DJ ter wereld", description: "Hardwell klimt naar de top van de DJ rankings en headlinet 's werelds grootste festivals.", category: "EDM", decade: "10s", icon: "award" },
  { year: 2012, title: "Danny Vera's eerste succes", description: "Danny Vera begint door te breken met authentieke rock en americana invloeden.", category: "Rock", decade: "10s", icon: "music" },
  { year: 2013, title: "Martin Garrix - Animals", description: "De toen 17-jarige Martin Garrix verovert de wereld met 'Animals', een #1 hit in meerdere landen.", category: "EDM", decade: "10s", icon: "award", funFact: "Hij was nog scholier toen het nummer uitkwam" },
  { year: 2014, title: "Chef'Special internationale tournee", description: "Chef'Special toert internationaal en brengt hun feel-good geluid naar een wereldwijd publiek.", category: "Pop Rock", decade: "10s", icon: "radio" },
  { year: 2015, title: "Davina Michelle's YouTube start", description: "Davina Michelle begint covers te plaatsen op YouTube, op weg naar nationale bekendheid.", category: "Pop", decade: "10s", icon: "mic" },
  { year: 2016, title: "Kensington in Ziggo Dome", description: "Kensington verkoopt de Ziggo Dome uit en bevestigt hun status als grote Nederlandse rockband.", category: "Rock", decade: "10s", icon: "star" },
  { year: 2017, title: "Snelle's eerste release", description: "Snelle brengt zijn eerste muziek uit en bouwt aan een fanbase via sociale media.", category: "Hip-Hop", decade: "10s", icon: "mic" },
  { year: 2018, title: "Goldband opgericht", description: "Goldband ontstaat en brengt een frisse, excentrieke sound naar de Nederlandse popscene.", category: "Alt Pop", decade: "10s", icon: "music" },
  { year: 2019, title: "Danny Vera's Roller Coaster", description: "Danny Vera scoort met 'Roller Coaster' de langst genoteerde hit in de Top 40 geschiedenis.", category: "Rock", decade: "10s", icon: "award", funFact: "Het nummer stond meer dan 2 jaar in de lijst" },
  
  // 2020s
  { year: 2020, title: "Snelle domineert tijdens lockdown", description: "Snelle's muziek biedt troost tijdens de pandemie met nummers als 'Smoorverliefd'.", category: "Hip-Hop", decade: "20s", icon: "star" },
  { year: 2021, title: "Froukje's protestlied", description: "Froukje wordt de stem van een generatie met maatschappelijk geëngageerde Nederlandstalige pop.", category: "Indie Pop", decade: "20s", icon: "mic" },
  { year: 2022, title: "S10 op Eurovision", description: "S10 vertegenwoordigt Nederland op het Eurovisie Songfestival met 'De Diepte' en eindigt in de top 15.", category: "Pop", decade: "20s", icon: "award" },
  { year: 2023, title: "Goldband's festival dominantie", description: "Goldband headlinet grote festivals en wordt een van de meest gevraagde Nederlandse acts.", category: "Alt Pop", decade: "20s", icon: "star" },
  { year: 2024, title: "Joost Klein viral", description: "Joost Klein gaat viraal met zijn unieke stijl en vertegenwoordigt Nederland op het Songfestival.", category: "Pop", decade: "20s", icon: "radio", funFact: "Zijn video's bereikten miljoenen views" },
];

const DECADES = ["Alle", "50s", "60s", "70s", "80s", "90s", "00s", "10s", "20s"];

const iconMap = {
  star: Star,
  award: Award,
  mic: Mic2,
  radio: Radio,
  disc: Disc3,
  music: Music2,
};

export function InteractieveNLMuziekTijdlijn() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedDecade, setSelectedDecade] = useState("Alle");
  const [isShuffled, setIsShuffled] = useState(false);
  const [isAutoplay, setIsAutoplay] = useState(false);
  const [shuffledFacts, setShuffledFacts] = useState<MuziekFeit[]>([]);
  const [direction, setDirection] = useState(0);
  const autoplayRef = useRef<NodeJS.Timeout | null>(null);

  // Filter facts by decade
  const filteredFacts = selectedDecade === "Alle" 
    ? NL_MUZIEK_FEITEN 
    : NL_MUZIEK_FEITEN.filter(f => f.decade === selectedDecade);

  // Get the actual facts to display (shuffled or not)
  const displayFacts = isShuffled ? shuffledFacts : filteredFacts;

  // Shuffle function
  const shuffleFacts = useCallback(() => {
    const shuffled = [...filteredFacts].sort(() => Math.random() - 0.5);
    setShuffledFacts(shuffled);
    setCurrentIndex(0);
  }, [filteredFacts]);

  // Toggle shuffle
  const toggleShuffle = () => {
    if (!isShuffled) {
      shuffleFacts();
    }
    setIsShuffled(!isShuffled);
    setCurrentIndex(0);
  };

  // Navigation
  const nextFact = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % displayFacts.length);
  }, [displayFacts.length]);

  const prevFact = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + displayFacts.length) % displayFacts.length);
  }, [displayFacts.length]);

  // Handle drag end
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x > threshold) {
      prevFact();
    } else if (info.offset.x < -threshold) {
      nextFact();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextFact();
      if (e.key === "ArrowLeft") prevFact();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextFact, prevFact]);

  // Autoplay
  useEffect(() => {
    if (isAutoplay) {
      autoplayRef.current = setInterval(nextFact, 4000);
    } else {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current);
      }
    }
    return () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current);
      }
    };
  }, [isAutoplay, nextFact]);

  // Reset index when filter changes
  useEffect(() => {
    setCurrentIndex(0);
    if (isShuffled) {
      shuffleFacts();
    }
  }, [selectedDecade]);

  const currentFact = displayFacts[currentIndex];
  const IconComponent = currentFact ? iconMap[currentFact.icon] : Music2;

  // Share function
  const shareFact = () => {
    if (currentFact) {
      const text = `🎵 ${currentFact.year}: ${currentFact.title}\n${currentFact.description}`;
      if (navigator.share) {
        navigator.share({ text });
      } else {
        navigator.clipboard.writeText(text);
        toast.success("Gekopieerd naar klembord!");
      }
    }
  };

  if (!currentFact) return null;

  return (
    <section className="py-16 bg-gradient-to-b from-background to-muted/30 overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Nederlandse{" "}
            <span className="bg-gradient-to-r from-[hsl(24,100%,50%)] to-[hsl(0,84%,40%)] bg-clip-text text-transparent">
              Muziekgeschiedenis
            </span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Swipe door {displayFacts.length} iconische momenten uit de Nederlandse muziekgeschiedenis
          </p>
        </motion.div>

        {/* Decade Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {DECADES.map((decade) => (
            <Button
              key={decade}
              variant={selectedDecade === decade ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDecade(decade)}
              className={cn(
                "transition-all",
                selectedDecade === decade && "bg-gradient-to-r from-[hsl(24,100%,50%)] to-[hsl(0,84%,40%)] border-none"
              )}
            >
              {decade === "Alle" ? "Alle" : `'${decade}`}
            </Button>
          ))}
        </div>

        {/* Card Container */}
        <div className="relative max-w-lg mx-auto">
          {/* Navigation Buttons */}
          <Button
            variant="ghost"
            size="icon"
            onClick={prevFact}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-16 z-10 bg-background/80 backdrop-blur-sm shadow-lg hover:bg-background"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={nextFact}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-16 z-10 bg-background/80 backdrop-blur-sm shadow-lg hover:bg-background"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>

          {/* Swipeable Card */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={`${currentFact.year}-${currentFact.title}-${currentIndex}`}
              custom={direction}
              initial={{ opacity: 0, x: direction * 300, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: direction * -300, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              className="cursor-grab active:cursor-grabbing"
            >
              <div className="bg-card border-2 border-border rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[hsl(24,100%,50%)]/10 to-transparent rounded-bl-full" />
                
                {/* Fun Fact Badge */}
                {currentFact.funFact && (
                  <Badge 
                    variant="secondary" 
                    className="absolute top-4 right-4 bg-[hsl(24,100%,50%)]/10 text-[hsl(24,100%,50%)] border-[hsl(24,100%,50%)]/30"
                  >
                    💡 Wist je dat?
                  </Badge>
                )}

                {/* Icon */}
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[hsl(24,100%,50%)] to-[hsl(0,84%,40%)] flex items-center justify-center mb-4 shadow-lg">
                  <IconComponent className="w-8 h-8 text-white" />
                </div>

                {/* Year */}
                <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-[hsl(24,100%,50%)] to-[hsl(0,84%,40%)] bg-clip-text text-transparent mb-2">
                  {currentFact.year}
                </div>

                {/* Category */}
                <Badge variant="outline" className="mb-3">
                  {currentFact.category}
                </Badge>

                {/* Title */}
                <h3 className="text-xl md:text-2xl font-bold mb-3">
                  {currentFact.title}
                </h3>

                {/* Description */}
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  {currentFact.description}
                </p>

                {/* Fun Fact */}
                {currentFact.funFact && (
                  <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground italic">
                    💡 {currentFact.funFact}
                  </div>
                )}

                {/* Share Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={shareFact}
                  className="absolute bottom-4 right-4 text-muted-foreground hover:text-foreground"
                >
                  <Share2 className="w-4 h-4 mr-1" />
                  Deel
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <Button
            variant={isAutoplay ? "default" : "outline"}
            size="sm"
            onClick={() => setIsAutoplay(!isAutoplay)}
            className={cn(
              isAutoplay && "bg-gradient-to-r from-[hsl(24,100%,50%)] to-[hsl(0,84%,40%)] border-none"
            )}
          >
            {isAutoplay ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {isAutoplay ? "Pauzeer" : "Autoplay"}
          </Button>
          
          <Button
            variant={isShuffled ? "default" : "outline"}
            size="sm"
            onClick={toggleShuffle}
            className={cn(
              isShuffled && "bg-gradient-to-r from-[hsl(24,100%,50%)] to-[hsl(0,84%,40%)] border-none"
            )}
          >
            <Shuffle className="w-4 h-4 mr-2" />
            Shuffle
          </Button>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} / {displayFacts.length}
          </span>
          <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[hsl(24,100%,50%)] to-[hsl(0,84%,40%)]"
              initial={false}
              animate={{ width: `${((currentIndex + 1) / displayFacts.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Keyboard hint */}
        <p className="text-center text-xs text-muted-foreground mt-4 hidden md:block">
          Tip: Gebruik ← → pijltjestoetsen om te navigeren
        </p>
      </div>
    </section>
  );
}
