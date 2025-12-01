import { Link } from "react-router-dom";
import { ExternalLink, Clock, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SmartArtistLinkProps {
  artistName: string;
  className?: string;
  showBadge?: boolean;
}

// Generate slug from artist name
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');
};

export function SmartArtistLink({ artistName, className, showBadge = true }: SmartArtistLinkProps) {
  const slug = generateSlug(artistName);
  
  // Check if artist story exists
  const { data: artistExists, isLoading } = useQuery({
    queryKey: ['artist-exists', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artist_stories')
        .select('id, slug')
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle();
      
      return !!data;
    },
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });

  if (isLoading) {
    return (
      <span className={cn(
        "inline-flex items-center gap-1 px-3 py-1.5 bg-muted/50 rounded-full text-sm animate-pulse",
        className
      )}>
        <User className="w-3 h-3" />
        {artistName}
      </span>
    );
  }

  if (artistExists) {
    return (
      <Link 
        to={`/artist/${slug}`}
        className={cn(
          "inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 rounded-full text-sm font-medium transition-colors group",
          className
        )}
      >
        <User className="w-3 h-3 text-primary" />
        {artistName}
        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      </Link>
    );
  }

  // Artist doesn't have a story yet - show with "coming soon" indicator
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted/70 rounded-full text-sm text-muted-foreground",
      className
    )}>
      <User className="w-3 h-3" />
      {artistName}
      {showBadge && (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 ml-1 border-dashed">
          <Clock className="w-2.5 h-2.5 mr-0.5" />
          Binnenkort
        </Badge>
      )}
    </span>
  );
}

// Bulk check component for multiple artists
interface SmartArtistLinksProps {
  artists: string[];
  className?: string;
}

export function SmartArtistLinks({ artists, className }: SmartArtistLinksProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {artists.map((artist) => (
        <SmartArtistLink key={artist} artistName={artist} />
      ))}
    </div>
  );
}
