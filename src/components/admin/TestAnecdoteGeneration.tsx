import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles } from "lucide-react";

export const TestAnecdoteGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerateAnecdote = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('daily-anecdote-generator', {
        body: { force: true }  // Force generation for admin testing
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Anekdote Gegenereerd!",
        description: data.message || "Een nieuwe anekdote is succesvol aangemaakt.",
      });
    } catch (error) {
      console.error('Error generating anecdote:', error);
      toast({
        title: "Generatie Mislukt",
        description: error instanceof Error ? error.message : "Er is een fout opgetreden bij het genereren van de anekdote",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Test Anekdote Generatie</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Genereer handmatig extra anekdotes voor vandaag. Je kunt meerdere anekdotes per dag genereren via deze test interface.
          </p>
        </div>
        
        <Button 
          onClick={handleGenerateAnecdote} 
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Anekdote genereren...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Genereer Anekdote
            </>
          )}
        </Button>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Gebruikt Lovable AI (google/gemini-2.5-flash)</p>
          <p>• Selecteert willekeurig album uit database</p>
          <p>• Slaat op in music_anecdotes tabel</p>
          <p>• Cronjob genereert 1x per dag om 6:05 UTC</p>
          <p>• Via admin kun je meerdere per dag genereren</p>
        </div>
      </div>
    </Card>
  );
};
