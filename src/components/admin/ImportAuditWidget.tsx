import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, AlertCircle, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AuditReport {
  generated_at: string;
  total_items: number;
  status_breakdown: {
    pending: number;
    processing: number;
    completed: number;
    skipped: number;
    failed: number;
  };
  product_status: {
    with_product: number;
    without_product: number;
  };
  blog_status: {
    with_blog: number;
    without_blog: number;
  };
  combined_status: {
    with_both: number;
    with_neither: number;
    only_product: number;
    only_blog: number;
  };
  needs_attention: {
    items_needing_product: number;
    items_needing_blog: number;
    items_with_mismatch: number;
  };
  top_errors: Array<{
    message: string;
    count: number;
    item_ids: string[];
  }>;
  sample_items_needing_blog: Array<any>;
  sample_items_needing_product: Array<any>;
  sample_mismatches: Array<any>;
}

export const ImportAuditWidget = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [report, setReport] = useState<AuditReport | null>(null);
  const { toast } = useToast();

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('import-audit-report');
      
      if (error) throw error;
      
      setReport(data);
      toast({
        title: "✅ Audit Report Gegenereerd",
        description: `${data.total_items} items geanalyseerd`,
      });
    } catch (error: any) {
      console.error('Error fetching audit report:', error);
      toast({
        title: "❌ Fout bij Audit",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const reprocessMissingBlogs = async () => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-blogs-from-import-log');
      
      if (error) throw error;
      
      toast({
        title: "✅ Blog Processing Gestart",
        description: `${data.processed} items verwerkt, ${data.successful} succesvol`,
      });
      
      // Refresh report after processing
      setTimeout(() => fetchReport(), 2000);
    } catch (error: any) {
      console.error('Error processing blogs:', error);
      toast({
        title: "❌ Fout bij Processing",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Import Queue Audit</CardTitle>
            <CardDescription>
              Overzicht van discogs_import_log met product/blog status
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={fetchReport}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            <Button
              onClick={reprocessMissingBlogs}
              disabled={isProcessing || !report}
              size="sm"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Reprocess Missing Blogs"
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!report ? (
          <div className="text-center py-8 text-muted-foreground">
            Klik op refresh om een audit rapport te genereren
          </div>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overzicht</TabsTrigger>
              <TabsTrigger value="status">Status</TabsTrigger>
              <TabsTrigger value="attention">Aandacht</TabsTrigger>
              <TabsTrigger value="errors">Errors</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{report.total_items}</div>
                  <div className="text-sm text-muted-foreground">Totaal Items</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{report.combined_status.with_both}</div>
                  <div className="text-sm text-muted-foreground">Product + Blog</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{report.combined_status.only_product}</div>
                  <div className="text-sm text-muted-foreground">Alleen Product</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{report.combined_status.only_blog}</div>
                  <div className="text-sm text-muted-foreground">Alleen Blog</div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                Gegenereerd op: {new Date(report.generated_at).toLocaleString('nl-NL')}
              </div>
            </TabsContent>

            <TabsContent value="status" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span>Pending</span>
                  </div>
                  <Badge variant="outline">{report.status_breakdown.pending}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                    <span>Processing</span>
                  </div>
                  <Badge variant="outline">{report.status_breakdown.processing}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Completed</span>
                  </div>
                  <Badge variant="outline">{report.status_breakdown.completed}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <span>Skipped</span>
                  </div>
                  <Badge variant="outline">{report.status_breakdown.skipped}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span>Failed</span>
                  </div>
                  <Badge variant="destructive">{report.status_breakdown.failed}</Badge>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="attention" className="space-y-4">
              <div className="space-y-2">
                <div className="p-4 border rounded-lg bg-orange-50 dark:bg-orange-950">
                  <div className="font-semibold mb-2">Items zonder Blog ({report.needs_attention.items_needing_blog})</div>
                  {report.sample_items_needing_blog.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="text-sm py-1 border-b last:border-b-0">
                      <div className="font-mono text-xs">{item.discogs_release_id}</div>
                      <div>{item.artist} - {item.title}</div>
                      {item.product_id && (
                        <Badge variant="outline" className="mt-1">Product: {item.product_id.slice(0, 8)}</Badge>
                      )}
                    </div>
                  ))}
                </div>

                <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
                  <div className="font-semibold mb-2">Items zonder Product ({report.needs_attention.items_needing_product})</div>
                  {report.sample_items_needing_product.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="text-sm py-1 border-b last:border-b-0">
                      <div className="font-mono text-xs">{item.discogs_release_id}</div>
                      <div>{item.artist} - {item.title}</div>
                      <Badge variant="outline" className="mt-1">{item.status}</Badge>
                    </div>
                  ))}
                </div>

                {report.needs_attention.items_with_mismatch > 0 && (
                  <div className="p-4 border rounded-lg bg-red-50 dark:bg-red-950">
                    <div className="font-semibold mb-2">Mismatches ({report.needs_attention.items_with_mismatch})</div>
                    {report.sample_mismatches.slice(0, 5).map((item, idx) => (
                      <div key={idx} className="text-sm py-1 border-b last:border-b-0">
                        <div className="font-mono text-xs">{item.discogs_release_id}</div>
                        <div>{item.artist} - {item.title}</div>
                        <div className="text-xs text-red-600 dark:text-red-400">{item.issue}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="errors" className="space-y-2">
              {report.top_errors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  Geen errors gevonden
                </div>
              ) : (
                report.top_errors.map((error, idx) => (
                  <div key={idx} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between mb-1">
                      <Badge variant="destructive">{error.count}x</Badge>
                    </div>
                    <div className="text-sm font-mono text-red-600 dark:text-red-400">
                      {error.message}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Items: {error.item_ids.slice(0, 3).join(', ')}
                      {error.item_ids.length > 3 && ` +${error.item_ids.length - 3} more`}
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};
