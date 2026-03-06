import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { MessageSquareText, Send, Loader2, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { ChatNudge } from '@/components/ui/chat-nudge';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  is_ai: boolean;
  sender: {
    display_name: string;
  } | null;
}

interface Project {
  id: string;
  name: string;
}

const ChatPage: React.FC = () => {
  const { projectId: routeProjectId } = useParams<{ projectId?: string }>();
  const location = useLocation();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [chatMessageCount, setChatMessageCount] = useState<number>(0);
  const [showChatNudge, setShowChatNudge] = useState<boolean>(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const projectFromState = location.state?.project as Project | undefined;
  const currentProjectId = routeProjectId || projectFromState?.id;

  const fetchMessagesAndProject = useCallback(async () => {
    if (!currentProjectId) {
      setError('No project selected.');
      return;
    }
    setLoading(true);
    setError(null);
    setLoading(false);
  }, [currentProjectId]);

  useEffect(() => {
    fetchMessagesAndProject();
  }, [fetchMessagesAndProject]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user?.id || !currentProjectId) {
      toast.error('Bericht, gebruiker of project ontbreekt.');
      return;
    }
    setNewMessage('');
  };

  const handleDismissNudge = () => {
    setShowChatNudge(false);
  };

  if (!currentProjectId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <Info className="w-12 h-12 mb-4" />
        <h2 className="text-xl font-semibold">Geen project geselecteerd</h2>
        <p>Ga naar een project om de chat te starten.</p>
      </div>
    );
  }

  if (loading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive text-center py-4">Error: {error}</div>;
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <Card className="flex flex-col flex-1">
        <CardHeader className="border-b p-4">
          <CardTitle className="flex items-center space-x-2">
            <MessageSquareText className="w-6 h-6 text-primary" />
            <span>Project Chat: {project?.name || 'Laden...'}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !loading && showChatNudge && (
            <div className="flex justify-center p-4">
              <ChatNudge chatMessageCount={chatMessageCount} onDismiss={handleDismissNudge} />
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-start gap-3 max-w-[75%] ${msg.sender_id === user?.id ? 'flex-row-reverse' : 'flex-row'}`}>
                <Avatar className="h-8 w-8 border">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {(msg.sender?.display_name || 'A')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className={`p-3 rounded-lg ${msg.sender_id === user?.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'} shadow-md`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </CardContent>
        <CardFooter className="border-t p-4 bg-background">
          <form onSubmit={handleSendMessage} className="flex w-full space-x-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type je bericht hier..."
              className="flex-1 min-h-[40px] resize-none"
            />
            <Button type="submit" disabled={loading || !newMessage.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ChatPage;
