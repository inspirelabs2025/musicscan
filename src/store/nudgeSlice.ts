import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface NudgeState {
  isDismissed: boolean;
  aiUsageCount: number;
}

const initialState: NudgeState = {
  isDismissed: false,
  aiUsageCount: 0,
};

const nudgeSlice = createSlice({
  name: 'nudge',
  initialState,
  reducers: {
    setAiUsageCount: (state, action: PayloadAction<number>) => {
      state.aiUsageCount = action.payload;
    },
    dismissNudge: (state) => {
      state.isDismissed = true;
    },
    resetNudge: (state) => {
      state.isDismissed = false;
      state.aiUsageCount = 0;
    },
  },
});

export const { setAiUsageCount, dismissNudge, resetNudge } = nudgeSlice.actions;

export default nudgeSlice.reducer;
