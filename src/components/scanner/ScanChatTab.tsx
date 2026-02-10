import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Send, Loader2, Disc3, Disc, RotateCcw, Camera, X, ImagePlus, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import magicMikeAvatar from '@/assets/magic-mike-avatar.png';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  images?: string[];
  scanData?: ScanData | null;
  pricingData?: PricingData | null;
  v2Result?: V2PipelineResult | null;
}

interface ScanData {
  barcode?: string | null;
  catno?: string | null;
  matrix?: string | null;
  rights_societies?: string[] | null;
}

interface V2PipelineResult {
  discogs_id?: number | null;
  status: string;
  confidence_score?: number | null;
  artist?: string;
  title?: string;
  artwork_url?: string;
  country?: string;
  year?: number;
  suggestions?: V2Suggestion[];
  rights_society_exclusions?: string[];
  audit_entries?: string[];
}

interface V2Suggestion {
  release_id: number;
  title: string;
  score: number;
  country?: string;
  year?: number;
  reason: string[];
}

interface PricingData {
  lowest_price: number | null;
  median_price: number | null;
  highest_price: number | null;
  num_for_sale: number | null;
}

const SUPABASE_URL = "https://ssxbpyqnjfiyubsuonar.supabase.co";

// Extract [[SCAN_DATA:{...}]] from message text
const extractScanData = (text: string): ScanData | null => {
  const match = text.match(/\[\[SCAN_DATA:(.*?)\]\]/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
};

// Remove hidden tags from display text
const cleanDisplayText = (text: string): string => {
  return text
    .replace(/\[\[SCAN_DATA:.*?\]\]/g, '')
    .trim();
};

export function ScanChatTab() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `🎩 **Hey, ik ben Magic Mike!** Je persoonlijke muziek-detective.\n\nWil je iets weten over een **CD** of **LP**?\n\nKies hieronder wat je hebt 👇`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRunningV2, setIsRunningV2] = useState(false);

  const [mediaType, setMediaType] = useState<'vinyl' | 'cd' | ''>('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, pendingFiles]);

  const pickMediaType = (type: 'vinyl' | 'cd') => {
    setMediaType(type);
    const label = type === 'vinyl' ? 'vinyl plaat' : 'CD';
    setMessages(prev => [
      ...prev,
      { role: 'user', content: type === 'vinyl' ? '🎵 Vinyl' : '💿 CD' },
      {
        role: 'assistant',
        content: `Top, een ${label}! 📸\n\nUpload je foto's — hoe meer hoe beter! Voorkant, achterkant, label, matrix... Alles helpt.\n\nKlik op het 📷 icoon hieronder om foto's te selecteren.`,
      },
    ]);
  };

  const handleFilesSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/') && f.size <= 10 * 1024 * 1024);
    if (selected.length === 0) return;
    setPendingFiles(prev => [...prev, ...selected]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const removePendingFile = useCallback((index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  // ─── Run V2 Pipeline (deterministic matching) ───────────────
  const runV2Pipeline = async (urls: string[], mType: string): Promise<V2PipelineResult | null> => {
    try {
      console.log(`🔍 Running V2 pipeline with ${urls.length} photos, mediaType: ${mType}`);
      
      const { data, error } = await supabase.functions.invoke('ai-photo-analysis-v2', {
        body: {
          photoUrls: urls,
          mediaType: mType,
          conditionGrade: 'Not Graded',
          skipSave: true, // Don't save to ai_scan_results, just return the match
        }
      });

      if (error) throw error;

      return {
        discogs_id: data?.discogs_id || null,
        status: data?.status || 'no_match',
        confidence_score: data?.confidence_score || null,
        artist: data?.artist || null,
        title: data?.title || null,
        artwork_url: data?.artwork_url || null,
        country: data?.country || null,
        year: data?.year || null,
        suggestions: data?.suggestions || [],
        rights_society_exclusions: data?.rights_society_exclusions || [],
        audit_entries: data?.audit_log || [],
      };
    } catch (err) {
      console.error('V2 pipeline error:', err);
      return null;
    }
  };

  // ─── Select a specific candidate from suggestions ───────────
  const selectCandidate = async (releaseId: number) => {
    setIsRunningV2(true);
    setMessages(prev => [...prev, {
      role: 'user',
      content: `Ik kies release #${releaseId}`,
    }, {
      role: 'assistant',
      content: `🔍 **Verifiëren en prijzen ophalen** voor release #${releaseId}...`,
    }]);

    try {
      // Verify & enrich
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-and-enrich-release', {
        body: { discogs_id: releaseId }
      });
      if (verifyError) throw verifyError;

      const enrichment = verifyData?.enrichment;
      const vArtist = enrichment?.artist || '';
      const vTitle = enrichment?.title || '';

      // Fetch pricing
      const { data: pricingResp } = await supabase.functions.invoke('fetch-discogs-pricing', {
        body: { discogs_id: releaseId }
      });

      const pricing: PricingData = {
        lowest_price: pricingResp?.lowest_price || null,
        median_price: pricingResp?.median_price || null,
        highest_price: pricingResp?.highest_price || null,
        num_for_sale: pricingResp?.num_for_sale || null,
      };

      // Remove loading message
      setMessages(prev => prev.filter(m => !m.content.includes('Verifiëren en prijzen ophalen')));

      let msg = `✅ **${vArtist} - ${vTitle}**\n`;
      msg += `🔗 [Bekijk op Discogs](https://www.discogs.com/release/${releaseId})\n\n`;

      if (pricing.lowest_price || pricing.median_price || pricing.highest_price) {
        msg += `💰 **Prijsinformatie:**\n`;
        if (pricing.lowest_price) msg += `📉 **Laagste:** €${Number(pricing.lowest_price).toFixed(2)}\n`;
        if (pricing.median_price) msg += `📊 **Mediaan:** €${Number(pricing.median_price).toFixed(2)}\n`;
        if (pricing.highest_price) msg += `📈 **Hoogste:** €${Number(pricing.highest_price).toFixed(2)}\n`;
        if (pricing.num_for_sale) msg += `\n🏪 **${pricing.num_for_sale}** exemplaren te koop`;
      }

      setMessages(prev => [...prev, { role: 'assistant', content: msg, pricingData: pricing }]);
    } catch (err) {
      console.error('Select candidate error:', err);
      setMessages(prev => {
        const filtered = prev.filter(m => !m.content.includes('Verifiëren en prijzen ophalen'));
        return [...filtered, { role: 'assistant', content: '⚠️ Kon de release niet ophalen. Probeer het later opnieuw.' }];
      });
    } finally {
      setIsRunningV2(false);
    }
  };

  const uploadAndSend = async () => {
    if (pendingFiles.length === 0 || !mediaType) return;
    setIsUploading(true);

    try {
      const urls: string[] = [];
      for (const file of pendingFiles) {
        const uid = Math.random().toString(36).substring(2, 10);
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `scan-chat/${Date.now()}-${uid}-${safeName}`;
        const { error } = await supabase.storage.from('vinyl_images').upload(fileName, file, { upsert: true });
        if (error) throw new Error(`Upload mislukt: ${error.message}`);
        const { data: { publicUrl } } = supabase.storage.from('vinyl_images').getPublicUrl(fileName);
        urls.push(publicUrl);
      }

      const previews = pendingFiles.map(f => URL.createObjectURL(f));
      const allUrls = [...photoUrls, ...urls];
      setPhotoUrls(allUrls);

      const userContent = `Ik heb ${pendingFiles.length} foto's geüpload van mijn ${mediaType === 'vinyl' ? 'vinyl plaat' : 'CD'}. Analyseer deze foto's. Bevestig eerst de artiest en titel. Zoek dan naar barcode, catalogusnummer en matrix-nummer op de foto's. Let ook op rechtenorganisaties (BIEM, STEMRA, JASRAC, etc.). Geef je bevindingen.`;
      const userMsg: ChatMessage = { role: 'user', content: userContent, images: previews };

      setPendingFiles([]);
      await sendMessage(userContent, allUrls, userMsg);
    } catch (err) {
      console.error('Upload error:', err);
      toast({ title: "Upload mislukt", description: err instanceof Error ? err.message : "Fout", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  // Stream message to AI, then auto-run V2 pipeline for photo-based messages
  const sendMessage = async (text: string, urls?: string[], customUserMsg?: ChatMessage) => {
    const userMsg: ChatMessage = customUserMsg || { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsStreaming(true);

    let assistantSoFar = '';
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      const scanData = extractScanData(assistantSoFar);
      setMessages(prev => {
        const last = prev[prev.length - 1];
        const msgData: ChatMessage = {
          role: 'assistant',
          content: assistantSoFar,
          ...(scanData ? { scanData } : {}),
        };
        if (last?.role === 'assistant') {
          return prev.map((m, i) => (i === prev.length - 1 ? msgData : m));
        }
        return [...prev, msgData];
      });
    };

    try {
      const allMessages = [...messages, { role: userMsg.role, content: userMsg.content }];
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/scan-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeGJweXFuamZpeXVic3VvbmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDgyNTMsImV4cCI6MjA2MTY4NDI1M30.UFZKmrN-gz4VUUlKmVfwocS5OQuxGm4ATYltBJn3Kq4`,
        },
        body: JSON.stringify({
          messages: allMessages.map(m => ({ role: m.role, content: m.content })),
          photoUrls: urls || photoUrls,
          mediaType,
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
      for (let raw of buf.split('\n')) {
        if (!raw || !raw.startsWith('data: ')) continue;
        const j = raw.slice(6).trim();
        if (j === '[DONE]') continue;
        try { const p = JSON.parse(j); const c = p.choices?.[0]?.delta?.content; if (c) upsertAssistant(c); } catch {}
      }

      setIsStreaming(false);

      // ─── AUTO-RUN V2 PIPELINE after stream completes (only if photos were sent) ────
      const activeUrls = urls || photoUrls;
      if (activeUrls.length > 0 && mediaType) {
        setIsRunningV2(true);
        
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `🔍 **Scanner-pipeline gestart...** De deterministische matcher zoekt nu de juiste release met barcode, matrix en rechtenorganisatie-gating...`,
        }]);

        const v2Result = await runV2Pipeline(activeUrls, mediaType);

        // Remove loading message
        setMessages(prev => prev.filter(m => !m.content.includes('Scanner-pipeline gestart')));

        if (v2Result && v2Result.discogs_id && (v2Result.status === 'verified' || v2Result.status === 'likely' || v2Result.status === 'suggested_match')) {
          // ── MATCH FOUND ──
          const statusEmoji = v2Result.status === 'verified' ? '✅' : v2Result.status === 'likely' ? '🟡' : '🔵';
          const statusLabel = v2Result.status === 'verified' ? 'Geverifieerd' : v2Result.status === 'likely' ? 'Waarschijnlijk correct' : 'Voorgestelde match';

          let resultMsg = `${statusEmoji} **${statusLabel}** — **${v2Result.artist} - ${v2Result.title}**\n`;
          if (v2Result.country || v2Result.year) {
            resultMsg += `📀 ${v2Result.country || ''}${v2Result.year ? ` (${v2Result.year})` : ''}\n`;
          }
          resultMsg += `📊 Confidence: ${((v2Result.confidence_score || 0) * 100).toFixed(0)}%\n`;
          resultMsg += `🔗 [Bekijk op Discogs](https://www.discogs.com/release/${v2Result.discogs_id})\n`;

          // Show rights society exclusions
          if (v2Result.rights_society_exclusions && v2Result.rights_society_exclusions.length > 0) {
            resultMsg += `\n⛔ **Uitgesloten releases:**\n`;
            for (const excl of v2Result.rights_society_exclusions) {
              resultMsg += `- ${excl}\n`;
            }
          }

          // Fetch pricing
          const { data: pricingResp } = await supabase.functions.invoke('fetch-discogs-pricing', {
            body: { discogs_id: v2Result.discogs_id }
          });

          const pricing: PricingData = {
            lowest_price: pricingResp?.lowest_price || null,
            median_price: pricingResp?.median_price || null,
            highest_price: pricingResp?.highest_price || null,
            num_for_sale: pricingResp?.num_for_sale || null,
          };

          if (pricing.lowest_price || pricing.median_price || pricing.highest_price) {
            resultMsg += `\n💰 **Prijsinformatie:**\n`;
            if (pricing.lowest_price) resultMsg += `📉 **Laagste:** €${Number(pricing.lowest_price).toFixed(2)}\n`;
            if (pricing.median_price) resultMsg += `📊 **Mediaan:** €${Number(pricing.median_price).toFixed(2)}\n`;
            if (pricing.highest_price) resultMsg += `📈 **Hoogste:** €${Number(pricing.highest_price).toFixed(2)}\n`;
            if (pricing.num_for_sale) resultMsg += `\n🏪 **${pricing.num_for_sale}** exemplaren te koop op Discogs`;
          }

          // Show alternative suggestions if available
          if (v2Result.suggestions && v2Result.suggestions.length > 1) {
            resultMsg += `\n\n📋 **Andere mogelijke releases:**`;
          }

          setMessages(prev => [...prev, {
            role: 'assistant',
            content: resultMsg,
            pricingData: pricing,
            v2Result,
          }]);

        } else if (v2Result && v2Result.suggestions && v2Result.suggestions.length > 0) {
          // ── MULTIPLE SUGGESTIONS, NO CLEAR WINNER ──
          let sugMsg = `🔍 **Geen eenduidige match gevonden.** De scanner heeft ${v2Result.suggestions.length} mogelijke releases gevonden:\n\n`;

          if (v2Result.rights_society_exclusions && v2Result.rights_society_exclusions.length > 0) {
            sugMsg += `⛔ **Uitgesloten op basis van rechtenorganisaties:**\n`;
            for (const excl of v2Result.rights_society_exclusions) {
              sugMsg += `- ${excl}\n`;
            }
            sugMsg += `\n`;
          }

          sugMsg += `Selecteer de juiste release hieronder:`;

          setMessages(prev => [...prev, {
            role: 'assistant',
            content: sugMsg,
            v2Result,
          }]);

        } else {
          // ── NO MATCH ──
          let noMatchMsg = `⚠️ **Geen match gevonden** in de Discogs-database.\n\n`;
          
          if (v2Result?.rights_society_exclusions && v2Result.rights_society_exclusions.length > 0) {
            noMatchMsg += `⛔ **Uitgesloten releases:**\n`;
            for (const excl of v2Result.rights_society_exclusions) {
              noMatchMsg += `- ${excl}\n`;
            }
            noMatchMsg += `\n`;
          }

          noMatchMsg += `📸 Upload extra foto's (matrix-nummer, achterkant, disc label) voor een betere identificatie.`;

          setMessages(prev => [...prev, {
            role: 'assistant',
            content: noMatchMsg,
            v2Result,
          }]);
        }

        setIsRunningV2(false);
      }

    } catch (err) {
      console.error('Chat error:', err);
      toast({ title: "Chat fout", description: err instanceof Error ? err.message : "Fout", variant: "destructive" });
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && !last.content) return prev.slice(0, -1);
        return prev;
      });
      setIsStreaming(false);
      setIsRunningV2(false);
    }
  };

  const handleSend = () => {
    if (!input.trim() || isStreaming || isRunningV2) return;
    sendMessage(input.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const resetChat = () => {
    setMessages([{
      role: 'assistant',
      content: `🎩 **Hey, ik ben Magic Mike!** Je persoonlijke muziek-detective.\n\nWil je iets weten over een **CD** of **LP**?\n\nKies hieronder wat je hebt 👇`,
    }]);
    setMediaType('');
    setPendingFiles([]);
    setPhotoUrls([]);
    setInput('');
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-220px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <img src={magicMikeAvatar} alt="Magic Mike" className="h-10 w-10 rounded-full object-cover ring-2 ring-primary/30 shadow-md" />
          <div>
            <span className="text-sm font-semibold">Magic Mike</span>
            {mediaType && <span className="text-xs text-muted-foreground ml-1">· {mediaType === 'vinyl' ? 'Vinyl' : 'CD'}</span>}
            <p className="text-xs text-muted-foreground">Muziek-detective 🕵️‍♂️</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={resetChat}>
          <RotateCcw className="h-4 w-4 mr-1" /> Opnieuw
        </Button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFilesSelected}
        className="hidden"
      />

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
            {msg.role === 'assistant' && (
              <img src={magicMikeAvatar} alt="Magic Mike" className="h-7 w-7 rounded-full object-cover shrink-0 mt-1 ring-1 ring-primary/20" />
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
              msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted rounded-bl-sm'
            }`}>
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({ href, children }) => (
                        <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80 break-all">
                          {children}
                        </a>
                      ),
                    }}
                  >{cleanDisplayText(msg.content) || '...'}</ReactMarkdown>
                </div>
              ) : (
                <>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.images && msg.images.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {msg.images.map((src, j) => (
                        <img key={j} src={src} alt={`Foto ${j + 1}`} className="h-16 w-16 object-cover rounded" />
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Pricing card inline */}
              {msg.pricingData && (msg.pricingData.lowest_price || msg.pricingData.median_price) && (
                <div className="mt-3 p-3 bg-background/60 rounded-lg border border-border/50">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {msg.pricingData.lowest_price && (
                      <div>
                        <div className="text-xs text-muted-foreground">Laagste</div>
                        <div className="text-base font-bold text-primary">€{Number(msg.pricingData.lowest_price).toFixed(2)}</div>
                      </div>
                    )}
                    {msg.pricingData.median_price && (
                      <div>
                        <div className="text-xs text-muted-foreground">Mediaan</div>
                        <div className="text-base font-bold text-foreground">€{Number(msg.pricingData.median_price).toFixed(2)}</div>
                      </div>
                    )}
                    {msg.pricingData.highest_price && (
                      <div>
                        <div className="text-xs text-muted-foreground">Hoogste</div>
                        <div className="text-base font-bold text-accent-foreground">€{Number(msg.pricingData.highest_price).toFixed(2)}</div>
                      </div>
                    )}
                  </div>
                  {msg.pricingData.num_for_sale && (
                    <div className="text-xs text-muted-foreground text-center mt-2">
                      {msg.pricingData.num_for_sale} exemplaren te koop op Discogs
                    </div>
                  )}
                </div>
              )}

              {/* V2 Suggestions buttons */}
              {msg.v2Result?.suggestions && msg.v2Result.suggestions.length > 0 && !msg.pricingData && (
                <div className="mt-3 space-y-2">
                  {msg.v2Result.suggestions.slice(0, 5).map((sug) => (
                    <Button
                      key={sug.release_id}
                      variant="outline"
                      size="sm"
                      className="w-full justify-between text-left h-auto py-2"
                      onClick={() => selectCandidate(sug.release_id)}
                      disabled={isRunningV2}
                    >
                      <div className="flex flex-col items-start min-w-0">
                        <span className="text-xs font-medium truncate w-full">{sug.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {sug.country || ''}{sug.year ? ` (${sug.year})` : ''} · Score: {(sug.score * 100).toFixed(0)}%
                        </span>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 ml-2" />
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Media type picker */}
        {!mediaType && (
          <div className="flex gap-3 justify-center my-2">
            <Button variant="outline" size="lg" onClick={() => pickMediaType('vinyl')} className="h-14 px-6 flex flex-col gap-1">
              <Disc3 className="h-5 w-5" />
              <span className="text-xs">Vinyl</span>
            </Button>
            <Button variant="outline" size="lg" onClick={() => pickMediaType('cd')} className="h-14 px-6 flex flex-col gap-1">
              <Disc className="h-5 w-5" />
              <span className="text-xs">CD</span>
            </Button>
          </div>
        )}

        {/* Pending files preview */}
        {pendingFiles.length > 0 && (
          <div className="mx-2 my-2">
            <Card>
              <CardContent className="pt-3 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {pendingFiles.map((file, i) => (
                    <div key={i} className="relative h-20 w-20">
                      <img src={URL.createObjectURL(file)} alt={file.name} className="h-full w-full object-cover rounded-lg border" />
                      <button onClick={() => removePendingFile(i)}
                        className="absolute -top-1 -right-1 p-0.5 bg-destructive text-destructive-foreground rounded-full">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="h-20 w-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center hover:border-primary/50 transition-colors"
                  >
                    <ImagePlus className="h-5 w-5 text-muted-foreground" />
                  </button>
                </div>
                <Button onClick={uploadAndSend} disabled={isUploading} className="w-full" size="sm">
                  {isUploading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploaden...</>
                  ) : (
                    <><Send className="mr-2 h-4 w-4" />Stuur {pendingFiles.length} foto's naar Magic Mike</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {(isStreaming || isRunningV2) && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      {mediaType && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isStreaming || isUploading || isRunningV2}
            className="shrink-0 h-[44px] w-[44px]"
            title="Foto's toevoegen"
          >
            <Camera className="h-4 w-4" />
          </Button>
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Stel Magic Mike een vraag..."
            className="min-h-[44px] max-h-[120px] resize-none"
            rows={1}
            disabled={isStreaming || isRunningV2}
          />
          <Button onClick={handleSend} disabled={!input.trim() || isStreaming || isRunningV2} size="icon" className="shrink-0 h-[44px] w-[44px]">
            {(isStreaming || isRunningV2) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      )}
    </div>
  );
}
