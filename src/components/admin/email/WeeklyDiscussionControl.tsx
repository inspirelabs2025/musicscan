import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Send, Calendar, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

export const WeeklyDiscussionControl = () => {
  const [isTriggeringDiscussion, setIsTriggeringDiscussion] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Fetch recent weekly discussions
  const { data: recentDiscussions, refetch } = useQuery({
    queryKey: ['recent-weekly-discussions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('forum_topics')
        .select('*')
        .eq('is_weekly_discussion', true)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  const handleTriggerDiscussion = async () => {
    setIsTriggeringDiscussion(true);
    try {
      const { data, error } = await supabase.functions.invoke('weekly-forum-discussions', {
        body: { trigger: 'manual' }
      });

      if (error) throw error;

      toast.success('Weekly discussion aangemaakt!');
      refetch();
    } catch (error: any) {
      console.error('Error triggering discussion:', error);
      toast.error('Fout bij aanmaken discussion: ' + error.message);
    } finally {
      setIsTriggeringDiscussion(false);
    }
  };

  const handleSendTestNotification = async () => {
    setIsSendingTest(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-weekly-discussion-notification', {
        body: {
          topicId: recentDiscussions?.[0]?.id,
          topicTitle: recentDiscussions?.[0]?.title,
          topicDescription: recentDiscussions?.[0]?.description,
          testEmail: 'rogiervisser76@gmail.com'
        }
      });

      if (error) throw error;

      toast.success('Test notificatie verzonden!');
    } catch (error: any) {
      console.error('Error sending test:', error);
      toast.error('Fout bij versturen test: ' + error.message);
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <CardTitle>Weekly Forum Discussion</CardTitle>
        </div>
        <CardDescription>
          Maak wekelijkse discussie aan en verstuur notificaties
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        {recentDiscussions?.[0] && (
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Laatste discussie</p>
            </div>
            <p className="text-sm font-semibold line-clamp-1">
              {recentDiscussions[0].title}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(recentDiscussions[0].created_at).toLocaleString('nl-NL')}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={handleTriggerDiscussion}
            disabled={isTriggeringDiscussion}
            className="flex-1"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            {isTriggeringDiscussion ? 'Aanmaken...' : 'Nieuwe Discussie'}
          </Button>
          <Button
            onClick={handleSendTestNotification}
            disabled={isSendingTest || !recentDiscussions?.[0]}
            variant="outline"
            className="flex-1"
          >
            <Send className="h-4 w-4 mr-2" />
            {isSendingTest ? 'Versturen...' : 'Test Notificatie'}
          </Button>
        </div>

        {/* Recent discussions */}
        {recentDiscussions && recentDiscussions.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Recente discussies:</p>
            <div className="space-y-1">
              {recentDiscussions.map((discussion) => (
                <div
                  key={discussion.id}
                  className="flex items-center justify-between p-2 rounded bg-muted/30 text-xs"
                >
                  <span className="truncate flex-1">{discussion.title}</span>
                  <span className="text-muted-foreground ml-2">
                    {new Date(discussion.created_at).toLocaleDateString('nl-NL')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
