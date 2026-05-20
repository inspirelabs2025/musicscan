import './App.css';
import { Toaster } from 'sonner';
import { TooltipProvider } from "@/components/ui/tooltip";
import { MainRouter } from './router';
import { useNudgeStore } from './store/nudgeStore'; // Import the store
import { AiNudge } from './components/ui/ai-nudge'; // Import the new component
import { useEffect, useState } from 'react';

function App() {
  const { showAiNudge, aiFeatureUsageCount, dismissAiNudge, incrementAiFeatureUsage } = useNudgeStore();
  const [hasDismissedAiNudge, setHasDismissedAiNudge] = useState(() => {
    // Initialize from local storage to persist dismissal across sessions
    if (typeof window !== 'undefined') {
      return localStorage.getItem('aiNudgeDismissed') === 'true';
    }
    return false;
  });

  useEffect(() => {
    if (hasDismissedAiNudge) {
      localStorage.setItem('aiNudgeDismissed', 'true');
    } else {
      localStorage.removeItem('aiNudgeDismissed');
    }
  }, [hasDismissedAiNudge]);

  const handleDismissAiNudge = () => {
    dismissAiNudge();
    setHasDismissedAiNudge(true);
  };

  const handleAiNudgeButtonClick = () => {
    // Example: navigate to AI features page
    // For now, let's just dismiss it and simulate usage
    incrementAiFeatureUsage();
    handleDismissAiNudge();
    // You might want to add a router.push('/ai-features') here
  };

  return (
    <TooltipProvider>
      <MainRouter />
      <Toaster richColors />
      {showAiNudge && !hasDismissedAiNudge && (aiFeatureUsageCount === 0) && (
        <div className="fixed bottom-4 right-4 z-[9999]">
          <AiNudge
            aiFeatureCount={aiFeatureUsageCount} // Pass the usage count
            onClose={handleDismissAiNudge}
            onButtonClick={handleAiNudgeButtonClick}
            description={`Je hebt de AI features nog maar ${aiFeatureUsageCount}x gebruikt. Ontdek wat AI voor je project kan doen!`}
          />
        </div>
      )}
    </TooltipProvider>
  );
}

export default App;
