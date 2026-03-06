import React from 'react';
import { X } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';

interface AINudgeProps {
  onClose: () => void;
  onExplore: () => void;
}

export const AINudge: React.FC<AINudgeProps> = ({ onClose, onExplore }) => {
  return (
    <Card className="fixed bottom-4 right-4 z-50 max-w-sm shadow-lg overflow-hidden bg-gradient-to-br from-blue-600 to-purple-700 text-white">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold text-white">🤖 AI features beschikbaar!</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white opacity-70 hover:opacity-100">
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-white opacity-90">
          Je hebt de AI features nog maar 0x gebruikt. Ontdek wat AI voor je project kan doen!
        </CardDescription>
      </CardContent>
      <CardFooter className="justify-end">
        <Button onClick={onExplore} className="bg-white text-blue-700 hover:bg-gray-100 transition-colors duration-200">
          Ontdek AI
        </Button>
      </CardFooter>
    </Card>
  );
};
