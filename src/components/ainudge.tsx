import { BellRing, Bot } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAICounters } from '@/lib/ai-nudge-utils';
import { useEffect, useState } from 'react';

export function AINudge() {
  const { getAICount, setAICount } = useAICounters();
  const [aiUsageCount, setAiUsageCount] = useState<number>(0);
  const threshold = 1; // Show nudge if AI features used 0 or 1 times

  useEffect(() => {
    setAiUsageCount(getAICount());
  }, [getAICount]);

  if (aiUsageCount > threshold) {
    return null;
  }

  return (
    <Card className="w-full max-w-sm border-2 border-primary animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">AI Features</CardTitle>
        <Bot className="h-6 w-6 text-primary" />
      </CardHeader>
      <CardContent className="py-2">
        <CardDescription className="text-muted-foreground">
          Je hebt de AI features nog maar {aiUsageCount}x gebruikt. Ontdek wat AI voor je project kan doen!
        </CardDescription>
      </CardContent>
      <CardFooter className="px-6 py-4 flex justify-between">
        <Link to="/ai-features" onClick={() => setAICount(aiUsageCount + 1)}>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Bot className="mr-2 h-4 w-4" /> Ontdek AI
          </Button>
        </Link>
        <Button variant="ghost" onClick={() => setAICount(threshold + 1)} className="text-muted-foreground hover:text-foreground">
          Later
        </Button>
      </CardFooter>
    </Card>
  );
}
