import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Search, 
  Send, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Loader2,
  FileText,
  Image as ImageIcon,
  ExternalLink
} from "lucide-react";

interface AnalyzedUrl {
  url: string;
  slug: string;
  type: 'plaat-verhaal' | 'product' | 'artist' | 'single' | 'anecdote' | 'news' | 'unknown';
  status: 'found' | 'not_found' | 'pending';
  hasContent: boolean;
  hasImage: boolean;
  hasMetaDescription: boolean;
  contentLength: number;
  issues: string[];
}

export const CrawledNotIndexedAnalyzer = () => {
  const [urlInput, setUrlInput] = useState("");
  const [analyzedUrls, setAnalyzedUrls] = useState<AnalyzedUrl[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);

  const parseUrls = (input: string): string[] => {
    const lines = input.split('\n').map(line => line.trim()).filter(Boolean);
    const urls: string[] = [];
    
    for (const line of lines) {
      // Extract URL from the line (handle GSC format with dates)
      const urlMatch = line.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        urls.push(urlMatch[0]);
      }
    }
    
    return [...new Set(urls)]; // Remove duplicates
  };

  const extractSlugAndType = (url: string): { slug: string; type: AnalyzedUrl['type'] } => {
    const urlObj = new URL(url);
    const path = urlObj.pathname;

    if (path.startsWith('/plaat-verhaal/')) {
      return { slug: path.replace('/plaat-verhaal/', ''), type: 'plaat-verhaal' };
    }
    if (path.startsWith('/product/')) {
      return { slug: path.replace('/product/', ''), type: 'product' };
    }
    if (path.startsWith('/artists/')) {
      return { slug: path.replace('/artists/', ''), type: 'artist' };
    }
    if (path.startsWith('/singles/')) {
      return { slug: path.replace('/singles/', ''), type: 'single' };
    }
    if (path.startsWith('/anekdotes/')) {
      return { slug: path.replace('/anekdotes/', ''), type: 'anecdote' };
    }
    if (path.startsWith('/nieuws/')) {
      return { slug: path.replace('/nieuws/', ''), type: 'news' };
    }

    return { slug: path, type: 'unknown' };
  };

  const analyzeUrl = async (url: string): Promise<AnalyzedUrl> => {
    const { slug, type } = extractSlugAndType(url);
    
    const result: AnalyzedUrl = {
      url,
      slug,
      type,
      status: 'pending',
      hasContent: false,
      hasImage: false,
      hasMetaDescription: false,
      contentLength: 0,
      issues: []
    };

    try {
      let data = null;
      
      switch (type) {
        case 'plaat-verhaal':
          const { data: blogData } = await supabase
            .from('blog_posts')
            .select('id, markdown_content, album_cover_url, yaml_frontmatter')
            .eq('slug', slug)
            .single();
          data = blogData;
          if (data) {
            result.hasContent = (data.markdown_content?.length || 0) > 500;
            result.hasImage = !!data.album_cover_url;
            result.hasMetaDescription = !!(data.yaml_frontmatter as any)?.description;
            result.contentLength = data.markdown_content?.length || 0;
          }
          break;

        case 'product':
          const { data: productData } = await supabase
            .from('platform_products')
            .select('id, description, image_url, meta_description')
            .eq('slug', slug)
            .single();
          data = productData;
          if (data) {
            result.hasContent = (data.description?.length || 0) > 100;
            result.hasImage = !!data.image_url;
            result.hasMetaDescription = !!data.meta_description;
            result.contentLength = data.description?.length || 0;
          }
          break;

        case 'artist':
          const { data: artistData } = await supabase
            .from('artist_stories')
            .select('id, story_content, artwork_url, meta_description')
            .eq('slug', slug)
            .single();
          data = artistData;
          if (data) {
            result.hasContent = (data.story_content?.length || 0) > 500;
            result.hasImage = !!data.artwork_url;
            result.hasMetaDescription = !!data.meta_description;
            result.contentLength = data.story_content?.length || 0;
          }
          break;

        case 'single':
          const { data: singleData } = await supabase
            .from('music_stories')
            .select('id, content, artwork_url, meta_description')
            .eq('slug', slug)
            .not('single_name', 'is', null)
            .single();
          data = singleData;
          if (data) {
            result.hasContent = (data.content?.length || 0) > 500;
            result.hasImage = !!data.artwork_url;
            result.hasMetaDescription = !!data.meta_description;
            result.contentLength = data.content?.length || 0;
          }
          break;

        case 'anecdote':
          const { data: anecdoteData } = await supabase
            .from('music_anecdotes')
            .select('id, content, image_url')
            .eq('slug', slug)
            .single();
          data = anecdoteData;
          if (data) {
            result.hasContent = (data.content?.length || 0) > 200;
            result.hasImage = !!data.image_url;
            result.hasMetaDescription = true; // Generated from content
            result.contentLength = data.content?.length || 0;
          }
          break;

        case 'news':
          const { data: newsData } = await supabase
            .from('news_blog_posts')
            .select('id, content, featured_image, meta_description')
            .eq('slug', slug)
            .single();
          data = newsData;
          if (data) {
            result.hasContent = (data.content?.length || 0) > 300;
            result.hasImage = !!data.featured_image;
            result.hasMetaDescription = !!data.meta_description;
            result.contentLength = data.content?.length || 0;
          }
          break;
      }

      result.status = data ? 'found' : 'not_found';
      
      // Determine issues
      if (result.status === 'not_found') {
        result.issues.push('Content niet gevonden in database');
      } else {
        if (!result.hasContent) result.issues.push('Te weinig content');
        if (!result.hasImage) result.issues.push('Geen afbeelding');
        if (!result.hasMetaDescription) result.issues.push('Geen meta description');
        if (result.contentLength < 300) result.issues.push('Content < 300 tekens');
      }

    } catch (error) {
      result.status = 'not_found';
      result.issues.push('Database error');
    }

    return result;
  };

  const handleAnalyze = async () => {
    const urls = parseUrls(urlInput);
    if (urls.length === 0) {
      toast.error("Geen geldige URLs gevonden");
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);
    setAnalyzedUrls([]);

    const results: AnalyzedUrl[] = [];
    
    for (let i = 0; i < urls.length; i++) {
      const result = await analyzeUrl(urls[i]);
      results.push(result);
      setProgress(Math.round(((i + 1) / urls.length) * 100));
      setAnalyzedUrls([...results]);
    }

    setIsAnalyzing(false);
    toast.success(`${urls.length} URLs geanalyseerd`);
  };

  const handleSubmitToIndexNow = async (urlsToSubmit?: string[]) => {
    const urls = urlsToSubmit || analyzedUrls
      .filter(u => u.status === 'found')
      .map(u => u.url);
    
    if (urls.length === 0) {
      toast.error("Geen URLs om te submitten");
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit in batches of 100
      const batchSize = 100;
      for (let i = 0; i < urls.length; i += batchSize) {
        const batch = urls.slice(i, i + batchSize);
        const { error } = await supabase.functions.invoke("indexnow-submit", {
          body: { urls: batch, contentType: "crawled-not-indexed-resubmit" },
        });
        if (error) throw error;
      }

      toast.success(`${urls.length} URLs gesubmit naar IndexNow`);
    } catch (error) {
      console.error('IndexNow submission error:', error);
      toast.error("Fout bij submitten naar IndexNow");
    } finally {
      setIsSubmitting(false);
    }
  };

  const stats = {
    total: analyzedUrls.length,
    found: analyzedUrls.filter(u => u.status === 'found').length,
    notFound: analyzedUrls.filter(u => u.status === 'not_found').length,
    withIssues: analyzedUrls.filter(u => u.issues.length > 0).length,
    noContent: analyzedUrls.filter(u => !u.hasContent && u.status === 'found').length,
    noImage: analyzedUrls.filter(u => !u.hasImage && u.status === 'found').length,
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Crawled Not Indexed Analyzer
          </CardTitle>
          <CardDescription>
            Plak URLs uit Google Search Console om te analyseren en opnieuw te indexeren
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder={`Plak hier de URLs uit GSC (één per regel of met datums):

https://www.musicscan.app/plaat-verhaal/example-slug Dec 16, 2025
https://www.musicscan.app/product/example-product Dec 15, 2025
...`}
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="min-h-[200px] font-mono text-sm"
          />
          
          <div className="flex gap-2">
            <Button onClick={handleAnalyze} disabled={isAnalyzing || !urlInput.trim()}>
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyseren... ({progress}%)
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Analyseer URLs
                </>
              )}
            </Button>
            
            {analyzedUrls.length > 0 && (
              <Button 
                onClick={() => handleSubmitToIndexNow()} 
                disabled={isSubmitting || stats.found === 0}
                variant="default"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit {stats.found} naar IndexNow
                  </>
                )}
              </Button>
            )}
          </div>

          {isAnalyzing && (
            <Progress value={progress} className="w-full" />
          )}
        </CardContent>
      </Card>

      {/* Stats Overview */}
      {analyzedUrls.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Totaal URLs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">{stats.found}</div>
              <p className="text-xs text-muted-foreground">Gevonden</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-red-600">{stats.notFound}</div>
              <p className="text-xs text-muted-foreground">Niet gevonden</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-yellow-600">{stats.withIssues}</div>
              <p className="text-xs text-muted-foreground">Met issues</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-orange-600">{stats.noContent}</div>
              <p className="text-xs text-muted-foreground">Weinig content</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-purple-600">{stats.noImage}</div>
              <p className="text-xs text-muted-foreground">Geen afbeelding</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Results Table */}
      {analyzedUrls.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Analyse Resultaten</CardTitle>
            <CardDescription>
              {stats.found} van {stats.total} URLs gevonden in database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {analyzedUrls.map((item, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    item.status === 'not_found' 
                      ? 'bg-red-500/10 border-red-500/30' 
                      : item.issues.length > 0 
                        ? 'bg-yellow-500/10 border-yellow-500/30'
                        : 'bg-green-500/10 border-green-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {item.status === 'found' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                        )}
                        <Badge variant="outline" className="text-xs">
                          {item.type}
                        </Badge>
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Bekijk
                        </a>
                      </div>
                      <p className="text-sm font-mono truncate text-muted-foreground">
                        {item.slug}
                      </p>
                      
                      {item.status === 'found' && (
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          <span className={`flex items-center gap-1 ${item.hasContent ? 'text-green-600' : 'text-red-500'}`}>
                            <FileText className="h-3 w-3" />
                            {item.contentLength} tekens
                          </span>
                          <span className={`flex items-center gap-1 ${item.hasImage ? 'text-green-600' : 'text-red-500'}`}>
                            <ImageIcon className="h-3 w-3" />
                            {item.hasImage ? 'Afbeelding ✓' : 'Geen afbeelding'}
                          </span>
                        </div>
                      )}
                      
                      {item.issues.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.issues.map((issue, i) => (
                            <Badge key={i} variant="destructive" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {issue}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {item.status === 'found' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSubmitToIndexNow([item.url])}
                        disabled={isSubmitting}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Tips voor "Crawled - not indexed" pagina's:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
            <li><strong>Niet gevonden:</strong> URL bestaat niet meer of heeft andere slug - overweeg 301 redirect</li>
            <li><strong>Te weinig content:</strong> Pagina heeft &lt;500 tekens - voeg meer content toe</li>
            <li><strong>Geen afbeelding:</strong> Voeg artwork toe via backfill functies</li>
            <li><strong>Geen meta description:</strong> Voeg SEO metadata toe</li>
            <li>Na fixes: submit naar IndexNow om Google te triggeren voor re-crawl</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
};
