import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { MessageSquareText, Send, Loader2, Info } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/supabaseClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'react-hot-toast';
import { ChatNudge } from '@/components/ui/chat-nudge'; // Import ChatNudge

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

    // Fetch project details
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('id, name')
      .eq('id', currentProjectId)
      .single();

    if (projectError) {
      console.error('Error fetching project:', projectError);
      setError('Failed to load project details.');
      setLoading(false);
      return;
    }
    setProject(projectData);

    // Fetch messages
    const { data, error: messagesError } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        sender_id,
        created_at,
        is_ai,
        sender:profiles (display_name)
      `)
      .eq('project_id', currentProjectId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      setError('Failed to load messages.');
    } else {
      setMessages(data || []);
      setChatMessageCount(data?.length || 0); // Update chat message count
    }
    setLoading(false);
  }, [currentProjectId]);

  useEffect(() => {
    fetchMessagesAndProject();
  }, [fetchMessagesAndProject]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Realtime subscription for new messages
  useEffect(() => {
    if (!currentProjectId) return;

    const channel = supabase
      .channel(`project_chat_${currentProjectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `project_id=eq.${currentProjectId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          // Fetch sender display name if it's not already in the payload
          if (!newMessage.sender) {
            supabase
              .from('profiles')
              .select('display_name')
              .eq('id', newMessage.sender_id)
              .single()
              .then(({ data, error }) => {
                if (!error && data) {
                  setMessages((prev) => [...prev, { ...newMessage, sender: data }]);
                } else {
                  console.error('Error fetching sender profile for new message:', error);
                  setMessages((prev) => [...prev, newMessage]); // Add without sender if fetch fails
                }
              });
          } else {
            setMessages((prev) => [...prev, newMessage]);
          }
          setChatMessageCount((prev) => prev + 1); // Increment count on new message
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentProjectId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user?.id || !currentProjectId) {
      toast.error('Message, user, or project is missing.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('messages').insert({
      content: newMessage,
      sender_id: user.id,
      project_id: currentProjectId,
      is_ai: false, // User messages are not AI
    });

    setLoading(false);
    if (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message.');
    } else {
      setNewMessage('');
    }
  };

  const handleDismissNudge = () => {
    setShowChatNudge(false);
    // Potentially store this preference in local storage or user settings
  };

  if (!currentProjectId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <Info className="w-12 h-12 mb-4" />
        <h2 className="text-xl font-semibold">Geen project geselecteerd</h2>
        <p>Ga naar een project om de chat te starten of selecteer een project via de projectenpagina.</p>
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
    return <div className="text-red-500 text-center py-4">Error: {error}</div>;
  }

  const currentUserDisplayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Anoniem';

  return (
    <div className="flex flex-col h-full bg-background">
      <Card className="flex flex-col flex-1">
        <CardHeader className="border-b p-4">
          <CardTitle className="flex items-center space-x-2">
            <MessageSquareText className="w-6 h-6 text-primary" />
            <span>Project Chat: {project?.name || 'Laden...'}</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-card-dark">
          {messages.length === 0 && !loading && showChatNudge && (
             <div className="flex justify-center p-4">
              <ChatNudge chatMessageCount={chatMessageCount} onDismiss={handleDismissNudge} />
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`flex items-start gap-3 max-w-[75%] ${msg.sender_id === user?.id ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <Avatar className="h-8 w-8 border">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {(msg.sender?.display_name || 'A')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`p-3 rounded-lg ${msg.sender_id === user?.id
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-muted text-muted-foreground rounded-bl-none'}
                  shadow-md`}
                >
                  <p className="font-semibold text-sm mb-1">
                    {msg.sender_id === user?.id ? currentUserDisplayName : (msg.sender?.display_name || 'Onbekend')}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p className="text-xs opacity-70 mt-1 text-right">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
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
              className="flex-1 min-h-[40px] resize-none pr-10"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
            <Button type="submit" disabled={loading || !newMessage.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span className="sr-only">Verstuur</span>
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ChatPage;
