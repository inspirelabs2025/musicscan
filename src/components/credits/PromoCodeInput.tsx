import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Gift, Check } from 'lucide-react';
import { useRedeemPromoCode } from '@/hooks/useCredits';

interface PromoCodeInputProps {
  compact?: boolean;
  onSuccess?: (credits: number) => void;
}

export const PromoCodeInput: React.FC<PromoCodeInputProps> = ({ compact, onSuccess }) => {
  const [code, setCode] = useState('');
  const [redeemed, setRedeemed] = useState(false);
  const { mutate: redeem, isPending } = useRedeemPromoCode();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    redeem(code.trim(), {
      onSuccess: (data) => {
        setRedeemed(true);
        setCode('');
        onSuccess?.(data.credits);
      },
    });
  };

  if (redeemed) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <Check className="h-4 w-4" />
        Code ingewisseld!
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`flex gap-2 ${compact ? '' : 'w-full'}`}>
      <div className="relative flex-1">
        <Gift className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Promocode"
          className="pl-9 uppercase"
          disabled={isPending}
          maxLength={30}
        />
      </div>
      <Button type="submit" size={compact ? "sm" : "default"} disabled={isPending || !code.trim()}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Inwisselen'}
      </Button>
    </form>
  );
};
