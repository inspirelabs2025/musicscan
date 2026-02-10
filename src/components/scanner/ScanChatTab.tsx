import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Send, Loader2, MessageCircle, Disc3, Disc, RotateCcw, Camera, Upload, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SUPABASE_URL = "https://ssxbpyqnjfiyubsuonar.supabase.co";

const PHOTO_LABELS: Record<string, string[]> = {
  vinyl: ['Voorkant hoes', 'Achterkant hoes', 'Label (plaat)'],
  cd: ['Voorkant', 'Achterkant', 'CD Label', 'Binnenkant booklet'],
};

export function ScanChatTab() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `🎩 **Hey, ik ben Magic Mike!** Je persoonlijke muziek-detective.\n\nWil je iets weten over een **CD** of **LP**? Ik help je de exacte release te vinden!\n\nKies hieronder wat je hebt, dan vraag ik je om een paar foto's.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  // Media & photo state
  const [mediaType, setMediaType] = useState<'vinyl' | 'cd' | ''>('');
  const [files, setFiles] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [photosUploaded, setPhotosUploaded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const requiredCount = mediaType === 'vinyl' ? 3 : mediaType === 'cd' ? 4 : 0;
  const labels = mediaType ? PHOTO_LABELS[mediaType] || [] : [];

  // When user picks media type, Magic Mike responds
  const pickMediaType = (type: 'vinyl' | 'cd') => {
    setMediaType(type);
    const label = type === 'vinyl' ? 'vinyl plaat' : 'CD';
    const count = type === 'vinyl' ? 3 : 4;
    const photoNames = PHOTO_LABELS[type].join(', ');

    setMessages(prev => [
      ...prev,
      { role: 'user', content: type === 'vinyl' ? '🎵 Vinyl' : '💿 CD' },
      {
        role: 'assistant',
        content: `Top! Een ${label} dus. 📸\n\nUpload ${count} foto's zodat ik je kan helpen:\n**${photoNames}**\n\nGebruik de upload-vakjes hieronder 👇`,
      },
    ]);
  };

  // File handling
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 10 * 1024 * 1024) return;

    setFiles(prev => {
      const next = [...prev];
      next[index] = file;
      return next;
    });

    if (inputRefs.current[index]) {
      inputRefs.current[index]!.value = '';
    }
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  }, []);

  // Upload & start analysis
  const uploadAndAnalyze = async () => {
    if (files.length === 0 || !mediaType) return;
    setIsUploading(true);

    try {
      const urls: string[] = [];
      for (const file of files) {
        const uniqueId = Math.random().toString(36).substring(2, 10);
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `scan-chat/${Date.now()}-${uniqueId}-${safeName}`;
        const { error } = await supabase.storage.from('vinyl_images').upload(fileName, file, { upsert: true });
        if (error) throw new Error(`Upload mislukt: ${error.message}`);
        const { data: { publicUrl } } = supabase.storage.from('vinyl_images').getPublicUrl(fileName);
        urls.push(publicUrl);
      }
      setPhotoUrls(urls);
      setPhotosUploaded(true);

      // Magic Mike acknowledges and starts analyzing
      const autoMsg = `Ik heb ${files.length} foto's van mijn ${mediaType === 'vinyl' ? 'vinyl plaat' : 'CD'} geüpload. Wat kun je hierover vertellen?`;
      await sendMessage(autoMsg, urls);
    } catch (err) {
      console.error('Upload error:', err);
      toast({ title: "Upload mislukt", description: err instanceof Error ? err.message : "Fout", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  // Stream message
  const sendMessage = async (text: string, urls?: string[]) => {
    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsStreaming(true);

    let assistantSoFar = '';
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: 'assistant', content: assistantSoFar }];
      });
    };

    try {
      const allMessages = [...messages, userMsg];
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
      // flush
      for (let raw of buf.split('\n')) {
        if (!raw || !raw.startsWith('data: ')) continue;
        const j = raw.slice(6).trim();
        if (j === '[DONE]') continue;
        try { const p = JSON.parse(j); const c = p.choices?.[0]?.delta?.content; if (c) upsertAssistant(c); } catch {}
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
      content: `🎩 **Hey, ik ben Magic Mike!** Je persoonlijke muziek-detective.\n\nWil je iets weten over een **CD** of **LP**? Ik help je de exacte release te vinden!\n\nKies hieronder wat je hebt, dan vraag ik je om een paar foto's.`,
    }]);
    setMediaType('');
    setFiles([]);
    setPhotoUrls([]);
    setPhotosUploaded(false);
    setInput('');
  };

  // Render inline upload grid
  const renderUploadGrid = () => {
    if (!mediaType || photosUploaded) return null;

    const actualFiles = files.filter(Boolean);
    const allDone = actualFiles.length >= requiredCount;

    return (
      <div className="mx-4 my-3">
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Foto's: {actualFiles.length}/{requiredCount}</span>
              {allDone && <span className="flex items-center gap-1 text-green-600"><CheckCircle className="h-4 w-4" /> Klaar!</span>}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {labels.slice(0, requiredCount).map((label, index) => {
                const file = files[index];
                return (
                  <div key={label} className="relative">
                    <input
                      ref={el => inputRefs.current[index] = el}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => handleFileChange(e, index)}
                      className="hidden"
                      disabled={isUploading}
                    />
                    {file ? (
                      <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-green-500 bg-muted">
                        <img src={URL.createObjectURL(file)} alt={label} className="w-full h-full object-cover" />
                        {!isUploading && (
                          <button onClick={() => removeFile(index)}
                            className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90">
                            <X className="h-3 w-3" />
                          </button>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 text-center truncate">{label}</div>
                      </div>
                    ) : (
                      <button
                        onClick={() => inputRefs.current[index]?.click()}
                        disabled={isUploading}
                        className="aspect-square w-full rounded-lg border-2 border-dashed border-primary bg-primary/5 hover:bg-primary/10 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
                      >
                        <div className="flex gap-1">
                          <Camera className="h-5 w-5 text-muted-foreground" />
                          <Upload className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <span className="text-xs text-muted-foreground text-center px-1">{label}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {actualFiles.length > 0 && (
              <Button onClick={uploadAndAnalyze} disabled={isUploading} className="w-full" size="sm">
                {isUploading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploaden...</>
                ) : (
                  <><Send className="mr-2 h-4 w-4" />Stuur naar Magic Mike ({actualFiles.length} foto's)</>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-220px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span>🎩</span>
          <span>Magic Mike</span>
          {mediaType && (
            <span className="text-xs text-muted-foreground">· {mediaType === 'vinyl' ? 'Vinyl' : 'CD'}</span>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={resetChat}>
          <RotateCcw className="h-4 w-4 mr-1" /> Opnieuw
        </Button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg px-4 py-3 text-sm ${
              msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}>
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{msg.content || '...'}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {/* Media type buttons inline in chat */}
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

        {/* Upload grid inline in chat */}
        {renderUploadGrid()}

        {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </div>
        )}
      </div>

      {/* Quick prompts after first analysis */}
      {photosUploaded && messages.length <= 4 && !isStreaming && (
        <div className="flex flex-wrap gap-2 mb-3">
          {["Zoek op barcode", "Welke persing is dit?", "Wat is de waarde?"].map(p => (
            <Button key={p} variant="outline" size="sm" onClick={() => sendMessage(p)} className="text-xs">
              {p}
            </Button>
          ))}
        </div>
      )}

      {/* Input - always visible after media type chosen */}
      {mediaType && (
        <div className="flex gap-2">
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
