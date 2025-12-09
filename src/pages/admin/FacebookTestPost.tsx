import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Facebook, Send, Settings, Eye, EyeOff } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";

const FacebookTestPost = () => {
  const [page2Token, setPage2Token] = useState("");
  const [page2Id, setPage2Id] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [testMessage, setTestMessage] = useState("");
  const [testImageUrl, setTestImageUrl] = useState("");
  const [selectedPage, setSelectedPage] = useState<"page1" | "page2">("page2");
  const [isSaving, setIsSaving] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPage2Credentials();
  }, []);

  const loadPage2Credentials = async () => {
    try {
      const { data, error } = await supabase
        .from("app_secrets")
        .select("secret_key, secret_value")
        .in("secret_key", ["FACEBOOK_PAGE_2_ACCESS_TOKEN", "FACEBOOK_PAGE_2_ID"]);

      if (error) throw error;

      data?.forEach((secret) => {
        if (secret.secret_key === "FACEBOOK_PAGE_2_ACCESS_TOKEN") {
          setPage2Token(secret.secret_value);
        } else if (secret.secret_key === "FACEBOOK_PAGE_2_ID") {
          setPage2Id(secret.secret_value);
        }
      });
    } catch (error) {
      console.error("Error loading page 2 credentials:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveCredentials = async () => {
    if (!page2Token || !page2Id) {
      toast.error("Vul zowel Page ID als Access Token in");
      return;
    }

    setIsSaving(true);
    try {
      // Upsert both credentials
      const secrets = [
        { secret_key: "FACEBOOK_PAGE_2_ACCESS_TOKEN", secret_value: page2Token, description: "Facebook Page 2 Access Token voor test posting" },
        { secret_key: "FACEBOOK_PAGE_2_ID", secret_value: page2Id, description: "Facebook Page 2 ID voor test posting" }
      ];

      for (const secret of secrets) {
        const { error } = await supabase
          .from("app_secrets")
          .upsert(secret, { onConflict: "secret_key" });

        if (error) throw error;
      }

      toast.success("Page 2 credentials opgeslagen!");
    } catch (error) {
      console.error("Error saving credentials:", error);
      toast.error("Fout bij opslaan credentials");
    } finally {
      setIsSaving(false);
    }
  };

  const sendTestPost = async () => {
    if (!testMessage) {
      toast.error("Voer een bericht in");
      return;
    }

    if (selectedPage === "page2" && (!page2Token || !page2Id)) {
      toast.error("Configureer eerst de Page 2 credentials");
      return;
    }

    setIsPosting(true);
    try {
      const { data, error } = await supabase.functions.invoke("post-to-facebook", {
        body: {
          content_type: "test",
          title: "Test Post",
          content: testMessage,
          image_url: testImageUrl || undefined,
          usePage2: selectedPage === "page2"
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`Test post verstuurd naar ${selectedPage === "page2" ? "Page 2" : "Page 1"}!`);
        setTestMessage("");
        setTestImageUrl("");
      } else {
        throw new Error(data?.error || "Onbekende fout");
      }
    } catch (error: any) {
      console.error("Error posting:", error);
      toast.error(`Post mislukt: ${error.message}`);
    } finally {
      setIsPosting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Facebook className="h-8 w-8 text-blue-600" />
            Facebook Test Post
          </h1>
          <p className="text-muted-foreground mt-1">
            Test posting naar 2e Facebook pagina
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Page 2 Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Page 2 Configuratie
              </CardTitle>
              <CardDescription>
                Sla de credentials op voor je 2e Facebook pagina
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="page2Id">Page ID</Label>
                <Input
                  id="page2Id"
                  value={page2Id}
                  onChange={(e) => setPage2Id(e.target.value)}
                  placeholder="123456789..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="page2Token">Page Access Token</Label>
                <div className="relative">
                  <Input
                    id="page2Token"
                    type={showToken ? "text" : "password"}
                    value={page2Token}
                    onChange={(e) => setPage2Token(e.target.value)}
                    placeholder="EAAxxxxx..."
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowToken(!showToken)}
                  >
                    {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button onClick={saveCredentials} disabled={isSaving} className="w-full">
                {isSaving ? "Opslaan..." : "Credentials Opslaan"}
              </Button>

              {page2Token && page2Id && (
                <p className="text-sm text-green-600">✓ Page 2 is geconfigureerd</p>
              )}
            </CardContent>
          </Card>

          {/* Test Post */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Test Post Versturen
              </CardTitle>
              <CardDescription>
                Stuur een test bericht naar een van je pagina's
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Doelpagina</Label>
                <Select value={selectedPage} onValueChange={(v) => setSelectedPage(v as "page1" | "page2")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="page1">Page 1 (Hoofdpagina)</SelectItem>
                    <SelectItem value="page2">Page 2 (Test pagina)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="testMessage">Bericht</Label>
                <Textarea
                  id="testMessage"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Schrijf je test bericht..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="testImageUrl">Afbeelding URL (optioneel)</Label>
                <Input
                  id="testImageUrl"
                  value={testImageUrl}
                  onChange={(e) => setTestImageUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <Button 
                onClick={sendTestPost} 
                disabled={isPosting || !testMessage}
                className="w-full"
              >
                {isPosting ? "Versturen..." : `Post naar ${selectedPage === "page2" ? "Page 2" : "Page 1"}`}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default FacebookTestPost;
