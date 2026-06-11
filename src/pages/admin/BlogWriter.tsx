import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2,
  Sparkles,
  Send,
  Save,
  RefreshCw,
  Wand2,
  User,
  Bot,
  Eye,
  Calendar,
  Image as ImageIcon,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

interface GeneratedBlog {
  title: string;
  summary: string;
  category: string;
  slug: string;
  content: string;
  image_url?: string;
}

const INTRO: ChatMsg = {
  role: "assistant",
  content:
    "Hé, Mike hier. Waar zullen we het over hebben? Gooi een artiest, album, single of thema voor m'n voeten. Ik stel een paar scherpe vragen, deel wat weetjes en help je een hoek vinden die niet op pagina 1 van Google staat. Klaar? Druk op 'Schrijf blog'.",
};

export default function AdminBlogWriter() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMsg[]>([INTRO]);
  const [input, setInput] = useState("");
  const [chatting, setChatting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [blog, setBlog] = useState<GeneratedBlog | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, chatting]);

  const send = async () => {
    const text = input.trim();
    if (!text || chatting) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setChatting(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-blog-writer", {
        body: { mode: "chat", messages: next.filter((m) => m !== INTRO || next.indexOf(m) > 0) },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch (err: any) {
      toast({ title: "Chat fout", description: err.message, variant: "destructive" });
      setMessages((m) => m.slice(0, -1));
      setInput(text);
    } finally {
      setChatting(false);
    }
  };

  const generate = async () => {
    if (messages.filter((m) => m.role === "user").length === 0) {
      toast({ title: "Begin eerst een gesprek", variant: "destructive" });
      return;
    }
    setGenerating(true);
    setBlog(null);
    try {
      const { data, error } = await supabase.functions.invoke("admin-blog-writer", {
        body: { mode: "generate", messages },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setBlog(data.blog);
      toast({ title: "Blog gegenereerd" });
    } catch (err: any) {
      toast({ title: "Generatie mislukt", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const publish = async () => {
    if (!blog) return;
    setPublishing(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const author = userData.user?.email ?? "MusicScan Redactie";

      // Ensure unique slug
      let slug = blog.slug || blog.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const { data: existing } = await supabase
        .from("news_blog_posts")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (existing) slug = `${slug}-${Date.now().toString(36)}`;

      const { error } = await supabase.from("news_blog_posts").insert({
        title: blog.title,
        summary: blog.summary,
        content: blog.content,
        category: blog.category || "Verhaal",
        slug,
        author,
        source: "admin-blog-writer",
        image_url: blog.image_url ?? null,
        published_at: new Date().toISOString(),
      });
      if (error) throw error;
      toast({ title: "Gepubliceerd in Nieuws", description: `/nieuws/${slug}` });
      setBlog(null);
      setMessages([INTRO]);
    } catch (err: any) {
      toast({ title: "Publiceren mislukt", description: err.message, variant: "destructive" });
    } finally {
      setPublishing(false);
    }
  };

  const generateImage = async () => {
    if (!blog) return;
    setGeneratingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-blog-writer", {
        body: { mode: "image", title: blog.title, summary: blog.summary },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.image_url) throw new Error("Geen afbeelding ontvangen");
      setBlog({ ...blog, image_url: data.image_url });
      toast({ title: "Afbeelding gegenereerd" });
    } catch (err: any) {
      toast({ title: "Afbeelding mislukt", description: err.message, variant: "destructive" });
    } finally {
      setGeneratingImage(false);
    }
  };



  const reset = () => {
    setMessages([INTRO]);
    setBlog(null);
    setInput("");
  };

  return (
    <div className="w-full min-w-0 p-4 space-y-4 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold mb-1 flex items-center gap-2">
          <Bot className="h-7 w-7 text-primary" />
          Chat met Mike de blogger
        </h1>
        <p className="text-muted-foreground text-sm">
          Brainstorm met Mike, je vaste redacteur. Als het idee scherp is, klik je op "Schrijf blog".
        </p>
      </div>

      <Card className="flex flex-col h-[60vh] min-h-[400px]">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div
                className={`rounded-2xl px-4 py-2 max-w-[80%] text-sm whitespace-pre-wrap ${
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {chatting && (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl px-4 py-2 bg-muted text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
        </div>

        <div className="border-t p-3 space-y-2">
          <Textarea
            placeholder="Typ je idee of vraag... (Cmd/Ctrl+Enter om te sturen)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                send();
              }
            }}
            rows={2}
            disabled={chatting || generating}
          />
          <div className="flex gap-2 flex-wrap">
            <Button onClick={send} disabled={chatting || generating || !input.trim()}>
              {chatting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Stuur
            </Button>
            <Button
              variant="secondary"
              onClick={generate}
              disabled={chatting || generating || messages.filter((m) => m.role === "user").length === 0}
            >
              {generating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4 mr-2" />
              )}
              Schrijf blog
            </Button>
            <Button variant="ghost" onClick={reset} disabled={chatting || generating}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Nieuw gesprek
            </Button>
          </div>
        </div>
      </Card>

      {blog && (
        <Card className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1 flex-1 min-w-0">
              <Badge variant="secondary">{blog.category}</Badge>
              <h2 className="text-2xl font-bold">{blog.title}</h2>
              <p className="text-muted-foreground">{blog.summary}</p>
              <p className="text-xs text-muted-foreground font-mono">/{blog.slug}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" onClick={generateImage} disabled={generatingImage}>
                {generatingImage ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ImageIcon className="h-4 w-4 mr-2" />
                )}
                {blog.image_url ? "Nieuwe afbeelding" : "Genereer afbeelding"}
              </Button>
              <Button variant="outline" onClick={() => setPreviewOpen(true)}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button onClick={publish} disabled={publishing}>
                {publishing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Publiceer in Nieuws
              </Button>
            </div>
          </div>

          {blog.image_url && (
            <img
              src={blog.image_url}
              alt={blog.title}
              className="w-full max-h-72 object-cover rounded-lg border"
            />
          )}


          <div className="prose prose-sm dark:prose-invert max-w-none border-t pt-4">
            <ReactMarkdown>{blog.content}</ReactMarkdown>
          </div>

          <details className="border-t pt-3">
            <summary className="cursor-pointer text-sm text-muted-foreground">
              Bewerk ruwe markdown
            </summary>
            <Textarea
              value={blog.content}
              onChange={(e) => setBlog({ ...blog, content: e.target.value })}
              rows={20}
              className="font-mono text-xs mt-2"
            />
          </details>
        </Card>
      )}

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Preview: zo verschijnt het in Nieuws</DialogTitle>
          </DialogHeader>
          {blog && (
            <article className="bg-background">
              <section className="relative py-10 px-6 md:px-10 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10 border-b">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="w-full md:w-1/3">
                    <div className="aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20 shadow-2xl flex items-center justify-center">
                      {blog.image_url ? (
                        <img src={blog.image_url} alt={blog.title} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-16 h-16 text-muted-foreground/30" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <Badge className="bg-purple-500/20 text-purple-600 border-0 mb-4">
                      {blog.category || "Nieuws"}
                    </Badge>
                    <h1 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent leading-tight">
                      {blog.title}
                    </h1>
                    {blog.summary && (
                      <p className="text-base text-muted-foreground mb-4">{blog.summary}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <span>MusicScan Redactie</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          {new Date().toLocaleDateString("nl-NL", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <div className="px-6 md:px-10 py-8">
                {blog.summary && (
                  <div className="border-l-4 border-primary bg-primary/5 rounded-r-lg p-4 mb-8">
                    <p className="text-lg font-medium text-foreground leading-relaxed italic">
                      {blog.summary}
                    </p>
                  </div>
                )}

                <div className="max-w-none">
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => <h1 className="text-3xl font-bold mt-12 mb-6 first:mt-0 text-foreground">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-2xl font-semibold mt-10 mb-4 text-foreground">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-xl font-medium mt-8 mb-3 text-foreground">{children}</h3>,
                      p: ({ children }) => <p className="mb-6 leading-relaxed text-foreground/90 text-lg">{children}</p>,
                      ul: ({ children }) => <ul className="mb-6 ml-6 space-y-2 list-disc marker:text-primary">{children}</ul>,
                      ol: ({ children }) => <ol className="mb-6 ml-6 space-y-2 list-decimal marker:text-primary">{children}</ol>,
                      li: ({ children }) => <li className="leading-relaxed text-foreground/90">{children}</li>,
                      strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-primary bg-primary/5 pl-6 py-4 my-8 italic rounded-r-lg">{children}</blockquote>
                      ),
                      a: ({ children, href }) => (
                        <a href={href} className="text-primary hover:underline font-medium" target="_blank" rel="noopener noreferrer">{children}</a>
                      ),
                      hr: () => <hr className="my-8 border-border" />,
                    }}
                  >
                    {blog.content}
                  </ReactMarkdown>
                </div>

                <div className="mt-10 pt-6 border-t text-xs text-muted-foreground font-mono">
                  /nieuws/{blog.slug}
                </div>
              </div>
            </article>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
