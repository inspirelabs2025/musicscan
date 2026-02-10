import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Send, Loader2, Disc3, Disc, RotateCcw, Camera, X, ImagePlus, DollarSign, Check, XCircle } from 'lucide-react';
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
  discogsId?: string;
  scanData?: ScanData | null;
  pricingData?: PricingData | null;
  verificationResult?: VerificationResult | null;
}

interface ScanData {
  barcode?: string | null;
  catno?: string | null;
  matrix?: string | null;
}

interface VerificationResult {
  status: string; // verified, likely, needs_review
  score: number;
  artist?: string;
  title?: string;
  artwork_url?: string;
}

interface PricingData {
  lowest_price: number | null;
  median_price: number | null;
  highest_price: number | null;
  num_for_sale: number | null;
}

const SUPABASE_URL = "https://ssxbpyqnjfiyubsuonar.supabase.co";

// Extract Discogs ID from [[DISCOGS:123456]] OR from discogs.com/release/123456 URLs
const extractDiscogsId = (text: string): string | null => {
  const tagMatch = text.match(/\[\[DISCOGS:(\d+)\]\]/);
  if (tagMatch) return tagMatch[1];
  // Also detect from Discogs URLs in the text
  const urlMatch = text.match(/discogs\.com\/release\/(\d+)/);
  return urlMatch ? urlMatch[1] : null;
};

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
    .replace(/\[\[DISCOGS:\d+\]\]/g, '')
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
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);

  const [mediaType, setMediaType] = useState<'vinyl' | 'cd' | ''>('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [confirmedDiscogsId, setConfirmedDiscogsId] = useState<string | null>(null);

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

  // Handle multi-file select
  const handleFilesSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/') && f.size <= 10 * 1024 * 1024);
    if (selected.length === 0) return;
    setPendingFiles(prev => [...prev, ...selected]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const removePendingFile = useCallback((index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Verify release via V2 pipeline, then fetch pricing
  const fetchPricing = async (discogsId: string, scanData?: ScanData | null) => {
    setIsFetchingPrice(true);
    setConfirmedDiscogsId(discogsId);

    // Add user confirmation message
    setMessages(prev => [...prev, { role: 'user', content: '✅ Ja, dat klopt! Verifieer en haal de prijzen op.' }]);

    try {
      // Step 1: Verify via verify-and-enrich-release (same as V2 scanner)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `🔍 **Bezig met verificatie...** Ik controleer release #${discogsId} via onze database met barcode, catalogusnummer en matrix-check...`,
      }]);

      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-and-enrich-release', {
        body: {
          discogs_id: parseInt(discogsId, 10),
          scan_data: scanData ? {
            barcode: scanData.barcode || null,
            catno: scanData.catno || null,
            matrix: scanData.matrix || null,
          } : null,
        }
      });

      if (verifyError) throw verifyError;

      const verification = verifyData?.verification;
      const enrichment = verifyData?.enrichment;
      const verificationStatus = verification?.status || 'unverified';
      const verificationScore = verification?.score || 0;

      // Remove the "bezig met verificatie" message and add result
      setMessages(prev => prev.filter(m => !m.content.includes('Bezig met verificatie')));

      // Build verification result message
      const verifiedArtist = enrichment?.artist || '';
      const verifiedTitle = enrichment?.title || '';
      const verifiedArtwork = enrichment?.artwork_url || '';

      const verificationResult: VerificationResult = {
        status: verificationStatus,
        score: verificationScore,
        artist: verifiedArtist,
        title: verifiedTitle,
        artwork_url: verifiedArtwork,
      };

      if (verificationStatus === 'needs_review' && scanData && (scanData.barcode || scanData.catno || scanData.matrix)) {
        // Verification FAILED — identifiers don't match
        const checks = verification?.details?.checks || [];
        let failMsg = `⚠️ **Verificatie mislukt** voor release #${discogsId}\n\n`;
        failMsg += `De door mij gevonden identifiers komen **niet overeen** met de Discogs-data:\n\n`;
        
        for (const check of checks) {
          const icon = check.matched ? '✅' : '❌';
          failMsg += `${icon} **${check.type.toUpperCase()}**: ${check.scan_value || 'niet gevonden'}`;
          if (!check.matched && check.release_values?.length) {
            failMsg += ` (Discogs: ${check.release_values.filter(Boolean).join(', ') || 'leeg'})`;
          }
          failMsg += '\n';
        }

        failMsg += `\n🔄 Dit is waarschijnlijk een **andere persing** of release. Upload extra foto's (matrix, achterkant) zodat ik opnieuw kan zoeken.`;

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: failMsg,
          verificationResult,
        }]);
        setConfirmedDiscogsId(null); // Reset so user can try again
        return;
      }

      // Verification passed or no scan_data to verify against
      const statusEmoji = verificationStatus === 'verified' ? '✅' : verificationStatus === 'likely' ? '🟡' : '🔵';
      const statusLabel = verificationStatus === 'verified' ? 'Geverifieerd' : verificationStatus === 'likely' ? 'Waarschijnlijk correct' : 'Niet geverifieerd (geen identifiers)';

      let verifyMsg = `${statusEmoji} **${statusLabel}** — ${verifiedArtist} - ${verifiedTitle}\n`;
      verifyMsg += `📊 Verificatiescore: ${verificationScore} bevestigingen\n\n`;

      // Step 2: Fetch full pricing
      const { data: pricingData, error: pricingError } = await supabase.functions.invoke('fetch-discogs-pricing', {
        body: { discogs_id: discogsId }
      });

      if (pricingError) throw pricingError;

      const pricing: PricingData = {
        lowest_price: pricingData?.lowest_price || null,
        median_price: pricingData?.median_price || null,
        highest_price: pricingData?.highest_price || null,
        num_for_sale: pricingData?.num_for_sale || null,
      };

      if (pricing.lowest_price || pricing.median_price || pricing.highest_price) {
        verifyMsg += `💰 **Prijsinformatie:**\n`;
        if (pricing.lowest_price) verifyMsg += `📉 **Laagste:** €${Number(pricing.lowest_price).toFixed(2)}\n`;
        if (pricing.median_price) verifyMsg += `📊 **Mediaan:** €${Number(pricing.median_price).toFixed(2)}\n`;
        if (pricing.highest_price) verifyMsg += `📈 **Hoogste:** €${Number(pricing.highest_price).toFixed(2)}\n`;
        if (pricing.num_for_sale) verifyMsg += `\n🏪 **${pricing.num_for_sale}** exemplaren te koop op Discogs`;
      } else {
        verifyMsg += `⚠️ Geen prijsdata beschikbaar voor deze release.`;
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: verifyMsg,
        pricingData: pricing,
        verificationResult,
      }]);

    } catch (err) {
      console.error('Verify/pricing error:', err);
      setMessages(prev => {
        // Remove loading message if present
        const filtered = prev.filter(m => !m.content.includes('Bezig met verificatie'));
        return [...filtered, {
          role: 'assistant',
          content: `⚠️ Kon de release niet verifiëren. Probeer het later opnieuw of upload extra foto's.`,
        }];
      });
      setConfirmedDiscogsId(null);
    } finally {
      setIsFetchingPrice(false);
    }
  };

  const declineMatch = () => {
    setMessages(prev => [
      ...prev,
      { role: 'user', content: '❌ Nee, dit is niet de juiste release.' },
      { role: 'assistant', content: '🔍 Geen probleem! Kun je extra foto\'s uploaden van het matrix-nummer of de achterkant? Dan zoek ik opnieuw.' },
    ]);
  };

  // Upload pending files and send to Magic Mike
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

      const userContent = `Ik heb ${pendingFiles.length} foto's geüpload van mijn ${mediaType === 'vinyl' ? 'vinyl plaat' : 'CD'}. Analyseer deze foto's. Bevestig eerst de artiest en titel. Zoek dan naar barcode, catalogusnummer en matrix-nummer op de foto's. Geef je bevindingen.`;
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

  // Stream message to AI, then auto-verify any detected Discogs ID
  const sendMessage = async (text: string, urls?: string[], customUserMsg?: ChatMessage) => {
    const userMsg: ChatMessage = customUserMsg || { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsStreaming(true);

    let assistantSoFar = '';
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      const discogsId = extractDiscogsId(assistantSoFar);
      const scanData = extractScanData(assistantSoFar);
      setMessages(prev => {
        const last = prev[prev.length - 1];
        const msgData: ChatMessage = {
          role: 'assistant',
          content: assistantSoFar,
          ...(discogsId ? { discogsId } : {}),
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

      // ─── AUTO-VERIFY after stream completes ────────────────────
      const detectedId = extractDiscogsId(assistantSoFar);
      const detectedScanData = extractScanData(assistantSoFar);
      
      if (detectedId && !confirmedDiscogsId) {
        console.log(`🔐 Auto-verifying Discogs ID ${detectedId} with scan_data:`, detectedScanData);
        
        // Show verification in progress
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `🔍 **Automatische verificatie...** Release #${detectedId} wordt gecontroleerd tegen de Discogs-database...`,
        }]);

        try {
          const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-and-enrich-release', {
            body: {
              discogs_id: parseInt(detectedId, 10),
              scan_data: detectedScanData ? {
                barcode: detectedScanData.barcode || null,
                catno: detectedScanData.catno || null,
                matrix: detectedScanData.matrix || null,
              } : null,
            }
          });

          if (verifyError) throw verifyError;

          const verification = verifyData?.verification;
          const enrichment = verifyData?.enrichment;
          const vStatus = verification?.status || 'unverified';
          const vScore = verification?.score || 0;
          const vArtist = enrichment?.artist || '';
          const vTitle = enrichment?.title || '';

          // Remove the "verificatie..." loading message
          setMessages(prev => prev.filter(m => !m.content.includes('Automatische verificatie...')));

          if (vStatus === 'needs_review' && detectedScanData && (detectedScanData.barcode || detectedScanData.catno || detectedScanData.matrix)) {
            // FAILED — identifiers don't match
            const checks = verification?.details?.checks || [];
            let failMsg = `⚠️ **Verificatie MISLUKT** — Release #${detectedId} komt **niet overeen** met de gescande identifiers!\n\n`;
            
            for (const check of checks) {
              const icon = check.matched ? '✅' : '❌';
              failMsg += `${icon} **${check.type.toUpperCase()}**: \`${check.scan_value || 'niet gevonden'}\``;
              if (!check.matched && check.release_values?.length) {
                failMsg += ` → Discogs: \`${check.release_values.filter(Boolean).join(', ') || 'leeg'}\``;
              }
              failMsg += '\n';
            }

            failMsg += `\n🔄 Upload extra foto's van het **matrix-nummer** of de **achterkant** zodat ik opnieuw kan zoeken.`;

            setMessages(prev => [...prev, {
              role: 'assistant',
              content: failMsg,
              verificationResult: { status: vStatus, score: vScore, artist: vArtist, title: vTitle },
            }]);
            // Don't set confirmedDiscogsId — allow retry
          } else {
            // PASSED or no scan data to compare
            const statusEmoji = vStatus === 'verified' ? '✅' : vStatus === 'likely' ? '🟡' : '🔵';
            const statusLabel = vStatus === 'verified' ? 'Geverifieerd' : vStatus === 'likely' ? 'Waarschijnlijk correct' : 'Geen identifiers om te checken';
            
            setConfirmedDiscogsId(detectedId);

            let verifyMsg = `${statusEmoji} **${statusLabel}** — **${vArtist} - ${vTitle}**\n`;
            verifyMsg += `📊 Score: ${vScore} bevestiging(en)\n`;

            // Auto-fetch pricing
            const { data: pricingResp } = await supabase.functions.invoke('fetch-discogs-pricing', {
              body: { discogs_id: detectedId }
            });

            const pricing: PricingData = {
              lowest_price: pricingResp?.lowest_price || null,
              median_price: pricingResp?.median_price || null,
              highest_price: pricingResp?.highest_price || null,
              num_for_sale: pricingResp?.num_for_sale || null,
            };

            if (pricing.lowest_price || pricing.median_price || pricing.highest_price) {
              verifyMsg += `\n💰 **Prijsinformatie:**\n`;
              if (pricing.lowest_price) verifyMsg += `📉 **Laagste:** €${Number(pricing.lowest_price).toFixed(2)}\n`;
              if (pricing.median_price) verifyMsg += `📊 **Mediaan:** €${Number(pricing.median_price).toFixed(2)}\n`;
              if (pricing.highest_price) verifyMsg += `📈 **Hoogste:** €${Number(pricing.highest_price).toFixed(2)}\n`;
              if (pricing.num_for_sale) verifyMsg += `\n🏪 **${pricing.num_for_sale}** exemplaren te koop op Discogs`;
            } else {
              verifyMsg += `\n⚠️ Geen prijsdata beschikbaar voor deze release.`;
            }

            setMessages(prev => [...prev, {
              role: 'assistant',
              content: verifyMsg,
              pricingData: pricing,
              verificationResult: { status: vStatus, score: vScore, artist: vArtist, title: vTitle },
            }]);
          }
        } catch (verifyErr) {
          console.error('Auto-verify error:', verifyErr);
          setMessages(prev => {
            const filtered = prev.filter(m => !m.content.includes('Automatische verificatie...'));
            return [...filtered, {
              role: 'assistant',
              content: `⚠️ Kon de release niet automatisch verifiëren. Klik hieronder om handmatig te verifiëren.`,
            }];
          });
        }
      }

    } catch (err) {
      console.error('Chat error:', err);
      toast({ title: "Chat fout", description: err instanceof Error ? err.message : "Fout", variant: "destructive" });
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && !last.content) return prev.slice(0, -1);
        return prev;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
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
    setConfirmedDiscogsId(null);
  };

  // Manual fallback: only show buttons if auto-verify failed (message contains "handmatig te verifiëren")
  const hasManualFallback = messages.some(m => m.content.includes('handmatig te verifiëren'));
  const pendingMessage = hasManualFallback && !confirmedDiscogsId && !isStreaming
    ? messages.filter(m => m.role === 'assistant' && m.discogsId).slice(-1)[0] || null
    : null;
  const pendingDiscogsId = pendingMessage?.discogsId || null;
  const pendingScanData = pendingMessage?.scanData || null;

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
            </div>
          </div>
        ))}

        {/* Confirm/Decline buttons when Discogs ID detected */}
        {pendingDiscogsId && (
          <div className="flex gap-2 justify-center my-3">
            <Button
              onClick={() => fetchPricing(pendingDiscogsId!, pendingScanData)}
              disabled={isFetchingPrice}
              variant="default"
              size="sm"
              className="gap-1"
            >
              {isFetchingPrice ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Verifiëren...</>
              ) : (
                <><Check className="h-4 w-4" />Ja, verifieer &amp; haal prijzen op</>
              )}
            </Button>
            <Button onClick={declineMatch} variant="outline" size="sm" className="gap-1">
              <XCircle className="h-4 w-4" />
              Nee, niet juist
            </Button>
          </div>
        )}

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

        {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
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
            disabled={isStreaming || isUploading}
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
            disabled={isStreaming}
          />
          <Button onClick={handleSend} disabled={!input.trim() || isStreaming} size="icon" className="shrink-0 h-[44px] w-[44px]">
            {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      )}
    </div>
  );
}
