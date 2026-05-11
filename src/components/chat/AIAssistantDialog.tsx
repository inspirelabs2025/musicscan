import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Link } from 'react-router-dom';
import { buttonVariants } from '../ui/button';
import { cn } from '@/lib/utils';

interface AIAssistantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onDismiss?: () => void;
  confirmText?: string;
  onConfirm?: () => void; // Optional if button links to a route
  type?: 'ai_nudge' | 'chat_nudge'; // Add type to differentiate
}

export function AIAssistantDialog({
  open,
  onOpenChange,
  title,
  description,
  onDismiss,
  confirmText = 'Oké',
  onConfirm,
  type = 'ai_nudge',
}: AIAssistantDialogProps) {
  const confirmAction = () => {
    onConfirm?.();
    onOpenChange(false); // Close dialog after action
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="w-[90%] rounded-lg border-2 border-ai-nudge-border bg-ai-nudge-background p-6 shadow-lg sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center text-lg font-bold text-ai-nudge-foreground">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-sm leading-relaxed text-ai-nudge-foreground">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row justify-center gap-4">
          {onDismiss && (
            <AlertDialogCancel
              onClick={onDismiss}
              className="rounded-full border-ai-nudge-border bg-transparent text-ai-nudge-foreground hover:bg-ai-nudge-foreground/10 hover:text-ai-nudge-foreground"
            >
              Nee, bedankt
            </AlertDialogCancel>
          )}
          {type === 'chat_nudge' ? (
             <Link
             to="/chat"
             className={cn(buttonVariants({ variant: 'default' }), "rounded-full hover:bg-ai-nudge-foreground/90")}
             onClick={confirmAction} // Dismiss nudge when going to chat
           >
             {confirmText}
           </Link>
          ) : (
            <AlertDialogAction
              onClick={confirmAction}
              className="rounded-full bg-ai-nudge-foreground text-white hover:bg-ai-nudge-foreground/90"
            >
              {confirmText}
            </AlertDialogAction>
          )}

        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
