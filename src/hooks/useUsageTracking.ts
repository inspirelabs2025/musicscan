import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UsageData {
  ai_scans_used: number;
  ai_chat_used: number;
  bulk_uploads_used: number;
  period_start: string;
  period_end: string;
}

interface UsageLimitCheck {
  can_use: boolean;
  current_usage: number;
  limit_amount: number | null;
  plan_name: string;
}

export const useUsageTracking = () => {
  const { user } = useAuth();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(false);

  const getCurrentUsage = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_current_usage', {
        p_user_id: user.id
      });

      if (error) throw error;
      if (data && data.length > 0) {
        setUsage(data[0]);
      }
    } catch (err) {
      console.error('Failed to get usage:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const checkUsageLimit = useCallback(async (usageType: 'ai_scans' | 'ai_chat' | 'bulk_uploads'): Promise<UsageLimitCheck> => {
    if (!user) {
      throw new Error('User must be logged in');
    }

    try {
      const { data, error } = await supabase.rpc('check_usage_limit', {
        p_user_id: user.id,
        p_usage_type: usageType
      });

      if (error) throw error;
      
      return data[0] as UsageLimitCheck;
    } catch (err) {
      console.error('Failed to check usage limit:', err);
      throw err;
    }
  }, [user]);

  const incrementUsage = useCallback(async (usageType: 'ai_scans' | 'ai_chat' | 'bulk_uploads', increment: number = 1) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('increment_usage', {
        p_user_id: user.id,
        p_usage_type: usageType,
        p_increment: increment
      });

      if (error) throw error;
      
      // Refresh usage data after incrementing
      await getCurrentUsage();
      
      return data;
    } catch (err) {
      console.error('Failed to increment usage:', err);
      return false;
    }
  }, [user, getCurrentUsage]);

  // Load usage on mount and when user changes
  useEffect(() => {
    getCurrentUsage();
  }, [getCurrentUsage]);

  const getUsagePercentage = useCallback((usageType: 'ai_scans' | 'ai_chat' | 'bulk_uploads', limit: number | null) => {
    if (!usage || limit === null) return 0;
    
    const used = usage[`${usageType}_used` as keyof UsageData] as number;
    return Math.min((used / limit) * 100, 100);
  }, [usage]);

  return {
    usage,
    loading,
    getCurrentUsage,
    checkUsageLimit,
    incrementUsage,
    getUsagePercentage,
    // Convenience getters
    aiScansUsed: usage?.ai_scans_used ?? 0,
    aiChatUsed: usage?.ai_chat_used ?? 0,
    bulkUploadsUsed: usage?.bulk_uploads_used ?? 0,
  };
};