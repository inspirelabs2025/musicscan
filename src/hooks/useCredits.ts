import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

export interface UserCredits {
  id: string;
  user_id: string;
  balance: number;
  total_earned: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: string;
  reference_id: string | null;
  description: string | null;
  created_at: string;
}

export const useCredits = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-credits", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("user_credits")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as UserCredits | null;
    },
    enabled: !!user?.id,
  });
};

export const useCreditTransactions = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["credit-transactions", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("credit_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as CreditTransaction[];
    },
    enabled: !!user?.id,
  });
};

export const useRedeemPromoCode = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase.rpc("redeem_promo_code", { p_code: code });
      if (error) throw error;
      const result = data as any;
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["user-credits"] });
      queryClient.invalidateQueries({ queryKey: ["credit-transactions"] });
      toast({
        title: "Code ingewisseld! 🎉",
        description: `Je hebt ${data.credits} credits ontvangen.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Code niet geldig",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
