import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Share2, ChevronLeft, ChevronRight, Music, Play, Disc3, Sparkles } from "lucide-react";
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
import { ConditionalFooter } from "@/components/ConditionalFooter";
import { SmartArtistLinks } from "@/components/nederland/SmartArtistLink";

export default function NLMuziekFeitDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const factIndex = NL_MUZIEK_FEITEN.findIndex(f => f.slug === slug);
  const fact = NL_MUZIEK_FEITEN[factIndex];
  
  const prevFact = factIndex > 0 ? NL_MUZIEK_FEITEN[factIndex - 1] : null;
  const nextFact = factIndex < NL_MUZIEK_FEITEN.length - 1 ? NL_MUZIEK_FEITEN[factIndex + 1] : null;

  if (!fact) {
    return (
      <>
        <Helmet>
          <title>Muziekfeit niet gevonden | MusicScan</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="min-h-screen flex flex-col">
          <main className="flex-1 container mx-auto px-4 py-16 text-center">
            <h1 className="text-2xl font-bold mb-4">Muziekfeit niet gevonden</h1>
            <Button asChild>
              <Link to="/nederland">Terug naar Nederlandse muziek</Link>
            </Button>
          </main>
          <ConditionalFooter />
        </div>
      </>
    );
  }

  const decadeInfo = DECADE_INFO[fact.decade] || { color: 'hsl(var(--primary))', name: `Jaren '${fact.decade}` };
  const IconComponent = iconMap[fact.icon] || iconMap.music;
  const decadeColor = decadeInfo.color || 'hsl(var(--primary))';

  // Get related facts from same decade
  const relatedFacts = NL_MUZIEK_FEITEN
    .filter(f => f.decade === fact.decade && f.slug !== fact.slug)
    .slice(0, 3);

  // Get contextual facts from same year or nearby years
  const contextFacts = NL_MUZIEK_FEITEN
    .filter(f => Math.abs(f.year - fact.year) <= 2 && f.slug !== fact.slug)
    .slice(0, 2);

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
        <title>{`${fact.title} (${fact.year}) - Nederlandse Muziekgeschiedenis | MusicScan`}</title>
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
            },
            "about": {
              "@type": "MusicEvent",
              "name": fact.title,
              "startDate": `${fact.year}`
            }
          })}
        </script>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        
        <main className="flex-1">
          {/* Hero Section */}
          <section 
            className="relative py-20 overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${decadeColor}15, transparent 50%)`
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
                        backgroundColor: `${decadeColor}20`,
                        borderColor: decadeColor,
                        color: decadeColor
                      }}
                    >
                      {fact.category}
                    </Badge>
                    <Link 
                      to={`/nl-muziek/jaren-${fact.decade}`}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {decadeInfo.name}
                    </Link>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-4">
                    <div 
                      className="w-16 h-16 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${decadeColor}15` }}
                    >
                      <IconComponent 
                        className="w-8 h-8" 
                        style={{ color: decadeColor }}
                      />
                    </div>
                    <div 
                      className="text-6xl md:text-8xl font-bold"
                      style={{ color: decadeColor }}
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

                  {/* YouTube Embed */}
                  {fact.youtubeId && (
                    <Card className="overflow-hidden mb-8">
                      <div className="aspect-video">
                        <iframe
                          src={`https://www.youtube.com/embed/${fact.youtubeId}`}
                          title={`${fact.title} - Video`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full"
                        />
                      </div>
                      <div className="p-4 bg-muted/30">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Play className="w-4 h-4" />
                          Bekijk de video van dit historische moment
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Famous Track */}
                  {fact.famousTrack && (
                    <Card 
                      className="p-6 mb-8"
                      style={{ 
                        borderColor: `${decadeColor}30`,
                        background: `linear-gradient(135deg, ${decadeColor}08, transparent)`
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${decadeColor}15` }}
                        >
                          <Music className="w-6 h-6" style={{ color: decadeColor }} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                            <Disc3 className="w-4 h-4" style={{ color: decadeColor }} />
                            Bekendste nummer
                          </h3>
                          <p className="text-xl font-semibold" style={{ color: decadeColor }}>
                            "{fact.famousTrack}"
                          </p>
                          {fact.spotifyUri && (
                            <a 
                              href={`https://open.spotify.com/track/${fact.spotifyUri.replace('spotify:track:', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 mt-2 text-sm text-green-600 hover:text-green-700"
                            >
                              <span className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                <Play className="w-2 h-2 text-white fill-white" />
                              </span>
                              Beluister op Spotify
                            </a>
                          )}
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Fun Fact Card */}
                  {fact.funFact && (
                    <Card 
                      className="p-6 mb-8"
                      style={{ 
                        borderColor: `${decadeColor}30`,
                        background: `linear-gradient(135deg, ${decadeColor}05, transparent)`
                      }}
                    >
                      <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-500" />
                        Wist je dat?
                      </h3>
                      <p className="text-muted-foreground">
                        {fact.funFact}
                      </p>
                    </Card>
                  )}

                  {/* Historical Context */}
                  {(fact.historicalContext || contextFacts.length > 0) && (
                    <Card className="p-6 mb-8 bg-muted/20">
                      <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Context: Rond {fact.year}
                      </h3>
                      
                      {fact.historicalContext && (
                        <p className="text-muted-foreground mb-4">
                          {fact.historicalContext}
                        </p>
                      )}
                      
                      {contextFacts.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">
                            In dezelfde periode:
                          </p>
                          {contextFacts.map((cf) => (
                            <Link 
                              key={cf.slug}
                              to={`/nl-muziekfeit/${cf.slug}`}
                              className="flex items-center gap-2 p-2 rounded-lg hover:bg-background transition-colors"
                            >
                              <span className="text-sm font-bold" style={{ color: decadeColor }}>
                                {cf.year}
                              </span>
                              <span className="text-sm">{cf.title}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </Card>
                  )}

                  {/* Related Artists - Using Smart Links */}
                  {fact.relatedArtists && fact.relatedArtists.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-lg font-bold mb-3">Gerelateerde artiesten</h3>
                      <SmartArtistLinks artists={fact.relatedArtists} />
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
                    Meer uit de {decadeInfo.name}
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
                                style={{ color: decadeColor }}
                              />
                              <span 
                                className="text-2xl font-bold"
                                style={{ color: decadeColor }}
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
                        Bekijk alle {decadeInfo.name} feiten
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
