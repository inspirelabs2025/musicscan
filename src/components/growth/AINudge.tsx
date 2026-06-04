import React from 'react';
import { ChevronRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface AINudgeProps {
  aiUsedCount: number;
  onDismiss?: () => void;
}

const AINudge: React.FC<AINudgeProps> = ({ aiUsedCount }) => {
  if (aiUsedCount > 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
      <Card className="w-[350px] bg-ai-nudge-background text-ai-nudge-foreground border-ai-nudge-border shadow-lg">
        <CardHeader className="flex flex-row items-center space-x-3 pb-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <CardTitle className="text-lg">AI features beschikbaar!</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <p className="mb-2">Je hebt de AI features nog maar <strong>0x</strong> gebruikt.</p>
          <CardDescription className="text-ai-nudge-foreground/80">
            Ontdek wat AI voor je project kan doen en bespaar kostbare tijd!
          </CardDescription>
        </CardContent>
        <CardFooter>
          <Link
            to="/ai-features" // Assuming a route to AI features page
            className="flex items-center text-primary hover:underline font-medium text-sm"
          >
            Ontdek AI functionaliteit
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AINudge;
