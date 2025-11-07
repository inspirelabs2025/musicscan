import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";

interface LastUpdatedBadgeProps {
  lastUpdate: string;
  showInSnippet?: boolean;
  className?: string;
}

export const LastUpdatedBadge: React.FC<LastUpdatedBadgeProps> = ({
  lastUpdate,
  showInSnippet = true,
  className = ""
}) => {
  const timeAgo = formatDistanceToNow(new Date(lastUpdate), {
    addSuffix: true,
    locale: nl
  });

  return (
    <Badge variant="outline" className={`flex items-center gap-1 ${className}`}>
      <Clock className="h-3 w-3" />
      <span className="text-xs">
        Bijgewerkt {timeAgo}
      </span>
    </Badge>
  );
};
