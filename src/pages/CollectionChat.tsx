import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Brain, Music, TrendingUp, Loader2, Headphones } from 'lucide-react';
import { useCollectionAIAnalysis } from '@/hooks/useCollectionAIAnalysis';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { useUsageTracking } from '@/hooks/useUsageTracking';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { toast } from '@/hooks/use-toast';

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
  const { checkUsageLimit, incrementUsage } = useUsageTracking();
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<'usage_limit' | 'feature_limit'>('usage_limit');
  const [usageInfo, setUsageInfo] = useState<{current: number, limit: number, plan: string} | undefined>();
  const [spotifyConnected, setSpotifyConnected] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load existing messages for this session
    loadMessages();
    // Check Spotify connection status
    checkSpotifyStatus();
  }, []);

  const checkSpotifyStatus = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('spotify_connected')
        .single();
      
      if (data) {
        setSpotifyConnected(data.spotify_connected || false);
      }
    } catch (error) {
      console.error('Error checking Spotify status:', error);
    }
  };

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

    // Check AI chat usage limit before sending
    try {
      const usageCheck = await checkUsageLimit('ai_chat');
      if (!usageCheck.can_use) {
        setUsageInfo({
          current: usageCheck.current_usage,
          limit: usageCheck.limit_amount || 0,
          plan: usageCheck.plan_name
        });
        setUpgradeReason('usage_limit');
        setShowUpgradePrompt(true);
        return;
      }
    } catch (error) {
      console.error('Failed to check usage limit:', error);
      toast({
        title: "Fout bij Controle",
        description: "Kon gebruikslimiet niet controleren. Probeer het opnieuw.",
        variant: "destructive"
      });
      return;
    }

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

      // Increment usage after successful AI response
      try {
        await incrementUsage('ai_chat', 1);
      } catch (error) {
        console.error('Failed to increment usage:', error);
      }

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
    
    // Check AI chat usage limit before starting analysis
    try {
      const usageCheck = await checkUsageLimit('ai_chat');
      if (!usageCheck.can_use) {
        setUsageInfo({
          current: usageCheck.current_usage,
          limit: usageCheck.limit_amount || 0,
          plan: usageCheck.plan_name
        });
        setUpgradeReason('usage_limit');
        setShowUpgradePrompt(true);
        setIsLoading(false);
        return;
      }
    } catch (error) {
      console.error('Failed to check usage limit:', error);
      setIsLoading(false);
      return;
    }
    
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

      // Increment usage after successful analysis
      try {
        await incrementUsage('ai_chat', 1);
      } catch (error) {
        console.error('Failed to increment usage:', error);
      }

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
      <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-fade-in`}>
        <div className={`max-w-[85%] sm:max-w-[75%] md:max-w-[70%] lg:max-w-[65%] p-4 rounded-2xl shadow-lg ${
          isUser 
            ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border border-primary/20' 
            : 'bg-gradient-to-br from-card to-muted/50 border border-primary/10'
        }`}>
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words hyphens-auto">{msg.message}</p>
          ) : (
            <div 
              className="prose prose-sm max-w-none dark:prose-invert prose-p:my-2 prose-p:leading-relaxed prose-headings:my-3 prose-headings:leading-tight prose-li:my-1 prose-ul:my-2 prose-ol:my-2 prose-strong:font-semibold text-sm"
              style={{ wordBreak: 'break-word', overflowWrap: 'break-word', hyphens: 'auto' }}
              dangerouslySetInnerHTML={{
                __html: msg.message
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  .replace(/\n\n/g, '</p><p>')
                  .replace(/\n/g, '<br>')
                  .replace(/^/, '<p>')
                  .replace(/$/, '</p>')
                  .replace(/<p><\/p>/g, '')
              }}
            />
          )}
          {msg.tokens_used && (
            <div className="text-xs opacity-60 mt-2 pt-2 border-t border-current/10">
              {msg.tokens_used} tokens • {msg.response_time_ms}ms
            </div>
          )}
        </div>
      </div>
    );
  };

  const getRandomSuggestedQuestions = () => {
    const physicalQuestions = [
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
      "Wat is de gemiddelde waarde van mijn collectie?",
      "Welke labels zijn dominant in mijn collectie?",
      "Analyseer de conditie van mijn collectie",
      "Welke albums moet ik absoluut houden?",
      "Wat zijn trends in mijn verzamelgedrag?",
      "Geef me tips voor het onderhouden van vinyl",
      "Welke albums hebben het meeste potentieel?",
      "Analyseer mijn internationale releases",
      "Wat zijn mijn meest unieke pressings?",
      "Welke albums zijn ondergewaardeerd in de markt?",
      "Toon me mijn meest diverse artiesten",
      "Wat zijn mijn beste vinyl finds?",
      "Analyseer mijn CD vs vinyl verhouding",
      "Welke decennia ontbreken in mijn collectie?",
      "Wat zijn mijn meest emotionele albums?",
      "Geef me aanbevelingen voor mijn volgende aankoop",
      "Welke albums hebben sentimentele waarde?",
      "Analyseer mijn collectie op zeldzaamheid",
      "Wat zijn mijn meest gespeelde genres waarschijnlijk?",
      "Welke albums zijn perfect bewaard gebleven?",
      "Toon me mijn meest interessante B-sides",
      "Wat zijn mijn limited edition releases?",
      "Analyseer de geografische spreiding van mijn labels",
      "Welke albums zijn het best aged in waarde?",
      "Wat zijn mijn meest controversiële albums?",
      "Geef me storage tips voor mijn conditie",
      "Welke albums zijn mijn guilty pleasures?",
      "Analyseer mijn collectie op heruitgaves vs originelen",
      "Wat zijn mijn meest experimentele albums?",
      "Welke albums hebben de beste artwork?",
      "Toon me mijn soundtrack en filmmusiek collectie",
      "Wat zijn mijn meest nostalgische albums?",
      "Analyseer mijn live albums en bootlegs",
      "Welke albums zijn mijn muziekeducatie?",
      "Wat zijn mijn meest underrated artiesten?",
      "Geef me insight in mijn verzamelpatronen",
      "Welke albums vertegenwoordigen verschillende levensfases?",
      "Analyseer mijn collectie op producer en studio",
      "Wat zijn mijn meest influentiële albums?",
      "Welke albums zijn mijn 'desert island' picks?",
      "Toon me mijn concept albums en rock opera's",
      "Wat zijn mijn meest danceable tracks waarschijnlijk?",
      "Analyseer mijn collectie op instrumentale muziek",
      "Welke albums zijn mijn mood boosters?",
      "Wat zijn mijn meest technisch uitdagende opnames?",
      "Geef me seasonal listening aanbevelingen uit mijn collectie",
      "Welke albums zijn mijn creative inspiration?",
      "Analyseer mijn wereldmuziek en etnische collectie",
      "Wat zijn mijn meest collaboratieve albums?",
      "Welke albums hebben de beste geluidskwaliteit?",
      "Toon me mijn protest en political songs",
      "Wat zijn mijn meest romantische albums?",
      "Analyseer mijn jazz en blues subcollectie",
      "Welke albums zijn mijn workout muziek?",
      "Wat zijn mijn meest relaxing en ambient albums?",
      "Geef me insight in mijn classical music taste",
      "Welke albums zijn mijn electronic en dance collectie?",
      "Analyseer mijn hip-hop en rap evolutie",
      "Wat zijn mijn meest storytelling albums?",
      "Welke albums tonen mijn cultural diversity?",
      "Toon me mijn cover versions en tribute albums",
      "Wat zijn mijn meest energetic en uplifting albums?",
      "Analyseer mijn metal en hard rock smaak",
      "Welke albums zijn mijn singer-songwriter collectie?",
      "Wat zijn mijn meest psychedelic en experimental releases?",
      "Geef me insight in mijn country en folk albums",
      "Welke albums vertegenwoordigen verschillende muziekbewegingen?",
      "Analyseer mijn funk, soul en R&B collectie",
      "Wat zijn mijn meest influential female artists?",
      "Welke albums zijn mijn guilty pleasure genres?",
      "Toon me mijn instrumental en soundtrack gems",
      "Wat zijn mijn meest innovative en groundbreaking albums?"
    ];

    const spotifyQuestions = [
      "Vergelijk mijn Spotify top tracks met mijn fysieke collectie",
      "Welke artiesten luister ik veel op Spotify maar heb ik niet fysiek?",
      "Analyseer de overlap tussen mijn playlists en vinyl collectie",
      "Wat zijn de verschillen tussen mijn digitale en fysieke muzieksmaak?",
      "Welke albums zou ik moeten kopen gebaseerd op mijn Spotify gedrag?",
      "Toon me mijn meest gespeelde Spotify genres vs mijn collectie",
      "Welke Spotify discoveries zou ik fysiek moeten aanschaffen?",
      "Analyseer mijn Spotify playlists voor collectie inspiratie",
      "Vergelijk mijn Spotify luistergewoonten met mijn aankopen",
      "Welke trending tracks op Spotify passen bij mijn collectie?",
      "Toon me crossover artiesten tussen Spotify en mijn collectie",
      "Analyseer mijn Spotify vs vinyl luistergedrag per seizoen",
      "Welke Spotify hits ontbreken in mijn fysieke collectie?",
      "Geef me aanbevelingen gebaseerd op mijn complete muziekprofiel",
      "Analyseer mijn music discovery patterns: digital vs physical",
      "Welke Spotify artiesten verdienen een plaats in mijn collectie?",
      "Vergelijk mijn streaming vs collecting voorkeuren",
      "Analyseer mijn Spotify data voor waardevolle vinyl tips",
      "Welke genres stream ik meer dan ik verzamel?",
      "Toon me mijn meest complete artist coverage (Spotify + fysiek)",
      // Playlist & Luistergedrag
      "Welke van mijn Spotify playlists hebben de meeste vinyl potentieel?",
      "Analyseer mijn recent played tracks voor nieuwe collectie ideeën",
      "Welke Spotify albums luister ik het vaakst maar mis ik fysiek?",
      "Toon me mijn Spotify repeat tracks vs mijn meest gedraaide vinyl",
      "Welke Spotify saved tracks zou ik moeten upgraden naar vinyl?",
      // Temporeel & Seizoensgebonden
      "Vergelijk mijn winter Spotify gedrag met mijn warme vinyl selectie",
      "Welke Spotify tracks speel ik 's ochtends vs mijn vinyl keuzes?",
      "Analyseer mijn Spotify workout playlist vs energieke albums in collectie",
      "Welke late night Spotify tracks ontbreken in mijn vinyl collectie?",
      // Artist Discovery & Trends
      "Welke nieuwe Spotify artiesten hebben vergelijkbare albums in mijn collectie?",
      "Toon me Spotify artists die ik net ontdek vs mijn verzamelgeschiedenis",
      "Welke Spotify collaborations leiden tot interessante vinyl uitgaven?",
      "Analyseer mijn Spotify monthly wrapped vs mijn jaarlijkse vinyl aankopen",
      // Technische Analyse
      "Vergelijk audio kwaliteit: mijn meest gespeelde Spotify vs vinyl versies",
      "Welke Spotify tracks zijn beter op vinyl dan digitaal?",
      "Analyseer mijn Spotify skip rate vs vinyl play-through albums",
      "Welke Spotify EQ preferences passen bij mijn vinyl setup?",
      // Social & Discovery
      "Welke vrienden op Spotify hebben albums die ik ook fysiek heb?",
      "Analyseer mijn Spotify shared playlists voor collectie overlap",
      "Welke Spotify discover weekly hits zijn nu vinyl geworden?",
      "Toon me Spotify concert attendance vs albums in mijn collectie"
    ];

    // Combine questions and shuffle
    const allQuestions = [...physicalQuestions, ...spotifyQuestions];
    
    // Shuffle en return 5 random questions
    const shuffled = allQuestions.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 5);
  };

  const [suggestedQuestions, setSuggestedQuestions] = useState(() => getRandomSuggestedQuestions());

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header with clean spacing */}
          <div className="text-center mb-12 space-y-6">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl border border-primary/20 shadow-lg backdrop-blur-sm">
                <Brain className="w-12 h-12 text-primary" />
              </div>
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-primary">
                Begin een gesprek 💬
              </h1>
              <p className="text-muted-foreground text-base max-w-md mx-auto">
                🎯 Stel een vraag over je collectie of klik op een suggestie hieronder
              </p>
            </div>
          </div>

          {/* Quick Stats with enhanced styling */}
          {analysisData && analysisData.success && (
            <Card className="mb-6 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-primary/20 shadow-lg animate-scale-in">
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-4 justify-center">
                  <Badge variant="outline" className="px-4 py-2 bg-primary/10 border-primary/30 text-primary font-medium hover-scale">
                    <Music className="w-4 h-4 mr-2" />
                    Collection Chat Klaar ✨
                  </Badge>
                  <Badge variant="outline" className="px-4 py-2 bg-secondary/10 border-secondary/30 text-secondary font-medium hover-scale">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    AI Analyse Beschikbaar 🧠
                  </Badge>
                  {spotifyConnected && (
                    <Badge variant="outline" className="px-4 py-2 bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400 font-medium hover-scale">
                      <Headphones className="w-4 h-4 mr-2" />
                      Spotify Geïntegreerd 🎧
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Chat Interface with enhanced styling */}
          <Card className="h-[600px] flex flex-col bg-gradient-to-b from-card to-card/50 shadow-2xl border border-primary/20 animate-fade-in">
            <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-secondary/5">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg">
                    <MessageCircle className="w-5 h-5 text-primary" />
                  </div>
                  <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Chat</span>
                </CardTitle>
                <Button 
                  onClick={startAnalysis} 
                  disabled={isLoading} 
                  variant="outline" 
                  size="sm"
                  className="bg-gradient-to-r from-primary/10 to-secondary/10 hover:from-primary/20 hover:to-secondary/20 border-primary/30 hover-scale"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  Start AI Analyse 🚀
                </Button>
              </div>
            </CardHeader>
            
            <Separator />
            
            <CardContent className="flex-1 flex flex-col p-0">
              <ScrollArea className="flex-1 p-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8 space-y-6">
                    <div className="space-y-4 max-w-lg mx-auto">
                      {suggestedQuestions.map((question, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          className="w-full text-left justify-start h-auto p-4 text-wrap bg-muted/30 hover:bg-muted/50 border border-border/50 rounded-2xl transition-all duration-200 shadow-sm hover:shadow-md"
                          onClick={async () => {
                            // Check AI chat usage limit before sending
                            try {
                              const usageCheck = await checkUsageLimit('ai_chat');
                              if (!usageCheck.can_use) {
                                setUsageInfo({
                                  current: usageCheck.current_usage,
                                  limit: usageCheck.limit_amount || 0,
                                  plan: usageCheck.plan_name
                                });
                                setUpgradeReason('usage_limit');
                                setShowUpgradePrompt(true);
                                return;
                              }
                            } catch (error) {
                              console.error('Failed to check usage limit:', error);
                              return;
                            }
                            
                            setInput(question);
                            
                            const userMessage: ChatMessage = {
                              id: crypto.randomUUID(),
                              message: question,
                              sender_type: 'user',
                              created_at: new Date().toISOString()
                            };

                            setMessages(prev => [...prev, userMessage]);
                            setInput('');
                            setIsLoading(true);

                            try {
                              await supabase.functions.invoke('collection-chat', {
                                body: {
                                  message: question,
                                  session_id: sessionId
                                }
                              });

                              // Increment usage after successful response
                              try {
                                await incrementUsage('ai_chat', 1);
                              } catch (error) {
                                console.error('Failed to increment usage:', error);
                              }

                              await loadMessages();
                              setSuggestedQuestions(getRandomSuggestedQuestions());
                            } catch (error) {
                              console.error('Error sending message:', error);
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
                          }}
                        >
                          <span className="text-sm font-medium">💡 {question}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map(renderMessage)}
                    {isLoading && (
                      <div className="flex justify-start mb-4 animate-fade-in">
                        <div className="max-w-[85%] sm:max-w-[75%] md:max-w-[70%] lg:max-w-[65%] bg-gradient-to-br from-primary/10 to-secondary/10 p-4 rounded-2xl border border-primary/20 shadow-lg">
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            <span className="text-sm text-muted-foreground">AI denkt na... 🤔</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Show suggested questions after messages with enhanced styling */}
                    {messages.length > 0 && !isLoading && (
                      <div className="mt-6 p-6 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 rounded-2xl border border-primary/20 shadow-lg animate-fade-in">
                        <h4 className="text-base font-semibold mb-4 text-primary flex items-center gap-2">
                          💡 Nieuwe vragen die je kunt stellen:
                        </h4>
                        <div className="space-y-3">
                          {suggestedQuestions.map((question, index) => (
                            <Button
                              key={index}
                              variant="ghost"
                              size="sm"
                              className="w-full text-left justify-start h-auto p-3 text-wrap bg-gradient-to-r from-primary/5 to-secondary/5 hover:from-primary/10 hover:to-secondary/10 border border-primary/10 rounded-xl hover-scale transition-all duration-300"
                              onClick={async () => {
                                // Check AI chat usage limit before sending
                                try {
                                  const usageCheck = await checkUsageLimit('ai_chat');
                                  if (!usageCheck.can_use) {
                                    setUsageInfo({
                                      current: usageCheck.current_usage,
                                      limit: usageCheck.limit_amount || 0,
                                      plan: usageCheck.plan_name
                                    });
                                    setUpgradeReason('usage_limit');
                                    setShowUpgradePrompt(true);
                                    return;
                                  }
                                } catch (error) {
                                  console.error('Failed to check usage limit:', error);
                                  return;
                                }
                                
                                setInput(question);
                                
                                const userMessage: ChatMessage = {
                                  id: crypto.randomUUID(),
                                  message: question,
                                  sender_type: 'user',
                                  created_at: new Date().toISOString()
                                };

                                setMessages(prev => [...prev, userMessage]);
                                setInput('');
                                setIsLoading(true);

                                try {
                                  await supabase.functions.invoke('collection-chat', {
                                    body: {
                                      message: question,
                                      session_id: sessionId
                                    }
                                  });

                                  // Increment usage after successful response
                                  try {
                                    await incrementUsage('ai_chat', 1);
                                  } catch (error) {
                                    console.error('Failed to increment usage:', error);
                                  }

                                  await loadMessages();
                                  setSuggestedQuestions(getRandomSuggestedQuestions());
                                } catch (error) {
                                  console.error('Error sending message:', error);
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
                              }}
                            >
                              <span className="text-sm">🔍 {question}</span>
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
        
        {/* Upgrade Prompt */}
        <UpgradePrompt
          isOpen={showUpgradePrompt}
          onClose={() => setShowUpgradePrompt(false)}
          reason={upgradeReason}
          currentPlan={usageInfo?.plan || 'free'}
          usageInfo={usageInfo}
        />
      </div>
    </div>
  );
};

export default CollectionChat;