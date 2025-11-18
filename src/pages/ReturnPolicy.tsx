import { useSEO } from "@/hooks/useSEO";
import { Card, CardContent } from "@/components/ui/card";
import { Truck, RotateCcw, PackageX, XCircle, MapPin, Monitor, Mail } from "lucide-react";

export default function ReturnPolicy() {
  useSEO({
    title: "Retour- & Leveringsbeleid - MusicScan.app",
    description: "Retour- en leveringsbeleid van MusicScan.app. Levertijd 1-6 werkdagen binnen Nederland & België. Op maat gemaakte producten met hoogwaardige materialen."
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 via-vinyl-purple/10 to-vinyl-gold/10 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-vinyl-gold bg-clip-text text-transparent">
            Retour- & Leveringsbeleid
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Bij MusicScan.app maken wij elke print speciaal op bestelling. We werken met hoogwaardige materialen en leveren zo snel mogelijk. Onderstaand beleid geldt voor alle producten in onze shop.
          </p>
        </div>
      </div>

      {/* Policy Content */}
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        
        {/* 1. Levertijd */}
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Truck className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-3">1. Levertijd</h2>
                <p className="text-muted-foreground mb-2">
                  Onze levertijd is <strong>1–6 werkdagen</strong> binnen Nederland & België.
                </p>
                <p className="text-muted-foreground">
                  Sommige speciale formaten kunnen een extra dag nodig hebben.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Retourneren */}
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-vinyl-purple/10">
                <RotateCcw className="w-6 h-6 text-vinyl-purple" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-3">2. Retourneren</h2>
                <p className="text-muted-foreground mb-3">
                  Omdat onze producten <strong>op maat worden gemaakt</strong>, is retourneren niet standaard mogelijk.
                  Maar we denken altijd met je mee.
                </p>
                <ul className="space-y-2 text-muted-foreground mb-4">
                  <li className="flex items-center gap-2">
                    <span className="text-vinyl-gold">✔</span>
                    Retourneren kan in overleg, afhankelijk van de situatie
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-vinyl-gold">✔</span>
                    We zoeken altijd naar een passende oplossing
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-vinyl-gold">✔</span>
                    Neem binnen 7 dagen contact met ons op
                  </li>
                </ul>
                <a 
                  href="mailto:support@musicscan.app"
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  <Mail className="w-4 h-4" />
                  support@musicscan.app
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Beschadigd of verkeerd geleverd */}
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-vinyl-gold/10">
                <PackageX className="w-6 h-6 text-vinyl-gold" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-3">3. Beschadigd of verkeerd geleverd</h2>
                <p className="text-muted-foreground mb-3">
                  Is je product <strong>beschadigd geleverd</strong> of hebben we per ongeluk iets <strong>verkeerd gemaakt</strong>?
                  Dan lossen wij dit altijd kosteloos op.
                </p>
                <p className="text-muted-foreground mb-2">
                  Stuur binnen 7 dagen:
                </p>
                <ul className="space-y-1 text-muted-foreground mb-3 ml-4">
                  <li>• je bestelnummer</li>
                  <li>• foto's van het probleem</li>
                </ul>
                <p className="text-foreground font-medium">
                  Wij sturen een gratis vervangend product.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4. Annuleren */}
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-destructive/10">
                <XCircle className="w-6 h-6 text-destructive" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-3">4. Annuleren</h2>
                <p className="text-muted-foreground mb-2">
                  Annuleren kan alleen <strong>vóórdat de productie is gestart</strong>.
                </p>
                <p className="text-muted-foreground">
                  Daarna is annuleren helaas niet meer mogelijk omdat het product al speciaal voor jou wordt gemaakt.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 5. Adres & bezorging */}
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-3">5. Adres & bezorging</h2>
                <p className="text-muted-foreground mb-2">
                  Let op dat je adres <strong>correct is</strong> bij het plaatsen van je bestelling.
                </p>
                <p className="text-muted-foreground">
                  Bij foutieve adresgegevens kunnen extra verzendkosten worden doorberekend.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 6. Kleuren & beeldschermen */}
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-vinyl-purple/10">
                <Monitor className="w-6 h-6 text-vinyl-purple" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-3">6. Kleuren & beeldschermen</h2>
                <p className="text-muted-foreground mb-2">
                  Kleurweergaves op schermen kunnen afwijken van de uiteindelijke print.
                </p>
                <p className="text-muted-foreground">
                  Dit wordt niet gezien als fout en valt niet onder een standaard retour.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact CTA */}
        <Card className="overflow-hidden bg-gradient-to-br from-primary/5 to-vinyl-gold/5">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-semibold mb-3">Nog vragen?</h3>
            <p className="text-muted-foreground mb-4">
              Neem gerust contact met ons op. We helpen je graag verder!
            </p>
            <a 
              href="mailto:support@musicscan.app"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Mail className="w-5 h-5" />
              support@musicscan.app
            </a>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
