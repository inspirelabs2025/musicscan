import React, { useEffect } from 'react';
import { useAIUsageTracker } from '@/hooks/use-ai-usage-tracker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Terminal, Lightbulb, Brain, Wand2, Sparkles } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

export const AIFeaturesPage: React.FC = () => {
  const { recordAIUsage, usageData } = useAIUsageTracker();

  useEffect(() => {
    // Record AI feature page visit as usage event
    recordAIUsage();
  }, [recordAIUsage]);

  const features = [
    {
      icon: <Terminal className="h-6 w-6 text-primary" />,
      title: 'Code Suggesties',
      description: 'Ontvang slimme code suggesties en voltooiing voor snellere ontwikkeling.',
      cta: 'Probeer Code AI',
      link: '#',
    },
    {
      icon: <Lightbulb className="h-6 w-6 text-primary" />,
      title: 'Idee Generator',
      description: 'Genereer nieuwe projecten en functionaliteit ideeën met AI.',
      cta: 'Genereer Ideeën',
      link: '#',
    },
    {
      icon: <Brain className="h-6 w-6 text-primary" />,
      title: 'Content Creatie',
      description: 'Laat AI helpen met het schrijven van marketingteksten, blogs en meer.',
      cta: 'Start Content AI',
      link: '#',
    },
    {
      icon: <Wand2 className="h-6 w-6 text-primary" />,
      title: 'Automatisering Workflows',
      description: 'Zet AI in om repetitieve taken te automatiseren en workflows te optimaliseren.',
      cta: 'Automatiseer Nu',
      link: '#',
    },
    {
      icon: <Sparkles className="h-6 w-6 text-primary" />,
      title: 'Slimme Analyse',
      description: 'Krijg diepere inzichten in je data en projecten met AI-gedreven analyses.',
      cta: 'Bekijk Analyses',
      link: '#',
    },
  ];

  return (
    <div className="container mx-auto p-6 md:p-10">
      <div className="flex flex-col items-center justify-center text-center">
        <Brain className="h-12 w-12 text-echo-violet mb-4" />
        <h1 className="text-4xl font-bold mb-2">Welkom bij de AI Features!</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mb-8">
          Klaar om je workflow te transformeren? Ontdek hoe onze AI-tools je kunnen helpen sneller te werken, slimmere beslissingen te nemen en creatiever te zijn.
        </p>
        <HoverCard>
          <HoverCardTrigger asChild>
            <Button variant="outline" className="mb-12">Wat is AI?</Button>
          </HoverCardTrigger>
          <HoverCardContent className="w-80 text-sm">
            Kunstmatige Intelligentie (AI) is een breed veld van de informatica gericht op het bouwen van machines die slimme taken kunnen uitvoeren die normaal menselijke intelligentie vereisen.
          </HoverCardContent>
        </HoverCard>
      </div>

      <Separator className="my-8" />

      <h2 className="text-3xl font-semibold mb-6 text-center">Onze AI Tools</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="transform transition-transform duration-300 hover:scale-105">
            <CardHeader>
              <div className="flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <CardTitle className="text-center">{feature.title}</CardTitle>
              <CardDescription className="text-center">{feature.description}</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button className="mt-4" asChild>
                <a href={feature.link} onClick={() => recordAIUsage()}>{feature.cta}</a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator className="my-8" />

      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">Jouw AI Gebruik</h2>
        <p className="text-muted-foreground">Je hebt AI functies <span className="font-bold text-primary">{usageData.usageCount}</span> keer gebruikt.</p>
        {usageData.lastUsed && (
          <p className="text-muted-foreground">Laatst gebruikt op: {new Date(usageData.lastUsed).toLocaleDateString()} om {new Date(usageData.lastUsed).toLocaleTimeString()}</p>
        )}
      </div>
    </div>
  );
};
