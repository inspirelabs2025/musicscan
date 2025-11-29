import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, RefreshCw, Facebook, CheckCircle2, XCircle, AlertCircle, Key, Wand2, Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useQuery } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  category?: string;
}

export default function FacebookSync() {
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [pageAccessToken, setPageAccessToken] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [pageId, setPageId] = useState("");
  const [isSavingToken, setIsSavingToken] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{
    total?: number;
    synced?: number;
    failed?: number;
    status?: string;
  }>({});
  
  // Token helper state
  const [userAccessToken, setUserAccessToken] = useState("");
  const [isFetchingPages, setIsFetchingPages] = useState(false);
  const [availablePages, setAvailablePages] = useState<FacebookPage[]>([]);
  const [selectedPageId, setSelectedPageId] = useState("");
  
  // Test post state
  const [testPostMessage, setTestPostMessage] = useState("🎵 Test post vanuit MusicScan! Onze Facebook integratie werkt perfect. #MusicScan #VinylCollection");
  const [isTestPosting, setIsTestPosting] = useState(false);

  // Fetch sync history
  const { data: syncLogs, refetch } = useQuery({
    queryKey: ['facebook-sync-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('facebook_sync_log')
        .select('*')
        .order('sync_started_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch post history
  const { data: postLogs, refetch: refetchPosts } = useQuery({
    queryKey: ['facebook-post-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('facebook_post_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    }
  });

  const startSync = async (forceFullResync: boolean = false) => {
    try {
      setIsSyncing(true);
      setSyncProgress({});

      toast({
        title: "Synchronisatie gestart",
        description: "Producten worden naar Facebook Catalog gesynchroniseerd...",
      });

      const { data, error } = await supabase.functions.invoke('sync-facebook-catalog', {
        body: { forceFullResync }
      });

      if (error) throw error;

      setSyncProgress({
        total: data.totalProducts,
        synced: data.productsSync,
        failed: data.productsFailed,
        status: data.status
      });

      // Refetch logs to show latest sync
      refetch();

      if (data.status === 'completed') {
        toast({
          title: "Synchronisatie voltooid!",
          description: `${data.productsSync} van ${data.totalProducts} producten succesvol gesynchroniseerd.`,
        });
      } else if (data.status === 'partial') {
        toast({
          title: "Synchronisatie gedeeltelijk voltooid",
          description: `${data.productsSync} succesvol, ${data.productsFailed} mislukt.`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Synchronisatie mislukt",
          description: "Er zijn fouten opgetreden tijdens het synchroniseren.",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: "Fout bij synchronisatie",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const saveToken = async () => {
    if (!pageAccessToken.trim() || !appSecret.trim() || !pageId.trim()) {
      toast({
        title: "Credentials vereist",
        description: "Vul alle velden in: Page Access Token, App Secret en Page ID",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSavingToken(true);
      
      console.log('🔐 Saving credentials...');
      console.log('Page Access Token length:', pageAccessToken.trim().length);
      console.log('App Secret length:', appSecret.trim().length);
      console.log('Page ID:', pageId.trim());
      
      // Save Page Access Token
      const { data: tokenData, error: tokenError } = await supabase.functions.invoke('save-facebook-token', {
        body: { 
          secret_key: 'FACEBOOK_PAGE_ACCESS_TOKEN',
          secret_value: pageAccessToken.trim()
        }
      });

      console.log('Token save result:', { tokenData, tokenError });
      if (tokenError) throw tokenError;

      // Save App Secret
      const { error: secretError } = await supabase.functions.invoke('save-facebook-token', {
        body: { 
          secret_key: 'FACEBOOK_APP_SECRET',
          secret_value: appSecret.trim()
        }
      });

      if (secretError) throw secretError;

      // Save Page ID
      const { error: pageIdError } = await supabase.functions.invoke('save-facebook-token', {
        body: { 
          secret_key: 'FACEBOOK_PAGE_ID',
          secret_value: pageId.trim()
        }
      });

      if (pageIdError) throw pageIdError;
      
      toast({
        title: "✅ Credentials opgeslagen",
        description: "Facebook credentials zijn veilig opgeslagen. Auto-posting is nu actief!",
      });

      setPageAccessToken("");
      setAppSecret("");
      setPageId("");
      
    } catch (error) {
      console.error('Error saving credentials:', error);
      toast({
        title: "❌ Fout bij opslaan",
        description: error.message || "Er is een fout opgetreden bij het opslaan van de credentials",
        variant: "destructive"
      });
    } finally {
      setIsSavingToken(false);
    }
  };

  // Test post to Facebook
  const sendTestPost = async () => {
    if (!testPostMessage.trim()) {
      toast({
        title: "Bericht vereist",
        description: "Voer een testbericht in om te posten",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsTestPosting(true);

      const { data, error } = await supabase.functions.invoke('post-to-facebook', {
        body: {
          content_type: 'test',
          title: 'Test Post',
          content: testPostMessage.trim(),
          hashtags: []
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "✅ Test post succesvol!",
          description: `Post ID: ${data.post_id}`,
        });
        refetchPosts();
      } else {
        throw new Error(data?.error || 'Onbekende fout');
      }

    } catch (error: any) {
      console.error('Test post error:', error);
      toast({
        title: "❌ Test post mislukt",
        description: error.message || "Er is een fout opgetreden",
        variant: "destructive"
      });
    } finally {
      setIsTestPosting(false);
    }
  };

  // Fetch pages using User Access Token via /me/accounts
  const fetchPageTokens = async () => {
    if (!userAccessToken.trim()) {
      toast({
        title: "User Access Token vereist",
        description: "Plak je long-lived User Access Token uit Graph API Explorer",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsFetchingPages(true);
      setAvailablePages([]);

      const { data, error } = await supabase.functions.invoke('get-facebook-page-token', {
        body: { user_access_token: userAccessToken.trim() }
      });

      if (error) throw error;

      if (data.pages && data.pages.length > 0) {
        setAvailablePages(data.pages);
        toast({
          title: `✅ ${data.pages.length} pagina('s) gevonden`,
          description: "Selecteer een pagina om de Page Access Token op te slaan",
        });
      } else {
        toast({
          title: "Geen pagina's gevonden",
          description: "Je hebt geen Facebook Pages gekoppeld aan dit account",
          variant: "destructive"
        });
      }

    } catch (error: any) {
      console.error('Error fetching pages:', error);
      toast({
        title: "❌ Fout bij ophalen",
        description: error.message || "Kon geen pagina's ophalen met deze token",
        variant: "destructive"
      });
    } finally {
      setIsFetchingPages(false);
    }
  };

  // Select a page and auto-fill credentials
  const selectPage = (pageId: string) => {
    const page = availablePages.find(p => p.id === pageId);
    if (page) {
      setPageAccessToken(page.access_token);
      setPageId(page.id);
      setSelectedPageId(pageId);
      toast({
        title: `✅ ${page.name} geselecteerd`,
        description: "Page Access Token en Page ID zijn ingevuld. Voeg nu je App Secret toe en klik 'Credentials Opslaan'.",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success text-success-foreground"><CheckCircle2 className="w-3 h-3 mr-1" />Voltooid</Badge>;
      case 'partial':
        return <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1" />Gedeeltelijk</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Mislukt</Badge>;
      case 'running':
        return <Badge variant="outline"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Bezig...</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('nl-NL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Facebook Catalog Synchronisatie</h1>
          <p className="text-muted-foreground">
            Synchroniseer MusicScan producten naar je Facebook Catalog voor Facebook Shop integratie
          </p>
        </div>

        {/* Token Helper - New Meta 2024 Rule */}
        <Card className="border-blue-500/50 bg-blue-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-blue-500" />
              🆕 Page Token Helper (Meta 2024 Regels)
            </CardTitle>
            <CardDescription>
              Sinds eind 2024 kan Graph API Explorer geen Page Tokens meer genereren voor server-side apps.
              Gebruik deze helper om je Page Token op te halen via de /me/accounts API.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm">
              <strong>📝 Stappen:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1 text-muted-foreground">
                <li>Ga naar <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Graph API Explorer</a></li>
                <li>Selecteer je app en voeg permissions toe: <code className="bg-muted px-1 rounded">pages_manage_posts</code>, <code className="bg-muted px-1 rounded">pages_read_engagement</code></li>
                <li>Klik "Generate Access Token" → "Open in Access Token Tool" → "Extend Access Token"</li>
                <li>Kopieer de long-lived User Access Token hieronder</li>
              </ol>
            </div>

            <div className="space-y-2">
              <Label htmlFor="userAccessToken">Long-Lived User Access Token</Label>
              <Input
                id="userAccessToken"
                type="password"
                placeholder="Plak hier je extended User Access Token uit Graph API Explorer..."
                value={userAccessToken}
                onChange={(e) => setUserAccessToken(e.target.value)}
                disabled={isFetchingPages}
              />
            </div>

            <Button
              onClick={fetchPageTokens}
              disabled={isFetchingPages || !userAccessToken.trim()}
              variant="outline"
              className="w-full"
            >
              {isFetchingPages ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Pagina's ophalen...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Haal Page Tokens Op via /me/accounts
                </>
              )}
            </Button>

            {/* Page Selection */}
            {availablePages.length > 0 && (
              <div className="space-y-2 p-4 bg-success/10 border border-success/30 rounded-lg">
                <Label>Selecteer je Facebook Pagina</Label>
                <Select value={selectedPageId} onValueChange={selectPage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kies een pagina..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePages.map((page) => (
                      <SelectItem key={page.id} value={page.id}>
                        {page.name} ({page.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-success">
                  ✅ Na selectie worden Page Access Token en Page ID automatisch ingevuld hieronder!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Facebook Credentials */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Facebook Credentials
            </CardTitle>
            <CardDescription>
              Configureer je Facebook Page Access Token en App Secret voor veilige API synchronisatie
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pageAccessToken">Facebook Page Access Token</Label>
              <Input
                id="pageAccessToken"
                type="password"
                placeholder="Plak hier je Page Access Token..."
                value={pageAccessToken}
                onChange={(e) => setPageAccessToken(e.target.value)}
                disabled={isSavingToken}
              />
              <p className="text-xs text-muted-foreground">
                Te vinden in: Meta Business Suite → Settings → Business Assets → Page Access Tokens
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="appSecret">Facebook App Secret</Label>
              <Input
                id="appSecret"
                type="password"
                placeholder="Plak hier je App Secret..."
                value={appSecret}
                onChange={(e) => setAppSecret(e.target.value)}
                disabled={isSavingToken}
              />
              <p className="text-xs text-muted-foreground">
                Te vinden in: Facebook Developers Console → App Settings → Basic → "App Secret" (klik "Show")
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pageId">Facebook Page ID</Label>
              <Input
                id="pageId"
                type="text"
                placeholder="Plak hier je Page ID (bijv. 123456789012345)..."
                value={pageId}
                onChange={(e) => setPageId(e.target.value)}
                disabled={isSavingToken}
              />
              <p className="text-xs text-muted-foreground">
                Te vinden in: Facebook Pagina → Info → Page ID (of in URL: facebook.com/[page-id])
              </p>
            </div>

            {/* Debug info for missing fields */}
            {(!pageAccessToken.trim() || !appSecret.trim() || !pageId.trim()) && (
              <div className="text-sm p-3 bg-destructive/10 border border-destructive/30 rounded-lg space-y-1">
                <p className="font-medium text-destructive">⚠️ Vereiste velden ontbreken:</p>
                <ul className="list-disc list-inside text-xs text-destructive/80">
                  {!pageAccessToken.trim() && <li>Page Access Token is leeg</li>}
                  {!appSecret.trim() && <li>App Secret is leeg</li>}
                  {!pageId.trim() && <li>Page ID is leeg</li>}
                </ul>
              </div>
            )}

            <Button
              onClick={() => {
                console.log('🔘 Save button clicked!');
                console.log('pageAccessToken filled:', !!pageAccessToken.trim());
                console.log('appSecret filled:', !!appSecret.trim());
                console.log('pageId filled:', !!pageId.trim());
                saveToken();
              }}
              disabled={isSavingToken || !pageAccessToken.trim() || !appSecret.trim() || !pageId.trim()}
              className="w-full"
            >
              {isSavingToken ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Opslaan...
                </>
              ) : (
                "Credentials Opslaan"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Test Post */}
        <Card className="border-green-500/50 bg-green-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-green-500" />
              🧪 Test Post naar Facebook
            </CardTitle>
            <CardDescription>
              Verstuur een testbericht naar je Facebook pagina om te controleren of de integratie werkt
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="testMessage">Testbericht</Label>
              <Textarea
                id="testMessage"
                placeholder="Typ hier je testbericht..."
                value={testPostMessage}
                onChange={(e) => setTestPostMessage(e.target.value)}
                disabled={isTestPosting}
                rows={3}
              />
            </div>

            <Button
              onClick={sendTestPost}
              disabled={isTestPosting || !testPostMessage.trim()}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isTestPosting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Posten...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Verstuur Test Post
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Sync Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Facebook className="w-5 h-5" />
              Product Synchronisatie
            </CardTitle>
            <CardDescription>
              Push alle actieve producten naar Facebook Catalog met één klik
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Button
                onClick={() => startSync(false)}
                disabled={isSyncing}
                size="lg"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Synchroniseren...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Start Synchronisatie
                  </>
                )}
              </Button>
              
              <Button
                onClick={() => startSync(true)}
                disabled={isSyncing}
                variant="outline"
                size="lg"
              >
                Force Full Resync
              </Button>
            </div>

            {/* Progress Display */}
            {isSyncing && syncProgress.total && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Voortgang</span>
                  <span>{syncProgress.synced || 0} / {syncProgress.total}</span>
                </div>
                <Progress 
                  value={((syncProgress.synced || 0) / syncProgress.total) * 100} 
                />
              </div>
            )}

            {/* Last Sync Result */}
            {!isSyncing && syncProgress.total && (
              <div className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Laatste synchronisatie:</span>
                  {syncProgress.status && getStatusBadge(syncProgress.status)}
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Totaal</div>
                    <div className="text-lg font-semibold">{syncProgress.total}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Succesvol</div>
                    <div className="text-lg font-semibold text-success">{syncProgress.synced}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Mislukt</div>
                    <div className="text-lg font-semibold text-destructive">{syncProgress.failed}</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sync History */}
        <Card>
          <CardHeader>
            <CardTitle>Synchronisatie Geschiedenis</CardTitle>
            <CardDescription>
              Overzicht van recente synchronisaties
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!syncLogs || syncLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nog geen synchronisaties uitgevoerd
              </div>
            ) : (
              <div className="space-y-3">
                {syncLogs.map((log) => (
                  <div
                    key={log.id}
                    className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {getStatusBadge(log.status)}
                        <span className="text-sm text-muted-foreground">
                          {formatDate(log.sync_started_at)}
                        </span>
                      </div>
                      <Badge variant="outline">{log.sync_type}</Badge>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Totaal</div>
                        <div className="font-medium">{log.total_products || 0}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Gesynchroniseerd</div>
                        <div className="font-medium text-success">{log.products_synced || 0}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Mislukt</div>
                        <div className="font-medium text-destructive">{log.products_failed || 0}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Duur</div>
                        <div className="font-medium">
                          {log.sync_completed_at 
                            ? `${Math.round((new Date(log.sync_completed_at).getTime() - new Date(log.sync_started_at).getTime()) / 1000)}s`
                            : '-'}
                        </div>
                      </div>
                    </div>

                    {log.error_details && (
                      <div className="mt-3 p-2 bg-destructive/10 rounded text-xs text-destructive">
                        <details>
                          <summary className="cursor-pointer font-medium">Foutdetails</summary>
                          <pre className="mt-2 overflow-auto">
                            {JSON.stringify(log.error_details, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Auto-Post Geschiedenis */}
        <Card>
          <CardHeader>
            <CardTitle>📘 Auto-Post Geschiedenis</CardTitle>
            <CardDescription>
              Overzicht van automatisch geplaatste berichten op Facebook (anekdotes, nieuws, blog)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!postLogs || postLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nog geen automatische posts geplaatst
              </div>
            ) : (
              <div className="space-y-3">
                {postLogs.map((post) => (
                  <div
                    key={post.id}
                    className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {post.status === 'success' ? (
                          <Badge className="bg-success text-success-foreground">
                            <CheckCircle2 className="w-3 h-3 mr-1" />Gepost
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="w-3 h-3 mr-1" />Mislukt
                          </Badge>
                        )}
                        <Badge variant="outline">{post.content_type}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(post.created_at)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="font-medium mb-2">{post.title}</div>
                    <div className="text-sm text-muted-foreground line-clamp-2">
                      {post.content}
                    </div>
                    
                    {post.facebook_post_id && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Post ID: {post.facebook_post_id}
                      </div>
                    )}
                    
                    {post.error_message && (
                      <div className="mt-2 p-2 bg-destructive/10 rounded text-xs text-destructive">
                        {post.error_message}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
