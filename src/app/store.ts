import { configureStore } from '@reduxjs/toolkit';
import globalSearchReducer from '@/features/global-search/globalSearchSlice';
import notificationsReducer from '@/features/notifications/notificationsSlice';
import authReducer from '@/features/auth/authSlice';
import projectReducer from '@/features/projects/projectSlice';
import aiNudgeReducer from '@/features/ai-nudge/aiNudgeSlice';

export const store = configureStore({
  reducer: {
    globalSearch: globalSearchReducer,
    notifications: notificationsReducer,
    auth: authReducer,
    project: projectReducer,
    aiNudge: aiNudgeReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
