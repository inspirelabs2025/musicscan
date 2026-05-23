import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

type NudgeType = 'info' | 'success' | 'warning' | 'error';

interface NudgeOptions {
  id: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  type?: NudgeType;
  duration?: number;
}

interface CustomerFeedbackHook {
  triggerNudge: (options: NudgeOptions) => void;
  dismissNudge: (id: string) => void;
}

// A simple in-memory store to prevent showing the same nudge repeatedly within a session
const dismissedNudges: Set<string> = new Set();

export const useCustomerFeedback = (): CustomerFeedbackHook => {
  const triggerNudge = useCallback((options: NudgeOptions) => {
    if (dismissedNudges.has(options.id)) {
      return; // Nudge already dismissed, don't show again
    }

    // Using react-hot-toast for nudges for simplicity and consistency with existing toast messages.
    // In a more complex system, this might involve a custom UI component or a dedicated notification service.
    toast.custom((t) => (
      <div
        className={`bg-ai-nudge-background text-ai-nudge-foreground border-ai-nudge-border border p-4 rounded-lg shadow-lg max-w-sm w-full flex justify-between items-center animate-fade-in`}
      >
        <div>
          <p className="font-semibold text-lg">{options.title}</p>
          <p className="text-sm mt-1 mb-2">{options.message}</p>
          {options.actionLabel && options.onAction && (
            <button
              onClick={() => {
                options.onAction?.();
                toast.dismiss(t.id);
                dismissedNudges.add(options.id);
              }}
              className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90 transition-opacity"
            >
              {options.actionLabel}
            </button>
          )}
        </div>
        <button
          onClick={() => {
            toast.dismiss(t.id);
            dismissedNudges.add(options.id);
          }}
          className="ml-4 text-ai-nudge-foreground opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Sluiten"
        >
          &times;
        </button>
      </div>
    ), {
      duration: options.duration || 10000, // Default duration, can be customized
      id: options.id,
    });
  }, []);

  const dismissNudge = useCallback((id: string) => {
    toast.dismiss(id);
    dismissedNudges.add(id);
  }, []);

  return {
    triggerNudge,
    dismissNudge,
  };
};
