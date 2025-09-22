import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Footer } from './Footer';

export const ConditionalFooter = () => {
  const { user, loading } = useAuth();

  // Don't show footer while loading auth state
  if (loading) {
    return null;
  }

  // Only show footer when user is NOT logged in
  if (user) {
    return null;
  }

  return <Footer />;
};