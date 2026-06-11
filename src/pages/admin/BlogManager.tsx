import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2, Pencil, Trash2, ExternalLink, Plus, Search } from "lucide-react";

interface BlogRow {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  author: string | null;
  source: string | null;
  published_at: string | null;
  views_count: number | null;
  image_url: string | null;
}

export default function AdminBlogManager() {
  const { toast } = useToast();
  const [rows, setRows] = useState<BlogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("news_blog_posts")
      .select("id, title, slug, category, author, source, published_at, views_count, image_url")
      .order("published_at", { ascending: false })
      .limit(500);
    if (error) {
      toast({ title: "Laden mislukt", description: error.message, variant: "destructive" });
    } else {
      setRows((data ?? []) as BlogRow[]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const remove = async (row: BlogRow) => {
    if (!confirm(`Verwijder "${row.title}"?`)) return;
    const { error } = await supabase.from("news_blog_posts").delete().eq("id", row.id);
    if (error) {
      toast({ title: "Verwijderen mislukt", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Verwijderd" });
      setRows((r) => r.filter((x) => x.id !== row.id));
    }
  };

  const filtered = rows.filter((r) => {
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return (
      r.title?.toLowerCase().includes(s) ||
      r.slug?.toLowerCase().includes(s) ||
      r.category?.toLowerCase().includes(s) ||
      r.author?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="w-full min-w-0 p-4 space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold mb-1">Blog Manager</h1>
          <p className="text-muted-foreground text-sm">
            Overzicht van alle blogs in Nieuws — bewerken, bekijken of verwijderen.
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/blog-writer">
            <Plus className="h-4 w-4 mr-2" /> Nieuwe blog schrijven
          </Link>
        </Button>
      </div>

      <Card className="p-3">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Zoek op titel, slug, categorie, auteur..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="p-10 flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Laden...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground text-sm">
            Geen blogs gevonden.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titel</TableHead>
                <TableHead className="hidden md:table-cell">Categorie</TableHead>
                <TableHead className="hidden lg:table-cell">Auteur</TableHead>
                <TableHead className="hidden md:table-cell">Datum</TableHead>
                <TableHead className="hidden lg:table-cell">Views</TableHead>
                <TableHead className="text-right">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="max-w-md">
                    <div className="font-medium truncate">{r.title}</div>
                    <div className="text-xs text-muted-foreground font-mono truncate">/{r.slug}</div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {r.category && <Badge variant="secondary">{r.category}</Badge>}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {r.author ?? "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {r.published_at
                      ? new Date(r.published_at).toLocaleDateString("nl-NL")
                      : "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">
                    {r.views_count ?? 0}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button asChild size="sm" variant="ghost" title="Bekijken">
                        <a href={`/nieuws/${r.slug}`} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button asChild size="sm" variant="ghost" title="Bewerken">
                        <Link to={`/admin/blogs/${r.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Verwijderen"
                        onClick={() => remove(r)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
