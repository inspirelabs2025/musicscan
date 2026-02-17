import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Send, Loader2, Disc3, Disc, RotateCcw, Camera, X, ImagePlus, ExternalLink, Save, Check, Sparkles, MessageCircle, ScanLine, Search, HelpCircle, Mic } from 'lucide-react';
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
import { ArtistContentCards } from '@/components/scanner/ArtistContentCards';
import { useArtistContent } from '@/hooks/useArtistContent';
import { ScannerManualSearch } from '@/components/scanner/ScannerManualSearch';
import { getDeviceFingerprint } from '@/utils/deviceFingerprint';
import { useLanguage } from '@/contexts/LanguageContext';

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
    .replace(/\[([^\]]*)\]\(https?:\/\/(?:www\.)?discogs\.com\/release\/\d+[^)]*\)/g, '')
    .replace(/https?:\/\/(?:www\.)?discogs\.com\/release\/\d+\S*/g, '')
    .replace(/^.*(?:Discogs|Release)\s*(?:ID|nummer|#)\s*[:=]?\s*\d+.*$/gim, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

// Helper to build localized suggestion pools
function buildSuggestionPools(sc: any) {
  const DISCOVERY_SUGGESTIONS = [
    { emoji: '💾', text: sc.saveToCollection },
    { emoji: '🎉', text: sc.funFacts },
    { emoji: '🎤', text: sc.tellMoreArtist },
    { emoji: '💰', text: sc.whatIsItWorth },
    { emoji: '🎵', text: sc.bestKnownTracks },
    { emoji: '📸', text: sc.scanAnother },
  ];

  const SAVED_SUGGESTIONS = [
    { emoji: '🎉', text: sc.funFacts },
    { emoji: '🎤', text: sc.tellMoreArtist },
    { emoji: '💿', text: sc.otherAlbumsToKnow },
    { emoji: '🎵', text: sc.bestKnownTracks },
    { emoji: '📅', text: sc.musicSceneBack },
    { emoji: '📸', text: sc.scanAnother },
  ];

  const UPLOAD_PHASE_SUGGESTIONS = [
    { emoji: '✏️', text: sc.typeMyself },
    { emoji: '💡', text: sc.scanTips },
  ];

  const NO_MATCH_SUGGESTIONS = [
    { emoji: '📸', text: sc.uploadMorePhotosShort },
    { emoji: '🔍', text: sc.lookAtMatrixAgain },
    { emoji: '✏️', text: sc.typeMyself },
    { emoji: '💡', text: sc.whereIsMatrix },
  ];

  const WELCOME_SUGGESTIONS = [
    { emoji: '❓', text: sc.whatCanMikeDo },
    { emoji: '💡', text: sc.howDoesScanner },
  ];

  const ARTIST_FOLLOWUP_SUGGESTIONS = [
    { emoji: '📚', text: sc.moreAboutArtist },
    { emoji: '💿', text: sc.mostWantedAlbums },
    { emoji: '🎸', text: sc.whoCollaborated },
    { emoji: '🏆', text: sc.awardsWon },
    { emoji: '📸', text: sc.scanAnother },
  ];

  const ALBUM_FOLLOWUP_SUGGESTIONS = [
    { emoji: '🤔', text: sc.tellMoreAboutThat },
    { emoji: '🎤', text: sc.whatAboutArtist },
    { emoji: '🔍', text: sc.specialRecordingFacts },
    { emoji: '📅', text: sc.musicSceneBack },
    { emoji: '💰', text: sc.whatIsItWorth },
    { emoji: '📸', text: sc.scanAnother },
  ];

  const VALUE_FOLLOWUP_SUGGESTIONS = [
    { emoji: '📈', text: sc.valueGoingUpDown },
    { emoji: '💎', text: sc.mostWantedVersions },
    { emoji: '🎉', text: sc.funFacts },
    { emoji: '📸', text: sc.scanAnother },
  ];

  const SCAN_GUIDE_FOLLOWUP_SUGGESTIONS = [
    { emoji: '📸', text: sc.scanOne },
    { emoji: '✏️', text: sc.typeMyself },
    { emoji: '💡', text: sc.scanExplanation },
  ];

  const GENERAL_FOLLOWUP_SUGGESTIONS = [
    { emoji: '🤔', text: sc.tellMoreAboutThat },
    { emoji: '🎵', text: sc.recommendedTracks },
    { emoji: '📚', text: sc.moreFunFacts },
    { emoji: '🎤', text: sc.whatAboutArtist },
    { emoji: '💿', text: sc.otherAlbumsToKnow },
    { emoji: '🏆', text: sc.isAlbumIconic },
    { emoji: '🎸', text: sc.whoCollaborated },
    { emoji: '📅', text: sc.musicSceneBack },
    { emoji: '🔍', text: sc.specialRecordingFacts },
    { emoji: '💰', text: sc.whatIsItWorth },
  ];

  return {
    DISCOVERY_SUGGESTIONS, SAVED_SUGGESTIONS, UPLOAD_PHASE_SUGGESTIONS,
    NO_MATCH_SUGGESTIONS, WELCOME_SUGGESTIONS, ARTIST_FOLLOWUP_SUGGESTIONS,
    ALBUM_FOLLOWUP_SUGGESTIONS, VALUE_FOLLOWUP_SUGGESTIONS,
    SCAN_GUIDE_FOLLOWUP_SUGGESTIONS, GENERAL_FOLLOWUP_SUGGESTIONS,
  };
}

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Detect conversation context from last assistant message
function detectFollowupPool(content: string, pools: ReturnType<typeof buildSuggestionPools>): Array<{ emoji: string; text: string }> {
  const lower = content.toLowerCase();
  const scanGuideKeywords = ['belichting', 'matrixnummer', 'barcode', 'hoek', 'scherpte', 'scanfoto', 'scantips', 'flash', 'daglicht', 'lighting', 'sharpness'];
  const scanGuideHits = scanGuideKeywords.filter(kw => lower.includes(kw)).length;
  if (scanGuideHits >= 2) return pools.SCAN_GUIDE_FOLLOWUP_SUGGESTIONS;
  if (lower.includes('artiest') || lower.includes('artist') || lower.includes('biografie') || lower.includes('biography') || lower.includes('carrière') || lower.includes('career') || lower.includes('band')) {
    return pools.ARTIST_FOLLOWUP_SUGGESTIONS;
  }
  if (lower.includes('waarde') || lower.includes('value') || lower.includes('prijs') || lower.includes('price') || lower.includes('€') || lower.includes('marktplaats') || lower.includes('marketplace') || lower.includes('median')) {
    return pools.VALUE_FOLLOWUP_SUGGESTIONS;
  }
  if (lower.includes('opname') || lower.includes('recording') || lower.includes('studio') || lower.includes('producer') || lower.includes('feitje') || lower.includes('fact') || lower.includes('weetje')) {
    return pools.ALBUM_FOLLOWUP_SUGGESTIONS;
  }
  return pools.GENERAL_FOLLOWUP_SUGGESTIONS;
}

interface SuggestionChipsProps {
  verifiedResult: V2PipelineResult | null;
  savedToCollection: boolean;
  isStreaming: boolean;
  isRunningV2: boolean;
  lastAssistantContent: string;
  hasNoMatch: boolean;
  artistContent?: { artistStory: any; albumStories: any[]; singles: any[]; anecdotes: any[]; products: any[]; totalCount: number } | null;
  onSave: () => void;
  onSend: (text: string) => void;
}

const SuggestionChips: React.FC<SuggestionChipsProps> = React.memo(({
  verifiedResult, savedToCollection, isStreaming, isRunningV2, lastAssistantContent, hasNoMatch, artistContent, onSave, onSend,
}) => {
  const { tr } = useLanguage();
  const sc = tr.scanChatUI;

  const pools = useMemo(() => buildSuggestionPools(sc), [sc]);

  const suggestions = useMemo(() => {
    if (hasNoMatch) return pickRandom(pools.NO_MATCH_SUGGESTIONS, 3);
    
    if (verifiedResult?.discogs_id) {
      const pool = savedToCollection ? pools.SAVED_SUGGESTIONS : pools.DISCOVERY_SUGGESTIONS;
      const filtered = savedToCollection ? pool : pool.filter(s => s.text !== sc.saveToCollection);
      const base = pickRandom(filtered, 3);
      
      const platformChips: Array<{ emoji: string; text: string }> = [];
      if (artistContent?.artistStory) {
        platformChips.push({ emoji: '📖', text: sc.readArtistStory.replace('{artist}', verifiedResult.artist || '') });
      }
      if (artistContent?.products && artistContent.products.length > 0) {
        platformChips.push({ emoji: '🛍️', text: sc.viewArtistProducts.replace('{artist}', verifiedResult.artist || '') });
      }
      if (artistContent?.anecdotes && artistContent.anecdotes.length > 0) {
        platformChips.push({ emoji: '💡', text: sc.knowThisAnecdote });
      }
      
      const selected = [...platformChips.slice(0, 2), ...base.slice(0, 3 - Math.min(platformChips.length, 2))];
      return selected;
    }
    
    const isPhotoPrompt = lastAssistantContent?.includes('Upload') || lastAssistantContent?.includes('Eerste knop') || lastAssistantContent?.includes('First button');
    if (isPhotoPrompt) return pools.UPLOAD_PHASE_SUGGESTIONS;
    
    const isWelcome = lastAssistantContent?.includes('Magic Mike');
    const isSetupMessage = lastAssistantContent?.includes('Kies hieronder') || 
      lastAssistantContent?.includes('Choose below') ||
      lastAssistantContent?.includes('Typ je vraag hieronder') ||
      lastAssistantContent?.includes('Type your question') ||
      lastAssistantContent?.includes('Wil je iets **scannen**') ||
      lastAssistantContent?.includes('Want to **scan**') ||
      lastAssistantContent?.includes('Wat wil je scannen');
    if (isWelcome || isSetupMessage) return [];
    
    if (lastAssistantContent && lastAssistantContent.length > 50) {
      const pool = detectFollowupPool(lastAssistantContent, pools);
      return pickRandom(pool, 3);
    }
    
    if (lastAssistantContent) return pickRandom(pools.GENERAL_FOLLOWUP_SUGGESTIONS, 3);
    
    return [];
  }, [verifiedResult?.discogs_id, verifiedResult?.artist, savedToCollection, lastAssistantContent, hasNoMatch, artistContent?.totalCount, pools, sc]);

  if (isStreaming || isRunningV2 || suggestions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 my-3 px-1 animate-fadeIn">
      {verifiedResult?.discogs_id && !savedToCollection && (
        <Button
          variant="default"
          size="sm"
          className="h-9 text-xs gap-2 rounded-full shadow-sm hover:shadow-md transition-all"
          onClick={onSave}
        >
          <Save className="h-3.5 w-3.5" />
          {sc.saveToCatalog}
        </Button>
      )}
      {suggestions.map((sug, i) => {
        const displayText = sug.text === sc.scanAnother && !verifiedResult?.discogs_id
          ? sc.scanOne
          : sug.text;
        return (
        <Button
          key={i}
          variant="outline"
          size="sm"
          className="h-9 text-xs gap-2 rounded-full border-border/50 bg-card/80 backdrop-blur-sm hover:bg-primary/10 hover:border-primary/30 hover:shadow-sm transition-all"
          onClick={() => onSend(sug.text)}
        >
          <span className="text-base leading-none">{sug.emoji}</span>
          {displayText}
        </Button>
        );
      })}
    </div>
  );
});
SuggestionChips.displayName = 'SuggestionChips';

export interface ScanChatTabHandle {
  triggerListening: () => void;
}

interface ScanChatTabProps {
  autoStartListening?: number;
}

export const ScanChatTab = React.forwardRef<ScanChatTabHandle, ScanChatTabProps>(function ScanChatTab({ autoStartListening = 0 }, ref) {
  const { user } = useAuth();
  const { tr } = useLanguage();
  const sc = tr.scanChatUI;
  const lastListenTrigger = useRef(0);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: sc.welcomeMessage,
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
   const [isListening, setIsListening] = useState(false);
   const [listeningProgress, setListeningProgress] = useState(0);
   const [isRecognizing, setIsRecognizing] = useState(false);

  // Artist content for platform enrichment
  const currentArtistName = verifiedResult?.artist || null;
  const artistContent = useArtistContent(currentArtistName);
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
    const label = type === 'vinyl' ? sc.vinylFull : sc.cdFull;
    setMessages(prev => [
      ...prev,
      { role: 'user', content: type === 'vinyl' ? sc.vinylLabel : sc.cdLabel },
      {
        role: 'assistant',
        content: sc.uploadPrompt.replace('{label}', label),
      },
    ]);
  };

  const pickScanAction = () => {
    setShowWelcomeActions(false);
    setMessages(prev => [
      ...prev,
      { role: 'user', content: sc.scanAction },
      {
        role: 'assistant',
        content: sc.whatToScan,
      },
    ]);
  };

  const pickAskAction = () => {
    setShowWelcomeActions(false);
    setMediaType('cd');
    setMessages(prev => [
      ...prev,
      { role: 'user', content: sc.askAction },
      {
        role: 'assistant',
        content: sc.askIntro,
      },
    ]);
  };

  const startListening = useCallback(async () => {
    if (typeof MediaRecorder === 'undefined') {
      toast({ 
        title: sc.notSupported, 
        description: sc.notSupportedDesc, 
        variant: "destructive" 
      });
      return;
    }
    console.log('[music-rec] MediaRecorder supported:', true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: false, 
          noiseSuppression: false, 
          autoGainControl: false,
          sampleRate: 44100,
          channelCount: 1
        } 
      });
      setIsListening(true);
      setListeningProgress(0);
      setShowWelcomeActions(false);

      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg']
        .find(type => MediaRecorder.isTypeSupported(type)) || 'audio/webm';
      console.log('[music-rec] Selected mimeType:', mimeType);
      const mediaRecorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 256000 });
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => { 
        if (e.data.size > 0) {
          chunks.push(e.data);
          console.log(`[music-rec] chunk received: ${e.data.size} bytes`);
        }
      };

      const totalSeconds = 12;
      let elapsed = 0;
      const interval = setInterval(() => {
        elapsed++;
        setListeningProgress(Math.round((elapsed / totalSeconds) * 100));
        if (elapsed >= totalSeconds) clearInterval(interval);
      }, 1000);

      mediaRecorder.onstop = async () => {
        clearInterval(interval);
        setIsListening(false);
        setListeningProgress(0);
        stream.getTracks().forEach(t => t.stop());

        const blob = new Blob(chunks, { type: mediaRecorder.mimeType });
        const blobType = blob.type || mediaRecorder.mimeType || mimeType;
        console.log(`[music-rec] Total blob size: ${blob.size} bytes, chunks: ${chunks.length}, type: ${blobType}`);
        
        if (blob.size < 10000) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `${sc.tooLittleAudio} (${Math.round(blob.size/1024)}KB). ${sc.ensureMusicAudible}`,
          }]);
          return;
        }
        
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          if (!base64) return;

          console.log(`[music-rec] Sending ${base64.length} chars base64 (${Math.round(base64.length * 0.75 / 1024)}KB), mimeType=${blobType}`);

          setIsRecognizing(true);
          setMessages(prev => [...prev, 
            { role: 'user', content: sc.recognizeMusic },
            { role: 'assistant', content: sc.listening }
          ]);

          try {
            const { data, error } = await supabase.functions.invoke('recognize-music', {
              body: { audio: base64, mimeType: blobType }
            });

            if (error) throw error;

            setMessages(prev => prev.filter(m => !m.content.includes('luisteren') && !m.content.includes('Listening')));

            if (data?.recognized) {
              let msg = `${sc.songRecognized}\n\n`;
              msg += `🎤 **${data.artist}** — *${data.title}*\n`;
              if (data.album) msg += `💿 ${sc.album}: ${data.album}\n`;
              if (data.release_date) msg += `📅 ${data.release_date}\n`;
              if (data.spotify_url) msg += `\n🎧 [${sc.listenOnSpotify}](${data.spotify_url})\n`;
              msg += `\n${sc.wantToKnowMore}`;

              setMessages(prev => [...prev, { role: 'assistant', content: msg }]);
            } else {
              setMessages(prev => [...prev, {
                role: 'assistant',
                content: sc.notRecognized,
              }]);
            }
          } catch (err) {
            console.error('Music recognition error:', err);
            setMessages(prev => prev.filter(m => !m.content.includes('luisteren') && !m.content.includes('Listening')));
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: `${sc.recognitionFailed} ${err instanceof Error ? err.message : ''}`,
            }]);
          } finally {
            setIsRecognizing(false);
          }
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorder.start();
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, totalSeconds * 1000);

    } catch (err) {
      console.error('Microphone error:', err);
      setIsListening(false);
      toast({ title: sc.micNotAvailable, description: sc.micNotAvailableDesc, variant: "destructive" });
    }
  }, [sc]);

  React.useImperativeHandle(ref, () => ({
    triggerListening: () => startListening(),
  }), [startListening]);

  useEffect(() => {
    if (autoStartListening > 0 && autoStartListening !== lastListenTrigger.current) {
      lastListenTrigger.current = autoStartListening;
      startListening();
    }
  }, [autoStartListening, startListening]);

  const handleScanGuide = () => {
    sendMessage(sc.scanGuideRequest);
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
        headers: { 'x-device-fingerprint': getDeviceFingerprint() },
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

      const result = data?.result || data;
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
      content: sc.chooseRelease.replace('{id}', String(releaseId)),
    }, {
      role: 'assistant',
      content: sc.verifyingRelease.replace('{id}', String(releaseId)),
    }]);

    try {
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-and-enrich-release', {
        body: { discogs_id: releaseId }
      });
      if (verifyError) throw verifyError;

      const enrichment = verifyData?.enrichment;
      const vArtist = enrichment?.artist || '';
      const vTitle = enrichment?.title || '';

      const { data: pricingResp } = await supabase.functions.invoke('fetch-discogs-pricing', {
        body: { discogs_id: releaseId }
      });

      const pricing: PricingData = {
        lowest_price: pricingResp?.lowest_price ?? null,
        median_price: pricingResp?.median_price ?? null,
        highest_price: pricingResp?.highest_price ?? null,
        num_for_sale: pricingResp?.num_for_sale ?? null,
      };

      setMessages(prev => prev.filter(m => !m.content.includes(sc.verifyingRelease.split(' ')[0])));

      let msg = `✅ **${vArtist} - ${vTitle}**\n`;
      msg += `🔗 [${sc.viewOnDiscogs}](https://www.discogs.com/release/${releaseId})\n\n`;

      if (pricing.lowest_price || pricing.median_price || pricing.highest_price) {
        msg += `💰 **${sc.pricingInfo}:**\n`;
        if (pricing.lowest_price) msg += `📉 **${sc.lowest}:** €${Number(pricing.lowest_price).toFixed(2)}\n`;
        if (pricing.median_price) msg += `📊 **${sc.median}:** €${Number(pricing.median_price).toFixed(2)}\n`;
        if (pricing.highest_price) msg += `📈 **${sc.highest}:** €${Number(pricing.highest_price).toFixed(2)}\n`;
        if (pricing.num_for_sale) msg += `\n🏪 **${pricing.num_for_sale}** ${sc.copiesForSale}`;
      }

      setMessages(prev => [...prev, { role: 'assistant', content: msg, pricingData: pricing }]);
    } catch (err) {
      console.error('Select candidate error:', err);
      setMessages(prev => {
        const filtered = prev.filter(m => !m.content.includes(sc.verifyingRelease.split(' ')[0]));
        return [...filtered, { role: 'assistant', content: sc.couldNotFetchRelease }];
      });
    } finally {
      setIsRunningV2(false);
    }
  };

  const uploadAndSend = async () => {
    if (pendingFiles.length === 0) return;
    if (!mediaType) {
      setMediaType('vinyl');
    }
    const effectiveMediaType = mediaType || 'vinyl';
    setIsUploading(true);

    try {
      const urls: string[] = [];
      for (const file of pendingFiles) {
        const uid = Math.random().toString(36).substring(2, 10);
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `scan-chat/${Date.now()}-${uid}-${safeName}`;
        const { error } = await supabase.storage.from('vinyl_images').upload(fileName, file, { upsert: true });
        if (error) throw new Error(`Upload failed: ${error.message}`);
        const { data: { publicUrl } } = supabase.storage.from('vinyl_images').getPublicUrl(fileName);
        urls.push(publicUrl);
      }

      const previews = pendingFiles.map(f => URL.createObjectURL(f));
      const allUrls = [...photoUrls, ...urls];
      setPhotoUrls(allUrls);

      const typeLabel = effectiveMediaType === 'vinyl' ? sc.vinylFull : sc.cdFull;
      const userContent = sc.uploadedPhotos.replace('{count}', String(pendingFiles.length)).replace('{type}', typeLabel);
      const userMsg: ChatMessage = { role: 'user', content: userContent, images: previews };

      setPendingFiles([]);
      await sendMessage(userContent, allUrls, userMsg);
    } catch (err) {
      console.error('Upload error:', err);
      toast({ title: sc.uploadFailed, description: err instanceof Error ? err.message : "Error", variant: "destructive" });
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
      // Fetch collection context for logged-in users
      let collectionPrefix = '';
      if (user?.id) {
        try {
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
          if (total > 0) {
            const allItems = [
              ...(cdItemsRes.data || []).map(i => ({ ...i, media_type: 'CD' })),
              ...(vinylItemsRes.data || []).map(i => ({ ...i, media_type: 'Vinyl' })),
              ...(aiItemsRes.data || []).map(i => ({ ...i, media_type: 'AI-scan', calculated_advice_price: null })),
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
            collectionPrefix = `[COLLECTIE_CONTEXT]\nTotaal: ${total} items (${cdCount} CD's, ${vinylCount} vinyl, ${aiCount} AI-scans)\nGeschatte totaalwaarde: €${totalValue.toFixed(2)}\nTop artiesten: ${topArtists || 'Geen data'}\nTop genres: ${topGenres || 'Geen data'}\n\nLaatste 10 items:\n${recentItems}\n[/COLLECTIE_CONTEXT]\n\n`;
          }
        } catch (err) {
          console.error('[scan-chat] Failed to fetch collection context:', err);
        }
      }

      // Build platform content context tag
      let platformContentTag = '';
      if (verifiedResult && currentArtistName && artistContent.totalCount > 0) {
        const parts: string[] = [];
        if (artistContent.artistStory) parts.push(`een artiestenverhaal over ${currentArtistName}`);
        if (artistContent.albumStories.length > 0) parts.push(`${artistContent.albumStories.length} albumverhalen`);
        if (artistContent.singles.length > 0) parts.push(`${artistContent.singles.length} singles`);
        if (artistContent.anecdotes.length > 0) parts.push(`${artistContent.anecdotes.length} anekdotes`);
        if (artistContent.products.length > 0) parts.push(`${artistContent.products.length} producten in de shop`);
        platformContentTag = `[PLATFORM_CONTENT: We hebben ${parts.join(', ')} over ${currentArtistName} op het platform]\n\n`;
      }

      const chatMessages = messages
        .filter(m => !m.content.includes('Even geduld...') && !m.content.includes('Please wait...'))
        .map(m => ({
          role: m.role,
          content: m.role === 'user' ? m.content : cleanDisplayText(m.content),
        }));

      const enrichedText = collectionPrefix + platformContentTag + text;
      const enrichedMessages = [...chatMessages, { role: 'user', content: enrichedText }];

      const activeUrls = urls || photoUrls;

      // Use fetch directly for SSE streaming (supabase.functions.invoke doesn't support streaming)
      const { data: { session } } = await supabase.auth.getSession();
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const authToken = session?.access_token || SUPABASE_ANON_KEY;

      const resp = await fetch(`${SUPABASE_URL}/functions/v1/scan-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
          apikey: SUPABASE_ANON_KEY,
          'x-device-fingerprint': getDeviceFingerprint(),
        },
        body: JSON.stringify({
          messages: enrichedMessages,
          photoUrls: activeUrls.length > 0 ? activeUrls : undefined,
          mediaType: mediaType || undefined,
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({ error: 'Onbekende fout' }));
        throw new Error(errData.error || `HTTP ${resp.status}`);
      }
      if (!resp.body) throw new Error('Geen stream');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '' || !line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') break;
          try {
            const json = JSON.parse(payload);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) upsertAssistant(delta);
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      setIsStreaming(false);

      // ─── Auto-trigger V2 pipeline after AI analysis for photo-based messages ───
      if (activeUrls.length > 0 && !verifiedResult && mediaType) {
        setIsRunningV2(true);

        const lastScanData = extractScanData(assistantSoFar);
        const chatRightsSocieties = lastScanData?.rights_societies || [];
        if (chatRightsSocieties.length > 0) {
          console.log('🏛️ Magic Mike detected rights societies:', chatRightsSocieties);
        }

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: sc.patience,
        }]);

        const v2Result = await runV2Pipeline(activeUrls, mediaType, chatRightsSocieties);

        setMessages(prev => prev.filter(m => !m.content.includes('Even geduld') && !m.content.includes('Please wait')));

        if (v2Result && v2Result.discogs_id) {
          const isVerified = v2Result.verification?.status === 'verified' || v2Result.status === 'single_match';
          const isLikely = v2Result.verification?.status === 'likely' || v2Result.status === 'multiple_candidates';
          const statusEmoji = isVerified ? '✅' : isLikely ? '🟡' : '🔵';
          const statusLabel = isVerified ? sc.verified : isLikely ? sc.likelyCorrect : sc.suggestedMatch;

          let resultMsg = `${statusEmoji} **${statusLabel}** — **${v2Result.artist} - ${v2Result.title}**\n`;
          if (v2Result.label) resultMsg += `🏷️ ${v2Result.label}`;
          if (v2Result.catalog_number) resultMsg += ` (${v2Result.catalog_number})`;
          if (v2Result.label || v2Result.catalog_number) resultMsg += `\n`;
          if (v2Result.country || v2Result.year) {
            resultMsg += `📀 ${v2Result.country || ''}${v2Result.year ? ` (${v2Result.year})` : ''}\n`;
          }
          resultMsg += `📊 ${sc.confidence}: ${((v2Result.confidence_score || 0) * 100).toFixed(0)}%\n`;
          resultMsg += `🔗 [${sc.viewOnDiscogs}](https://www.discogs.com/release/${v2Result.discogs_id})\n`;

          if (v2Result.verification?.confirmations?.length) {
            resultMsg += `\n🔒 **${sc.verification}:** ${v2Result.verification.confirmations.join(', ')}\n`;
          }

          if (v2Result.rights_society_exclusions && v2Result.rights_society_exclusions.length > 0) {
            resultMsg += `\n⛔ **${sc.excludedReleases}:**\n`;
            for (const excl of v2Result.rights_society_exclusions) {
              resultMsg += `- ${excl}\n`;
            }
          }

          const pricing: PricingData = {
            lowest_price: v2Result.pricing_stats?.lowest_price ?? null,
            median_price: v2Result.pricing_stats?.median_price ?? null,
            highest_price: v2Result.pricing_stats?.highest_price ?? null,
            num_for_sale: v2Result.pricing_stats?.num_for_sale ?? null,
          };

          if (pricing.lowest_price || pricing.median_price || pricing.highest_price) {
            resultMsg += `\n💰 **${sc.pricingInfo}:**\n`;
            if (pricing.lowest_price) resultMsg += `📉 **${sc.lowest}:** €${Number(pricing.lowest_price).toFixed(2)}\n`;
            if (pricing.median_price) resultMsg += `📊 **${sc.median}:** €${Number(pricing.median_price).toFixed(2)}\n`;
            if (pricing.highest_price) resultMsg += `📈 **${sc.highest}:** €${Number(pricing.highest_price).toFixed(2)}\n`;
            if (pricing.num_for_sale) resultMsg += `\n🏪 **${pricing.num_for_sale}** ${sc.copiesForSaleDiscogs}`;
          }

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

          if (v2Result.suggestions && v2Result.suggestions.length > 1) {
            resultMsg += `\n\n📋 **${sc.otherPossibleReleases}:**`;
          }

          setVerifiedResult(v2Result);

          setMessages(prev => [...prev, {
            role: 'assistant',
            content: resultMsg,
            pricingData: pricing,
            v2Result,
          }]);

        } else if (v2Result && v2Result.suggestions && v2Result.suggestions.length > 0) {
          let sugMsg = `${sc.noUniqueMatch}\n\n`;
          sugMsg += `${sc.scannerRecognized.replace('{artist}', v2Result.artist || '?').replace('{title}', v2Result.title || '?')}\n\n`;

          if (v2Result.rights_society_exclusions && v2Result.rights_society_exclusions.length > 0) {
            sugMsg += `⛔ **${sc.excludedBasedOnRights}:**\n`;
            for (const excl of v2Result.rights_society_exclusions) {
              sugMsg += `- ${excl}\n`;
            }
            sugMsg += `\n`;
          }

          sugMsg += sc.selectCorrectRelease;

          setMessages(prev => [...prev, {
            role: 'assistant',
            content: sugMsg,
            v2Result,
          }]);

        } else {
          let noMatchMsg = `${sc.noMatchFound}\n\n`;
          
          if (v2Result?.artist || v2Result?.title) {
            noMatchMsg += `🔎 ${sc.recognized}: **${v2Result.artist || '?'} - ${v2Result.title || '?'}**\n\n`;
          }

          if (v2Result?.rights_society_exclusions && v2Result.rights_society_exclusions.length > 0) {
            noMatchMsg += `⛔ **${sc.excludedReleases}:**\n`;
            for (const excl of v2Result.rights_society_exclusions) {
              noMatchMsg += `- ${excl}\n`;
            }
            noMatchMsg += `\n`;
          }

          noMatchMsg += sc.uploadMorePhotos;

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
      toast({ title: sc.chatError, description: err instanceof Error ? err.message : "Error", variant: "destructive" });
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

    const rejectKeywords = ['niet juist', 'niet correct', 'verkeerde', 'fout', 'klopt niet',
      'andere release', 'niet goed', 'opnieuw zoeken', 'wrong', 'incorrect', 'not correct'];
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
      content: sc.welcomeMessage,
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
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
    toast({ title: sc.chatReset, description: sc.readyForNewScan });
  };

  const handleManualSearch = async (artist: string, title: string, barcode?: string, year?: string, country?: string, matrix?: string) => {
    setIsManualSearching(true);
    setShowManualSearch(false);

    const searchDesc = [artist, title].filter(Boolean).join(' - ');
    setMessages(prev => [...prev, {
      role: 'user',
      content: sc.manualSearch.replace('{desc}', searchDesc),
    }, {
      role: 'assistant',
      content: sc.searching.replace('{desc}', searchDesc),
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

      setMessages(prev => prev.filter(m => !m.content.includes('doorzoek de database') && !m.content.includes('searching the database')));

      if (error) throw error;

      if (data?.results?.length > 0) {
        const topResult = data.results[0];
        const releaseId = topResult.discogs_id || topResult.id;

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
        msg += `🔗 [${sc.viewOnDiscogs}](https://www.discogs.com/release/${releaseId})\n`;

        const pricing: PricingData = {
          lowest_price: topResult.pricing_stats?.lowest_price ?? null,
          median_price: topResult.pricing_stats?.median_price ?? null,
          highest_price: topResult.pricing_stats?.highest_price ?? null,
          num_for_sale: topResult.pricing_stats?.num_for_sale ?? null,
        };

        if (pricing.lowest_price || pricing.median_price || pricing.highest_price) {
          msg += `\n💰 **${sc.pricingInfo}:**\n`;
          if (pricing.lowest_price) msg += `📉 **${sc.lowest}:** €${Number(pricing.lowest_price).toFixed(2)}\n`;
          if (pricing.median_price) msg += `📊 **${sc.median}:** €${Number(pricing.median_price).toFixed(2)}\n`;
          if (pricing.highest_price) msg += `📈 **${sc.highest}:** €${Number(pricing.highest_price).toFixed(2)}\n`;
          if (pricing.num_for_sale) msg += `\n🏪 **${pricing.num_for_sale}** ${sc.copiesForSaleDiscogs}`;
        }

        if (data.results.length > 1) {
          msg += `\n\n📋 **${sc.otherPossibleReleases}:**`;
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
          content: sc.noResultsFound.replace('{desc}', searchDesc),
        }]);
      }
    } catch (err) {
      console.error('Manual search error:', err);
      setMessages(prev => prev.filter(m => !m.content.includes('doorzoek de database') && !m.content.includes('searching the database')));
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: sc.searchFailed,
      }]);
    } finally {
      setIsManualSearching(false);
    }
  };

  const saveToCollection = async () => {
    if (!user || !verifiedResult || !verifiedResult.discogs_id) {
      toast({ title: sc.cannotSave, description: sc.cannotSaveDesc, variant: "destructive" });
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

      if (mediaType === 'cd' && conditionSleeve) {
        record.marketplace_sleeve_condition = conditionSleeve;
      }

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
        content: sc.savedMessage.replace('{artist}', verifiedResult.artist || '').replace('{title}', verifiedResult.title || ''),
      }]);

      toast({ title: sc.savedToCatalog, description: `${verifiedResult.artist} - ${verifiedResult.title}` });
    } catch (err) {
      console.error('Save to collection error:', err);
      toast({ title: sc.saveFailed, description: err instanceof Error ? err.message : "Error", variant: "destructive" });
    } finally {
      setIsSavingToCollection(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-280px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-3 py-3 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src={magicMikeAvatar} alt="Magic Mike" className="h-11 w-11 rounded-full object-cover object-top ring-2 ring-primary/40 shadow-lg" />
            <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-card" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight">Magic Mike</span>
            {mediaType && <span className="text-xs text-muted-foreground ml-1.5 bg-muted px-1.5 py-0.5 rounded-full">{mediaType === 'vinyl' ? sc.vinylLabel : sc.cdLabel}</span>}
            <p className="text-xs text-muted-foreground">{sc.musicDetective}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={resetChat} className="rounded-full h-8 w-8 border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 cursor-pointer relative z-10" title={sc.restart}>
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
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
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1 scroll-smooth">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2.5 animate-fadeIn`}>
            {msg.role === 'assistant' && (
              <img src={magicMikeAvatar} alt="Magic Mike" className="h-8 w-8 rounded-full object-cover object-top shrink-0 mt-1 ring-2 ring-primary/20 shadow-sm" />
            )}
            <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm shadow-sm transition-colors ${
              msg.role === 'user' 
                ? 'bg-primary text-primary-foreground rounded-br-md' 
                : 'bg-card/90 backdrop-blur-sm border border-border/40 rounded-bl-md'
            }`}>
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:leading-relaxed [&_li]:leading-relaxed">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({ href, children }) => (
                        <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline decoration-primary/30 hover:decoration-primary hover:text-primary/80 break-all transition-colors">
                          {children}
                        </a>
                      ),
                    }}
                  >{cleanDisplayText(msg.content) || '...'}</ReactMarkdown>
                </div>
              ) : (
                <>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  {msg.images && msg.images.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {msg.images.map((src, j) => (
                        <img key={j} src={src} alt={`${sc.photo} ${j + 1}`} className="h-16 w-16 object-cover rounded-lg border border-primary-foreground/20" />
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
                    {sc.viewOnDiscogs}
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
                      {sc.saveToCatalog}
                    </Button>
                  )}
                  {msg.pricingData && savedToCollection && (
                    <span className="inline-flex items-center gap-1 text-xs text-primary">
                      <Check className="h-3 w-3" />
                      {sc.saved}
                    </span>
                  )}
                </div>
              )}

              {/* Pricing card inline */}
              {msg.pricingData && (msg.pricingData.lowest_price || msg.pricingData.median_price || msg.pricingData.highest_price) && (
                <div className="mt-3 p-3 bg-gradient-to-br from-primary/5 to-transparent rounded-xl border border-primary/10">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {msg.pricingData.lowest_price && (
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{sc.lowest}</div>
                        <div className="text-lg font-bold text-primary">€{Number(msg.pricingData.lowest_price).toFixed(2)}</div>
                      </div>
                    )}
                    {msg.pricingData.median_price && (
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{sc.median}</div>
                        <div className="text-lg font-bold text-foreground">€{Number(msg.pricingData.median_price).toFixed(2)}</div>
                      </div>
                    )}
                    {msg.pricingData.highest_price && (
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{sc.highest}</div>
                        <div className="text-lg font-bold text-foreground">€{Number(msg.pricingData.highest_price).toFixed(2)}</div>
                      </div>
                    )}
                  </div>
              {msg.pricingData.num_for_sale != null && msg.pricingData.num_for_sale > 0 && (
                    <div className="text-xs text-muted-foreground text-center mt-2 pt-2 border-t border-border/30">
                      🏪 {msg.pricingData.num_for_sale} {sc.copiesForSaleDiscogs}
                    </div>
                  )}
                </div>
              )}

              {/* Marketplace listings */}
              {msg.pricingData?.marketplace_listings && msg.pricingData.marketplace_listings.length > 0 && (
                <div className="mt-3 p-3 bg-background/60 rounded-lg border border-border/50">
                  <div className="text-xs font-semibold mb-2 flex items-center gap-1">
                    🏪 {msg.pricingData.num_for_sale || msg.pricingData.marketplace_listings.length} {sc.copiesForSale}
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
                      {sc.viewAllOffers}
                    </a>
                  )}
                </div>
              )}

              {/* Condition grading panel */}
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
          <div className="flex gap-3 justify-center my-4 animate-fadeIn">
            <Button variant="outline" size="lg" onClick={pickScanAction} className="h-20 px-10 flex flex-col gap-2 rounded-2xl border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary hover:bg-primary/5 hover:shadow-md transition-all">
              <ScanLine className="h-7 w-7 text-primary" />
              <span className="text-sm font-semibold">{sc.scanButton}</span>
            </Button>
            <Button variant="outline" size="lg" onClick={pickAskAction} className="h-20 px-10 flex flex-col gap-2 rounded-2xl border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary hover:bg-primary/5 hover:shadow-md transition-all">
              <MessageCircle className="h-7 w-7 text-primary" />
              <span className="text-sm font-semibold">{sc.askButton}</span>
            </Button>
          </div>
        )}

        {/* Media type picker */}
        {!showWelcomeActions && !mediaType && (
          <div className="flex flex-col items-center gap-2 my-3 animate-fadeIn">
            <div className="flex gap-3 justify-center">
              <Button variant="outline" size="lg" onClick={() => pickMediaType('vinyl')} className="h-16 px-8 flex flex-col gap-1.5 rounded-2xl border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary hover:shadow-md transition-all">
                <Disc3 className="h-6 w-6 text-primary" />
                <span className="text-xs font-medium">Vinyl</span>
              </Button>
              <Button variant="outline" size="lg" onClick={() => pickMediaType('cd')} className="h-16 px-8 flex flex-col gap-1.5 rounded-2xl border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary hover:shadow-md transition-all">
                <Disc className="h-6 w-6 text-primary" />
                <span className="text-xs font-medium">CD</span>
              </Button>
            </div>
          </div>
        )}

        {/* Artist content cards */}
        {verifiedResult?.artist && !isStreaming && !isRunningV2 && (
          <ArtistContentCards artistName={verifiedResult.artist} />
        )}

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
            return !!(lastAssistant?.content?.includes('Geen match gevonden') || lastAssistant?.content?.includes('No match found') || lastAssistant?.content?.includes('Geen eenduidige match') || lastAssistant?.content?.includes('No unique match'));
          })()}
          artistContent={verifiedResult?.artist ? artistContent : null}
          onSave={saveToCollection}
          onSend={(text) => {
            if (text === sc.typeMyself) {
              setShowManualSearch(true);
              setMessages(prev => [...prev, { role: 'user', content: sc.typeArtistTitle }, { role: 'assistant', content: sc.fillDetails }]);
            } else {
              sendMessage(text);
            }
          }}
        />

        {/* Manual search form */}
        {showManualSearch && (
          <div className="mx-2 my-2 space-y-2">
            <ScannerManualSearch
              onSearch={handleManualSearch}
              isSearching={isManualSearching}
            />
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 rounded-full border-muted-foreground/20 hover:bg-muted"
                onClick={() => { setShowManualSearch(false); fileInputRef.current?.click(); }}
              >
                <span>📸</span>
                {sc.choosePhoto}
              </Button>
            </div>
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
                    title={sc.takePhoto}
                  >
                    <Camera className="h-5 w-5 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="h-20 w-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center hover:border-primary/50 transition-colors"
                    title={sc.chooseFromGallery}
                  >
                    <ImagePlus className="h-5 w-5 text-muted-foreground" />
                  </button>
                </div>
                <Button onClick={uploadAndSend} disabled={isUploading} className="w-full" size="sm">
                  {isUploading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{sc.uploading}</>
                  ) : (
                    <><Send className="mr-2 h-4 w-4" />{sc.sendPhotos.replace('{count}', String(pendingFiles.length))}</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {(isStreaming || isRunningV2) && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex justify-start gap-2.5">
            <img src={magicMikeAvatar} alt="Magic Mike" className="h-8 w-8 rounded-full object-cover object-top shrink-0 ring-2 ring-primary/20 shadow-sm" />
            <div className="bg-card/90 backdrop-blur-sm border border-border/40 rounded-2xl rounded-bl-md px-5 py-3.5 shadow-sm">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      {true && (
        <div className="fixed bottom-14 left-0 right-0 z-40 px-3 pb-2">
        <div className="max-w-2xl mx-auto flex items-end gap-1.5 p-2 rounded-2xl bg-card/95 backdrop-blur-md border border-border/50 shadow-[0_-2px_15px_rgba(0,0,0,0.1)]">
          <div className="flex items-center gap-0.5 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => cameraInputRef.current?.click()}
              disabled={isStreaming || isUploading || isRunningV2 || isListening || isRecognizing}
              className="h-8 w-8 rounded-full hover:bg-primary/10"
              title={sc.takePhoto}
            >
              <Camera className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isStreaming || isUploading || isRunningV2 || isListening || isRecognizing}
              className="h-8 w-8 rounded-full hover:bg-primary/10"
              title={sc.chooseFromGallery}
            >
              <ImagePlus className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
            <Button
              variant={isListening ? "default" : "ghost"}
              size="icon"
              onClick={startListening}
              disabled={isStreaming || isUploading || isRunningV2 || isListening || isRecognizing}
              className={`h-8 w-8 rounded-full transition-all ${
                isListening 
                  ? 'bg-primary text-primary-foreground animate-pulse shadow-lg shadow-primary/30' 
                  : 'hover:bg-primary/10'
              }`}
              title={isListening ? sc.listeningPlaceholder : sc.recognizeMusic2}
            >
              {isRecognizing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Mic className={`h-3.5 w-3.5 ${isListening ? '' : 'text-amber-500'}`} />
              )}
            </Button>
          </div>
          {isListening && (
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative h-2 w-12 bg-muted rounded-full overflow-hidden">
                <div 
                  className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-1000"
                  style={{ width: `${listeningProgress}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground font-medium">
                {Math.ceil(8 - (listeningProgress / 100) * 8)}s
              </span>
            </div>
          )}
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? sc.listeningPlaceholder : sc.askYourQuestion}
            className="min-h-[44px] max-h-[120px] flex-1 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60 text-sm py-3"
            rows={1}
            disabled={isStreaming || isRunningV2 || isListening || isRecognizing}
          />
          <Button onClick={handleSend} disabled={!input.trim() || isStreaming || isRunningV2 || isListening || isRecognizing} size="icon" className="shrink-0 h-8 w-8 rounded-full shadow-sm">
            {(isStreaming || isRunningV2) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          </Button>
        </div>
        </div>
      )}
    </div>
  );
});
