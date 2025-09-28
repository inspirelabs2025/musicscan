import React from 'react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { X, ChevronLeft, ChevronRight, SkipForward } from 'lucide-react';
import { useOnboarding } from '@/hooks/useOnboarding';
import { OnboardingStepComponent } from './OnboardingStepComponent';

export const OnboardingModal: React.FC = () => {
  const {
    isOnboardingOpen,
    setIsOnboardingOpen,
    currentStepIndex,
    currentStepData,
    totalSteps,
    nextStep,
    previousStep,
    completeOnboarding,
    skipOnboarding
  } = useOnboarding();

  console.log('🎯 OnboardingModal render:', { 
    isOnboardingOpen, 
    currentStepIndex, 
    currentStepData: currentStepData?.title 
  });

  const progressPercentage = ((currentStepIndex + 1) / totalSteps) * 100;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  const handleNext = () => {
    if (isLastStep) {
      completeOnboarding();
    } else {
      nextStep();
    }
  };

  return (
    <Dialog open={isOnboardingOpen} onOpenChange={setIsOnboardingOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 z-50">
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-xl font-bold text-primary">MusicScan Onboarding</div>
              <Badge variant="outline" className="text-xs">
                Stap {currentStepIndex + 1} van {totalSteps}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {!isLastStep && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={skipOnboarding}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <SkipForward className="h-4 w-4 mr-1" />
                  Overslaan
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOnboardingOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="mt-3">
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          <OnboardingStepComponent
            step={currentStepData}
            stepIndex={currentStepIndex}
            totalSteps={totalSteps}
          />
        </div>

        <div className="px-6 py-4 border-t bg-background/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={previousStep}
              disabled={isFirstStep}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Vorige
            </Button>

            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground">
                {currentStepData?.title}
              </div>
            </div>

            <Button
              onClick={handleNext}
              className="flex items-center gap-2"
            >
              {isLastStep ? 'Voltooien' : 'Volgende'}
              {!isLastStep && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};