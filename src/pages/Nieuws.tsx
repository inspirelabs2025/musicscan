import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Newspaper, Search, Calendar, Sparkles, TrendingUp, Clock, ExternalLink } from "lucide-react";
import { BreadcrumbNavigation } from "@/components/SEO/BreadcrumbNavigation";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDebounceSearch } from "@/hooks/useDebounceSearch";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";

export default function Nieuws() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const debouncedSearch = useDebounceSearch(searchTerm, 300);

  const { data: musicNews = [], isLoading } = useQuery({
    queryKey: ["news-blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news_blog_posts')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const categories = useMemo(() => {
    const cats = [...new Set((musicNews as any[]).map(n => n.category).filter(Boolean))];
    return ['all', ...cats];
  }, [musicNews]);

  const filteredNews = useMemo(() => {
    return (musicNews as any[]).filter(news => {
      const matchesSearch = debouncedSearch === '' || 
        news.title?.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
        news.summary?.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || news.category === categoryFilter;
      
      return matchesSearch && matchesCategory;
    });
  }, [musicNews, debouncedSearch, categoryFilter]);

  const featuredArticle = filteredNews[0];
  const regularArticles = filteredNews.slice(1);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Muzieknieuws - AI Powered | MusicScan</title>
        <meta name="description" content="Het laatste muzieknieuws, dagelijks verzameld en herschreven door AI voor jou." />
      </Helmet>

      <BreadcrumbNavigation className="max-w-7xl mx-auto px-4 pt-4" />

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-12">
        {/* Hero Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary mb-4">
            <Sparkles className="w-4 h-4" />
            AI-Powered Nieuws
          </div>
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Muzieknieuws
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Dagelijks verzameld en herschreven door AI • Altijd actueel • Altijd betrouwbaar
          </p>
        </motion.div>

        {/* Search & Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col md:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input 
              placeholder="Zoek in het nieuws..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-12 h-12 text-lg"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-[200px] h-12">
              <SelectValue placeholder="Categorie" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>
                  {cat === 'all' ? 'Alle categorieën' : cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        {isLoading ? (
          <div className="space-y-8">
            <Skeleton className="w-full h-[400px] rounded-2xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} className="h-[320px] rounded-xl" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Featured Article */}
            {featuredArticle && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Link to={`/nieuws/${featuredArticle.slug}`}>
                  <Card className="group relative overflow-hidden h-[500px] hover:shadow-2xl transition-all duration-500 cursor-pointer border-2 hover:border-primary/50">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-10" />
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
                    
                    {featuredArticle.image_url && (
                      <div className="absolute inset-0">
                        <img 
                          src={featuredArticle.image_url} 
                          alt={featuredArticle.title}
                          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                        />
                      </div>
                    )}

                    <div className="relative z-20 h-full flex flex-col justify-end p-8 md:p-12">
                      <div className="flex items-center gap-3 mb-4">
                        <Badge className="bg-primary/90 backdrop-blur-sm text-white border-0">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                        {featuredArticle.category && (
                          <Badge variant="secondary" className="backdrop-blur-sm">
                            {featuredArticle.category}
                          </Badge>
                        )}
                      </div>

                      <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 group-hover:text-primary transition-colors">
                        {featuredArticle.title}
                      </h2>
                      
                      <p className="text-lg text-white/90 mb-6 line-clamp-2 max-w-3xl">
                        {featuredArticle.summary}
                      </p>

                      <div className="flex items-center gap-4 text-white/70 text-sm">
                        {featuredArticle.source && (
                          <span className="flex items-center gap-1">
                            <Newspaper className="w-4 h-4" />
                            {featuredArticle.source}
                          </span>
                        )}
                        {featuredArticle.published_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(featuredArticle.published_at).toLocaleDateString('nl-NL', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            )}

            {/* Regular Articles Grid */}
            {regularArticles.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold flex items-center gap-2">
                    <Clock className="w-6 h-6 text-primary" />
                    Recente Artikelen
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    {regularArticles.length} artikelen
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {regularArticles.map((article: any, index: number) => (
                    <motion.div
                      key={article.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * index }}
                    >
                      <Link to={`/nieuws/${article.slug}`}>
                        <Card className="group h-full hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border hover:border-primary/30">
                          {article.image_url && (
                            <div className="relative h-48 overflow-hidden bg-muted">
                              <img 
                                src={article.image_url} 
                                alt={article.title}
                                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            </div>
                          )}

                          <CardContent className="p-6 space-y-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              {article.category && (
                                <Badge variant="secondary" className="text-xs">
                                  {article.category}
                                </Badge>
                              )}
                              {article.published_at && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(article.published_at).toLocaleDateString('nl-NL')}
                                </span>
                              )}
                            </div>

                            <h3 className="text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                              {article.title}
                            </h3>

                            <p className="text-sm text-muted-foreground line-clamp-3">
                              {article.summary}
                            </p>

                            {article.source && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                                <Newspaper className="w-3 h-3" />
                                <span>{article.source}</span>
                              </div>
                            )}

                            <div className="flex items-center gap-1 text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                              Lees meer
                              <ExternalLink className="w-4 h-4" />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {filteredNews.length === 0 && !isLoading && (
              <div className="text-center py-20">
                <div className="bg-muted/30 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                  <Newspaper className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">Geen artikelen gevonden</h3>
                <p className="text-muted-foreground mb-6">
                  Probeer een andere zoekopdracht of filter
                </p>
                <Button onClick={() => {
                  setSearchTerm("");
                  setCategoryFilter("all");
                }} variant="outline">
                  Reset filters
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
