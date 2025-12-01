import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Music2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  NL_MUZIEK_FEITEN, 
  DECADE_INFO, 
  iconMap,
  type MuziekFeit 
} from "@/data/nederlandseMuziekFeiten";
import { Navigation } from "@/components/Navigation";
import { ConditionalFooter } from "@/components/ConditionalFooter";

export default function NLMuziekDecennium() {
  const { decade } = useParams<{ decade: string }>();
  
  // Normalize decade format (e.g., "80s" or "jaren-80s" -> "80s")
  const normalizedDecade = decade?.replace("jaren-", "").replace("jaren", "") || "80s";
  
  const decadeInfo = DECADE_INFO[normalizedDecade];
  const facts = NL_MUZIEK_FEITEN.filter(f => f.decade === normalizedDecade);

  if (!decadeInfo || facts.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Decennium niet gevonden</h1>
          <Button asChild>
            <Link to="/nederland">Terug naar Nederlandse muziek</Link>
          </Button>
        </main>
        <ConditionalFooter />
      </div>
    );
  }

  // Group facts by year
  const factsByYear = facts.reduce((acc, fact) => {
    if (!acc[fact.year]) acc[fact.year] = [];
    acc[fact.year].push(fact);
    return acc;
  }, {} as Record<number, MuziekFeit[]>);

  const years = Object.keys(factsByYear).map(Number).sort((a, b) => a - b);

  return (
    <>
      <Helmet>
        <title>{decadeInfo.name} - Nederlandse Muziekgeschiedenis | MusicScan</title>
        <meta 
          name="description" 
          content={`Ontdek de belangrijkste muziekmomenten uit de ${decadeInfo.name} (${decadeInfo.years}). ${decadeInfo.description}`}
        />
        <link rel="canonical" href={`https://www.musicscan.app/nl-muziek/jaren-${normalizedDecade}`} />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        
        <main className="flex-1">
          {/* Hero Section */}
          <section 
            className="relative py-20 overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${decadeInfo.color}15, transparent 50%)`
            }}
          >
            <div className="container mx-auto px-4">
              <Button asChild variant="ghost" size="sm" className="mb-6">
                <Link to="/nederland">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Terug naar overzicht
                </Link>
              </Button>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Badge 
                  className="mb-4"
                  style={{ 
                    backgroundColor: `${decadeInfo.color}20`,
                    borderColor: decadeInfo.color,
                    color: decadeInfo.color
                  }}
                >
                  {decadeInfo.years}
                </Badge>
                
                <h1 className="text-4xl md:text-6xl font-bold mb-4">
                  <span style={{ color: decadeInfo.color }}>{decadeInfo.name}</span>
                </h1>
                
                <p className="text-xl text-muted-foreground max-w-2xl">
                  {decadeInfo.description}
                </p>

                <div className="flex items-center gap-6 mt-6 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    <span>{facts.length} muziekmomenten</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Music2 className="w-5 h-5" />
                    <span>{years.length} jaren</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Timeline Grid */}
          <section className="py-12">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                {years.map((year, yearIndex) => (
                  <motion.div
                    key={year}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: yearIndex * 0.1 }}
                    className="relative mb-8"
                  >
                    {/* Year marker */}
                    <div className="flex items-center gap-4 mb-4">
                      <div 
                        className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                        style={{ backgroundColor: decadeInfo.color }}
                      >
                        {year.toString().slice(-2)}
                      </div>
                      <div>
                        <div className="text-3xl font-bold">{year}</div>
                        <div className="text-sm text-muted-foreground">
                          {factsByYear[year].length} {factsByYear[year].length === 1 ? 'moment' : 'momenten'}
                        </div>
                      </div>
                    </div>

                    {/* Facts for this year */}
                    <div className="ml-8 border-l-2 pl-8 space-y-4" style={{ borderColor: `${decadeInfo.color}30` }}>
                      {factsByYear[year].map((fact, factIndex) => {
                        const IconComponent = iconMap[fact.icon];
                        
                        return (
                          <motion.div
                            key={fact.slug}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: factIndex * 0.05 }}
                          >
                            <Card className="p-5 hover:shadow-lg transition-all group">
                              <div className="flex items-start gap-4">
                                <div 
                                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                  style={{ backgroundColor: `${decadeInfo.color}15` }}
                                >
                                  <IconComponent 
                                    className="w-5 h-5" 
                                    style={{ color: decadeInfo.color }}
                                  />
                                </div>
                                
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline" className="text-xs">
                                      {fact.category}
                                    </Badge>
                                  </div>
                                  
                                  <h3 className="text-lg font-bold mb-1 group-hover:text-primary transition-colors">
                                    {fact.title}
                                  </h3>
                                  
                                  <p className="text-muted-foreground text-sm mb-3">
                                    {fact.description}
                                  </p>

                                  {fact.funFact && (
                                    <p className="text-sm text-primary/80 mb-3">
                                      💡 {fact.funFact}
                                    </p>
                                  )}

                                  <Button asChild variant="ghost" size="sm" className="p-0 h-auto">
                                    <Link to={`/nl-muziekfeit/${fact.slug}`} className="flex items-center gap-1 text-primary">
                                      Lees het volledige verhaal
                                      <ChevronRight className="w-4 h-4" />
                                    </Link>
                                  </Button>
                                </div>
                              </div>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Navigate to other decades */}
          <section className="py-12 bg-muted/30">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-bold mb-6 text-center">Ontdek andere decennia</h2>
              
              <div className="flex flex-wrap justify-center gap-3">
                {Object.entries(DECADE_INFO).map(([dec, info]) => (
                  <Button
                    key={dec}
                    asChild
                    variant={dec === normalizedDecade ? "default" : "outline"}
                    style={dec === normalizedDecade ? { backgroundColor: info.color } : {}}
                  >
                    <Link to={`/nl-muziek/jaren-${dec}`}>
                      {info.name}
                    </Link>
                  </Button>
                ))}
              </div>
            </div>
          </section>
        </main>

        <ConditionalFooter />
      </div>
    </>
  );
}
