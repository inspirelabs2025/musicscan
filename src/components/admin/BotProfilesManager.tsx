import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";

interface BotProfile {
  user_id: string;
  first_name: string;
  last_name?: string;
  is_bot: boolean;
  created_at: string;
}

export function BotProfilesManager() {
  const [botProfiles, setBotProfiles] = useState<BotProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBotProfiles();
  }, []);

  const loadBotProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, is_bot, created_at')
        .eq('is_bot', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBotProfiles(data || []);
    } catch (error) {
      console.error('Error loading bot profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground">Bot gebruikers laden...</p>
      </div>
    );
  }

  if (botProfiles.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            Nog geen bot gebruikers aangemaakt. Klik op "Bot Gebruikers Aanmaken" om te beginnen.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="w-5 h-5" />
          Actieve Bot Gebruikers ({botProfiles.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {botProfiles.map((bot) => (
            <div
              key={bot.user_id}
              className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {bot.first_name}
                  {bot.last_name && ` ${bot.last_name}`}
                </p>
                <Badge variant="secondary" className="text-xs">
                  Bot
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}