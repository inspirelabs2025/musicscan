import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle, Music, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

const Welkom: React.FC = () => {
  const { language } = useLanguage();

  const isNL = language === "nl";

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <Card className="max-w-lg w-full border-none shadow-2xl bg-gradient-to-br from-card to-card/80">
        <CardContent className="pt-10 pb-8 px-8 text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {isNL ? "Bedankt voor je aanmelding! 🎉" : "Thanks for signing up! 🎉"}
            </h1>
            <p className="text-muted-foreground text-lg">
              {isNL
                ? "Je account is aangemaakt. Check je e-mail om je account te bevestigen."
                : "Your account has been created. Check your email to confirm your account."}
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 justify-center text-sm font-medium">
              <Music className="h-4 w-4 text-primary" />
              {isNL ? "Wat kun je verwachten?" : "What to expect?"}
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>{isNL ? "✓ Scan en beheer je muziekcollectie" : "✓ Scan and manage your music collection"}</li>
              <li>{isNL ? "✓ Ontdek verhalen achter je muziek" : "✓ Discover stories behind your music"}</li>
              <li>{isNL ? "✓ Verbind met andere verzamelaars" : "✓ Connect with other collectors"}</li>
              <li>{isNL ? "✓ Unieke merchandise van je favoriete albums" : "✓ Unique merch from your favorite albums"}</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Button asChild size="lg">
              <Link to="/auth">
                {isNL ? "Inloggen" : "Sign in"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/">
                {isNL ? "Terug naar home" : "Back to home"}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Welkom;
