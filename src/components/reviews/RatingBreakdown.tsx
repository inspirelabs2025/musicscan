interface RatingBreakdownProps {
  breakdown: Record<string, number>;
  maxRating?: number;
}

export const RatingBreakdown = ({ breakdown, maxRating = 10 }: RatingBreakdownProps) => {
  if (!breakdown || Object.keys(breakdown).length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Rating Breakdown</h3>
      <div className="space-y-3">
        {Object.entries(breakdown).map(([aspect, score]) => (
          <div key={aspect} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="capitalize">{aspect}</span>
              <span className="font-medium">{score}/{maxRating}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${(score / maxRating) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
