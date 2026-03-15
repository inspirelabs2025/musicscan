import React from 'react';
import { BellRing } from 'lucide-react';
import { Button } from './button';

interface AiNudgeBannerProps {
  onDismiss: () => void;
  onExplore: () => void;
}

export const AiNudgeBanner: React.FC<AiNudgeBannerProps> = ({ onDismiss, onExplore }) => {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 p-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg shadow-lg flex items-center space-x-3 max-w-sm md:max-w-md lg:max-w-xl animate-fade-in">
      <BellRing className="h-6 w-6 text-yellow-300 animate-pulse" />
      <div className="flex-1">
        <p className="font-semibold text-sm md:text-base">🤖 AI features beschikbaar!</p>
        <p className="text-xs md:text-sm">Ontdek wat AI voor je project kan doen.</p>
      </div>
      <div className="flex flex-col space-y-2 md:flex-row md:space-x-2 md:space-y-0">
        <Button onClick={onExplore} className="bg-white text-purple-700 hover:bg-gray-100 px-3 py-1 text-xs md:text-sm h-auto focus:ring-2 focus:ring-offset-2 focus:ring-white ">
          Ontdek AI
        </Button>
        <Button onClick={onDismiss} variant="ghost" className="text-white hover:bg-white/20 px-3 py-1 text-xs md:text-sm h-auto">
          Verberg
        </Button>
      </div>
    </div>
  );
};
