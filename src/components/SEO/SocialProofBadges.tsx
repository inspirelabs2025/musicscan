import { Eye, TrendingUp, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ViewCountBadgeProps {
  viewCount: number;
  className?: string;
}

export const ViewCountBadge: React.FC<ViewCountBadgeProps> = ({
  viewCount,
  className
}) => {
  if (viewCount === 0) return null;

  return (
    <Badge variant="secondary" className={cn("flex items-center gap-1", className)}>
      <Eye className="h-3 w-3" />
      <span className="text-xs">
        {viewCount.toLocaleString('nl-NL')} {viewCount === 1 ? 'weergave' : 'weergaven'}
      </span>
    </Badge>
  );
};

interface TrendingBadgeProps {
  isHot?: boolean;
  className?: string;
}

export const TrendingBadge: React.FC<TrendingBadgeProps> = ({
  isHot = false,
  className
}) => {
  if (!isHot) return null;

  return (
    <Badge variant="default" className={cn("flex items-center gap-1 bg-gradient-to-r from-orange-500 to-red-500", className)}>
      <TrendingUp className="h-3 w-3" />
      <span className="text-xs font-semibold">Trending</span>
    </Badge>
  );
};

interface PopularityBadgeProps {
  scanCount: number;
  threshold?: number;
  className?: string;
}

export const PopularityBadge: React.FC<PopularityBadgeProps> = ({
  scanCount,
  threshold = 10,
  className
}) => {
  if (scanCount < threshold) return null;

  return (
    <Badge variant="secondary" className={cn("flex items-center gap-1", className)}>
      <Users className="h-3 w-3" />
      <span className="text-xs">
        {scanCount} mensen hebben dit
      </span>
    </Badge>
  );
};
