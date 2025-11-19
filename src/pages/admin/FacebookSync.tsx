import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, RefreshCw, Facebook, CheckCircle2, XCircle, AlertCircle, Key } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function FacebookSync() {
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [pageAccessToken, setPageAccessToken] = useState("");
  const [isSavingToken, setIsSavingToken] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{
    total?: number;
    synced?: number;
    failed?: number;
    status?: string;
  }>({});

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
    if (!pageAccessToken.trim()) {
      toast({
        title: "Token vereist",
        description: "Voer een Facebook Page Access Token in",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSavingToken(true);
      
      // Note: In production, this should save to Supabase secrets
      // For now, we'll store it in localStorage as a temporary solution
      localStorage.setItem('FACEBOOK_PAGE_ACCESS_TOKEN', pageAccessToken);
      
      toast({
        title: "Token opgeslagen",
        description: "Facebook Page Access Token is opgeslagen",
      });
      
    } catch (error) {
      console.error('Error saving token:', error);
      toast({
        title: "Fout bij opslaan",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSavingToken(false);
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

        {/* Facebook Credentials */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Facebook Credentials
            </CardTitle>
            <CardDescription>
              Voer je Facebook Page Access Token in voor catalog synchronisatie
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pageAccessToken">Page Access Token</Label>
              <div className="flex gap-2">
                <Input
                  id="pageAccessToken"
                  type="password"
                  placeholder="Plak hier je Facebook Page Access Token..."
                  value={pageAccessToken}
                  onChange={(e) => setPageAccessToken(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={saveToken}
                  disabled={isSavingToken || !pageAccessToken.trim()}
                >
                  {isSavingToken ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Opslaan...
                    </>
                  ) : (
                    "Opslaan"
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Genereer een Page Access Token via Facebook Graph API Explorer met de permissions: pages_read_engagement
              </p>
            </div>
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
      </div>
    </AdminLayout>
  );
}
