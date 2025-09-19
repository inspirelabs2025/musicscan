import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, TrendingUp } from 'lucide-react';

export function TestPriceCollection() {
  const [isCollecting, setIsCollecting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleCollectPrices = async () => {
    setIsCollecting(true);
    try {
      console.log('Triggering price collection...');
      
      const { data, error } = await supabase.functions.invoke('collect-price-history', {
        body: { manual: true }
      });

      if (error) throw error;

      setResult(data);
      toast({
        title: "Prijshistorie verzameld!",
        description: `${data.successful} albums succesvol verwerkt`,
      });
    } catch (error) {
      console.error('Error collecting prices:', error);
      toast({
        title: "Fout bij verzamelen",
        description: "Er is een fout opgetreden bij het verzamelen van prijsdata",
        variant: "destructive",
      });
    } finally {
      setIsCollecting(false);
    }
  };

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Prijshistorie Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Test de prijshistorie verzameling handmatig. Dit proces haalt de huidige prijsdata op van Discogs.
        </p>
        
        <Button 
          onClick={handleCollectPrices} 
          disabled={isCollecting}
          className="w-full"
        >
          {isCollecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isCollecting ? 'Verzamelen...' : 'Start Prijsverzameling'}
        </Button>

        {result && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Resultaat:</h4>
            <div className="text-sm space-y-1">
              <p>Verwerkt: {result.processed}</p>
              <p>Succesvol: {result.successful}</p>
              <p>Fouten: {result.errors}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}