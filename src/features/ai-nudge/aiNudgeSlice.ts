import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AiNudgeState {
  isVisible: boolean;
  hasDismissed: boolean;
  displayCount: number;
}

const initialState: AiNudgeState = {
  isVisible: false,
  hasDismissed: false,
  displayCount: 0,
};

const AI_NUDGE_DISMISSED_KEY = 'ai_nudge_dismissed';
const AI_NUDGE_DISPLAY_COUNT_KEY = 'ai_nudge_display_count';
const AI_NUDGE_LAST_DISPLAY_DATE_KEY = 'ai_nudge_last_display_date';

// Load initial state from localStorage
if (typeof localStorage !== 'undefined') {
  initialState.hasDismissed = localStorage.getItem(AI_NUDGE_DISMISSED_KEY) === 'true';
  initialState.displayCount = parseInt(localStorage.getItem(AI_NUDGE_DISPLAY_COUNT_KEY) || '0', 10);
}

const aiNudgeSlice = createSlice({
  name: 'aiNudge',
  initialState,
  reducers: {
    showAiNudge: (state) => {
      if (!state.hasDismissed) {
        state.isVisible = true;
        state.displayCount += 1;
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(AI_NUDGE_DISPLAY_COUNT_KEY, state.displayCount.toString());
          localStorage.setItem(AI_NUDGE_LAST_DISPLAY_DATE_KEY, new Date().toISOString());
        }
      }
    },
    hideAiNudge: (state) => {
      state.isVisible = false;
    },
    dismissAiNudge: (state) => {
      state.isVisible = false;
      state.hasDismissed = true;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(AI_NUDGE_DISMISSED_KEY, 'true');
      }
    },
    setAiNudgeDisplayCount: (state, action: PayloadAction<number>) => {
      state.displayCount = action.payload;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(AI_NUDGE_DISPLAY_COUNT_KEY, action.payload.toString());
      }
    },
  },
});

export const { showAiNudge, hideAiNudge, dismissAiNudge, setAiNudgeDisplayCount } = aiNudgeSlice.actions;

export const getAiNudgeState = (state: { aiNudge: AiNudgeState }) => state.aiNudge;

export default aiNudgeSlice.reducer;
