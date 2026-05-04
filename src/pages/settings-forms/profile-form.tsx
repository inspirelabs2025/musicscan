import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

export const ProfileForm: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('user_id', user.id)
        .maybeSingle();
      if (cancelled) return;
      setDisplayName(data?.first_name || user.user_metadata?.first_name || '');
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .upsert({ user_id: user.id, first_name: displayName.trim() }, { onConflict: 'user_id' });
    setSaving(false);
    if (error) {
      toast({ title: 'Fout', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Opgeslagen', description: 'Je weergavenaam is bijgewerkt.' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="displayName">Weergavenaam</Label>
        <Input
          id="displayName"
          placeholder="Je weergavenaam"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          disabled={loading}
        />
      </div>
      <Button onClick={handleSave} disabled={saving || loading || !displayName.trim()}>
        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Opslaan
      </Button>
    </div>
  );
};
