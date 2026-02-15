import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import magicMikeAvatar from '@/assets/magic-mike-avatar.png';
import { getDeviceFingerprint } from '@/utils/deviceFingerprint';

const SUPABASE_URL = "https://ssxbpyqnjfiyubsuonar.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeGJweXFuamZpeXVic3VvbmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDgyNTMsImV4cCI6MjA2MTY4NDI1M30.UFZKmrN-gz4VUUlKmVfwocS5OQuxGm4ATYltBJn3Kq4";

// Generate a deterministic UUID-like string for the floating session
// Uses user.id directly as session_id (which is already a UUID from Supabase auth)
const getFloatingSessionId = (userId?: string): string => {
  if (userId) return userId;
  // For non-logged-in users, use a localStorage-persisted UUID
  const key = 'floating-mike-session-uuid';
  let stored = localStorage.getItem(key);
  if (!stored) {
    stored = crypto.randomUUID();
    localStorage.setItem(key, stored);
  }
  return stored;
};

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  id?: string; // DB id for persisted messages
}

// Map routes to context descriptions for Magic Mike
const getPageContext = (pathname: string): string => {
  if (pathname.startsWith('/collection-overview')) return 'De gebruiker bekijkt zijn collectie-overzicht. Je kunt helpen met collectiewaarde, statistieken, en aanbevelingen.';
  if (pathname.startsWith('/dashboard')) return 'De gebruiker is op het dashboard. Je kunt helpen met een overzicht van recente activiteit.';
  if (pathname.startsWith('/my-collection')) return 'De gebruiker bekijkt zijn persoonlijke collectie. Help met informatie over specifieke albums.';
  if (pathname.startsWith('/collection-chat')) return 'De gebruiker is in de collectie-chat.';
  if (pathname.startsWith('/shop') || pathname.startsWith('/product')) return 'De gebruiker browst door de shop. Help met productinfo en aanbevelingen.';
  if (pathname.startsWith('/artists')) return 'De gebruiker bekijkt artiestenpagina\'s. Deel interessante feiten over artiesten.';
  if (pathname.startsWith('/singles')) return 'De gebruiker bekijkt singles. Deel verhalen achter de nummers.';
  if (pathname.startsWith('/muziek-verhaal') || pathname.startsWith('/plaat-verhaal')) return 'De gebruiker leest een albumverhaal. Verdiep het gesprek over dit album.';
  if (pathname.startsWith('/quizzen') || pathname.startsWith('/quiz')) return 'De gebruiker speelt quizzen. Moedig aan en deel leuke muziekweetjes.';
  if (pathname.startsWith('/nieuws')) return 'De gebruiker leest muzieknieuws.';
  if (pathname.startsWith('/nederland')) return 'De gebruiker bekijkt Nederlandse muziek. Focus op Nederlandse artiesten en hits.';
  if (pathname.startsWith('/frankrijk')) return 'De gebruiker bekijkt Franse muziek.';
  if (pathname.startsWith('/dance-house')) return 'De gebruiker bekijkt Dance & House muziek.';
  if (pathname === '/') return 'De gebruiker is op de homepage van MusicScan.';
  return '';
};

const getWelcomeMessage = (pathname: string, hasHistory: boolean): string => {
  if (hasHistory) {
    return '🎩 **Welkom terug!** Ik heb ons vorige gesprek nog paraat. Waar waren we gebleven, of heb je een nieuwe vraag?';
  }
  if (pathname.startsWith('/collection-overview')) 
    return '🎩 **Hey!** Ik ben Magic Mike. Ik zie dat je je collectie bekijkt — wil je weten wat je verzameling waard is, of heb je een vraag over een specifiek album?';
  if (pathname.startsWith('/dashboard'))
    return '🎩 **Welkom terug!** Ik ben Magic Mike. Heb je een vraag over je collectie of wil je muziekadvies?';
  if (pathname.startsWith('/shop') || pathname.startsWith('/product'))
    return '🎩 **Hey!** Magic Mike hier. Kan ik je helpen met een product, of wil je meer weten over een artiest?';
  if (pathname.startsWith('/artists'))
    return '🎩 **Hey!** Ik ben Magic Mike. Wil je meer weten over een artiest? Vraag maar raak!';
  return '🎩 **Hey, ik ben Magic Mike!** Je persoonlijke muziek-detective. Vraag me alles over muziek, artiesten, albums of je collectie!';
};

