import { Button } from "@/components/ui/button";
import { useDiscogsConnection } from "@/hooks/useDiscogsConnection";
import { ExternalLink, Link2, Link2Off, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export const DiscogsConnectButton = () => {
  const { tr } = useLanguage();
  const s = tr.scannerUI;
  const {
    connection,
    isLoading,
    isConnected,
    connect,
    isConnecting,
    disconnect,
    isDisconnecting,
  } = useDiscogsConnection();

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        {s.loading}
      </Button>
    );
  }

  if (isConnected && connection) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <a
            href={`https://www.discogs.com/user/${connection.discogs_username}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
            Discogs account: {connection.discogs_username}
          </a>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => disconnect()}
          disabled={isDisconnecting}
        >
          {isDisconnecting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Link2Off className="w-4 h-4" />
          )}
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => connect()}
      disabled={isConnecting}
    >
      {isConnecting ? (
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
      ) : (
        <Link2 className="w-4 h-4 mr-2" />
      )}
      {s.connectDiscogs}
    </Button>
  );
};
