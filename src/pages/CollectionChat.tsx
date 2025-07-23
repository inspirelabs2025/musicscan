import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Brain, Music, TrendingUp, Loader2 } from 'lucide-react';
import { useCollectionAIAnalysis } from '@/hooks/useCollectionAIAnalysis';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';

interface ChatMessage {
  id: string;
  message: string;
  sender_type: 'user' | 'ai';
  created_at: string;
  format_type?: string;
  tokens_used?: number;
  response_time_ms?: number;
}

const CollectionChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: analysisData } = useCollectionAIAnalysis();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load existing messages for this session
    loadMessages();
  }, []);

  const loadMessages = async () => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    
    if (data) {
      setMessages(data as ChatMessage[]);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      message: input,
      sender_type: 'user',
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('collection-chat', {
        body: {
          message: input,
          session_id: sessionId
        }
      });

      if (error) throw error;

      // Reload messages to get the AI response
      await loadMessages();
      
      // Generate new suggested questions after AI response
      setSuggestedQuestions(getRandomSuggestedQuestions());
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        message: 'Sorry, er ging iets mis bij het verwerken van je bericht.',
        sender_type: 'ai',
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startAnalysis = async () => {
    setIsLoading(true);
    const analysisMessage = 'Geef me een uitgebreide AI analyse van mijn hele muziekcollectie met persoonlijke inzichten, waarde-analyse, en aanbevelingen.';
    
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      message: analysisMessage,
      sender_type: 'user',
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      await supabase.functions.invoke('collection-chat', {
        body: {
          message: analysisMessage,
          session_id: sessionId
        }
      });

      await loadMessages();
      
      // Generate new suggested questions after analysis
      setSuggestedQuestions(getRandomSuggestedQuestions());
    } catch (error) {
      console.error('Error starting analysis:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = (msg: ChatMessage) => {
    const isUser = msg.sender_type === 'user';
    
    return (
      <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-[80%] p-3 rounded-lg ${
          isUser 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted'
        }`}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{msg.message}</p>
          ) : (
            <div 
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{
                __html: msg.message
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  .replace(/\n/g, '<br>')
              }}
            />
          )}
          {msg.tokens_used && (
            <div className="text-xs opacity-60 mt-1">
              {msg.tokens_used} tokens • {msg.response_time_ms}ms
            </div>
          )}
        </div>
      </div>
    );
  };

  const getRandomSuggestedQuestions = () => {
    const allQuestions = [
      "Wat zijn mijn meest waardevolle albums?",
      "Welke genres domineren mijn collectie?",
      "Geef me investeeringsadvies voor mijn collectie",
      "Welke artiesten ontbreken in mijn collectie?",
      "Analyseer mijn smaak in muziek",
      "Wat zijn de hidden gems in mijn collectie?",
      "Welke albums zijn het meest gestegen in waarde?",
      "Vergelijk mijn collectie met andere verzamelaars",
      "Wat zijn mijn zeldzaamste releases?",
      "Welke jaren zijn het best vertegenwoordigd?",
      "Suggereer albums om mijn collectie aan te vullen",
      "Wat is de gemiddelde waarde van mijn albums?",
      "Welke labels zijn dominant in mijn collectie?",
      "Analyseer de conditie van mijn collectie",
      "Welke albums moet ik absoluut houden?",
      "Wat zijn trends in mijn verzamelgedrag?",
      "Geef me tips voor het onderhouden van vinyl",
      "Welke albums hebben het meeste potentieel?",
      "Analyseer mijn internationale releases",
      "Wat zijn mijn meest unieke pressings?"
    ];
    
    // Shuffle en return 5 random questions
    const shuffled = allQuestions.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 5);
  };

  const [suggestedQuestions, setSuggestedQuestions] = useState(() => getRandomSuggestedQuestions());

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center items-center gap-2 mb-4">
              <Brain className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                AI Collection Chat
              </h1>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Chat met een AI-expert over je muziekcollectie. Krijg persoonlijke inzichten, waarde-analyses, en aanbevelingen gebaseerd op je eigen vinyl en CD collectie.
            </p>
          </div>

          {/* Quick Stats */}
          {analysisData && analysisData.success && (
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-4 justify-center">
                  <Badge variant="outline" className="px-3 py-1">
                    <Music className="w-4 h-4 mr-1" />
                    Collection Chat Klaar
                  </Badge>
                  <Badge variant="outline" className="px-3 py-1">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    AI Analyse Beschikbaar
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Chat Interface */}
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Chat
                </CardTitle>
                <Button onClick={startAnalysis} disabled={isLoading} variant="outline" size="sm">
                  <Brain className="w-4 h-4 mr-1" />
                  Start AI Analyse
                </Button>
              </div>
            </CardHeader>
            
            <Separator />
            
            <CardContent className="flex-1 flex flex-col p-0">
              <ScrollArea className="flex-1 p-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <Brain className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Begin een gesprek</h3>
                    <p className="text-muted-foreground mb-6">
                      Stel een vraag over je collectie of klik op een suggestie hieronder
                    </p>
                    
                    <div className="space-y-2 max-w-md mx-auto">
                      {suggestedQuestions.map((question, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          className="w-full text-left justify-start h-auto p-3 text-wrap"
                          onClick={() => setInput(question)}
                        >
                          {question}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    {messages.map(renderMessage)}
                    {isLoading && (
                      <div className="flex justify-start mb-4">
                        <div className="bg-muted p-3 rounded-lg">
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                      </div>
                    )}
                    
                    {/* Show suggested questions after messages */}
                    {messages.length > 0 && !isLoading && (
                      <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                        <h4 className="text-sm font-medium mb-3 text-muted-foreground">
                          Nieuwe vragen die je kunt stellen:
                        </h4>
                        <div className="space-y-2">
                          {suggestedQuestions.map((question, index) => (
                            <Button
                              key={index}
                              variant="ghost"
                              size="sm"
                              className="w-full text-left justify-start h-auto p-2 text-wrap text-xs"
                              onClick={() => setInput(question)}
                            >
                              {question}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </ScrollArea>
              
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Stel een vraag over je collectie..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button 
                    onClick={sendMessage} 
                    disabled={!input.trim() || isLoading}
                    size="icon"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CollectionChat;