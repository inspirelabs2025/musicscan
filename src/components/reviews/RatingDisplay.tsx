import { Star } from "lucide-react";

interface RatingDisplayProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  showNumber?: boolean;
}

export const RatingDisplay = ({ 
  rating, 
  maxRating = 10, 
  size = "md",
  showNumber = true 
}: RatingDisplayProps) => {
  const percentage = (rating / maxRating) * 100;
  
  const sizeClasses = {
    sm: "text-2xl",
    md: "text-4xl",
    lg: "text-6xl"
  };

  const getColor = () => {
    if (percentage >= 80) return "text-green-500";
    if (percentage >= 60) return "text-yellow-500";
    return "text-orange-500";
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`${sizeClasses[size]} font-bold ${getColor()}`}>
        {rating.toFixed(1)}
      </div>
      {showNumber && (
        <div className="flex flex-col">
          <div className="text-sm text-muted-foreground">van {maxRating}</div>
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < Math.round(rating / 2)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted"
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
