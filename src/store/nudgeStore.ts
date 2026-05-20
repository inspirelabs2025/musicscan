import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface NudgeState {
  showAiNudge: boolean;
  aiFeatureUsageCount: number;
  dismissAiNudge: () => void;
  incrementAiFeatureUsage: () => void;
  // Add any other nudge-related state here
}

export const useNudgeStore = create<NudgeState>()(
  persist(
    (set) => ({
      showAiNudge: true, // Default to true, will be hidden by logic in AI Nudge component
      aiFeatureUsageCount: 0,
      dismissAiNudge: () => set({ showAiNudge: false }),
      incrementAiFeatureUsage: () => set((state) => ({ aiFeatureUsageCount: state.aiFeatureUsageCount + 1 })),
    }),
    {
      name: 'nudge-storage', // unique name
      storage: createJSONStorage(() => localStorage), // use localStorage for persistence
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(([key]) => ['aiFeatureUsageCount'].includes(key))
        ) as NudgeState,
    }
  )
);
