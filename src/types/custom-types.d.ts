declare type NudgeState = {
  id: string;
  variant: 'nudge' | 'ai_features_available';
  show_count: number;
  last_shown_at: string | null;
  dismissed_at: string | null;
  action_taken_at: string | null;
};

declare type GrowthFeatureFlag = 'ai_nudge';
