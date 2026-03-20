import { Helmet } from 'react-helmet';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Bot, Lightbulb, TrendingUp } from 'lucide-react';
import { useAICounters } from '@/lib/ai-nudge-utils';
import { useEffect } from 'react';

const AIFeaturesPage = () => {
  const { incrementAICount } = useAICounters();

  useEffect(() => {
    // Increment AI usage count when this page is visited
    incrementAICount();
  }, [incrementAICount]);

  return (
    <div className="container mx-auto py-8">
      <Helmet>
        <title>AI Features - Melodify</title>
      </Helmet>
      <h1 className="text-4xl font-bold mb-8 text-center">Ontdek de kracht van AI</h1>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <Card className="animate-fade-in delay-100">
          <CardHeader className="flex flex-row items-center gap-4">
            <Bot className="h-8 w-8 text-primary" />
            <div className="grid gap-1">
              <CardTitle className="text-xl">AI Muziek Generator</CardTitle>
              <CardDescription>Genereer unieke beats en melodieën met een druk op de knop.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Laat onze AI-assistent je helpen bij het creëren van soundtracks die perfect passen bij jouw visie. Van ambient tot techno, de mogelijkheden zijn eindeloos.</p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in delay-200">
          <CardHeader className="flex flex-row items-center gap-4">
            <Lightbulb className="h-8 w-8 text-primary" />
            <div className="grid gap-1">
              <CardTitle className="text-xl">Slimme Songtekst Assistent</CardTitle>
              <CardDescription>Krijg suggesties en verbeteringen voor je songteksten.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Overwin writer's block met onze AI-gestuurde songtekstgenerator. Je krijgt inspiratie, rijmwoorden en zelfs complete coupletten op basis van jouw input.</p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in delay-300">
          <CardHeader className="flex flex-row items-center gap-4">
            <TrendingUp className="h-8 w-8 text-primary" />
            <div className="grid gap-1">
              <CardTitle className="text-xl">AI Promotie Strategie</CardTitle>
              <CardDescription>Optimaliseer je marketingcampagnes met AI-inzichten.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Bereik een groter publiek door AI te laten analyseren welke promotiekanalen het meest effectief zijn voor jouw muziek en doelgroep.</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12 text-center">
        <p className="text-lg text-muted-foreground">En nog veel meer AI-gestuurde tools zijn onderweg!</p>
      </div>
    </div>
  );
};

export default AIFeaturesPage;
