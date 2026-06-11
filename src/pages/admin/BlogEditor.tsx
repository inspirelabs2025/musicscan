import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Save, ExternalLink, Eye, Image as ImageIcon, Upload } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  category: string | null;
  author: string | null;
  source: string | null;
  image_url: string | null;
  published_at: string | null;
}

export default function AdminBlogEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const { data, error } = await supabase
        .from("news_blog_posts")
        .select("*")
        .eq("id", id)
        .single();
      if (error) {
        toast({ title: "Laden mislukt", description: error.message, variant: "destructive" });
      } else {
        setPost(data as BlogPost);
      }
      setLoading(false);
    })();
  }, [id, toast]);

  const save = async () => {
    if (!post) return;
    setSaving(true);
    const { error } = await supabase
      .from("news_blog_posts")
      .update({
        title: post.title,
        slug: post.slug,
        summary: post.summary,
        content: post.content,
        category: post.category,
        author: post.author,
        image_url: post.image_url,
        published_at: post.published_at,
      })
      .eq("id", post.id);
    setSaving(false);
    if (error) {
      toast({ title: "Opslaan mislukt", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Opgeslagen ✅" });
    }
  };

  if (loading) {
    return (
      <div className="p-10 flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Laden...
      </div>
    );
  }

  if (!post) {
    return (
      <div className="p-10 text-center">
        <p className="text-muted-foreground mb-4">Blog niet gevonden.</p>
        <Button asChild variant="outline">
          <Link to="/admin/blogs"><ArrowLeft className="h-4 w-4 mr-2" /> Terug</Link>
        </Button>
      </div>
    );
  }

  const set = <K extends keyof BlogPost>(k: K, v: BlogPost[K]) =>
    setPost({ ...post, [k]: v });

  return (
    <div className="w-full min-w-0 p-4 space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin/blogs"><ArrowLeft className="h-4 w-4 mr-2" /> Overzicht</Link>
          </Button>
          <h1 className="text-2xl font-bold">Blog bewerken</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href={`/nieuws/${post.slug}`} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" /> Live
            </a>
          </Button>
          <Button variant="outline" onClick={() => setShowPreview((p) => !p)}>
            <Eye className="h-4 w-4 mr-2" /> {showPreview ? "Verberg" : "Preview"}
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Opslaan
          </Button>
        </div>
      </div>

      <Card className="p-4 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Titel</Label>
            <Input value={post.title ?? ""} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input value={post.slug ?? ""} onChange={(e) => set("slug", e.target.value)} className="font-mono" />
          </div>
          <div className="space-y-2">
            <Label>Categorie</Label>
            <Input value={post.category ?? ""} onChange={(e) => set("category", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Auteur</Label>
            <Input value={post.author ?? ""} onChange={(e) => set("author", e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Afbeelding URL</Label>
            <div className="flex gap-2">
              <Input value={post.image_url ?? ""} onChange={(e) => set("image_url", e.target.value)} />
              {post.image_url && (
                <a href={post.image_url} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="icon"><ImageIcon className="h-4 w-4" /></Button>
                </a>
              )}
            </div>
            {post.image_url && (
              <img src={post.image_url} alt="" className="max-h-40 rounded border object-cover" />
            )}
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Samenvatting</Label>
            <Textarea
              value={post.summary ?? ""}
              onChange={(e) => set("summary", e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>Publicatiedatum</Label>
            <Input
              type="datetime-local"
              value={
                post.published_at
                  ? new Date(post.published_at).toISOString().slice(0, 16)
                  : ""
              }
              onChange={(e) =>
                set("published_at", e.target.value ? new Date(e.target.value).toISOString() : null)
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Bron</Label>
            <Input value={post.source ?? ""} disabled />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Inhoud (Markdown)</Label>
          <Textarea
            value={post.content ?? ""}
            onChange={(e) => set("content", e.target.value)}
            rows={24}
            className="font-mono text-sm"
          />
        </div>
      </Card>

      {showPreview && (
        <Card className="p-6 prose prose-sm dark:prose-invert max-w-none">
          <h1>{post.title}</h1>
          {post.summary && <p className="lead">{post.summary}</p>}
          <ReactMarkdown>{post.content || ""}</ReactMarkdown>
        </Card>
      )}
    </div>
  );
}
