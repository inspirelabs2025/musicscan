import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Send, Loader2, Disc3, Disc, RotateCcw, Camera, X, ImagePlus, ExternalLink, Save, Check, Sparkles, MessageCircle, ScanLine, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import magicMikeAvatar from '@/assets/magic-mike-avatar.png';
import { ConditionGradingPanel, calculateAdvicePrice } from '@/components/scanner/ConditionGradingPanel';
import { ScannerManualSearch } from '@/components/scanner/ScannerManualSearch';

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
  discogs_url?: string | null;
  status: string;
  confidence_score?: number | null;
  artist?: string | null;
  title?: string | null;
  artwork_url?: string | null;
  country?: string | null;
  year?: number | null;
  label?: string | null;
  catalog_number?: string | null;
  barcode?: string | null;
  matrix_number?: string | null;
  format?: string | null;
  genre?: string | null;
  suggestions?: V2Suggestion[];
  rights_society_exclusions?: string[];
  audit_entries?: any[];
  pricing_stats?: PricingData | null;
  verification?: { status: string; score: number; confirmations?: string[] } | null;
  match_status?: string;
}

interface V2Suggestion {
  release_id: number;
  id?: number;
  title: string;
  score?: number;
  country?: string;
  year?: number;
  catno?: string;
  label?: string;
  reason?: string[];
}

interface MarketplaceListing {
  price: number;
  currency: string;
  condition_media: string;
  condition_sleeve: string;
  seller: string;
  ships_from: string;
}

