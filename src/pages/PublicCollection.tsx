import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Music, Search, ArrowLeft, Share2, Eye, Heart, Disc3 } from "lucide-react";
import { usePublicCollection } from "@/hooks/usePublicCollection";
import { useProfile } from "@/hooks/useProfile";
import { useCollectionViewTracker } from "@/hooks/useCollectionViewTracker";
import { CollectionItemCard } from "@/components/CollectionItemCard";
import { BreadcrumbNavigation } from "@/components/SEO/BreadcrumbNavigation";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function PublicCollection() {
  const { userId } = useParams<{ userId: string }>();
  const { items, isLoading } = usePublicCollection(userId || "");
  const { data: profile, isLoading: profileLoading } = useProfile(userId);
  const { trackView } = useCollectionViewTracker();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [formatFilter, setFormatFilter] = useState<string>("all");

  // Track collection view
  useEffect(() => {
    if (userId && !isLoading && items.length > 0) {
      trackView(userId);
    }
  }, [userId, isLoading, items.length, trackView]);

  const filteredItems = items.filter(item => {
    const matchesSearch = !searchTerm || 
      item.artist?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.label?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFormat = formatFilter === "all" || item.media_type === formatFilter;
    
    return matchesSearch && matchesFormat;
  });

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link gekopieerd!",
      description: "De collectie link is naar je klembord gekopieerd.",
    });
  };

  if (isLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <>
        <Helmet>
          <title>Profiel niet gevonden | MusicScan</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
          <div className="container mx-auto px-4 py-8">
            <Card className="p-8 text-center">
              <h1 className="text-2xl font-bold mb-2">Profiel niet gevonden</h1>
              <p className="text-muted-foreground mb-4">
                Het profiel dat je zoekt bestaat niet of is privé.
              </p>
              <Button asChild>
                <Link to="/community">Terug naar Community</Link>
              </Button>
            </Card>
          </div>
        </div>
      </>
    );
  }

  if (!profile.show_collection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
        <div className="container mx-auto px-4 py-8">
          <BreadcrumbNavigation 
            items={[
              { name: 'Community', url: '/community' },
              { name: profile.first_name || 'Gebruiker', url: `/profile/${userId}` },
              { name: 'Collectie', url: `/collection/${userId}` }
            ]}
            className="mb-6"
          />
          
          <Card className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-2">Collectie Privé</h1>
            <p className="text-muted-foreground mb-4">
              {profile.first_name || 'Deze gebruiker'} heeft ervoor gekozen om de collectie privé te houden.
            </p>
            <Button asChild>
              <Link to={`/profile/${userId}`}>Terug naar Profiel</Link>
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <BreadcrumbNavigation 
          items={[
            { name: 'Community', url: '/community' },
            { name: profile.first_name || 'Gebruiker', url: `/profile/${userId}` },
            { name: 'Collectie', url: `/collection/${userId}` }
          ]}
          className="mb-6"
        />

        {/* Owner Header */}
        <Card className="p-6 mb-6 bg-gradient-to-r from-card/50 to-background/80 backdrop-blur-sm border-border/50">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-xl">
                {profile.first_name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold">{profile.first_name || 'Gebruiker'}</h2>
                {profile.is_public && (
                  <Badge variant="secondary">Publiek Profiel</Badge>
                )}
              </div>
              
              {profile.bio && (
                <p className="text-muted-foreground text-sm mb-2">{profile.bio}</p>
              )}
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  Collectie weergave
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="p-1 h-auto text-muted-foreground hover:text-primary"
                >
                  <Share2 className="h-4 w-4 mr-1" />
                  Delen
                </Button>
              </div>
            </div>
            
            <div className="text-right">
              <Button asChild variant="outline">
                <Link to={`/profile/${userId}`}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Terug naar Profiel
                </Link>
              </Button>
            </div>
          </div>
        </Card>

        {/* Collection Stats Header */}
        <Card className="p-8 mb-8 bg-gradient-to-r from-card/50 to-background/80 backdrop-blur-sm border-border/50">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Music className="w-8 h-8 text-primary mr-3" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                {profile.first_name}'s Collectie
              </h1>
            </div>
            
            <p className="text-muted-foreground max-w-2xl mx-auto mb-4">
              Bekijk deze openbare muziekcollectie van {profile.first_name || 'deze gebruiker'}. 
              Items zijn niet te koop maar tonen wat er verzameld is.
            </p>

            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="px-3 py-1">
                  {items.length} publieke items
                </Badge>
              </div>
              <div className="flex gap-4 text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Disc3 className="h-4 w-4" />
                  {items.filter(item => item.media_type === "cd").length} CD's
                </span>
                <span className="flex items-center gap-1">
                  <Music className="h-4 w-4" />
                  {items.filter(item => item.media_type === "vinyl").length} Vinyl
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Search and Filters */}
        <Card className="p-6 mb-8 bg-gradient-to-r from-card/50 to-background/80 backdrop-blur-sm border-border/50">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Zoek op artiest, titel, of label..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={formatFilter === "all" ? "default" : "outline"}
                onClick={() => setFormatFilter("all")}
                size="sm"
              >
                Alle ({items.length})
              </Button>
              <Button
                variant={formatFilter === "cd" ? "default" : "outline"}
                onClick={() => setFormatFilter("cd")}
                size="sm"
              >
                CD's ({items.filter(item => item.media_type === "cd").length})
              </Button>
              <Button
                variant={formatFilter === "vinyl" ? "default" : "outline"}
                onClick={() => setFormatFilter("vinyl")}
                size="sm"
              >
                Vinyl ({items.filter(item => item.media_type === "vinyl").length})
              </Button>
            </div>
          </div>
        </Card>

        {/* Items Grid */}
        {filteredItems.length === 0 ? (
          <Card className="p-12 text-center bg-gradient-to-br from-card/50 to-background/80 backdrop-blur-sm border-border/50">
            <Music className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {items.length === 0 ? "Geen publieke items" : "Geen resultaten"}
            </h3>
            <p className="text-muted-foreground">
              {items.length === 0 
                ? "Deze collectie heeft geen publiek zichtbare items."
                : "Probeer een andere zoekopdracht of filter."
              }
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredItems.map((item) => (
              <CollectionItemCard
                key={item.id}
                item={item}
                onUpdate={() => {}} // No updates allowed in public view
                showControls={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}