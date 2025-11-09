import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Play, Download } from "lucide-react";
import { CanonicalResults } from "./CanonicalResults";
import { SingleURLTester } from "./SingleURLTester";

export interface CanonicalCheckResult {
  url: string;
  finalURL: string;
  status: number;
  contentType?: string;
  contentLength?: number;
  canonical?: string | null;
  canonicalStatus: "OK_SELF" | "MISSING" | "HOMEPAGE_CANONICAL" | "DIFFERENT_PATH" | "DIFFERENT_DOMAIN" | "MULTIPLE_CANONICALS";
  multipleCanonicals?: string[];
  noindex: boolean;
  xRobotsTag?: string | null;
  redirected: boolean;
  redirectLocation?: string | null;
  soft404: boolean;
  wordCount: number;
  thinContent: boolean;
  checkedAt: string;
}

const DEFAULT_SITEMAPS = [
  'https://www.musicscan.app/sitemap.xml',
  'https://www.musicscan.app/sm/sitemap-blog.xml',
  'https://www.musicscan.app/sm/sitemap-metal-prints.xml',
  'https://www.musicscan.app/sm/sitemap-images-posters.xml',
  'https://www.musicscan.app/sm/sitemap-images-stories.xml'
];

export function CanonicalChecker() {
  const [sitemapUrls, setSitemapUrls] = useState(DEFAULT_SITEMAPS.join('\n'));
  const [pathFilters, setPathFilters] = useState({
    product: true,
    'plaat-verhaal': true,
    blog: true
  });
  const [maxUrls, setMaxUrls] = useState(200);
  const [concurrency, setConcurrency] = useState(8);
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<CanonicalCheckResult[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const { toast } = useToast();

  const stats = {
    total: results.length,
    ok: results.filter(r => r.canonicalStatus === 'OK_SELF').length,
    missing: results.filter(r => r.canonicalStatus === 'MISSING').length,
    homepage: results.filter(r => r.canonicalStatus === 'HOMEPAGE_CANONICAL').length,
    differentPath: results.filter(r => r.canonicalStatus === 'DIFFERENT_PATH').length,
    differentDomain: results.filter(r => r.canonicalStatus === 'DIFFERENT_DOMAIN').length,
    multiple: results.filter(r => r.canonicalStatus === 'MULTIPLE_CANONICALS').length,
    noindex: results.filter(r => r.noindex).length,
    redirects: results.filter(r => r.redirected).length,
    soft404: results.filter(r => r.soft404).length,
    thinContent: results.filter(r => r.thinContent).length,
  };

  async function startCheck() {
    setIsChecking(true);
    setResults([]);
    setProgress({ current: 0, total: 0 });

    try {
      // Parse sitemaps
      const sitemaps = sitemapUrls.split('\n').filter(url => url.trim());
      const { data: urlsData, error: parseError } = await supabase.functions.invoke('canonical-checker', {
        body: { sitemapUrls: sitemaps },
        method: 'POST',
      });

      if (parseError) throw parseError;

      let urls = urlsData.urls as string[];

      // Apply path filters
      const enabledPaths = Object.entries(pathFilters)
        .filter(([_, enabled]) => enabled)
        .map(([path]) => `/${path}/`);

      if (enabledPaths.length > 0) {
        urls = urls.filter(url => enabledPaths.some(path => url.includes(path)));
      }

      // Limit URLs
      urls = urls.slice(0, maxUrls);
      setProgress({ current: 0, total: urls.length });

      // Check URLs
      const { data: resultsData, error: checkError } = await supabase.functions.invoke('canonical-checker', {
        body: { urls, concurrency, action: 'check-urls' },
        method: 'POST',
      });

      if (checkError) throw checkError;

      setResults(resultsData.results);
      toast({
        title: "Check compleet",
        description: `${resultsData.results.length} URLs gecontroleerd`,
      });
    } catch (error) {
      console.error('Check error:', error);
      toast({
        title: "Fout bij canonical check",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  }

  function exportToCSV() {
    const headers = [
      'URL', 'Final URL', 'HTTP Status', 'Canonical Found', 'Canonical Status',
      'Multiple Canonicals', 'Noindex', 'X-Robots-Tag', 'Redirected', 
      'Redirect Location', 'Soft-404', 'Word Count', 'Thin Content', 'Checked At'
    ];
    
    const rows = results.map(r => [
      r.url,
      r.finalURL,
      r.status,
      r.canonical || 'NONE',
      r.canonicalStatus,
      r.multipleCanonicals?.join('; ') || '',
      r.noindex ? 'YES' : 'NO',
      r.xRobotsTag || '',
      r.redirected ? 'YES' : 'NO',
      r.redirectLocation || '',
      r.soft404 ? 'YES' : 'NO',
      r.wordCount,
      r.thinContent ? 'YES' : 'NO',
      r.checkedAt
    ]);
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `canonical-check-${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <SingleURLTester />

      <Card>
        <CardHeader>
          <CardTitle>Bulk Canonical Checker</CardTitle>
          <CardDescription>
            Controleer canonicals van meerdere URLs vanuit sitemaps
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Input Section */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sitemaps">Sitemap URLs (één per regel)</Label>
              <Textarea
                id="sitemaps"
                value={sitemapUrls}
                onChange={(e) => setSitemapUrls(e.target.value)}
                rows={6}
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">Pad Filters</Label>
                <div className="space-y-2">
                  {Object.entries(pathFilters).map(([path, checked]) => (
                    <div key={path} className="flex items-center space-x-2">
                      <Checkbox
                        id={path}
                        checked={checked}
                        onCheckedChange={(checked) =>
                          setPathFilters(prev => ({ ...prev, [path]: checked as boolean }))
                        }
                      />
                      <Label htmlFor={path} className="cursor-pointer">/{path}/</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxUrls">Max URLs</Label>
                  <Input
                    id="maxUrls"
                    type="number"
                    value={maxUrls}
                    onChange={(e) => setMaxUrls(parseInt(e.target.value))}
                    min={1}
                    max={1000}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="concurrency">Concurrency</Label>
                  <Input
                    id="concurrency"
                    type="number"
                    value={concurrency}
                    onChange={(e) => setConcurrency(parseInt(e.target.value))}
                    min={1}
                    max={20}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={startCheck} disabled={isChecking}>
              {isChecking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking... {progress.current > 0 && `(${progress.current}/${progress.total})`}
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Start Check
                </>
              )}
            </Button>

            {results.length > 0 && (
              <Button onClick={exportToCSV} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            )}
          </div>

          {/* Stats Cards */}
          {results.length > 0 && (
            <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Totaal</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>

              <Card className="border-green-500/20 bg-green-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">✅ OK</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.ok}</div>
                </CardContent>
              </Card>

              <Card className="border-orange-500/20 bg-orange-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">⚠️ Missing</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{stats.missing}</div>
                </CardContent>
              </Card>

              <Card className="border-orange-500/20 bg-orange-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">🏠 Homepage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{stats.homepage}</div>
                </CardContent>
              </Card>

              <Card className="border-orange-500/20 bg-orange-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">🔀 Diff Path</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{stats.differentPath}</div>
                </CardContent>
              </Card>

              <Card className="border-red-500/20 bg-red-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">🌐 Diff Domain</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{stats.differentDomain}</div>
                </CardContent>
              </Card>

              <Card className="border-red-500/20 bg-red-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">📋 Multiple</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{stats.multiple}</div>
                </CardContent>
              </Card>

              <Card className="border-blue-500/20 bg-blue-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">🚫 Noindex</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{stats.noindex}</div>
                </CardContent>
              </Card>

              <Card className="border-blue-500/20 bg-blue-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">↩️ Redirects</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{stats.redirects}</div>
                </CardContent>
              </Card>

              <Card className="border-red-500/20 bg-red-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">⚠️ Soft-404</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{stats.soft404}</div>
                </CardContent>
              </Card>

              <Card className="border-orange-500/20 bg-orange-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">📄 Thin</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{stats.thinContent}</div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Table */}
      {results.length > 0 && <CanonicalResults results={results} />}
    </div>
  );
}
