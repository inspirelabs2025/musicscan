import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles, Send, Save, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface GeneratedBlog {
  title: string;
  summary: string;
  category: string;
  slug: string;
  content: string;
}

export default function AdminBlogWriter() {
  const { toast } = useToast();
  const [topic, setTopic] = useState("");
  const [extraContext, setExtraContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [blog, setBlog] = useState<GeneratedBlog | null>(null);

  const generate = async () => {
    if (!topic.trim()) {
      toast({ title: "Geef een onderwerp op", variant: "destructive" });
      return;
    }
    setLoading(true);
    setBlog(null);
    try {
      const { data, error } = await supabase.functions.invoke("admin-blog-writer", {
        body: { topic: topic.trim(), extraContext: extraContext.trim() || undefined },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setBlog(data.blog);
      toast({ title: "Blog gegenereerd" });
    } catch (err: any) {
      toast({
        title: "Generatie mislukt",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const publish = async () => {
    if (!blog) return;
    setPublishing(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const author = userData.user?.email ?? "MusicScan Redactie";

      const { error } = await supabase.from("news_blog_posts").insert({
        title: blog.title,
        summary: blog.summary,
        content: blog.content,
        category: blog.category || "Verhaal",
        slug: blog.slug,
        author,
        source: "admin-blog-writer",
        published_at: new Date().toISOString(),
      });
      if (error) throw error;
      toast({ title: "Gepubliceerd in Nieuws" });
      setBlog(null);
      setTopic("");
      setExtraContext("");
    } catch (err: any) {
      toast({
        title: "Publiceren mislukt",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="w-full min-w-0 p-4 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-primary" />
          Blog Writer
        </h1>
        <p className="text-muted-foreground">
          Geef een onderwerp, album, artiest of vraag. De AI doet onderzoek en schrijft een
          menselijk blog (geen typische AI-stijl, geen em-dashes).
        </p>
      </div>

      <Card className="p-4 space-y-3">
        <div>
          <label className="text-sm font-medium mb-1 block">Onderwerp</label>
          <Input
            placeholder='Bijv. "Het verhaal achter Pink Floyd - The Wall" of "Nederlandse hits van 1985"'
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) generate();
            }}
            disabled={loading}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">
            Extra richtlijnen <span className="text-muted-foreground">(optioneel)</span>
          </label>
          <Textarea
            placeholder="Bijv. focus op de opnamesessies in Abbey Road, of 'maak het luchtig en grappig'"
            value={extraContext}
            onChange={(e) => setExtraContext(e.target.value)}
            rows={2}
            disabled={loading}
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={generate} disabled={loading || !topic.trim()}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Onderzoek + schrijven...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Genereer blog
              </>
            )}
          </Button>
          {blog && (
            <Button variant="outline" onClick={generate} disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Opnieuw
            </Button>
          )}
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
            <Button onClick={publish} disabled={publishing}>
              {publishing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Publiceer in Nieuws
            </Button>
          </div>

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
    </div>
  );
}
