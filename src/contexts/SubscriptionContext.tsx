import React, { createContext, useContext } from 'react';
import { useSubscription } from '@/hooks/useSubscription';

type SubscriptionContextType = ReturnType<typeof useSubscription>;

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value = useSubscription();
  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscriptionContext = (): SubscriptionContextType => {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error('useSubscriptionContext must be used within SubscriptionProvider');
  }
  return ctx;
};
