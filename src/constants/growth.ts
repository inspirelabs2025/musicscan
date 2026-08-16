export const AI_NUDGE_VARIANT = import.meta.env.VITE_AI_NUDGE_VARIANT as
  | 'disabled'
  | 'nudge'
  | undefined;

export const CHAT_NUDGE_VARIANT = import.meta.env
  .VITE_CHAT_NUDGE_VARIANT as 'disabled' | 'new_chat_user' | undefined;

export const AI_FEATURES_NUDGE_VARIANT = import.meta.env
  .VITE_AI_FEATURES_NUDGE_VARIANT as 'disabled' | 'enabled' | undefined;

export const AI_FEATURES_NUDGE_MESSAGE = 'Je hebt de AI features nog maar 0x gebruikt. Ontdek wat AI voor je project kan doen!';
