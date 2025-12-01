import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  ChevronRight, 
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
  iconMap 
} from "@/data/nederlandseMuziekFeiten";

export function DualViewNLTijdlijn() {
  const [selectedDecade, setSelectedDecade] = useState("Alle");

  // Filter facts by decade
  const displayFacts = selectedDecade === "Alle" 
    ? NL_MUZIEK_FEITEN 
    : NL_MUZIEK_FEITEN.filter(f => f.decade === selectedDecade);

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
          
          {/* Vertical Timeline Navigation (Left) */}
          <div className="lg:w-48 flex-shrink-0">
            <div className="sticky top-24">
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 hidden lg:block">
                Tijdlijn
              </h3>
              
              {/* Mobile: Horizontal scroll */}
              <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-hide">
                {activeDecades.map((decade) => {
                  const isActive = selectedDecade === decade;
                  const decadeInfo = DECADE_INFO[decade];
                  const factsInDecade = NL_MUZIEK_FEITEN.filter(f => f.decade === decade).length;
                  
                  return (
                    <motion.button
                      key={decade}
                      onClick={() => setSelectedDecade(isActive ? "Alle" : decade)}
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
              {selectedDecade !== "Alle" && (
                <Link 
                  to={`/nl-muziek/jaren-${selectedDecade}`}
                  className="mt-4 hidden lg:flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <span>Alle '{selectedDecade} feiten</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>

          {/* Vertical Timeline Content (Right) */}
          <div className="flex-1">
            {/* Decade Filter Pills */}
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

            {/* Vertical Timeline */}
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[hsl(24,100%,50%)] via-primary to-[hsl(0,84%,40%)]" />

              {/* Timeline Items */}
              <div className="space-y-8">
                {displayFacts.map((fact, index) => {
                  const FactIcon = iconMap[fact.icon];
                  const isEven = index % 2 === 0;
                  
                  return (
                    <motion.div
                      key={fact.slug}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ duration: 0.4, delay: Math.min(index * 0.03, 0.3) }}
                      className={cn(
                        "relative flex items-start gap-4",
                        "pl-12 md:pl-0",
                        isEven ? "md:flex-row" : "md:flex-row-reverse"
                      )}
                    >
                      {/* Timeline Dot */}
                      <div 
                        className={cn(
                          "absolute left-2 md:left-1/2 md:-translate-x-1/2 z-10",
                          "w-5 h-5 rounded-full border-4 border-background shadow-lg"
                        )}
                        style={{ backgroundColor: DECADE_INFO[fact.decade]?.color || 'hsl(var(--primary))' }}
                      />

                      {/* Year Label - Desktop only, opposite side */}
                      <div className={cn(
                        "hidden md:flex items-center justify-end w-[calc(50%-2rem)]",
                        isEven ? "pr-8" : "pl-8 flex-row-reverse"
                      )}>
                        <span 
                          className="text-3xl font-bold"
                          style={{ color: DECADE_INFO[fact.decade]?.color }}
                        >
                          {fact.year}
                        </span>
                      </div>

                      {/* Content Card */}
                      <div className={cn(
                        "flex-1 md:w-[calc(50%-2rem)]",
                        isEven ? "md:pl-8" : "md:pr-8"
                      )}>
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          className="bg-card border rounded-xl p-5 shadow-lg hover:shadow-xl transition-all relative overflow-hidden group"
                        >
                          {/* Background gradient */}
                          <div 
                            className="absolute inset-0 opacity-5 pointer-events-none"
                            style={{ 
                              background: `radial-gradient(circle at top right, ${DECADE_INFO[fact.decade]?.color || 'hsl(var(--primary))'}, transparent 70%)` 
                            }}
                          />

                          {/* Mobile Year */}
                          <div className="flex items-center justify-between mb-3 md:hidden">
                            <span 
                              className="text-2xl font-bold"
                              style={{ color: DECADE_INFO[fact.decade]?.color }}
                            >
                              {fact.year}
                            </span>
                            <Badge 
                              variant="outline" 
                              className="text-xs"
                              style={{ borderColor: DECADE_INFO[fact.decade]?.color }}
                            >
                              {fact.category}
                            </Badge>
                          </div>

                          {/* Desktop Category Badge */}
                          <div className="hidden md:flex items-center gap-2 mb-3">
                            <FactIcon 
                              className="w-4 h-4" 
                              style={{ color: DECADE_INFO[fact.decade]?.color }}
                            />
                            <Badge 
                              variant="outline" 
                              className="text-xs"
                              style={{ borderColor: DECADE_INFO[fact.decade]?.color }}
                            >
                              {fact.category}
                            </Badge>
                          </div>

                          {/* Title */}
                          <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">
                            {fact.title}
                          </h3>

                          {/* Description */}
                          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                            {fact.description}
                          </p>

                          {/* Fun Fact */}
                          {fact.funFact && (
                            <div className="p-2 bg-primary/5 border border-primary/20 rounded-lg mb-4">
                              <p className="text-xs">
                                <span className="font-semibold text-primary">💡 </span>
                                {fact.funFact}
                              </p>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex flex-wrap gap-2">
                            <Button asChild variant="default" size="sm" className="h-8 text-xs">
                              <Link to={`/nl-muziekfeit/${fact.slug}`}>
                                Lees meer
                                <ChevronRight className="w-3 h-3 ml-1" />
                              </Link>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() => {
                                const url = `${window.location.origin}/nl-muziekfeit/${fact.slug}`;
                                const text = `🎵 ${fact.year}: ${fact.title}\n${fact.description}`;
                                if (navigator.share) {
                                  navigator.share({ text, url });
                                } else {
                                  navigator.clipboard.writeText(`${text}\n${url}`);
                                  toast.success("Gekopieerd!");
                                }
                              }}
                            >
                              <Share2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Results count */}
              {displayFacts.length > 0 && (
                <div className="text-center mt-8 text-sm text-muted-foreground">
                  {displayFacts.length} muziekfeiten {selectedDecade !== "Alle" && `uit de jaren '${selectedDecade}`}
                </div>
              )}
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
