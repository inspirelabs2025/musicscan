import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export enum AI_NUDGE_VARIANTS {
  CONTROL = 'control',
  NUDGE = 'nudge',
}

interface AiNudge {
  id: string;
  message: string;
  title?: string;
  actionLabel?: string;
  action?: () => void;
  onDismiss?: () => void;
  priority?: number; // Higher priority nudges are displayed first
}

interface AiNudgeContextType {
  variant: AI_NUDGE_VARIANTS;
  setVariant: (variant: AI_NUDGE_VARIANTS) => void;
  addNudge: (nudge: AiNudge) => void;
  dismissNudge: (id: string) => void;
  visibleNudge: AiNudge | null;
  forceVisible: boolean;
  setForceVisible: (visible: boolean) => void;
}

const AiNudgeContext = createContext<AiNudgeContextType | undefined>(undefined);

export const AiNudgeProvider = ({ children }: { children: ReactNode }) => {
  const [nudges, setNudges] = useState<AiNudge[]>([]);
  const [dismissedNudges, setDismissedNudges] = useState<string[]>([]);
  const [variant, setVariant] = useState<AI_NUDGE_VARIANTS>(AI_NUDGE_VARIANTS.CONTROL); // Default to control
  const [forceVisible, setForceVisible] = useState(false);

  useEffect(() => {
    // Load dismissed nudges from local storage
    const storedDismissed = localStorage.getItem('dismissedAiNudges');
    if (storedDismissed) {
      setDismissedNudges(JSON.parse(storedDismissed));
    }
  }, []);

  useEffect(() => {
    // Save dismissed nudges to local storage
    localStorage.setItem('dismissedAiNudges', JSON.stringify(dismissedNudges));
  }, [dismissedNudges]);

  const addNudge = useCallback((nudge: AiNudge) => {
    setNudges((prevNudges) => {
      // Only add if not already present and not dismissed
      if (!prevNudges.some(n => n.id === nudge.id) && !dismissedNudges.includes(nudge.id)) {
        return [...prevNudges, nudge];
      }
      return prevNudges;
    });
  }, [dismissedNudges]);

  const dismissNudge = useCallback((id: string) => {
    setDismissedNudges((prev) => [...prev, id]);
    setNudges((prev) => prev.filter((nudge) => nudge.id !== id));
  }, []);

  const visibleNudge = nudges
    .filter(nudge => !dismissedNudges.includes(nudge.id))
    .sort((a, b) => (b.priority || 0) - (a.priority || 0))[0] || null;

  const contextValue = {
    variant,
    setVariant,
    addNudge,
    dismissNudge,
    visibleNudge,
    forceVisible,
    setForceVisible
  };

  return (
    <AiNudgeContext.Provider value={contextValue}>
      {children}
    </AiNudgeContext.Provider>
  );
};

export const useAiNudge = () => {
  const context = useContext(AiNudgeContext);
  if (context === undefined) {
    throw new Error('useAiNudge must be used within an AiNudgeProvider');
  }
  return context;
};
