import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, TestTube, ExternalLink } from "lucide-react";
import { CanonicalCheckResult } from "./CanonicalChecker";

export function SingleURLTester() {
  const [url, setUrl] = useState('https://www.musicscan.app/product/heart-heart-brigade-album-cover-metaalprint');
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<CanonicalCheckResult | null>(null);
  const { toast } = useToast();

  async function testURL() {
    if (!url) return;

    setIsChecking(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('canonical-checker', {
        body: { url, action: 'test-single' },
        method: 'POST',
      });

      if (error) throw error;

      setResult(data.result);
      toast({
        title: "URL gecontroleerd",
        description: `Status: ${data.result.canonicalStatus}`,
      });
    } catch (error) {
      console.error('Test error:', error);
      toast({
        title: "Fout bij URL test",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, any> = {
      OK_SELF: { variant: "default", className: "bg-green-500 hover:bg-green-600" },
      MISSING: { variant: "default", className: "bg-orange-500 hover:bg-orange-600" },
      HOMEPAGE_CANONICAL: { variant: "default", className: "bg-orange-500 hover:bg-orange-600" },
      DIFFERENT_PATH: { variant: "default", className: "bg-orange-500 hover:bg-orange-600" },
      DIFFERENT_DOMAIN: { variant: "destructive", className: "" },
      MULTIPLE_CANONICALS: { variant: "destructive", className: "" },
    };

    const config = variants[status] || { variant: "secondary", className: "" };
    return (
      <Badge {...config}>
        {status.replace(/_/g, ' ')}
      </Badge>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Single URL Tester</CardTitle>
        <CardDescription>
          Test de canonical van een enkele URL
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="https://www.musicscan.app/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && testURL()}
            className="font-mono text-sm"
          />
          <Button onClick={testURL} disabled={isChecking || !url}>
            {isChecking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <TestTube className="mr-2 h-4 w-4" />
                Test URL
              </>
            )}
          </Button>
        </div>

        {result && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Canonical Status</h4>
                {getStatusBadge(result.canonicalStatus)}
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">HTTP Status</h4>
                <Badge variant={result.status === 200 ? "default" : "destructive"}>
                  {result.status}
                </Badge>
              </div>

              <div className="col-span-2">
                <h4 className="text-sm font-medium mb-2">Expected Canonical</h4>
                <code className="block text-xs bg-muted p-2 rounded break-all">
                  {result.url}
                </code>
              </div>

              <div className="col-span-2">
                <h4 className="text-sm font-medium mb-2">Found Canonical</h4>
                {result.canonical ? (
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-muted p-2 rounded break-all">
                      {result.canonical}
                    </code>
                    <Button variant="ghost" size="icon" asChild>
                      <a href={result.canonical} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Geen canonical gevonden</p>
                )}
              </div>

              {result.multipleCanonicals && result.multipleCanonicals.length > 1 && (
                <div className="col-span-2">
                  <h4 className="text-sm font-medium mb-2 text-red-600">Multiple Canonicals</h4>
                  <ul className="space-y-1">
                    {result.multipleCanonicals.map((canonical, i) => (
                      <li key={i}>
                        <code className="block text-xs bg-muted p-2 rounded break-all">
                          {canonical}
                        </code>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="col-span-2">
                <h4 className="text-sm font-medium mb-2">Flags</h4>
                <div className="flex gap-2 flex-wrap">
                  {result.noindex && <Badge variant="secondary">🚫 Noindex</Badge>}
                  {result.redirected && <Badge variant="secondary">↩️ Redirected</Badge>}
                  {result.soft404 && <Badge variant="destructive">⚠️ Soft-404</Badge>}
                  {result.thinContent && <Badge variant="secondary">📄 Thin ({result.wordCount} words)</Badge>}
                </div>
              </div>

              <div className="col-span-2">
                <h4 className="text-sm font-medium mb-2">Headers</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Content-Type: {result.contentType || 'N/A'}</div>
                  <div>Content-Length: {result.contentLength || 'N/A'}</div>
                  <div>X-Robots-Tag: {result.xRobotsTag || 'N/A'}</div>
                  <div>Word Count: {result.wordCount}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
