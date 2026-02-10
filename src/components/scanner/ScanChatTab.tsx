import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Send, Loader2, MessageCircle, Disc3, Disc, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { ScannerUploadZone } from './ScannerUploadZone';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_PROMPTS = [
  "Analyseer mijn foto's",
  "Zoek op barcode",
  "Welke persing is dit?",
  "Wat is de waarde?",
];

const SUPABASE_URL = "https://ssxbpyqnjfiyubsuonar.supabase.co";

export function ScanChatTab() {
  // Setup phase state
  const [mediaType, setMediaType] = useState<'vinyl' | 'cd' | ''>('');
  const [files, setFiles] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Chat phase state
  const [chatStarted, setChatStarted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFileAdd = useCallback((file: File) => {
    setFiles(prev => [...prev, file]);
  }, []);

  const handleFileRemove = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const requiredCount = mediaType === 'vinyl' ? 3 : mediaType === 'cd' ? 4 : 0;

  // Upload photos to Supabase storage
  const uploadPhotos = async (): Promise<string[]> => {
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
    return urls;
  };

  // Start chat: upload photos, then send first message
  const startChat = async () => {
    if (files.length === 0 || !mediaType) return;

    setIsUploading(true);
    try {
      const urls = await uploadPhotos();
      setPhotoUrls(urls);
      setChatStarted(true);

      // Auto-send first message
      const firstMessage = `Ik heb ${files.length} foto's van mijn ${mediaType === 'vinyl' ? 'vinyl plaat' : 'CD'} geüpload. Wat kun je hierover vertellen?`;
      await sendMessage(firstMessage, urls);
    } catch (err) {
      console.error('Upload error:', err);
      toast({
        title: "Upload mislukt",
        description: err instanceof Error ? err.message : "Onbekende fout",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Stream a message to the AI
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

      if (!resp.body) throw new Error('Geen stream ontvangen');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch { /* ignore */ }
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Onbekende fout';
      toast({ title: "Chat fout", description: errorMsg, variant: "destructive" });
      // Remove the failed assistant message if empty
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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const resetChat = () => {
    setChatStarted(false);
    setMessages([]);
    setFiles([]);
    setPhotoUrls([]);
    setMediaType('');
    setInput('');
  };

  // ---- SETUP PHASE ----
  if (!chatStarted) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Media Type Selection */}
        <Card>
          <CardContent className="pt-6">
            <label className="text-sm font-medium mb-3 block">Selecteer media type</label>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant={mediaType === 'vinyl' ? 'default' : 'outline'}
                onClick={() => setMediaType('vinyl')}
                className="h-16 flex flex-col gap-1"
              >
                <Disc3 className="h-5 w-5" />
                <span className="font-medium">Vinyl</span>
              </Button>
              <Button
                variant={mediaType === 'cd' ? 'default' : 'outline'}
                onClick={() => setMediaType('cd')}
                className="h-16 flex flex-col gap-1"
              >
                <Disc className="h-5 w-5" />
                <span className="font-medium">CD</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Photo Upload */}
        {mediaType && (
          <Card>
            <CardContent className="pt-6">
              <ScannerUploadZone
                mediaType={mediaType}
                files={files}
                onFileAdd={handleFileAdd}
                onFileRemove={handleFileRemove}
                isAnalyzing={isUploading}
                requiredCount={requiredCount}
              />
            </CardContent>
          </Card>
        )}

        {/* Start Chat Button */}
        {files.length > 0 && (
          <Button
            onClick={startChat}
            disabled={isUploading}
            className="w-full"
            size="lg"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Foto's uploaden...
              </>
            ) : (
              <>
                <MessageCircle className="mr-2 h-4 w-4" />
                Start Chat ({files.length} foto's)
              </>
            )}
          </Button>
        )}
      </div>
    );
  }

  // ---- CHAT PHASE ----
  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-220px)]">
      {/* Header with reset */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MessageCircle className="h-4 w-4" />
          <span>{mediaType === 'vinyl' ? 'Vinyl' : 'CD'} · {photoUrls.length} foto's</span>
        </div>
        <Button variant="ghost" size="sm" onClick={resetChat}>
          <RotateCcw className="h-4 w-4 mr-1" />
          Opnieuw
        </Button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-4 py-3 text-sm ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
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

        {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </div>
        )}
      </div>

      {/* Quick prompts */}
      {messages.length <= 2 && !isStreaming && (
        <div className="flex flex-wrap gap-2 mb-3">
          {QUICK_PROMPTS.map(prompt => (
            <Button
              key={prompt}
              variant="outline"
              size="sm"
              onClick={() => sendMessage(prompt)}
              disabled={isStreaming}
              className="text-xs"
            >
              {prompt}
            </Button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Stel een vraag over je plaat of CD..."
          className="min-h-[44px] max-h-[120px] resize-none"
          rows={1}
          disabled={isStreaming}
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim() || isStreaming}
          size="icon"
          className="shrink-0 h-[44px] w-[44px]"
        >
          {isStreaming ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
