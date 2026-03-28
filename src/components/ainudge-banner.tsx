import { Link } from 'react-router-dom';
import { RocketIcon, SlashIcon, SparklesIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export function AINudgeBanner() {
  return (
    <Card className="bg-ai-nudge-background border-ai-nudge-border text-ai-nudge-foreground animate-fade-in">
      <CardHeader className="flex-row items-center gap-4 space-y-0 pb-4">
        <SparklesIcon className="h-8 w-8 text-ai-nudge-foreground" />
        <div>
          <CardTitle className="text-lg sm:text-xl md:text-2xl">AI features beschikbaar!</CardTitle>
          <CardDescription className="text-ai-nudge-foreground/80">
            Je hebt de AI features nog maar 0x gebruikt. Ontdek wat AI voor je project kan doen!
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex items-center gap-2 pt-0">
        <Button asChild size="sm" className="bg-ai-nudge-foreground text-ai-nudge-background hover:bg-ai-nudge-foreground/90">
          <Link to="/dashboard/ai">
            <RocketIcon className="mr-2 h-4 w-4" />
            AI Assistant
          </Link>
        </Button>
        <Button asChild variant="secondary" size="sm">
          <Link to="/dashboard/settings#ai-settings">
            <SlashIcon className="mr-2 h-4 w-4" />
            Meer info
          </Link>
        </Button>
      </CardContent>
      <CardFooter className="p-4 text-xs text-ai-nudge-foreground/60">
        <p>Tip: AI kan je helpen bij het genereren van teksten, ideeën en meer!</p>
      </CardFooter>
    </Card>
  );
}