// Hidden routes where the floating chat should not appear
const HIDDEN_ROUTES = ['/ai-scan-v2', '/auth', '/auth/set-password', '/set-password'];

// Save a message to the database
async function persistMessage(userId: string, content: string, senderType: 'user' | 'assistant', sessionId: string) {
  try {
    const { error } = await supabase.from('chat_messages').insert({
      user_id: userId,
      message: content,
      sender_type: senderType,
      session_id: sessionId,
    });
    if (error) {
      console.error('[floating-mike] DB error persisting message:', error.message, { senderType, sessionId });
    }
  } catch (err) {
    console.error('[floating-mike] Failed to persist message:', err);
  }
}

// Load recent conversation history from DB
async function loadHistory(userId: string, sessionId: string, limit = 50): Promise<ChatMessage[]> {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('id, message, sender_type, created_at')
      .eq('user_id', userId)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(limit);
    
    if (error) throw error;
    if (!data || data.length === 0) return [];

    return data.map(row => ({
      id: row.id,
      role: (row.sender_type === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: row.message,
    }));
  } catch (err) {
    console.error('[floating-mike] Failed to load history:', err);
    return [];
  }
}

// Clear conversation history
async function clearHistory(userId: string, sessionId: string) {
  try {
    await supabase
      .from('chat_messages')
      .delete()
      .eq('user_id', userId)
      .eq('session_id', sessionId);
  } catch (err) {
    console.error('[floating-mike] Failed to clear history:', err);
  }
}

