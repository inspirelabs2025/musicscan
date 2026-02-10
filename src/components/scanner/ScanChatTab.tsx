import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Send, Loader2, Disc3, Disc, RotateCcw, Camera, X, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  images?: string[]; // preview URLs for display
}

const SUPABASE_URL = "https://ssxbpyqnjfiyubsuonar.supabase.co";

export function ScanChatTab() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `🎩 **Hey, ik ben Magic Mike!** Je persoonlijke muziek-detective.\n\nWil je iets weten over een **CD** of **LP**?\n\nKies hieronder wat je hebt 👇`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

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

      // Show thumbnails in user message
      const previews = pendingFiles.map(f => URL.createObjectURL(f));
      const allUrls = [...photoUrls, ...urls];
      setPhotoUrls(allUrls);

      const userContent = `Ik heb ${pendingFiles.length} foto's geüpload van mijn ${mediaType === 'vinyl' ? 'vinyl plaat' : 'CD'}. Bekijk ze en vertel me wat je ziet!`;
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

  // Stream message to AI
  const sendMessage = async (text: string, urls?: string[], customUserMsg?: ChatMessage) => {
    const userMsg: ChatMessage = customUserMsg || { role: 'user', content: text };
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
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-220px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span>🎩</span>
          <span>Magic Mike</span>
          {mediaType && <span className="text-xs text-muted-foreground">· {mediaType === 'vinyl' ? 'Vinyl' : 'CD'}</span>}
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
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg px-4 py-3 text-sm ${
              msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}>
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{msg.content || '...'}</ReactMarkdown>
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

        {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </div>
        )}
      </div>

      {/* Quick prompts */}
      {photoUrls.length > 0 && messages.length <= 5 && !isStreaming && (
        <div className="flex flex-wrap gap-2 mb-3">
          {["Zoek op barcode", "Welke persing is dit?", "Wat is de waarde?", "Heb je meer foto's nodig?"].map(p => (
            <Button key={p} variant="outline" size="sm" onClick={() => sendMessage(p)} className="text-xs">{p}</Button>
          ))}
        </div>
      )}

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
