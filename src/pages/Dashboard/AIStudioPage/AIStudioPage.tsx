import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAIUsage } from '@/hooks/use-ai-usage';
import { useEffect } from 'react';

export function Component() {
  const { recordAIUsage, usageCount } = useAIUsage();

  // Record AI Studio visit as an AI usage event
  useEffect(() => {
    recordAIUsage('ai_studio_visit');
  }, [recordAIUsage]);

  return (
    <MainLayout>
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle>AI Studio</CardTitle>
            <CardDescription>Explore the power of AI for your project.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid w-full items-center gap-4">
              <p className="text-sm text-center">You've used AI features {usageCount} time(s)!</p>
              <Button onClick={() => recordAIUsage('ai_feature_example')}>Simulate AI Feature Use</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

export const AIStudioPage = Component;
