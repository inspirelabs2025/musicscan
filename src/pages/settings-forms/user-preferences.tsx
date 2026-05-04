import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { useAIUsageTracker } from '@/hooks/use-ai-usage-tracker';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export const UserPreferencesForm: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const { resetAIUsage } = useAIUsageTracker();
  const { toast } = useToast();

  const handleLanguageChange = (value: string) => {
    setLanguage(value as 'nl' | 'en');
    toast({
      title: value === 'nl' ? 'Taal aangepast' : 'Language updated',
      description: value === 'nl' ? 'Nederlands is nu actief.' : 'English is now active.',
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Taal / Language</Label>
        <RadioGroup value={language} onValueChange={handleLanguageChange} className="grid grid-cols-2 gap-2">
          <Label
            htmlFor="lang-nl"
            className="flex items-center gap-2 rounded-md border border-border p-3 cursor-pointer hover:bg-muted [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"
          >
            <RadioGroupItem value="nl" id="lang-nl" />
            <span className="text-sm">🇳🇱 Nederlands</span>
          </Label>
          <Label
            htmlFor="lang-en"
            className="flex items-center gap-2 rounded-md border border-border p-3 cursor-pointer hover:bg-muted [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"
          >
            <RadioGroupItem value="en" id="lang-en" />
            <span className="text-sm">🇬🇧 English</span>
          </Label>
        </RadioGroup>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label className="text-sm font-semibold">AI gebruik</Label>
        <p className="text-xs text-muted-foreground">
          Reset je lokale AI-gebruikstelling. Dit beïnvloedt geen daadwerkelijke AI-aanroepen.
        </p>
        <Button variant="outline" size="sm" onClick={resetAIUsage}>
          Reset AI-gebruik
        </Button>
      </div>
    </div>
  );
};
