
import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  Brain, 
  Network, 
  Lightbulb, 
  Compass,
  Share2,
  Download
} from "lucide-react";
import { toast } from '@/hooks/use-toast';

interface FloatingNavigationProps {
  chapters: Array<{
    id: string;
    title: string;
    subtitle: string;
    icon: React.ComponentType<any>;
    color: string;
  }>;
  activeChapter: number;
  onChapterChange: (index: number) => void;
}

export function FloatingNavigation({ 
  chapters, 
  activeChapter, 
  onChapterChange 
}: FloatingNavigationProps) {
  const scrollToSection = (index: number) => {
    const sectionId = `chapter-${chapters[index].id}`;
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
    onChapterChange(index);
  };

  return (
    <div className="fixed bottom-4 md:bottom-6 left-1/2 transform -translate-x-1/2 z-[9999] px-4 w-full max-w-screen-lg">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl md:rounded-2xl p-1 md:p-2 shadow-2xl overflow-x-auto">
        <div className="flex items-center gap-1 md:gap-2 min-w-fit">
          {/* Chapter Navigation Buttons */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {chapters.map((chapter, index) => {
              const Icon = chapter.icon;
              const isActive = activeChapter === index;
              
              return (
                <Button
                  key={chapter.id}
                  onClick={() => scrollToSection(index)}
                  variant="ghost"
                  size="sm"
                  className={`relative flex flex-col items-center gap-1 p-2 md:p-3 h-auto min-w-[50px] md:min-w-[60px] transition-all duration-300 ${
                    isActive 
                      ? 'bg-white/20 text-white shadow-lg' 
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="text-xs font-medium hidden sm:block">
                    {chapter.title.split(' ')[0]}
                  </span>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/20 to-vinyl-gold/20 -z-10" />
                  )}
                </Button>
              );
            })}
          </div>
          
          {/* Separator - Hidden on mobile */}
          <div className="w-px h-6 md:h-8 bg-white/20 mx-1 md:mx-2 hidden sm:block" />
          
          {/* Action Buttons - Hidden on mobile */}
          <div className="hidden sm:flex items-center gap-1">
            <Button
              onClick={() => toast({ title: "Share DNA feature coming soon!" })}
              variant="ghost"
              size="sm"
              className="flex flex-col items-center gap-1 p-2 md:p-3 h-auto min-w-[50px] md:min-w-[60px] text-white/60 hover:text-white hover:bg-white/10 transition-all"
            >
              <Share2 className="h-3 w-3 md:h-4 md:w-4" />
              <span className="text-xs font-medium hidden md:block">Share</span>
            </Button>
            
            <Button
              onClick={() => toast({ title: "Export feature coming soon!" })}
              variant="ghost"
              size="sm"
              className="flex flex-col items-center gap-1 p-2 md:p-3 h-auto min-w-[50px] md:min-w-[60px] text-white/60 hover:text-white hover:bg-white/10 transition-all"
            >
              <Download className="h-3 w-3 md:h-4 md:w-4" />
              <span className="text-xs font-medium hidden md:block">Export</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
