import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ChatAIPromoBannerProps {
  onClose?: () => void;
}

const CHAT_AI_PROMO_DISMISSED = 'chat_ai_promo_dismissed';

export function ChatAIPromoBanner({ onClose }: ChatAIPromoBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show the banner if it hasn't been dismissed before
    const dismissed = localStorage.getItem(CHAT_AI_PROMO_DISMISSED);
    if (!dismissed) {
      setIsVisible(true);
    }
    // todo: Track banner impression "growth_chat_ai_banner_impression"
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(CHAT_AI_PROMO_DISMISSED, 'true');
    onClose?.();
    // todo: Track banner dismissal "growth_chat_ai_banner_dismiss"
  };

  const handleCtaClick = (feature: 'chat' | 'ai') => {
    // todo: Track CTA click "growth_chat_ai_banner_cta_click" with feature: chat/ai
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.3 }}
          className="absolute top-4 right-4 z-50 w-full max-w-sm md:max-w-md"
        >
          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg border-none">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="absolute top-2 right-2 text-white/80 hover:text-white hover:bg-white/10"
              aria-label="Dismiss promotion"
            >
              <X className="h-4 w-4" />
            </Button>
            <CardHeader className="flex flex-row items-center space-x-3 pb-2">
              <MessageSquare className="h-6 w-6" />
              <CardTitle className="text-lg md:text-xl font-bold">New Features Available!</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <CardDescription className="text-white/90 text-sm md:text-base leading-relaxed">
                Unlock powerful insights and streamline your workflow with our brand new Chat function and AI-powered tools!
              </CardDescription>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                <Button
                  className="bg-white text-blue-600 hover:bg-gray-100 border-none justify-start px-4"
                  onClick={() => handleCtaClick('chat')}
                >
                  <MessageSquare className="mr-2 h-4 w-4" /> Start Chatting
                </Button>
                <Button
                  className="bg-white text-purple-600 hover:bg-gray-100 border-none justify-start px-4"
                  onClick={() => handleCtaClick('ai')}
                >
                  <Brain className="mr-2 h-4 w-4" /> Explore AI
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
