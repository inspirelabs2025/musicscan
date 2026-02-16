import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePodcastCategories } from "@/hooks/useCuratedPodcasts";
import { useLanguage } from "@/contexts/LanguageContext";

interface PodcastCategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export const PodcastCategoryFilter = ({ 
  selectedCategory, 
  onCategoryChange 
}: PodcastCategoryFilterProps) => {
  const { data: categories = [], isLoading } = usePodcastCategories();
  const { tr } = useLanguage();
  const p = tr.podcastUI;

  if (isLoading || categories.length === 0) {
    return null;
  }

  const allCategories = ['all', ...categories];

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'all': return p.allCategories;
      case 'General': return p.general;
      case 'Music History': return p.musicHistory;
      case 'Artist Interviews': return p.artistInterviews;
      case 'Music Production': return p.musicProduction;
      case 'Genre Specific': return p.genreSpecific;
      case 'Industry News': return p.industryNews;
      default: return category;
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {allCategories.map((category) => (
        <Button
          key={category}
          variant={selectedCategory === category ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryChange(category)}
          className="text-sm"
        >
          {getCategoryLabel(category)}
          {selectedCategory === category && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {p.active}
            </Badge>
          )}
        </Button>
      ))}
    </div>
  );
};
