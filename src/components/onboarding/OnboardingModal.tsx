import React from 'react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { X, ChevronLeft, ChevronRight, SkipForward } from 'lucide-react';
import { OnboardingStepComponent } from './OnboardingStepComponent';
import { useLanguage } from '@/contexts/LanguageContext';

export interface OnboardingModalProps {
  isOnboardingOpen: boolean;
  setIsOnboardingOpen: (open: boolean) => void;
  currentStepIndex: number;
  currentStepData: any;
  totalSteps: number;
  nextStep: () => void;
  previousStep: () => void;
  completeOnboarding: () => void;
  skipOnboarding: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOnboardingOpen, setIsOnboardingOpen, currentStepIndex, currentStepData,
  totalSteps, nextStep, previousStep, completeOnboarding, skipOnboarding
}) => {
  const { tr } = useLanguage();
  const sc = tr.scanCollectionUI;

  console.log('🎯 OnboardingModal render:', { isOnboardingOpen, currentStepIndex, currentStepData: currentStepData?.title });

  const progressPercentage = ((currentStepIndex + 1) / totalSteps) * 100;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  const handleNext = () => { isLastStep ? completeOnboarding() : nextStep(); };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'ArrowRight') { e.preventDefault(); handleNext(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); if (!isFirstStep) previousStep(); }
  };

  return (
    <Dialog open={isOnboardingOpen} onOpenChange={setIsOnboardingOpen}>
      <DialogContent className="max-w-4xl h-[85vh] max-h-[85vh] p-0 grid grid-rows-[auto,1fr,auto] overflow-hidden z-50" onKeyDown={handleKeyDown}>
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-xl font-bold text-primary">{sc.onboardingTitle}</div>
              <Badge variant="outline" className="text-xs">
                {sc.stepOf.replace('{current}', String(currentStepIndex + 1)).replace('{total}', String(totalSteps))}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {!isLastStep && (
                <Button variant="ghost" size="sm" onClick={skipOnboarding} className="text-muted-foreground hover:text-foreground">
                  <SkipForward className="h-4 w-4 mr-1" />{sc.skip}
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setIsOnboardingOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="mt-3"><Progress value={progressPercentage} className="h-2" /></div>
        </DialogHeader>

        <div className="min-h-0 overflow-y-auto">
          <OnboardingStepComponent step={currentStepData} stepIndex={currentStepIndex} totalSteps={totalSteps} />
        </div>

        <div className="px-6 py-4 border-t bg-background/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={previousStep} disabled={isFirstStep} className="flex items-center gap-2">
              <ChevronLeft className="h-4 w-4" />{sc.previous}
            </Button>
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground">{currentStepData?.title}</div>
            </div>
            <Button onClick={handleNext} className="flex items-center gap-2">
              {isLastStep ? sc.complete : sc.next}
              {!isLastStep && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
