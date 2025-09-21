import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SubscriptionStatus {
  subscribed: boolean;
  plan_slug: string;
  plan_name: string;
  subscription_end?: string;
  stripe_product_id?: string;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setSubscription({
        subscribed: false,
        plan_slug: 'free',
        plan_name: 'FREE - Music Explorer'
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) throw error;
      
      setSubscription(data);
    } catch (err: any) {
      console.error('Failed to check subscription:', err);
      setError(err.message || 'Failed to check subscription');
      // Fallback to FREE plan on error
      setSubscription({
        subscribed: false,
        plan_slug: 'free',
        plan_name: 'FREE - Music Explorer'
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createCheckout = useCallback(async (planSlug: string) => {
    if (!user) throw new Error('User must be logged in');

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan_slug: planSlug }
      });

      if (error) throw error;
      
      if (data?.url) {
        // Open checkout in new tab
        window.open(data.url, '_blank');
      }
      
      return data;
    } catch (err: any) {
      console.error('Failed to create checkout:', err);
      throw err;
    }
  }, [user]);

  const openCustomerPortal = useCallback(async () => {
    if (!user) throw new Error('User must be logged in');

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      if (data?.url) {
        // Open portal in new tab
        window.open(data.url, '_blank');
      }
      
      return data;
    } catch (err: any) {
      console.error('Failed to open customer portal:', err);
      throw err;
    }
  }, [user]);

  // Check subscription on mount and when user changes
  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Auto-refresh subscription status every 30 seconds
  useEffect(() => {
    const interval = setInterval(checkSubscription, 30000);
    return () => clearInterval(interval);
  }, [checkSubscription]);

  return {
    subscription,
    loading,
    error,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
    isSubscribed: subscription?.subscribed ?? false,
    planSlug: subscription?.plan_slug ?? 'free',
    planName: subscription?.plan_name ?? 'FREE - Music Explorer',
  };
};