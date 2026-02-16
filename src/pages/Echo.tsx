import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, Loader2, Music2, Sparkles, Heart, BookOpen, Lightbulb } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

import { useLanguage } from '@/contexts/LanguageContext';

interface EchoMessage {
  id: string;
  message: string;
  sender_type: 'user' | 'echo';
  created_at: string;
  message_type?: string;
}

export default function Echo() {
  const [messages, setMessages] = useState<EchoMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [activeMode, setActiveMode] = useState<string>('general');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { tr } = useLanguage();
  const e = tr.echoPage;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);
  useEffect(() => { loadMessages(); }, []);

  const loadMessages = async () => {
    const { data: conversation } = await supabase
      .from('echo_conversations')
      .select('id')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (!conversation) return;

    if (conversation) {
      const { data } = await supabase
        .from('echo_messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true });
      
      if (data) setMessages(data as EchoMessage[]);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg: EchoMessage = {
      id: crypto.randomUUID(),
      message: input,
      sender_type: 'user',
      created_at: new Date().toISOString(),
      message_type: activeMode
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('echo-chat', {
        body: {
          message: input,
          session_id: sessionId,
          conversation_type: activeMode
        }
      });

      if (error) throw error;
      await loadMessages();
    } catch (error) {
      console.error('Echo error:', error);
      toast({
        title: e.errorTitle,
        description: e.errorDesc,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedQuestions = {
    general: [
      "Vertel me over de geschiedenis van jazz 🎷",
      "Wat is het verhaal achter punk rock? 🎸",
      "Waarom is Fleetwood Mac - Rumours zo iconisch? 💿"
    ],
    album_story: [
      "Vertel het verhaal van Pink Floyd - Dark Side of the Moon 🌙",
      "Wat maakt The Beatles - Abbey Road zo bijzonder? 🚶‍♂️",
      "Vertel over de impact van Nirvana - Nevermind 🎤"
    ],
    lyric_analysis: [
      "Analyseer de lyrics van Bohemian Rhapsody 👑",
      "Wat betekenen de teksten van Leonard Cohen - Hallelujah? 🕊️",
      "Leg de poëzie uit in Bob Dylan - Like a Rolling Stone 🎲"
    ],
    memory: [
      "Welke muziek herinnert jou aan je jeugd? 🌟",
      "Vertel over je eerste concert ervaring 🎪",
      "Welk album heeft jouw leven veranderd? 💫"
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-echo-violet via-background to-background">
      <div className="relative overflow-hidden py-2 px-4 bg-gradient-to-br from-[hsl(270,60%,20%)] via-[hsl(270,50%,18%)] to-[hsl(270,55%,12%)]">
        <div className="container mx-auto max-w-5xl relative z-10">
          <div className="text-center space-y-1 animate-fade-in">
            <div className="flex justify-center">
              <img 
                src="/magic-mike-logo.png"
                alt="Magic Mike"
                className="w-48 h-48 object-contain drop-shadow-xl"
              />
            </div>
            <h1 className="text-3xl font-bold text-white font-serif">{e.title}</h1>
            <p className="text-sm text-muted-foreground">{e.subtitle}</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-8 max-w-5xl -mt-3">
        <Card className="border-2 border-echo-lavender/20 bg-card/95 backdrop-blur">
          <CardHeader>
            <Tabs value={activeMode} onValueChange={setActiveMode} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-echo-violet/20">
                <TabsTrigger value="general" className="data-[state=active]:bg-echo-lavender data-[state=active]:text-black">
                  <Sparkles className="w-4 h-4 mr-2" />
                  {e.explore}
                </TabsTrigger>
                <TabsTrigger value="album_story" className="data-[state=active]:bg-echo-gold data-[state=active]:text-white">
                  <BookOpen className="w-4 h-4 mr-2" />
                  {e.albumStory}
                </TabsTrigger>
                <TabsTrigger value="lyric_analysis" className="data-[state=active]:bg-vinyl-purple data-[state=active]:text-white">
                  <Lightbulb className="w-4 h-4 mr-2" />
                  {e.lyricAnalysis}
                </TabsTrigger>
                <TabsTrigger value="memory" className="data-[state=active]:bg-vinyl-gold data-[state=active]:text-black">
                  <Heart className="w-4 h-4 mr-2" />
                  {e.memories}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent className="space-y-6">
            <ScrollArea className="h-[500px] pr-4">
              {messages.length === 0 && (
                <div className="text-center py-12 space-y-6">
                  <Music2 className="w-16 h-16 mx-auto text-echo-lavender animate-echo-pulse" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2 font-serif">{e.welcome}</h3>
                    <p className="text-muted-foreground mb-6">{e.askQuestion}</p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground font-semibold">{e.suggestions}</p>
                    {suggestedQuestions[activeMode as keyof typeof suggestedQuestions].map((q, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        className="w-full justify-start text-left h-auto py-3 hover:bg-echo-lavender/10 hover:border-echo-lavender"
                        onClick={() => setInput(q)}
                      >
                        {q}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`mb-4 flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl ${
                      msg.sender_type === 'user'
                        ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground'
                        : 'bg-gradient-to-br from-echo-violet/10 to-echo-lavender/10 border border-echo-lavender/20'
                    }`}
                  >
                    {msg.sender_type === 'echo' && (
                      <div className="flex items-center gap-2 mb-2">
                        <img src="/magic-mike-logo.png" alt="Magic Mike" className="w-6 h-6 rounded-full border border-echo-lavender/30" />
                        <span className="text-xs font-semibold text-echo-lavender">Magic Mike</span>
                      </div>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start mb-4">
                  <div className="bg-gradient-to-br from-echo-violet/10 to-echo-lavender/10 border border-echo-lavender/20 p-4 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <Music2 className="w-4 h-4 text-echo-lavender animate-echo-pulse" />
                      <span className="text-sm text-muted-foreground">{e.listening}</span>
                      <Loader2 className="w-4 h-4 animate-spin text-echo-lavender" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </ScrollArea>

            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(ev) => setInput(ev.target.value)}
                onKeyPress={(ev) => ev.key === 'Enter' && !ev.shiftKey && sendMessage()}
                placeholder={e.inputPlaceholder}
                disabled={isLoading}
                className="flex-1 border-echo-lavender/20 focus:border-echo-lavender bg-background/50"
              />
              <Button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className="bg-gradient-to-r from-echo-lavender to-echo-gold hover:opacity-90"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
