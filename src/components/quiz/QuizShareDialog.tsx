import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  Share2, Twitter, Facebook, MessageCircle, Copy, Link2, 
  Trophy, Target, Swords, QrCode, Instagram, Send
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';

interface QuizShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  score: number;
  totalQuestions: number;
  percentage: number;
  badge: { title: string; emoji: string; color: string };
  shareToken: string;
  quizType: string;
  shareImageUrl?: string;
  onCreateChallenge?: () => void;
}

export function QuizShareDialog({
  open,
  onOpenChange,
  score,
  totalQuestions,
  percentage,
  badge,
  shareToken,
  quizType,
  shareImageUrl,
  onCreateChallenge
}: QuizShareDialogProps) {
  const { toast } = useToast();
  const [showQR, setShowQR] = useState(false);
  
  const shareUrl = `${window.location.origin}/quiz/result/${shareToken}`;
  
  const shareText = `🎵 Ik scoorde ${percentage}% op de MusicScan ${quizType} Quiz! ${badge.emoji} Kun jij dit verslaan? 🎧`;
  const shareTextWhatsApp = `Hey! Ik heb net ${percentage}% gescoord op de MusicScan muziek quiz! 🎵\nIk daag je uit om het beter te doen! 💪\n${shareUrl}`;
  
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link gekopieerd!",
        description: "Deel deze link met je vrienden",
      });
    } catch (error) {
      toast({
        title: "Kopiëren mislukt",
        description: "Probeer het opnieuw",
        variant: "destructive",
      });
    }
  };
  
  const handleTwitterShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}&hashtags=MusicScan,MuziekQuiz`;
    window.open(url, '_blank', 'width=550,height=420');
  };
  
  const handleFacebookShare = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'width=550,height=420');
  };
  
  const handleWhatsAppShare = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareTextWhatsApp)}`;
    window.open(url, '_blank');
  };
  
  const handleTelegramShare = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };
  
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `MusicScan Quiz Score: ${percentage}%`,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Share failed:', error);
        }
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Deel je Score
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Score Preview Card */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-br from-primary/20 via-primary/10 to-background rounded-xl p-6 text-center border border-primary/20"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="text-5xl font-bold text-primary mb-2"
            >
              {percentage}%
            </motion.div>
            <div className="text-lg text-muted-foreground mb-3">
              {score}/{totalQuestions} vragen correct
            </div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-lg font-medium ${badge.color}`}
            >
              <span className="text-2xl">{badge.emoji}</span>
              {badge.title}
            </motion.div>
          </motion.div>
          
          {/* Challenge Button */}
          {onCreateChallenge && (
            <Button
              onClick={onCreateChallenge}
              className="w-full gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
              size="lg"
            >
              <Swords className="w-5 h-5" />
              Daag een Vriend Uit!
            </Button>
          )}
          
          {/* Social Share Buttons */}
          <div className="grid grid-cols-2 gap-3">
            {navigator.share && (
              <Button
                onClick={handleNativeShare}
                variant="outline"
                className="gap-2"
              >
                <Share2 className="w-4 h-4" />
                Delen
              </Button>
            )}
            
            <Button
              onClick={handleTwitterShare}
              variant="outline"
              className="gap-2 hover:bg-sky-500/10 hover:border-sky-500/50"
            >
              <Twitter className="w-4 h-4 text-sky-500" />
              Twitter
            </Button>
            
            <Button
              onClick={handleFacebookShare}
              variant="outline"
              className="gap-2 hover:bg-blue-600/10 hover:border-blue-600/50"
            >
              <Facebook className="w-4 h-4 text-blue-600" />
              Facebook
            </Button>
            
            <Button
              onClick={handleWhatsAppShare}
              variant="outline"
              className="gap-2 hover:bg-green-500/10 hover:border-green-500/50"
            >
              <MessageCircle className="w-4 h-4 text-green-500" />
              WhatsApp
            </Button>
            
            <Button
              onClick={handleTelegramShare}
              variant="outline"
              className="gap-2 hover:bg-blue-400/10 hover:border-blue-400/50"
            >
              <Send className="w-4 h-4 text-blue-400" />
              Telegram
            </Button>
            
            <Button
              onClick={() => setShowQR(!showQR)}
              variant="outline"
              className="gap-2"
            >
              <QrCode className="w-4 h-4" />
              QR Code
            </Button>
          </div>
          
          {/* QR Code */}
          <AnimatePresence>
            {showQR && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="flex justify-center overflow-hidden"
              >
                <div className="bg-white p-4 rounded-lg">
                  <QRCodeSVG value={shareUrl} size={150} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Copy Link */}
          <div className="flex gap-2">
            <Input
              value={shareUrl}
              readOnly
              className="text-sm"
            />
            <Button onClick={handleCopyLink} variant="secondary" size="icon">
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
