
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
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[9999]">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-2 shadow-2xl">
        <div className="flex items-center gap-2">
          {/* Chapter Navigation Buttons */}
          <div className="flex items-center gap-1">
            {chapters.map((chapter, index) => {
              const Icon = chapter.icon;
              const isActive = activeChapter === index;
              
              return (
                <Button
                  key={chapter.id}
                  onClick={() => scrollToSection(index)}
                  variant="ghost"
                  size="sm"
                  className={`relative flex flex-col items-center gap-1 p-3 h-auto min-w-[60px] transition-all duration-300 ${
                    isActive 
                      ? 'bg-white/20 text-white shadow-lg' 
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs font-medium hidden sm:block">
                    {chapter.title.split(' ')[0]}
                  </span>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 -z-10" />
                  )}
                </Button>
              );
            })}
          </div>
          
          {/* Separator */}
          <div className="w-px h-8 bg-white/20 mx-2" />
          
          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            <Button
              onClick={() => toast({ title: "Share DNA feature coming soon!" })}
              variant="ghost"
              size="sm"
              className="flex flex-col items-center gap-1 p-3 h-auto min-w-[60px] text-white/60 hover:text-white hover:bg-white/10 transition-all"
            >
              <Share2 className="h-4 w-4" />
              <span className="text-xs font-medium hidden sm:block">Share</span>
            </Button>
            
            <Button
              onClick={() => toast({ title: "Export feature coming soon!" })}
              variant="ghost"
              size="sm"
              className="flex flex-col items-center gap-1 p-3 h-auto min-w-[60px] text-white/60 hover:text-white hover:bg-white/10 transition-all"
            >
              <Download className="h-4 w-4" />
              <span className="text-xs font-medium hidden sm:block">Export</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
