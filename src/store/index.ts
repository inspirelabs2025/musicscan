import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import userReducer from './userSlice';
import onboardingReducer from './onboardingSlice';
import nudgeReducer from './nudgeSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    onboarding: onboardingReducer,
    nudge: nudgeReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
