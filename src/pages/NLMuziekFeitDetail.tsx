import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Share2, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  NL_MUZIEK_FEITEN, 
  DECADE_INFO, 
  iconMap,
  type MuziekFeit 
} from "@/data/nederlandseMuziekFeiten";
import { Navigation } from "@/components/Navigation";
import { ConditionalFooter } from "@/components/ConditionalFooter";

export default function NLMuziekFeitDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const factIndex = NL_MUZIEK_FEITEN.findIndex(f => f.slug === slug);
  const fact = NL_MUZIEK_FEITEN[factIndex];
  
  const prevFact = factIndex > 0 ? NL_MUZIEK_FEITEN[factIndex - 1] : null;
  const nextFact = factIndex < NL_MUZIEK_FEITEN.length - 1 ? NL_MUZIEK_FEITEN[factIndex + 1] : null;

  if (!fact) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Muziekfeit niet gevonden</h1>
          <Button asChild>
            <Link to="/nederland">Terug naar Nederlandse muziek</Link>
          </Button>
        </main>
        <ConditionalFooter />
      </div>
    );
  }

  const decadeInfo = DECADE_INFO[fact.decade];
  const IconComponent = iconMap[fact.icon];

  // Get related facts from same decade
  const relatedFacts = NL_MUZIEK_FEITEN
    .filter(f => f.decade === fact.decade && f.slug !== fact.slug)
    .slice(0, 3);

  const shareFact = () => {
    const url = window.location.href;
    const text = `🎵 ${fact.year}: ${fact.title}\n${fact.description}`;
    if (navigator.share) {
      navigator.share({ title: fact.title, text, url });
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`);
      toast.success("Link gekopieerd naar klembord!");
    }
  };

  return (
    <>
      <Helmet>
        <title>{fact.title} ({fact.year}) - Nederlandse Muziekgeschiedenis | MusicScan</title>
        <meta 
          name="description" 
          content={fact.longDescription || fact.description}
        />
        <link rel="canonical" href={`https://www.musicscan.app/nl-muziekfeit/${slug}`} />
        
        {/* Open Graph */}
        <meta property="og:title" content={`${fact.title} (${fact.year})`} />
        <meta property="og:description" content={fact.description} />
        <meta property="og:type" content="article" />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": fact.title,
            "description": fact.description,
            "datePublished": `${fact.year}-01-01`,
            "author": {
              "@type": "Organization",
              "name": "MusicScan"
            }
          })}
        </script>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        
        <main className="flex-1">
          {/* Hero Section */}
          <section 
            className="relative py-20 overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${decadeInfo?.color || 'hsl(var(--primary))'}15, transparent 50%)`
            }}
          >
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <Button asChild variant="ghost" size="sm" className="mb-6">
                  <Link to="/nederland">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Terug naar tijdlijn
                  </Link>
                </Button>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <Badge 
                      style={{ 
                        backgroundColor: `${decadeInfo?.color}20`,
                        borderColor: decadeInfo?.color,
                        color: decadeInfo?.color
                      }}
                    >
                      {fact.category}
                    </Badge>
                    <Link 
                      to={`/nl-muziek/jaren-${fact.decade}`}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {decadeInfo?.name}
                    </Link>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-4">
                    <div 
                      className="w-16 h-16 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${decadeInfo?.color}15` }}
                    >
                      <IconComponent 
                        className="w-8 h-8" 
                        style={{ color: decadeInfo?.color }}
                      />
                    </div>
                    <div 
                      className="text-6xl md:text-8xl font-bold"
                      style={{ color: decadeInfo?.color }}
                    >
                      {fact.year}
                    </div>
                  </div>

                  <h1 className="text-3xl md:text-5xl font-bold mb-4">
                    {fact.title}
                  </h1>
                  
                  <p className="text-xl text-muted-foreground">
                    {fact.description}
                  </p>

                  <div className="flex items-center gap-3 mt-6">
                    <Button onClick={shareFact} variant="outline">
                      <Share2 className="w-4 h-4 mr-2" />
                      Deel dit verhaal
                    </Button>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Main Content */}
          <section className="py-12">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {/* Long description */}
                  <div className="prose prose-lg dark:prose-invert max-w-none mb-8">
                    <p className="text-lg leading-relaxed">
                      {fact.longDescription || fact.description}
                    </p>
                  </div>

                  {/* Fun Fact Card */}
                  {fact.funFact && (
                    <Card 
                      className="p-6 mb-8"
                      style={{ 
                        borderColor: `${decadeInfo?.color}30`,
                        background: `linear-gradient(135deg, ${decadeInfo?.color}05, transparent)`
                      }}
                    >
                      <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                        <span>💡</span> Wist je dat?
                      </h3>
                      <p className="text-muted-foreground">
                        {fact.funFact}
                      </p>
                    </Card>
                  )}

                  {/* Related Artists */}
                  {fact.relatedArtists && fact.relatedArtists.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-lg font-bold mb-3">Gerelateerde artiesten</h3>
                      <div className="flex flex-wrap gap-2">
                        {fact.relatedArtists.map((artist) => (
                          <Link 
                            key={artist}
                            to={`/artist/${artist.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-muted rounded-full text-sm hover:bg-primary/10 transition-colors"
                          >
                            {artist}
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex items-center justify-between border-t pt-8 mt-8">
                    {prevFact ? (
                      <Button asChild variant="ghost" className="flex-1 justify-start">
                        <Link to={`/nl-muziekfeit/${prevFact.slug}`}>
                          <ChevronLeft className="w-4 h-4 mr-2" />
                          <div className="text-left">
                            <div className="text-xs text-muted-foreground">Vorige</div>
                            <div className="font-medium">{prevFact.year}: {prevFact.title}</div>
                          </div>
                        </Link>
                      </Button>
                    ) : <div />}
                    
                    {nextFact && (
                      <Button asChild variant="ghost" className="flex-1 justify-end">
                        <Link to={`/nl-muziekfeit/${nextFact.slug}`}>
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">Volgende</div>
                            <div className="font-medium">{nextFact.year}: {nextFact.title}</div>
                          </div>
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Related Facts */}
          {relatedFacts.length > 0 && (
            <section className="py-12 bg-muted/30">
              <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                  <h2 className="text-2xl font-bold mb-6">
                    Meer uit de {decadeInfo?.name}
                  </h2>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    {relatedFacts.map((relFact) => {
                      const RelIcon = iconMap[relFact.icon];
                      return (
                        <Card 
                          key={relFact.slug}
                          className="p-4 hover:shadow-lg transition-all"
                        >
                          <Link to={`/nl-muziekfeit/${relFact.slug}`}>
                            <div className="flex items-center gap-3 mb-2">
                              <RelIcon 
                                className="w-5 h-5" 
                                style={{ color: decadeInfo?.color }}
                              />
                              <span 
                                className="text-2xl font-bold"
                                style={{ color: decadeInfo?.color }}
                              >
                                {relFact.year}
                              </span>
                            </div>
                            <h3 className="font-semibold mb-1">{relFact.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {relFact.description}
                            </p>
                          </Link>
                        </Card>
                      );
                    })}
                  </div>

                  <div className="text-center mt-6">
                    <Button asChild variant="outline">
                      <Link to={`/nl-muziek/jaren-${fact.decade}`}>
                        Bekijk alle {decadeInfo?.name} feiten
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </section>
          )}
        </main>

        <ConditionalFooter />
      </div>
    </>
  );
}
