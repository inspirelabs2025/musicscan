import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Coins, Smartphone, UserPlus, Apple } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
  open: boolean;
  onClose: () => void;
}

const isIOS = () =>
  typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);

const APP_STORE_URL = "https://apps.apple.com/app/musicscan/id6739262838";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.inspirelabs.musicscan";

export function GuestScanSignupDialog({ open, onClose }: Props) {
  const navigate = useNavigate();
  const ios = isIOS();
  const storeUrl = ios ? APP_STORE_URL : PLAY_STORE_URL;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Coins className="h-5 w-5 text-amber-500" />
            Maak je account aan
          </DialogTitle>
          <DialogDescription className="text-base pt-1">
            Krijg <span className="font-bold text-foreground">10 credits cadeau</span> bij registratie en bewaar al je scans.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <Button
            size="lg"
            className="w-full gap-2"
            onClick={() => {
              onClose();
              navigate("/auth?signup=1&bonus=10");
            }}
          >
            <UserPlus className="h-4 w-4" />
            Maak nu je account (+10 credits)
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">of</span>
            </div>
          </div>

          <Button
            size="lg"
            variant="outline"
            className="w-full gap-2"
            asChild
          >
            <a href={storeUrl} target="_blank" rel="noopener noreferrer">
              {ios ? <Apple className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
              Download de app
            </a>
          </Button>

          <button
            type="button"
            onClick={onClose}
            className="w-full text-xs text-muted-foreground hover:text-foreground pt-1"
          >
            Misschien later
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
