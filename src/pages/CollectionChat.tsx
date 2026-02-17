import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageCircle, Send, Brain, Music, TrendingUp, Headphones, Sparkles, Disc3, BarChart3, ListMusic, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCollectionAIAnalysis } from '@/hooks/useCollectionAIAnalysis';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { useUsageTracking } from '@/hooks/useUsageTracking';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { toast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';

interface ChatMessage {
  id: string;
  message: string;
  sender_type: 'user' | 'ai';
  created_at: string;
  format_type?: string;
  tokens_used?: number;
  response_time_ms?: number;
}

// Typing indicator with bounce animation
const TypingIndicator = () => (
  <div className="flex items-end gap-3 mb-4 animate-fade-in">
    <Avatar className="h-8 w-8 ring-2 ring-amber-400/50 shadow-lg">
      <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-white text-xs">
        <Brain className="h-4 w-4" />
      </AvatarFallback>
    </Avatar>
    <div className="bg-card/80 backdrop-blur-sm border border-primary/15 rounded-2xl rounded-bl-md px-5 py-3 shadow-md">
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  </div>
);

// Suggestion category icons (labels come from translations)
const categoryIcons = [
  { key: 'catValue', icon: TrendingUp, emoji: '💰' },
  { key: 'catTaste', icon: Disc3, emoji: '🎵' },
  { key: 'catAnalysis', icon: BarChart3, emoji: '📊' },
  { key: 'catSpotify', icon: Headphones, emoji: '🎧' },
  { key: 'catDiscover', icon: Sparkles, emoji: '✨' },
  { key: 'catCollection', icon: ListMusic, emoji: '📀' },
];

const CollectionChat = () => {
  const navigate = useNavigate();
  const { tr } = useLanguage();
  const cc = tr.collectionChatPage as any;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { data: analysisData } = useCollectionAIAnalysis();
  const { checkUsageLimit, incrementUsage } = useUsageTracking();
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<'usage_limit' | 'feature_limit'>('usage_limit');
  const [usageInfo, setUsageInfo] = useState<{current: number, limit: number, plan: string} | undefined>();
  const [spotifyConnected, setSpotifyConnected] = useState(false);

  const suggestionCategories = categoryIcons.map(c => ({
    label: cc[c.key] || c.key,
    icon: c.icon,
    emoji: c.emoji,
  }));

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    loadMessages();
    checkSpotifyStatus();
  }, []);

  const checkSpotifyStatus = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('spotify_connected')
        .single();
      if (data) setSpotifyConnected(data.spotify_connected || false);
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
    if (data) setMessages(data as ChatMessage[]);
  };

  // Shared handler for sending a question (used by input, suggestions, and analysis)
  const handleSendQuestion = async (question: string) => {
    if (!question.trim()) return;

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
      message: question,
      sender_type: 'user',
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { error } = await supabase.functions.invoke('collection-chat', {
        body: { message: question, session_id: sessionId }
      });
      if (error) throw error;

      try { await incrementUsage('ai_chat', 1); } catch {}
      await loadMessages();
      setSuggestedQuestions(getRandomSuggestedQuestions());
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        message: cc.errorMessage,
        sender_type: 'ai',
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = () => handleSendQuestion(input);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startAnalysis = () => {
    handleSendQuestion(cc.analysisPrompt);
  };

  const categorizeQuestion = (question: string): typeof suggestionCategories[0] => {
    const q = question.toLowerCase();
    if (q.includes('waarde') || q.includes('value') || q.includes('prijs') || q.includes('price') || q.includes('investeer') || q.includes('investment') || q.includes('gestegen') || q.includes('risen')) return suggestionCategories[0];
    if (q.includes('smaak') || q.includes('taste') || q.includes('genre') || q.includes('emotion') || q.includes('mood')) return suggestionCategories[1];
    if (q.includes('analys') || q.includes('vergelijk') || q.includes('compare') || q.includes('statistiek') || q.includes('condition')) return suggestionCategories[2];
    if (q.includes('spotify') || q.includes('stream') || q.includes('playlist')) return suggestionCategories[3];
    if (q.includes('ontbre') || q.includes('missing') || q.includes('sugger') || q.includes('suggest') || q.includes('aanbevel') || q.includes('ontdek') || q.includes('discover') || q.includes('complement')) return suggestionCategories[4];
    return suggestionCategories[5];
  };

  const renderMessage = (msg: ChatMessage) => {
    const isUser = msg.sender_type === 'user';
    const timestamp = format(new Date(msg.created_at), 'HH:mm');

    return (
      <div key={msg.id} className={`flex items-end gap-3 mb-4 animate-fade-in ${isUser ? 'flex-row-reverse' : ''}`}>
        {/* Avatar */}
        {isUser ? (
          <Avatar className="h-8 w-8 ring-2 ring-primary/30 shadow-md">
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xs font-bold">
              {cc.you}
            </AvatarFallback>
          </Avatar>
        ) : (
          <Avatar className="h-8 w-8 ring-2 ring-amber-400/50 shadow-lg">
            <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-white text-xs">
              <Brain className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        )}

        {/* Message Bubble */}
        <div className={`max-w-[80%] sm:max-w-[72%] md:max-w-[68%] ${
          isUser
            ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-2xl rounded-br-md shadow-lg shadow-primary/20'
            : 'bg-card/80 backdrop-blur-sm border border-primary/15 rounded-2xl rounded-bl-md shadow-md'
        } px-4 py-3`}>
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.message}</p>
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1.5 prose-p:leading-relaxed prose-headings:my-2 prose-headings:text-primary prose-li:my-0.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-strong:text-primary prose-strong:font-semibold text-sm">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {msg.message}
              </ReactMarkdown>
            </div>
          )}
          <div className={`flex items-center gap-2 text-xs mt-2 pt-1.5 border-t ${isUser ? 'border-primary-foreground/15 text-primary-foreground/60' : 'border-primary/10 text-muted-foreground'}`}>
            <span>{timestamp}</span>
            {msg.tokens_used && (
              <span className="opacity-60">• {msg.tokens_used} tokens</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const getRandomSuggestedQuestions = () => {
    const physicalQuestions = [
      cc.qMostValuable, cc.qGenresDominate, cc.qInvestment,
      cc.qMissingArtists, cc.qAnalyzeTaste, cc.qHiddenGems,
      cc.qRisenValue, cc.qCompare, cc.qRarest,
      cc.qBestYears, cc.qSuggestAlbums, cc.qAverageValue,
      cc.qDominantLabels, cc.qCondition, cc.qMustKeep,
      cc.qTrends, cc.qMaintenanceTips, cc.qPotential,
    ];

    const spotifyQuestions = [
      cc.qSpotifyCompare, cc.qSpotifyMissing, cc.qSpotifyOverlap,
      cc.qSpotifyDiff, cc.qSpotifyBuy, cc.qSpotifyGenres,
    ];

    const allQuestions = [...physicalQuestions, ...spotifyQuestions];
    const shuffled = allQuestions.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 6);
  };

  const [suggestedQuestions, setSuggestedQuestions] = useState(() => getRandomSuggestedQuestions());

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">

          {/* Chat Interface */}
          <Card className="h-[calc(100vh-8rem)] flex flex-col bg-gradient-to-b from-card to-card/50 shadow-2xl border border-primary/20 overflow-hidden">
            {/* Chat Header */}
            <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-secondary/5 flex-shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="h-8 w-8">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Avatar className="h-9 w-9 ring-2 ring-amber-400/50">
                    <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                      <Brain className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent text-lg">Magic Mike</span>
                    <p className="text-xs text-muted-foreground font-normal">{cc.yourExpert}</p>
                  </div>
                </CardTitle>
                <div className="flex items-center gap-2">
                  {spotifyConnected && (
                    <Badge variant="outline" className="bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400 text-xs">
                      <Headphones className="w-3 h-3 mr-1" /> Spotify
                    </Badge>
                  )}
                  <Button 
                    onClick={startAnalysis} 
                    disabled={isLoading} 
                    variant="outline" 
                    size="sm"
                    className="bg-gradient-to-r from-primary/10 to-secondary/10 hover:from-primary/20 hover:to-secondary/20 border-primary/30"
                  >
                    <Brain className="w-4 h-4 mr-1" />
                    {cc.analysis}
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <Separator />
            
            <CardContent className="flex-1 flex flex-col p-0 min-h-0">
              <ScrollArea className="flex-1 p-4">
                {messages.length === 0 ? (
                  /* Welcome Screen */
                  <div className="flex flex-col items-center justify-center py-4 space-y-4 animate-fade-in">

                    <div className="text-center space-y-1 max-w-md">
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        Hey! 👋
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        {cc.welcome}
                      </p>
                    </div>

                    {/* Suggestion Grid - 2 columns */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                      {suggestedQuestions.map((question, index) => {
                        const category = categorizeQuestion(question);
                        return (
                          <button
                            key={index}
                            onClick={() => handleSendQuestion(question)}
                            disabled={isLoading}
                            className="group text-left p-3.5 rounded-xl border border-primary/15 bg-card/60 backdrop-blur-sm hover:bg-primary/10 hover:border-primary/30 hover:shadow-md transition-all duration-200 disabled:opacity-50"
                          >
                            <div className="flex items-center gap-2 mb-1.5">
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-primary/20 bg-primary/5 text-primary font-medium">
                                {category.emoji} {category.label}
                              </Badge>
                            </div>
                            <span className="text-sm text-foreground/80 group-hover:text-foreground line-clamp-2 leading-snug">
                              {question}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {messages.map(renderMessage)}
                    {isLoading && <TypingIndicator />}
                    
                    {/* Suggested questions after conversation */}
                    {messages.length > 0 && !isLoading && (
                      <div className="mt-6 pt-4 border-t border-primary/10">
                        <p className="text-xs text-muted-foreground mb-3 font-medium">{cc.followUp}</p>
                        <div className="flex flex-wrap gap-2">
                          {suggestedQuestions.slice(0, 3).map((question, index) => (
                            <button
                              key={index}
                              onClick={() => handleSendQuestion(question)}
                              disabled={isLoading}
                              className="text-xs px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 hover:bg-primary/15 text-foreground/70 hover:text-foreground transition-all duration-200 disabled:opacity-50"
                            >
                              {question}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </ScrollArea>
              
              {/* Enhanced Input Bar */}
              <div className="p-3 border-t bg-card/80 backdrop-blur-sm flex-shrink-0">
                <div className="flex items-end gap-2">
                  <div className="flex-1 relative">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={cc.placeholder}
                      disabled={isLoading}
                      rows={1}
                      className="w-full resize-none rounded-2xl border border-primary/20 bg-background/80 px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/40 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px] max-h-32"
                      style={{ overflow: 'hidden' }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = Math.min(target.scrollHeight, 128) + 'px';
                      }}
                    />
                  </div>
                  <Button 
                    onClick={sendMessage} 
                    disabled={!input.trim() || isLoading}
                    size="icon"
                    className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/25 transition-all duration-200 disabled:opacity-40 disabled:shadow-none flex-shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
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
