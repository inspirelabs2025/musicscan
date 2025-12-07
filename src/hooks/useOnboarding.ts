import { useState, useCallback } from 'react';
import { useProfile, useUpdateProfile } from './useProfile';
import { useToast } from '@/hooks/use-toast';

export interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  component: string;
  icon: string;
  completed: boolean;
}

export const ONBOARDING_STEPS: Omit<OnboardingStep, 'completed'>[] = [
  {
    id: 0,
    title: 'Welkom bij MusicScan',
    description: 'Ontdek je muziekcollectie zoals nooit tevoren',
    component: 'welcome',
    icon: 'Music'
  },
  {
    id: 1,
    title: 'Scan je eerste item',
    description: 'Maak een foto van een vinyl of CD om te beginnen',
    component: 'first-scan',
    icon: 'Camera'
  },
  {
    id: 2,
    title: 'Slimme Herkenning',
    description: 'Zie hoe het systeem je muziek herkent en analyseert',
    component: 'ai-magic',
    icon: 'Sparkles'
  },
  {
    id: 3,
    title: 'Je Collectie',
    description: 'Bekijk en beheer al je gescande items',
    component: 'collection',
    icon: 'Library'
  },
  {
    id: 4,
    title: 'Chat met je Collectie',
    description: 'Stel vragen over je muziek aan ons slimme systeem',
    component: 'chat',
    icon: 'MessageCircle'
  },
  {
    id: 5,
    title: 'Community Features',
    description: 'Ontdek andere verzamelaars en deel je passie',
    component: 'community',
    icon: 'Users'
  },
  {
    id: 6,
    title: 'Spotify Integratie',
    description: 'Verbind je Spotify account (optioneel)',
    component: 'spotify',
    icon: 'Music2'
  },
  {
    id: 7,
    title: 'Klaar om te beginnen!',
    description: 'Je bent nu klaar om MusicScan ten volle te benutten',
    component: 'completion',
    icon: 'CheckCircle'
  }
];

export const useOnboarding = () => {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const shouldShowOnboarding = profile && !profile.onboarding_completed && !profile.onboarding_skipped;
  const currentStep = profile?.onboarding_step || 0;

  const startOnboarding = useCallback(() => {
    setCurrentStepIndex(currentStep);
    setIsOnboardingOpen(true);
  }, [currentStep]);

  const nextStep = useCallback(() => {
    const nextIndex = Math.min(currentStepIndex + 1, ONBOARDING_STEPS.length - 1);
    setCurrentStepIndex(nextIndex);
    
    // Update profile with current step
    updateProfile.mutate({
      onboarding_step: nextIndex,
      last_onboarding_at: new Date().toISOString()
    });
  }, [currentStepIndex, updateProfile]);

  const previousStep = useCallback(() => {
    const prevIndex = Math.max(currentStepIndex - 1, 0);
    setCurrentStepIndex(prevIndex);
    
    updateProfile.mutate({
      onboarding_step: prevIndex,
      last_onboarding_at: new Date().toISOString()
    });
  }, [currentStepIndex, updateProfile]);

  const completeOnboarding = useCallback(() => {
    updateProfile.mutate({
      onboarding_completed: true,
      onboarding_step: ONBOARDING_STEPS.length - 1,
      last_onboarding_at: new Date().toISOString()
    });
    setIsOnboardingOpen(false);
    toast({
      title: "Onboarding voltooid! 🎉",
      description: "Je bent nu klaar om MusicScan ten volle te benutten!"
    });
  }, [updateProfile, toast]);

  const skipOnboarding = useCallback(() => {
    updateProfile.mutate({
      onboarding_skipped: true,
      last_onboarding_at: new Date().toISOString()
    });
    setIsOnboardingOpen(false);
    toast({
      title: "Onboarding overgeslagen",
      description: "Je kunt de tour altijd later starten via het help menu."
    });
  }, [updateProfile, toast]);

  const restartOnboarding = useCallback(() => {
    console.log('🚀 restartOnboarding called');
    updateProfile.mutate({
      onboarding_completed: false,
      onboarding_skipped: false,
      onboarding_step: 0,
      last_onboarding_at: new Date().toISOString()
    }, {
      onSuccess: () => {
        console.log('✅ Profile updated successfully');
        setCurrentStepIndex(0);
        setIsOnboardingOpen(true);
        console.log('✅ Onboarding modal should be open now');
      },
      onError: (error) => {
        console.error('❌ Failed to update profile:', error);
      }
    });
  }, [updateProfile]);

  return {
    isOnboardingOpen,
    setIsOnboardingOpen,
    shouldShowOnboarding,
    currentStepIndex,
    currentStepData: ONBOARDING_STEPS[currentStepIndex],
    totalSteps: ONBOARDING_STEPS.length,
    startOnboarding,
    nextStep,
    previousStep,
    completeOnboarding,
    skipOnboarding,
    restartOnboarding,
    isLoading
  };
};