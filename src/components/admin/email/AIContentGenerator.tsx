import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AIContentGeneratorProps {
  templateType: 'daily_digest' | 'weekly_discussion';
  currentConfig: any;
  onContentGenerated: (content: any, targetType: 'daily_digest' | 'weekly_discussion') => void;
}

export const AIContentGenerator = ({ 
  templateType, 
  currentConfig, 
  onContentGenerated 
}: AIContentGeneratorProps) => {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [targetType, setTargetType] = useState<'daily_digest' | 'weekly_discussion'>(templateType);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt vereist",
        description: "Voer een prompt in om content te genereren",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-email-content', {
        body: {
          prompt: prompt.trim(),
          templateType: targetType,
          currentConfig
        }
      });

      if (error) throw error;

      if (data?.content) {
        console.log('AI generated content received:', data.content);
        onContentGenerated(data.content, targetType);
        setIsOpen(false);
        setPrompt('');
      } else {
        toast({
          title: "Geen content ontvangen",
          description: "AI heeft geen content gegenereerd",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error generating content:', error);
      toast({
        title: "Generatie mislukt",
        description: error.message || "Er ging iets mis bij het genereren van content",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Sparkles className="mr-2 h-4 w-4" />
          AI Content Generator
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Genereer Email Content met AI</DialogTitle>
          <DialogDescription>
            Beschrijf wat voor content je wilt en AI zal email teksten genereren
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <Label>Doel Template Type</Label>
            <Select value={targetType} onValueChange={(value: 'daily_digest' | 'weekly_discussion') => setTargetType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily_digest">Daily Digest</SelectItem>
                <SelectItem value="weekly_discussion">Weekly Discussion</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-1">
              {targetType === 'daily_digest' 
                ? "Genereert: introText, outroText, ctaButtonText"
                : "Genereert: headerText, ctaButtonText"}
            </p>
          </div>
          <div>
            <Label>Content Prompt</Label>
            <Input
              placeholder="Bijv: Maak een enthousiaste intro over nieuwe jazz releases"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isGenerating) {
                  handleGenerate();
                }
              }}
            />
          </div>
          <Button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Genereren...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Genereer Content
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