export function FloatingMikeChat() {
  const { user } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Hide on certain routes
  const shouldHide = HIDDEN_ROUTES.some(r => location.pathname.startsWith(r));

  // Compute session ID based on user
  const sessionId = getFloatingSessionId(user?.id);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Initialize: load history on first open
  const handleOpen = useCallback(async () => {
    setIsOpen(true);
    setTimeout(() => textareaRef.current?.focus(), 300);

    if (hasInitialized) return;
    setHasInitialized(true);

    if (!user?.id) {
      setMessages([{ role: 'assistant', content: getWelcomeMessage(location.pathname, false) }]);
      return;
    }

    setIsLoading(true);
    try {
      const history = await loadHistory(user.id, sessionId);
      if (history.length > 0) {
        // Prepend a welcome-back message + loaded history
        setMessages([
          { role: 'assistant', content: getWelcomeMessage(location.pathname, true) },
          ...history,
        ]);
      } else {
        setMessages([{ role: 'assistant', content: getWelcomeMessage(location.pathname, false) }]);
      }
    } catch {
      setMessages([{ role: 'assistant', content: getWelcomeMessage(location.pathname, false) }]);
    } finally {
      setIsLoading(false);
    }
  }, [hasInitialized, user?.id, location.pathname]);

  // Listen for external open requests (e.g. from Quick Actions Chat button)
  useEffect(() => {
    const handler = () => handleOpen();
    window.addEventListener('open-magic-mike', handler);
    return () => window.removeEventListener('open-magic-mike', handler);
  }, [handleOpen]);

  const handleClearHistory = useCallback(async () => {
    if (!user?.id) return;
    await clearHistory(user.id, sessionId);
    setMessages([{ role: 'assistant', content: '🎩 **Nieuw gesprek gestart!** Wat kan ik voor je doen?' }]);
  }, [user?.id]);

  // Fetch collection summary for context
  const fetchCollectionSummary = useCallback(async (): Promise<string | null> => {
    if (!user?.id) return null;
    try {
      // Query actual tables instead of non-existent unified_scans view
      const [cdCountRes, vinylCountRes, aiCountRes, cdItemsRes, vinylItemsRes, aiItemsRes] = await Promise.all([
        supabase.from('cd_scan').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('vinyl2_scan').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('ai_scan_results').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('cd_scan').select('artist, title, genre, year, calculated_advice_price').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
        supabase.from('vinyl2_scan').select('artist, title, genre, year, calculated_advice_price').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
        supabase.from('ai_scan_results').select('artist, title, genre, year').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
      ]);

      const cdCount = cdCountRes.count || 0;
      const vinylCount = vinylCountRes.count || 0;
      const aiCount = aiCountRes.count || 0;
      const total = cdCount + vinylCount + aiCount;
      if (total === 0) return null;

      const allItems = [
        ...(cdItemsRes.data || []).map(i => ({ ...i, media_type: 'CD' })),
        ...(vinylItemsRes.data || []).map(i => ({ ...i, media_type: 'Vinyl' })),
        ...(aiItemsRes.data || []).map(i => ({ ...i, media_type: 'AI-scan', calculated_advice_price: null as number | null })),
      ];
      const totalValue = allItems.reduce((sum, item) => sum + (item.calculated_advice_price || 0), 0);

      const artistCounts: Record<string, number> = {};
      const genres: Record<string, number> = {};
      allItems.forEach(item => {
        if (item.artist) artistCounts[item.artist] = (artistCounts[item.artist] || 0) + 1;
        if (item.genre) genres[item.genre] = (genres[item.genre] || 0) + 1;
      });
      const topArtists = Object.entries(artistCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count]) => `${name} (${count}x)`).join(', ');
      const topGenres = Object.entries(genres).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name]) => name).join(', ');

      const recentItems = allItems.slice(0, 10).map(i => 
        `- ${i.artist || '?'} — ${i.title || '?'} (${i.media_type}, ${i.year || '?'})${i.calculated_advice_price ? ` €${Number(i.calculated_advice_price).toFixed(2)}` : ''}`
      ).join('\n') || '';

      return `[COLLECTIE_CONTEXT]
Totaal: ${total} items (${cdCount} CD's, ${vinylCount} vinyl, ${aiCount} AI-scans)
Geschatte totaalwaarde: €${totalValue.toFixed(2)}
Top artiesten: ${topArtists || 'Geen data'}
Top genres: ${topGenres || 'Geen data'}

Laatste 10 items:
${recentItems}
[/COLLECTIE_CONTEXT]`;
    } catch (err) {
      console.error('[floating-mike] Failed to fetch collection summary:', err);
      return null;
    }
  }, [user?.id]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsStreaming(true);

    // Persist user message
    if (user?.id) {
      persistMessage(user.id, text, 'user', sessionId);
    }

    let assistantSoFar = '';
    let responsePersisted = false;
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        const msgData: ChatMessage = { role: 'assistant', content: assistantSoFar };
        if (last?.role === 'assistant' && !last.id) {
          return prev.map((m, i) => (i === prev.length - 1 ? msgData : m));
        }
        return [...prev, msgData];
      });
    };

    try {
      const pageContext = getPageContext(location.pathname);
      const contextPrefix = pageContext ? `[PAGE_CONTEXT: ${pageContext}]\n\n` : '';
      
      // Fetch collection context for logged-in users
      const collectionContext = await fetchCollectionSummary();
      const collectionPrefix = collectionContext ? `${collectionContext}\n\n` : '';
      
      const effectiveContent = collectionPrefix + contextPrefix + text;

      // Build message history for AI — include recent conversation
      const recentMessages = messages.slice(-20); // Last 20 messages for context
      const allMessages = [...recentMessages, { role: 'user' as const, content: effectiveContent }];

      // Use user's JWT if available, otherwise fall back to anon key
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token || SUPABASE_ANON_KEY;

      const resp = await fetch(`${SUPABASE_URL}/functions/v1/scan-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
          'x-device-fingerprint': getDeviceFingerprint(),
        },
        body: JSON.stringify({
          messages: allMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({ error: 'Onbekende fout' }));
        throw new Error(errData.error || `HTTP ${resp.status}`);
      }
      if (!resp.body) throw new Error('Geen stream');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf('\n')) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '' || !line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (json === '[DONE]') break;
          try {
            const p = JSON.parse(json);
            const c = p.choices?.[0]?.delta?.content;
            if (c) upsertAssistant(c);
          } catch {
            buf = line + '\n' + buf;
            break;
          }
        }
      }
      // Process remaining buffer
      for (const raw of buf.split('\n')) {
        if (!raw || !raw.startsWith('data: ')) continue;
        const j = raw.slice(6).trim();
        if (j === '[DONE]') continue;
        try { const p = JSON.parse(j); const c = p.choices?.[0]?.delta?.content; if (c) upsertAssistant(c); } catch {}
      }

      // Persist assistant response
      if (user?.id && assistantSoFar) {
        await persistMessage(user.id, assistantSoFar, 'assistant', sessionId);
        responsePersisted = true;
      }
    } catch (err) {
      console.error('[floating-mike] Error:', err);
      const errorMsg = `⚠️ Er ging iets mis. ${err instanceof Error ? err.message : 'Probeer het later opnieuw.'}`;
      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
    } finally {
      // Safety net: persist partial response if not already done
      if (!responsePersisted && user?.id && assistantSoFar) {
        persistMessage(user.id, assistantSoFar, 'assistant', sessionId);
      }
      setIsStreaming(false);
    }
  }, [messages, isStreaming, location.pathname, user?.id, fetchCollectionSummary]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  if (shouldHide) return null;

  return (
    <>
      {/* Floating bubble */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            onClick={handleOpen}
            className="fixed bottom-20 md:bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-shadow cursor-pointer bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center ring-2 ring-purple-400/30"
            aria-label="Open Magic Mike Chat"
          >
            <img
              src={magicMikeAvatar}
              alt="Magic Mike"
              className="w-10 h-10 rounded-full object-cover object-top"
            />
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full animate-ping bg-purple-500/20 pointer-events-none" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-20 md:bottom-6 right-6 z-50 w-[380px] md:w-[520px] lg:w-[600px] max-w-[calc(100vw-2rem)] h-[520px] md:h-[680px] lg:h-[720px] max-h-[calc(100vh-6rem)] rounded-2xl overflow-hidden flex flex-col shadow-2xl border border-border/50 bg-background/95 backdrop-blur-xl"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-purple-600/90 to-purple-800/90 text-white">
              <img
                src={magicMikeAvatar}
                alt="Magic Mike"
                className="w-9 h-9 rounded-full object-cover object-top ring-2 ring-white/30"
              />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">Magic Mike 🎩</div>
                <div className="text-xs text-white/70">Muziek-detective</div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
                onClick={handleClearHistory}
                title="Nieuw gesprek starten"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-black hover:text-black hover:bg-black/10"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Gesprek laden...</span>
                </div>
              ) : (
                <>
                  {messages.map((msg, i) => (
                    <div key={msg.id || i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'assistant' && (
                        <img src={magicMikeAvatar} alt="" className="w-7 h-7 rounded-full object-cover object-top flex-shrink-0 mt-1" />
                      )}
                      <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : 'bg-muted/60 backdrop-blur-sm rounded-bl-sm'
                      }`}>
                        {msg.role === 'assistant' ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-1.5 [&>p:last-child]:mb-0">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
                    <div className="flex gap-2 justify-start">
                      <img src={magicMikeAvatar} alt="" className="w-7 h-7 rounded-full object-cover object-top flex-shrink-0 mt-1" />
                      <div className="bg-muted/60 rounded-xl px-3 py-2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-border/50 px-3 py-2 bg-background/80">
              <div className="flex items-end gap-2">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Stel een vraag aan Mike..."
                  className="min-h-[40px] max-h-[100px] resize-none text-sm border-0 bg-muted/40 focus-visible:ring-1 focus-visible:ring-purple-500/50 rounded-lg"
                  rows={1}
                  disabled={isStreaming}
                />
                <Button
                  size="icon"
                  className="h-9 w-9 rounded-lg bg-purple-600 hover:bg-purple-700 flex-shrink-0"
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isStreaming}
                >
                  {isStreaming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
