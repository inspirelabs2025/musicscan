import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const INCORRECT_IDS = [
  11452, 13565, 14240, 37205, 36729, 35373, 53983, 35667, 13214, 2183,
  33088, 140977, 25520, 37757, 35934, 14269, 37343, 37994, 13663, 37435
];

const BulkProductCleanup = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [customIds, setCustomIds] = useState(INCORRECT_IDS.join(', '));
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!confirmed) {
      toast({
        title: "⚠️ Bevestiging vereist",
        description: "Vink het vakje aan om te bevestigen",
        variant: "destructive"
      });
      return;
    }

    setIsDeleting(true);
    setResult(null);

    try {
      const idsToDelete = customIds
        .split(/[,\s]+/)
        .map(id => parseInt(id.trim()))
        .filter(id => !isNaN(id));

      toast({
        title: "🗑️ Verwijderen gestart",
        description: `Bezig met verwijderen van ${idsToDelete.length} producten...`,
      });

      const { data, error } = await supabase.functions.invoke('admin-bulk-cleanup-today', {
        body: { discogs_ids: idsToDelete }
      });

      if (error) throw error;

      setResult(data);
      setConfirmed(false);
      
      toast({
        title: "✅ Cleanup voltooid",
        description: `${data.products_deleted} producten en ${data.blogs_deleted} blogs verwijderd`,
      });
    } catch (error: any) {
      console.error('Cleanup error:', error);
      toast({
        title: "❌ Cleanup fout",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>🗑️ Bulk Product Cleanup</CardTitle>
          <CardDescription>
            Verwijder verkeerd aangemaakte producten en hun bijbehorende blogs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="ids">Discogs IDs om te verwijderen</Label>
            <Textarea
              id="ids"
              value={customIds}
              onChange={(e) => setCustomIds(e.target.value)}
              placeholder="11452, 13565, 14240..."
              rows={4}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Gescheiden door komma's of spaties. Standaard de 30 verkeerde uploads van vandaag.
            </p>
          </div>

          <div className="flex items-center space-x-2 p-4 border border-destructive/50 rounded-lg bg-destructive/5">
            <Checkbox 
              id="confirm" 
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked as boolean)}
            />
            <Label 
              htmlFor="confirm" 
              className="text-sm font-normal cursor-pointer"
            >
              Ik begrijp dat deze actie {customIds.split(/[,\s]+/).filter(Boolean).length} producten
              + hun blogs permanent verwijdert
            </Label>
          </div>

          <Button 
            onClick={handleDelete} 
            disabled={isDeleting || !confirmed}
            variant="destructive"
            size="lg"
            className="w-full"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Trash2 className="mr-2 h-4 w-4" />
            {isDeleting ? 'Bezig met verwijderen...' : 'Verwijder Alles'}
          </Button>

          {result && (
            <div className="mt-6 p-4 bg-muted rounded-lg space-y-2">
              <h3 className="font-semibold">Resultaat</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>🗑️ Producten verwijderd: <strong>{result.products_deleted}</strong></div>
                <div>📝 Blogs verwijderd: <strong>{result.blogs_deleted}</strong></div>
              </div>
              {result.error && (
                <p className="text-sm text-destructive mt-2">{result.error}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BulkProductCleanup;