interface PricingData {
  lowest_price: number | null;
  median_price: number | null;
  highest_price: number | null;
  num_for_sale: number | null;
  marketplace_listings?: MarketplaceListing[];
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

// Remove hidden tags and hallucinated Discogs URLs/IDs from display text
const cleanDisplayText = (text: string): string => {
  return text
    .replace(/\[\[SCAN_DATA:.*?\]\]/g, '')
    // Strip hallucinated Discogs URLs (markdown links and plain URLs)
    .replace(/\[([^\]]*)\]\(https?:\/\/(?:www\.)?discogs\.com\/release\/\d+[^)]*\)/g, '')
    .replace(/https?:\/\/(?:www\.)?discogs\.com\/release\/\d+\S*/g, '')
    // Strip lines mentioning "Discogs ID" or "Release ID" with a number (hallucinated)
    .replace(/^.*(?:Discogs|Release)\s*(?:ID|nummer|#)\s*[:=]?\s*\d+.*$/gim, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};
// ─── Suggestion pools ──────────────────────────────────────
const DISCOVERY_SUGGESTIONS = [
  { emoji: '🎉', text: 'Leuke feitjes over dit album' },
  { emoji: '🎤', text: 'Vertel me meer over de artiest' },
  { emoji: '📸', text: 'Scan nog een CD of LP' },
];

const SAVED_SUGGESTIONS = [
  { emoji: '🎉', text: 'Leuke feitjes over dit album' },
  { emoji: '🎤', text: 'Vertel me meer over de artiest' },
  { emoji: '📸', text: 'Scan nog een CD of LP' },
];

// Contextual follow-ups based on last assistant message content
const FOLLOWUP_SUGGESTIONS = [
  { emoji: '🤔', text: 'Vertel daar meer over' },
  { emoji: '🎵', text: 'Welke nummers raad je aan?' },
  { emoji: '📚', text: 'Nog meer weetjes hierover?' },
  { emoji: '🎤', text: 'Hoe zit het met de artiest zelf?' },
  { emoji: '💿', text: 'Welke andere albums moet ik kennen?' },
  { emoji: '🏆', text: 'Is dit album iconisch geworden?' },
  { emoji: '🎸', text: 'Wie hebben er aan meegewerkt?' },
  { emoji: '📅', text: 'Hoe was de muziekscene in die tijd?' },
  { emoji: '🔍', text: 'Zijn er bijzondere feiten over de opnames?' },
  { emoji: '💰', text: 'Hoe staat het met de waarde van dit album?' },
];

const NO_MATCH_SUGGESTIONS = [
  { emoji: '📸', text: 'Ik upload extra foto\'s' },
  { emoji: '🔍', text: 'Kun je nog eens goed naar de matrix kijken?' },
  { emoji: '💬', text: 'Ik typ de artiest en titel zelf in' },
];

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

interface SuggestionChipsProps {
  verifiedResult: V2PipelineResult | null;
  savedToCollection: boolean;
  isStreaming: boolean;
  isRunningV2: boolean;
  lastAssistantContent: string;
  hasNoMatch: boolean;
  onSave: () => void;
  onSend: (text: string) => void;
}

const SuggestionChips: React.FC<SuggestionChipsProps> = React.memo(({
  verifiedResult, savedToCollection, isStreaming, isRunningV2, lastAssistantContent, hasNoMatch, onSave, onSend,
}) => {
  const suggestions = useMemo(() => {
    if (hasNoMatch) return pickRandom(NO_MATCH_SUGGESTIONS, 3);
    if (verifiedResult?.discogs_id) {
      return savedToCollection ? SAVED_SUGGESTIONS : DISCOVERY_SUGGESTIONS;
    }
    // After any AI response, show general follow-ups — but NOT during scan setup (welcome, photo upload prompt, ask prompt)
    const skipPhrases = ['Hey, ik ben Magic Mike', 'Upload je foto', 'Kies hieronder', 'Typ je vraag hieronder'];
    const isSetupMessage = skipPhrases.some(p => lastAssistantContent?.includes(p));
    if (lastAssistantContent && !isSetupMessage) {
      return pickRandom(FOLLOWUP_SUGGESTIONS, 3);
    }
    return [];
  }, [verifiedResult?.discogs_id, savedToCollection, lastAssistantContent, hasNoMatch]);

  if (isStreaming || isRunningV2 || suggestions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 my-2 px-1">
      {verifiedResult?.discogs_id && !savedToCollection && (
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1.5 rounded-full border-primary/30 hover:bg-primary/10"
          onClick={onSave}
        >
          <Save className="h-3 w-3" />
          Opslaan in catalogus
        </Button>
      )}
      {suggestions.map((sug, i) => (
        <Button
          key={i}
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1.5 rounded-full border-muted-foreground/20 hover:bg-muted"
          onClick={() => onSend(sug.text)}
        >
          <span>{sug.emoji}</span>
          {sug.text}
        </Button>
      ))}
    </div>
  );
});
SuggestionChips.displayName = 'SuggestionChips';

export function ScanChatTab() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `🎩 **Hey, ik ben Magic Mike!** Je persoonlijke muziek-detective.\n\nWil je iets **scannen** of iets **vragen** over een artiest of album?`,
    },
  ]);
  const [showWelcomeActions, setShowWelcomeActions] = useState(true);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRunningV2, setIsRunningV2] = useState(false);
  const [isSavingToCollection, setIsSavingToCollection] = useState(false);
  const [savedToCollection, setSavedToCollection] = useState(false);

  const [mediaType, setMediaType] = useState<'vinyl' | 'cd' | ''>('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [verifiedResult, setVerifiedResult] = useState<V2PipelineResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showManualSearch, setShowManualSearch] = useState(false);
  const [isManualSearching, setIsManualSearching] = useState(false);
  const [conditionMedia, setConditionMedia] = useState<string>('');
  const [conditionSleeve, setConditionSleeve] = useState<string>('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, pendingFiles]);

  const pickMediaType = (type: 'vinyl' | 'cd') => {
    setMediaType(type);
    setShowWelcomeActions(false);
    const label = type === 'vinyl' ? 'vinyl plaat' : 'CD';
    setMessages(prev => [
      ...prev,
      { role: 'user', content: type === 'vinyl' ? '🎵 Vinyl' : '💿 CD' },
      {
        role: 'assistant',
        content: `Top, een ${label}! 📸\n\nUpload je foto's — hoe meer hoe beter! Voorkant, achterkant, label, matrix... Alles helpt.\n\nGebruik de knoppen hieronder:\n- **Eerste knop** → Foto maken met je camera\n- **Tweede knop** → Foto uploaden uit je galerij`,
      },
    ]);
  };

  const pickScanAction = () => {
    setShowWelcomeActions(false);
    setMessages(prev => [
      ...prev,
      { role: 'user', content: '🔍 Scannen' },
      {
        role: 'assistant',
        content: `Wat wil je scannen? Kies hieronder 👇`,
      },
    ]);
  };

  const pickAskAction = () => {
    setShowWelcomeActions(false);
    setMediaType('cd'); // Set any media type to skip picker, won't actually scan
    setMessages(prev => [
      ...prev,
      { role: 'user', content: '💬 Stel een vraag' },
      {
        role: 'assistant',
        content: `Leuk! Vraag me alles over artiesten, albums, genres, muziekgeschiedenis... Ik weet er alles van! 🎶\n\nTyp je vraag hieronder.`,
      },
    ]);
  };

  const handleFilesSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/') && f.size <= 10 * 1024 * 1024);
    if (selected.length === 0) return;
    setPendingFiles(prev => [...prev, ...selected]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  }, []);

  const removePendingFile = useCallback((index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  // ─── Run V2 Pipeline (deterministic matching) ───────────────
  const runV2Pipeline = async (urls: string[], mType: string, rightsSocieties?: string[]): Promise<V2PipelineResult | null> => {
    try {
      console.log(`🔍 Running V2 pipeline with ${urls.length} photos, mediaType: ${mType}, externalRightsSocieties:`, rightsSocieties);
      
      const { data, error } = await supabase.functions.invoke('ai-photo-analysis-v2', {
        body: {
          photoUrls: urls,
          mediaType: mType,
          conditionGrade: 'Not Graded',
          skipSave: true,
          ...(rightsSocieties && rightsSocieties.length > 0 ? { externalRightsSocieties: rightsSocieties } : {}),
        }
      });

      if (error) throw error;

      console.log('📊 V2 pipeline raw response:', JSON.stringify(data, null, 2).slice(0, 2000));

      // Edge function returns { success, result: { discogs_id, ... } }
      const result = data?.result || data;

      // Extract rights society exclusions from collector_audit
      const auditEntries = result?.collector_audit || [];
      const rsExclusions = auditEntries
        .filter((a: any) => a.detail?.includes('⛔'))
        .map((a: any) => a.detail);

      return {
        discogs_id: result?.discogs_id || null,
        discogs_url: result?.discogs_url || null,
        status: result?.match_status || 'no_match',
        confidence_score: result?.confidence_score || null,
        artist: result?.artist || null,
        title: result?.title || null,
        artwork_url: result?.artwork_url || null,
        country: result?.country || null,
        year: result?.year || null,
        label: result?.label || null,
        catalog_number: result?.catalog_number || null,
        barcode: result?.barcode || null,
        matrix_number: result?.matrix_number || null,
        format: result?.format || null,
        genre: result?.genre || null,
        suggestions: result?.suggestions || [],
        rights_society_exclusions: rsExclusions,
        audit_entries: auditEntries,
        pricing_stats: result?.pricing_stats || null,
        verification: result?.verification || null,
        match_status: result?.match_status || null,
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
        lowest_price: pricingResp?.lowest_price ?? null,
        median_price: pricingResp?.median_price ?? null,
        highest_price: pricingResp?.highest_price ?? null,
        num_for_sale: pricingResp?.num_for_sale ?? null,
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
      // If we already have a verified result, prepend context so Mike knows the release
      const effectiveContent = verifiedResult
        ? `[CONTEXT: Release al geïdentificeerd - ${verifiedResult.artist} - ${verifiedResult.title}, Discogs ID: ${verifiedResult.discogs_id}. Beantwoord de vraag van de gebruiker over deze release zonder opnieuw te scannen.]\n\n${userMsg.content}`
        : userMsg.content;

      const allMessages = [...messages, { role: userMsg.role, content: effectiveContent }];
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

      // ─── AUTO-RUN V2 PIPELINE after stream completes (only if photos were sent AND no verified result yet) ────
      const activeUrls = urls || photoUrls;
      const shouldRunV2 = activeUrls.length > 0 && mediaType && !verifiedResult;
      if (shouldRunV2) {
        setIsRunningV2(true);
        
        // Extract rights_societies from Magic Mike's SCAN_DATA to forward to V2 pipeline
        const lastScanData = extractScanData(assistantSoFar);
        const chatRightsSocieties = lastScanData?.rights_societies || [];
        if (chatRightsSocieties.length > 0) {
          console.log('🏛️ Magic Mike detected rights societies:', chatRightsSocieties);
        }

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `🎯 **Even geduld...** Ik doorzoek nu duizenden releases om jouw exacte pressing te vinden. Barcode, matrix-codes, labels — alles wordt gecheckt! 🔎`,
        }]);

        const v2Result = await runV2Pipeline(activeUrls, mediaType, chatRightsSocieties);

        // Remove loading message
        setMessages(prev => prev.filter(m => !m.content.includes('Even geduld...')));

        if (v2Result && v2Result.discogs_id) {
          // ── MATCH FOUND ──
          const isVerified = v2Result.verification?.status === 'verified' || v2Result.status === 'single_match';
          const isLikely = v2Result.verification?.status === 'likely' || v2Result.status === 'multiple_candidates';
          const statusEmoji = isVerified ? '✅' : isLikely ? '🟡' : '🔵';
          const statusLabel = isVerified ? 'Geverifieerd' : isLikely ? 'Waarschijnlijk correct' : 'Voorgestelde match';

          let resultMsg = `${statusEmoji} **${statusLabel}** — **${v2Result.artist} - ${v2Result.title}**\n`;
          if (v2Result.label) resultMsg += `🏷️ ${v2Result.label}`;
          if (v2Result.catalog_number) resultMsg += ` (${v2Result.catalog_number})`;
          if (v2Result.label || v2Result.catalog_number) resultMsg += `\n`;
          if (v2Result.country || v2Result.year) {
            resultMsg += `📀 ${v2Result.country || ''}${v2Result.year ? ` (${v2Result.year})` : ''}\n`;
          }
          resultMsg += `📊 Confidence: ${((v2Result.confidence_score || 0) * 100).toFixed(0)}%\n`;
          resultMsg += `🔗 [Bekijk op Discogs](https://www.discogs.com/release/${v2Result.discogs_id})\n`;

          // Show verification details
          if (v2Result.verification?.confirmations?.length) {
            resultMsg += `\n🔒 **Verificatie:** ${v2Result.verification.confirmations.join(', ')}\n`;
          }

          // Show rights society exclusions
          if (v2Result.rights_society_exclusions && v2Result.rights_society_exclusions.length > 0) {
            resultMsg += `\n⛔ **Uitgesloten releases:**\n`;
            for (const excl of v2Result.rights_society_exclusions) {
              resultMsg += `- ${excl}\n`;
            }
          }

          // Use pricing_stats from V2 response (already fetched by the edge function)
          const pricing: PricingData = {
            lowest_price: v2Result.pricing_stats?.lowest_price ?? null,
            median_price: v2Result.pricing_stats?.median_price ?? null,
            highest_price: v2Result.pricing_stats?.highest_price ?? null,
            num_for_sale: v2Result.pricing_stats?.num_for_sale ?? null,
          };

          if (pricing.lowest_price || pricing.median_price || pricing.highest_price) {
            resultMsg += `\n💰 **Prijsinformatie:**\n`;
            if (pricing.lowest_price) resultMsg += `📉 **Laagste:** €${Number(pricing.lowest_price).toFixed(2)}\n`;
            if (pricing.median_price) resultMsg += `📊 **Mediaan:** €${Number(pricing.median_price).toFixed(2)}\n`;
            if (pricing.highest_price) resultMsg += `📈 **Hoogste:** €${Number(pricing.highest_price).toFixed(2)}\n`;
            if (pricing.num_for_sale) resultMsg += `\n🏪 **${pricing.num_for_sale}** exemplaren te koop op Discogs`;
          }

          // Fetch marketplace listings in parallel (non-blocking for UI)
          try {
            const { data: marketplaceData } = await supabase.functions.invoke('fetch-discogs-marketplace-listings', {
              body: { discogs_id: v2Result.discogs_id }
            });
            if (marketplaceData?.listings?.length > 0) {
              pricing.marketplace_listings = marketplaceData.listings;
              if (marketplaceData.total_for_sale) {
                pricing.num_for_sale = marketplaceData.total_for_sale;
              }
            }
          } catch (mlErr) {
            console.error('Marketplace listings fetch error:', mlErr);
          }

          // Show alternative suggestions if available
          if (v2Result.suggestions && v2Result.suggestions.length > 1) {
            resultMsg += `\n\n📋 **Andere mogelijke releases:**`;
          }

          // Save verified result so follow-up questions don't re-trigger the pipeline
          setVerifiedResult(v2Result);

          setMessages(prev => [...prev, {
            role: 'assistant',
            content: resultMsg,
            pricingData: pricing,
            v2Result,
          }]);

        } else if (v2Result && v2Result.suggestions && v2Result.suggestions.length > 0) {
          // ── MULTIPLE SUGGESTIONS, NO CLEAR WINNER ──
          let sugMsg = `🔍 **Geen eenduidige match gevonden.**\n\n`;
          sugMsg += `De scanner heeft **${v2Result.artist || 'onbekend'} - ${v2Result.title || 'onbekend'}** herkend, maar kan de exacte persing niet bevestigen.\n\n`;

          if (v2Result.rights_society_exclusions && v2Result.rights_society_exclusions.length > 0) {
            sugMsg += `⛔ **Uitgesloten op basis van rechtenorganisaties:**\n`;
            for (const excl of v2Result.rights_society_exclusions) {
              sugMsg += `- ${excl}\n`;
            }
            sugMsg += `\n`;
          }

          sugMsg += `Selecteer de juiste release hieronder, of upload extra foto's voor een betere match:`;

          setMessages(prev => [...prev, {
            role: 'assistant',
            content: sugMsg,
            v2Result,
          }]);

        } else {
          // ── NO MATCH ──
          let noMatchMsg = `⚠️ **Geen match gevonden** in de Discogs-database.\n\n`;
          
          if (v2Result?.artist || v2Result?.title) {
            noMatchMsg += `🔎 Herkend: **${v2Result.artist || '?'} - ${v2Result.title || '?'}**\n\n`;
          }

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
    const trimmed = input.trim();

    // Check if user rejects the current result
    const rejectKeywords = ['niet juist', 'niet correct', 'verkeerde', 'fout', 'klopt niet',
      'andere release', 'niet goed', 'opnieuw zoeken', 'wrong', 'incorrect'];
    const isRejection = rejectKeywords.some(kw => trimmed.toLowerCase().includes(kw));
    if (isRejection) {
      setVerifiedResult(null);
    }

    sendMessage(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const resetChat = () => {
    setMessages([{
      role: 'assistant',
      content: `🎩 **Hey, ik ben Magic Mike!** Je persoonlijke muziek-detective.\n\nWil je iets **scannen** of iets **vragen** over een artiest of album?`,
    }]);
    setShowWelcomeActions(true);
    setMediaType('');
    setPendingFiles([]);
    setPhotoUrls([]);
    setInput('');
    setVerifiedResult(null);
    setSavedToCollection(false);
    setConditionMedia('');
    setConditionSleeve('');
    setShowManualSearch(false);
    setIsManualSearching(false);
  };

  // Handle manual search form submission
  const handleManualSearch = async (artist: string, title: string, barcode?: string, year?: string, country?: string, matrix?: string) => {
    setIsManualSearching(true);
    setShowManualSearch(false);

    const searchDesc = [artist, title].filter(Boolean).join(' - ');
    setMessages(prev => [...prev, {
      role: 'user',
      content: `🔍 Handmatig zoeken: ${searchDesc}`,
    }, {
      role: 'assistant',
      content: `🔎 **Zoeken...** Even geduld, ik doorzoek de database voor "${searchDesc}"...`,
    }]);

    try {
      const { data, error } = await supabase.functions.invoke('optimized-catalog-search', {
        body: {
          catalog_number: barcode || '',
          artist: artist || '',
          title: title || '',
          year: year || undefined,
          country: country || undefined,
          matrix_number: matrix || undefined,
          include_pricing: true,
        },
      });

      // Remove loading message
      setMessages(prev => prev.filter(m => !m.content.includes('Even geduld, ik doorzoek')));

      if (error) throw error;

      if (data?.results?.length > 0) {
        const topResult = data.results[0];
        const releaseId = topResult.discogs_id || topResult.id;

        // Build verified result
        const v2Result: V2PipelineResult = {
          discogs_id: releaseId,
          discogs_url: `https://www.discogs.com/release/${releaseId}`,
          status: 'manual_match',
          confidence_score: topResult.similarity_score || null,
          artist: topResult.artist || artist,
          title: topResult.title || title,
          artwork_url: topResult.cover_image || null,
          country: topResult.country || null,
          year: topResult.year || null,
          label: topResult.label || null,
          catalog_number: topResult.catalog_number || null,
          barcode: barcode || null,
          matrix_number: matrix || null,
          format: topResult.format || null,
          genre: topResult.genre || null,
          suggestions: data.results.length > 1 ? data.results.slice(0, 5).map((r: any) => ({
            release_id: r.discogs_id || r.id,
            title: `${r.artist} - ${r.title}`,
            country: r.country,
            year: r.year,
            catno: r.catalog_number,
            label: r.label,
          })) : [],
          pricing_stats: topResult.pricing_stats || null,
          match_status: 'manual_match',
        };

        setVerifiedResult(v2Result);

        let msg = `✅ **${v2Result.artist} - ${v2Result.title}**\n`;
        if (v2Result.label) msg += `🏷️ ${v2Result.label}`;
        if (v2Result.catalog_number) msg += ` (${v2Result.catalog_number})`;
        if (v2Result.label || v2Result.catalog_number) msg += `\n`;
        if (v2Result.country || v2Result.year) {
          msg += `📀 ${v2Result.country || ''}${v2Result.year ? ` (${v2Result.year})` : ''}\n`;
        }
        msg += `🔗 [Bekijk op Discogs](https://www.discogs.com/release/${releaseId})\n`;

        const pricing: PricingData = {
          lowest_price: topResult.pricing_stats?.lowest_price ?? null,
          median_price: topResult.pricing_stats?.median_price ?? null,
          highest_price: topResult.pricing_stats?.highest_price ?? null,
          num_for_sale: topResult.pricing_stats?.num_for_sale ?? null,
        };

        if (pricing.lowest_price || pricing.median_price || pricing.highest_price) {
          msg += `\n💰 **Prijsinformatie:**\n`;
          if (pricing.lowest_price) msg += `📉 **Laagste:** €${Number(pricing.lowest_price).toFixed(2)}\n`;
          if (pricing.median_price) msg += `📊 **Mediaan:** €${Number(pricing.median_price).toFixed(2)}\n`;
          if (pricing.highest_price) msg += `📈 **Hoogste:** €${Number(pricing.highest_price).toFixed(2)}\n`;
          if (pricing.num_for_sale) msg += `\n🏪 **${pricing.num_for_sale}** exemplaren te koop op Discogs`;
        }

        if (data.results.length > 1) {
          msg += `\n\n📋 **Andere mogelijke releases:**`;
        }

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: msg,
          pricingData: pricing,
          v2Result,
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `⚠️ **Geen resultaten gevonden** voor "${searchDesc}".\n\nProbeer andere zoektermen of upload foto's voor een betere match.`,
        }]);
      }
    } catch (err) {
      console.error('Manual search error:', err);
      setMessages(prev => prev.filter(m => !m.content.includes('Even geduld, ik doorzoek')));
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ **Zoeken mislukt.** Probeer het later opnieuw.`,
      }]);
    } finally {
      setIsManualSearching(false);
    }
  };

  const saveToCollection = async () => {
    if (!user || !verifiedResult || !verifiedResult.discogs_id) {
      toast({ title: "Kan niet opslaan", description: "Je moet ingelogd zijn en een geverifieerde release hebben.", variant: "destructive" });
      return;
    }

    setIsSavingToCollection(true);
    try {
      const table = mediaType === 'cd' ? 'cd_scan' : 'vinyl2_scan';
      const pricing = verifiedResult.pricing_stats;

      const record: Record<string, any> = {
        user_id: user.id,
        artist: verifiedResult.artist,
        title: verifiedResult.title,
        label: verifiedResult.label,
        catalog_number: verifiedResult.catalog_number,
        year: verifiedResult.year,
        discogs_id: verifiedResult.discogs_id,
        discogs_url: `https://www.discogs.com/release/${verifiedResult.discogs_id}`,
        country: verifiedResult.country,
        format: verifiedResult.format,
        genre: verifiedResult.genre,
        barcode_number: verifiedResult.barcode,
        matrix_number: verifiedResult.matrix_number,
        condition_grade: conditionMedia || 'Not Graded',
        is_public: false,
        is_for_sale: false,
        calculated_advice_price: calculateAdvicePrice(pricing?.median_price, conditionMedia, conditionSleeve, pricing?.lowest_price, pricing?.highest_price) ?? pricing?.median_price ?? null,
        lowest_price: pricing?.lowest_price ?? null,
        median_price: pricing?.median_price ?? null,
        highest_price: pricing?.highest_price ?? null,
      };

      // Add sleeve condition for cd_scan table
      if (mediaType === 'cd' && conditionSleeve) {
        record.marketplace_sleeve_condition = conditionSleeve;
      }

      // Add first photo as image
      if (photoUrls.length > 0) {
        if (mediaType === 'cd') {
          record.front_image = photoUrls[0];
          if (photoUrls[1]) record.back_image = photoUrls[1];
        } else {
          record.catalog_image = photoUrls[0];
          if (photoUrls[1]) record.matrix_image = photoUrls[1];
        }
      }

      const { error } = await supabase.from(table).insert(record);
      if (error) throw error;

      setSavedToCollection(true);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `✅ **Opgeslagen!** ${verifiedResult.artist} - ${verifiedResult.title} staat nu in je catalogus.\n\nJe kunt de conditie, prijs en winkelstatus later aanpassen in je collectie.`,
      }]);

      toast({ title: "Opgeslagen in catalogus", description: `${verifiedResult.artist} - ${verifiedResult.title}` });
    } catch (err) {
      console.error('Save to collection error:', err);
      toast({ title: "Opslaan mislukt", description: err instanceof Error ? err.message : "Fout", variant: "destructive" });
    } finally {
      setIsSavingToCollection(false);
    }
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
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
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

              {/* Discogs link + Save button */}
              {msg.v2Result?.discogs_id && (
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <a
                    href={`https://www.discogs.com/release/${msg.v2Result.discogs_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Bekijk op Discogs
                  </a>
                  {msg.pricingData && !savedToCollection && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={saveToCollection}
                      disabled={isSavingToCollection || !user}
                    >
                      {isSavingToCollection ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Save className="h-3 w-3" />
                      )}
                      Opslaan in catalogus
                    </Button>
                  )}
                  {msg.pricingData && savedToCollection && (
                    <span className="inline-flex items-center gap-1 text-xs text-primary">
                      <Check className="h-3 w-3" />
                      Opgeslagen
                    </span>
                  )}
                </div>
              )}

              {/* Pricing card inline */}
              {msg.pricingData && (msg.pricingData.lowest_price || msg.pricingData.median_price || msg.pricingData.highest_price) && (
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
                        <div className="text-base font-bold text-foreground">€{Number(msg.pricingData.highest_price).toFixed(2)}</div>
                      </div>
                    )}
                  </div>
              {msg.pricingData.num_for_sale != null && msg.pricingData.num_for_sale > 0 && (
                    <div className="text-xs text-muted-foreground text-center mt-2">
                      {msg.pricingData.num_for_sale} exemplaren te koop op Discogs
                    </div>
                  )}
                </div>
              )}

              {/* Marketplace listings */}
              {msg.pricingData?.marketplace_listings && msg.pricingData.marketplace_listings.length > 0 && (
                <div className="mt-3 p-3 bg-background/60 rounded-lg border border-border/50">
                  <div className="text-xs font-semibold mb-2 flex items-center gap-1">
                    🏪 {msg.pricingData.num_for_sale || msg.pricingData.marketplace_listings.length} exemplaren te koop
                  </div>
                  <div className="space-y-1.5">
                    {msg.pricingData.marketplace_listings.slice(0, 5).map((listing, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs gap-2 py-1 border-b border-border/30 last:border-0">
                        <span className="font-semibold text-primary min-w-[60px]">€{listing.price.toFixed(2)}</span>
                        <span className="text-muted-foreground truncate flex-1">
                          {listing.condition_media}{listing.condition_sleeve && listing.condition_sleeve !== 'Unknown' ? ` / ${listing.condition_sleeve}` : ''}
                        </span>
                        <span className="text-muted-foreground text-right min-w-[70px]">{listing.ships_from}</span>
                      </div>
                    ))}
                  </div>
                  {msg.v2Result?.discogs_id && (
                    <a
                      href={`https://www.discogs.com/sell/release/${msg.v2Result.discogs_id}?curr=EUR`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Bekijk alle aanbiedingen
                    </a>
                  )}
                </div>
              )}

              {/* Condition grading panel - shown after pricing for verified results */}
              {msg.v2Result?.discogs_id && msg.pricingData && !savedToCollection && (
                <ConditionGradingPanel
                  mediaType={mediaType}
                  conditionMedia={conditionMedia}
                  conditionSleeve={conditionSleeve}
                  medianPrice={msg.pricingData.median_price}
                  lowestPrice={msg.pricingData.lowest_price}
                  highestPrice={msg.pricingData.highest_price}
                  onConditionMediaChange={setConditionMedia}
                  onConditionSleeveChange={setConditionSleeve}
                />
              )}

              {/* V2 Suggestions buttons */}
              {msg.v2Result?.suggestions && msg.v2Result.suggestions.length > 0 && !msg.pricingData && (
                <div className="mt-3 space-y-2">
                  {msg.v2Result.suggestions.slice(0, 4).map((sug) => (
                    <Button
                      key={sug.release_id}
                      variant="outline"
                      size="sm"
                      className="w-full justify-between text-left h-auto py-2"
                      onClick={() => selectCandidate(sug.release_id || sug.id)}
                      disabled={isRunningV2}
                    >
                      <div className="flex flex-col items-start min-w-0">
                        <span className="text-xs font-medium truncate w-full">{sug.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {sug.country || ''}{sug.year ? ` (${sug.year})` : ''}
                          {sug.catno ? ` · ${sug.catno}` : ''}
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

        {/* Welcome action buttons */}
        {showWelcomeActions && !mediaType && messages.length === 1 && (
          <div className="flex gap-3 justify-center my-3">
            <Button variant="outline" size="lg" onClick={pickScanAction} className="h-16 px-8 flex flex-col gap-1.5 border-primary/30 hover:border-primary hover:bg-primary/5">
              <ScanLine className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Scannen</span>
            </Button>
            <Button variant="outline" size="lg" onClick={pickAskAction} className="h-16 px-8 flex flex-col gap-1.5 border-primary/30 hover:border-primary hover:bg-primary/5">
              <MessageCircle className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Stel een vraag</span>
            </Button>
          </div>
        )}

        {/* Media type picker - shown after choosing "Scannen" */}
        {!showWelcomeActions && !mediaType && (
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

        {/* Suggestion chips - context aware */}
        <SuggestionChips
          verifiedResult={verifiedResult}
          savedToCollection={savedToCollection}
          isStreaming={isStreaming}
          isRunningV2={isRunningV2}
          lastAssistantContent={(() => {
            const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');
            return lastAssistant?.content || '';
          })()}
          hasNoMatch={(() => {
            const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');
            return !!(lastAssistant?.content?.includes('Geen match gevonden') || lastAssistant?.content?.includes('Geen eenduidige match'));
          })()}
          onSave={saveToCollection}
          onSend={(text) => {
            if (text === 'Ik typ de artiest en titel zelf in') {
              setShowManualSearch(true);
              setMessages(prev => [...prev, { role: 'user', content: '✏️ Ik typ de artiest en titel zelf in' }, { role: 'assistant', content: '📝 **Vul de gegevens in** die je weet. Hoe meer je invult, hoe preciezer het resultaat!' }]);
            } else {
              sendMessage(text);
            }
          }}
        />

        {/* Manual search form - inline in chat */}
        {showManualSearch && (
          <div className="mx-2 my-2">
            <ScannerManualSearch
              onSearch={handleManualSearch}
              isSearching={isManualSearching}
            />
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
                    onClick={() => cameraInputRef.current?.click()}
                    className="h-20 w-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center hover:border-primary/50 transition-colors"
                    title="Maak een foto"
                  >
                    <Camera className="h-5 w-5 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="h-20 w-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center hover:border-primary/50 transition-colors"
                    title="Kies uit galerij"
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
            onClick={() => cameraInputRef.current?.click()}
            disabled={isStreaming || isUploading || isRunningV2}
            className="shrink-0 h-[44px] w-[44px]"
            title="Maak een foto"
          >
            <Camera className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isStreaming || isUploading || isRunningV2}
            className="shrink-0 h-[44px] w-[44px]"
            title="Kies uit galerij"
          >
            <ImagePlus className="h-4 w-4" />
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
