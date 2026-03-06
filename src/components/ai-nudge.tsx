import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { BirdIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAIMetrics } from "@/hooks/use-ai-metrics";
import { getAINudgeVariant, trackAIBTestEvent } from "@/lib/ab-test";
import { Link } from "react-router-dom";

export const AINudge: React.FC = () => {
  const { user } = useAuth();
  const { data: aiMetrics } = useAIMetrics();
  const [isOpen, setIsOpen] = useState(false);
  const [variant, setVariant] = useState<'control' | 'nudge'>('control');

  useEffect(() => {
    if (user && aiMetrics && aiMetrics.ai_usage_count === 0) {
      const abVariant = getAINudgeVariant();
      setVariant(abVariant);
      if (abVariant === 'nudge') {
        setIsOpen(true);
        trackAIBTestEvent('view_nudge', 'nudge');
      }
    }
  }, [user, aiMetrics]);

  const handleDismiss = () => {
    setIsOpen(false);
    trackAIBTestEvent('dismiss_nudge', variant);
  };

  const handleExploreClick = () => {
    setIsOpen(false);
    trackAIBTestEvent('click_nudge', variant);
  };

  if (!user || aiMetrics?.ai_usage_count !== 0 || variant === 'control') {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BirdIcon className="h-6 w-6 text-primary" /> Slimme features beschikbaar!
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-2">
            Je hebt de slimme features nog niet gebruikt. Ontdek wat ze voor je kunnen doen!
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Button variant="outline" onClick={handleDismiss} className="w-full sm:w-auto">
            Nee, bedankt
          </Button>
          <Link to="/dashboard" onClick={handleExploreClick} className="w-full sm:w-auto">
            <Button className="w-full">
              Ontdek! <BirdIcon className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
