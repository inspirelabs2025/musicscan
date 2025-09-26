import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePodcastCategories } from "@/hooks/useCuratedPodcasts";

interface PodcastCategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export const PodcastCategoryFilter = ({ 
  selectedCategory, 
  onCategoryChange 
}: PodcastCategoryFilterProps) => {
  const { data: categories = [], isLoading } = usePodcastCategories();

  if (isLoading || categories.length === 0) {
    return null;
  }

  const allCategories = ['all', ...categories];

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'all': return 'Alle categorieën';
      case 'General': return 'Algemeen';
      case 'Music History': return 'Muziekgeschiedenis';
      case 'Artist Interviews': return 'Artiest Interviews';
      case 'Music Production': return 'Muziekproductie';
      case 'Genre Specific': return 'Genre Specifiek';
      case 'Industry News': return 'Industrie Nieuws';
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
              Actief
            </Badge>
          )}
        </Button>
      ))}
    </div>
  );
};