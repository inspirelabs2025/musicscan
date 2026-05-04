import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Footer } from './Footer';

export const ConditionalFooter = () => {
  const { loading } = useAuth();

  if (loading) return null;

  // Tonen op desktop/tablet voor iedereen (ingelogd of niet),
  // verbergen op mobiel om de mobiele ervaring schoon te houden.
  return (
    <div className="hidden md:block">
      <Footer />
    </div>
  );
};
