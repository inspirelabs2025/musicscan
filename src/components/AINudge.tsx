import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getAiNudgeVariant, hasUsedAIFeatures } from '@/lib/growth';

export const AINudge = () => {
  const [showNudge, setShowNudge] = useState(false);

  useEffect(() => {
    const variant = getAiNudgeVariant();
    const usedAi = hasUsedAIFeatures(); // Placeholder for actual check

    if (variant === 'nudge' && !usedAi) {
      setShowNudge(true);
    }
  }, []);

  if (!showNudge) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 max-w-sm shadow-lg border-ai-nudge-border bg-ai-nudge-background text-ai-nudge-foreground animate-fade-in z-50">
      <CardHeader className="flex flex-row items-center space-x-4 p-4 pb-2">
        <Sparkles className="h-6 w-6 text-ai-nudge-foreground" />
        <div className="grid gap-1">
          <CardTitle className="text-lg font-bold">AI features beschikbaar!</CardTitle>
          <CardDescription className="text-sm text-ai-nudge-foreground/80">
            Je hebt de AI features nog maar 0x gebruikt.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <p className="text-sm mb-4">
          Ontdek wat AI voor je project kan doen! Laat AI je helpen met het genereren van content, analyses of meer.
        </p>
        <Link to="/ai-features" onClick={() => setShowNudge(false)}>
          <Button className="w-full bg-ai-nudge-foreground text-ai-nudge-background hover:bg-ai-nudge-foreground/90">
            Ontdek AI
          </Button>
        </Link>
        <Button variant="ghost" className="w-full mt-2 text-ai-nudge-foreground hover:bg-ai-nudge-background/80" onClick={() => setShowNudge(false)}>
          Nee, bedankt
        </Button>
      </CardContent>
    </Card>
  );
};
