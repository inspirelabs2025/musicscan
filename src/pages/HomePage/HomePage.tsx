import { MainLayout } from "@/components/layout/MainLayout";
import { AINudge } from '@/components/ai-nudge';

export function Component() {
  return (
    <MainLayout>
      <div
        className="min-h-screen items-center justify-center bg-background text-foreground"
      >
        <h1 className="text-center text-4xl font-bold">Welcome to the Home Page!</h1>
        <p className="text-center text-lg">Start building your awesome application.</p>
      </div>
      <AINudge aiFeaturesPath="/ai" /> 
    </MainLayout>
  );
}

export const HomePage = Component;
