import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  ChevronLeft, 
  ChevronRight, 
  Shuffle, 
  Play, 
  Pause,
  Share2,
  ExternalLink,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { 
  NL_MUZIEK_FEITEN, 
  DECADES, 
  DECADE_INFO,
  iconMap,
  type MuziekFeit 
} from "@/data/nederlandseMuziekFeiten";

export function DualViewNLTijdlijn() {
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

  // Get current decade from current fact
  const currentFact = displayFacts[currentIndex];
  const currentDecade = currentFact?.decade || "50s";

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

  // Jump to decade
  const jumpToDecade = (decade: string) => {
    if (decade === "Alle") {
      setSelectedDecade("Alle");
      setCurrentIndex(0);
      return;
    }
    
    // Find first fact of this decade
    const facts = isShuffled ? shuffledFacts : NL_MUZIEK_FEITEN;
    const index = facts.findIndex(f => f.decade === decade);
    if (index !== -1) {
      setSelectedDecade("Alle");
      setCurrentIndex(index);
    }
  };

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
      autoplayRef.current = setInterval(nextFact, 5000);
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

  const IconComponent = currentFact ? iconMap[currentFact.icon] : iconMap.music;

  // Share function
  const shareFact = () => {
    if (currentFact) {
      const url = `${window.location.origin}/nl-muziekfeit/${currentFact.slug}`;
      const text = `🎵 ${currentFact.year}: ${currentFact.title}\n${currentFact.description}`;
      if (navigator.share) {
        navigator.share({ text, url });
      } else {
        navigator.clipboard.writeText(`${text}\n${url}`);
        toast.success("Gekopieerd naar klembord!");
      }
    }
  };

  if (!currentFact) return null;

  const activeDecades = DECADES.filter(d => d !== "Alle");

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
            Ontdek {displayFacts.length} iconische momenten uit de Nederlandse muziekgeschiedenis
          </p>
        </motion.div>

        {/* Dual View Layout */}
        <div className="flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto">
          
          {/* Vertical Timeline (Left) */}
          <div className="lg:w-48 flex-shrink-0">
            <div className="sticky top-24">
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 hidden lg:block">
                Tijdlijn
              </h3>
              
              {/* Mobile: Horizontal scroll */}
              <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-hide">
                {activeDecades.map((decade) => {
                  const isActive = currentDecade === decade;
                  const decadeInfo = DECADE_INFO[decade];
                  const factsInDecade = NL_MUZIEK_FEITEN.filter(f => f.decade === decade).length;
                  
                  return (
                    <motion.button
                      key={decade}
                      onClick={() => jumpToDecade(decade)}
                      className={cn(
                        "relative flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left min-w-[120px] lg:min-w-0",
                        isActive 
                          ? "bg-primary/10 border border-primary/30" 
                          : "hover:bg-muted/50 border border-transparent"
                      )}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Timeline dot */}
                      <div 
                        className={cn(
                          "w-3 h-3 rounded-full flex-shrink-0 transition-all",
                          isActive ? "ring-4 ring-primary/20" : ""
                        )}
                        style={{ backgroundColor: decadeInfo?.color || "hsl(var(--primary))" }}
                      />
                      
                      {/* Decade info */}
                      <div className="flex-1">
                        <div className={cn(
                          "font-semibold text-sm",
                          isActive ? "text-foreground" : "text-muted-foreground"
                        )}>
                          '{decade}
                        </div>
                        <div className="text-xs text-muted-foreground hidden lg:block">
                          {factsInDecade} feiten
                        </div>
                      </div>

                      {/* Active indicator */}
                      {isActive && (
                        <motion.div
                          layoutId="activeDecade"
                          className="absolute right-2 w-1.5 h-6 bg-primary rounded-full hidden lg:block"
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* View all decades link */}
              <Link 
                to={`/nl-muziek/jaren-${currentDecade}`}
                className="mt-4 hidden lg:flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <span>Alle '{currentDecade} feiten</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Swipe Card Area (Right) */}
          <div className="flex-1">
            {/* Decade Filter Pills */}
            <div className="flex flex-wrap justify-center gap-2 mb-6">
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
            <div className="relative">
              {/* Navigation Buttons */}
              <Button
                variant="ghost"
                size="icon"
                onClick={prevFact}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm shadow-lg hover:bg-background hidden md:flex"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={nextFact}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm shadow-lg hover:bg-background hidden md:flex"
              >
                <ChevronRight className="w-6 h-6" />
              </Button>

              {/* Swipe Card */}
              <div className="overflow-hidden px-4 md:px-12">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={currentIndex}
                    custom={direction}
                    initial={{ opacity: 0, x: direction * 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -direction * 100 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.1}
                    onDragEnd={handleDragEnd}
                    className="cursor-grab active:cursor-grabbing"
                  >
                    <div className="bg-card border rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden min-h-[350px]">
                      {/* Background gradient based on decade */}
                      <div 
                        className="absolute inset-0 opacity-5 pointer-events-none"
                        style={{ 
                          background: `radial-gradient(circle at top right, ${DECADE_INFO[currentFact.decade]?.color || 'hsl(var(--primary))'}, transparent 70%)` 
                        }}
                      />

                      {/* Category & Year Header */}
                      <div className="flex items-center justify-between mb-4 relative">
                        <Badge 
                          variant="outline" 
                          className="bg-background/50"
                          style={{ borderColor: DECADE_INFO[currentFact.decade]?.color }}
                        >
                          {currentFact.category}
                        </Badge>
                        <div className="flex items-center gap-2">
                          <IconComponent 
                            className="w-5 h-5" 
                            style={{ color: DECADE_INFO[currentFact.decade]?.color }}
                          />
                          <span 
                            className="text-4xl md:text-5xl font-bold"
                            style={{ color: DECADE_INFO[currentFact.decade]?.color }}
                          >
                            {currentFact.year}
                          </span>
                        </div>
                      </div>

                      {/* Title & Description */}
                      <div className="relative">
                        <h3 className="text-2xl md:text-3xl font-bold mb-3">
                          {currentFact.title}
                        </h3>
                        <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                          {currentFact.description}
                        </p>
                      </div>

                      {/* Fun Fact */}
                      {currentFact.funFact && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg"
                        >
                          <p className="text-sm">
                            <span className="font-semibold text-primary">💡 Wist je dat? </span>
                            {currentFact.funFact}
                          </p>
                        </motion.div>
                      )}

                      {/* Action Buttons */}
                      <div className="mt-6 flex flex-wrap gap-2">
                        <Button asChild variant="default" size="sm">
                          <Link to={`/nl-muziekfeit/${currentFact.slug}`}>
                            Lees meer
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Link>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={shareFact}
                        >
                          <Share2 className="w-4 h-4 mr-1" />
                          Deel
                        </Button>
                        <Button asChild variant="ghost" size="sm">
                          <Link to={`/nl-muziek/jaren-${currentFact.decade}`}>
                            Meer uit de '{currentFact.decade}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Progress Indicator */}
              <div className="flex items-center justify-center gap-1 mt-4">
                {displayFacts.slice(0, Math.min(10, displayFacts.length)).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      idx === currentIndex 
                        ? "bg-primary w-6" 
                        : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    )}
                  />
                ))}
                {displayFacts.length > 10 && (
                  <span className="text-xs text-muted-foreground ml-2">
                    +{displayFacts.length - 10} meer
                  </span>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4 mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAutoplay(!isAutoplay)}
                  className={cn(isAutoplay && "text-primary")}
                >
                  {isAutoplay ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                  {isAutoplay ? "Pauzeer" : "Autoplay"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleShuffle}
                  className={cn(isShuffled && "text-primary")}
                >
                  <Shuffle className="w-4 h-4 mr-1" />
                  Shuffle
                </Button>
              </div>

              {/* Swipe hint for mobile */}
              <p className="text-center text-xs text-muted-foreground mt-4 md:hidden flex items-center justify-center gap-1">
                <ChevronLeft className="w-3 h-3" />
                Swipe om te navigeren
                <ChevronRight className="w-3 h-3" />
              </p>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Button asChild size="lg" variant="outline">
            <Link to="/vandaag-in-de-muziekgeschiedenis" className="inline-flex items-center gap-2">
              Bekijk vandaag in de muziekgeschiedenis
              <ChevronDown className="w-4 h-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
