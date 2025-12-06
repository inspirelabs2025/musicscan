import { useSEO } from "@/hooks/useSEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ShoppingCart, CreditCard, Truck, RefreshCw, Scale, AlertCircle, Mail } from "lucide-react";

export default function Voorwaarden() {
  useSEO({
    title: "Algemene Voorwaarden | MusicScan - Gebruiksvoorwaarden",
    description: "Lees onze algemene voorwaarden voor het gebruik van MusicScan platform, shop en diensten."
  });

  const lastUpdated = "6 december 2025";

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 via-vinyl-purple/10 to-vinyl-gold/10 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-10 w-10 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-vinyl-gold bg-clip-text text-transparent">
              Algemene Voorwaarden
            </h1>
          </div>
          <p className="text-muted-foreground">
            Laatst bijgewerkt: {lastUpdated}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-lg leading-relaxed">
              Deze algemene voorwaarden zijn van toepassing op alle diensten en producten van MusicScan 
              ("wij", "ons", "onze"). Door gebruik te maken van onze website, app of diensten ga je akkoord 
              met deze voorwaarden.
            </p>
          </CardContent>
        </Card>

        {/* Section 1: Definities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              1. Definities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Platform:</strong> De website musicscan.app en alle bijbehorende diensten.</li>
              <li><strong className="text-foreground">Gebruiker:</strong> Iedere natuurlijke of rechtspersoon die gebruik maakt van het Platform.</li>
              <li><strong className="text-foreground">Account:</strong> Het persoonlijke profiel van een geregistreerde Gebruiker.</li>
              <li><strong className="text-foreground">Content:</strong> Alle teksten, afbeeldingen, muziekdata en andere materialen op het Platform.</li>
              <li><strong className="text-foreground">Shop:</strong> De online winkel van MusicScan voor merchandise en producten.</li>
            </ul>
          </CardContent>
        </Card>

        {/* Section 2: Gebruik van het Platform */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              2. Gebruik van het Platform
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Bij het gebruik van MusicScan ga je akkoord met de volgende regels:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Je bent minimaal 16 jaar oud of hebt toestemming van een ouder/voogd.</li>
              <li>Je verstrekt juiste en actuele informatie bij registratie.</li>
              <li>Je bent verantwoordelijk voor de beveiliging van je accountgegevens.</li>
              <li>Je gebruikt het Platform niet voor illegale activiteiten.</li>
              <li>Je uploadt geen content die inbreuk maakt op auteursrechten van derden.</li>
              <li>Je respecteert andere gebruikers en de community-richtlijnen.</li>
            </ul>
          </CardContent>
        </Card>

        {/* Section 3: Account */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              3. Account en Registratie
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Voor bepaalde functies van MusicScan is een account vereist. Bij het aanmaken van 
              een account:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Gebruik je een geldig e-mailadres dat je regelmatig controleert.</li>
              <li>Kies je een sterk wachtwoord en deel dit niet met anderen.</li>
              <li>Ben je verantwoordelijk voor alle activiteiten onder jouw account.</li>
              <li>Meld je verdachte activiteiten direct aan ons.</li>
            </ul>
            <p className="mt-4">
              Wij behouden ons het recht voor om accounts te schorsen of te verwijderen bij 
              overtreding van deze voorwaarden.
            </p>
          </CardContent>
        </Card>

        {/* Section 4: Shop en Bestellingen */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              4. Shop en Bestellingen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Voor aankopen in de MusicScan Shop gelden de volgende voorwaarden:</p>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Prijzen</h4>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Alle prijzen zijn in Euro's (€) en inclusief BTW (21%).</li>
                  <li>Verzendkosten worden apart vermeld tijdens het afrekenen.</li>
                  <li>Wij behouden ons het recht voor prijzen te wijzigen.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Bestelling</h4>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Een bestelling is definitief na bevestiging per e-mail.</li>
                  <li>Custom en gepersonaliseerde producten worden op bestelling gemaakt.</li>
                  <li>Levertijden zijn indicatief (meestal 3-4 werkdagen).</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 5: Betaling */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              5. Betaling
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Betalingen worden verwerkt via onze betalingspartner Stripe:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Wij accepteren creditcards (Visa, Mastercard, American Express).</li>
              <li>iDEAL voor Nederlandse klanten.</li>
              <li>Bancontact voor Belgische klanten.</li>
              <li>Apple Pay en Google Pay.</li>
            </ul>
            <p className="mt-4">
              Betalingsgegevens worden veilig verwerkt door Stripe en niet door ons opgeslagen.
            </p>
          </CardContent>
        </Card>

        {/* Section 6: Verzending */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              6. Verzending en Levering
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Informatie over verzending van producten:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Nederland:</strong> Standaard verzending 3-4 werkdagen.</li>
              <li><strong className="text-foreground">België:</strong> Standaard verzending 4-5 werkdagen.</li>
              <li><strong className="text-foreground">Overig Europa:</strong> 5-10 werkdagen.</li>
              <li><strong className="text-foreground">Buiten Europa:</strong> Op aanvraag.</li>
            </ul>
            <p className="mt-4">
              Het risico van beschadiging of verlies gaat over op de koper bij aflevering. 
              Bij problemen met de bezorging, neem binnen 7 dagen contact met ons op.
            </p>
          </CardContent>
        </Card>

        {/* Section 7: Herroepingsrecht */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              7. Herroepingsrecht
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Conform de Europese wetgeving heb je 14 dagen bedenktijd na ontvangst van je bestelling.
            </p>
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Uitzonderingen</h4>
              <p className="text-muted-foreground">
                Het herroepingsrecht geldt <strong className="text-foreground">niet</strong> voor:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground mt-2">
                <li>Gepersonaliseerde of custom-made producten (zoals art prints op bestelling)</li>
                <li>Producten die om hygiënische redenen zijn verzegeld en waarvan de verzegeling is verbroken</li>
              </ul>
            </div>
            <p className="mt-4">
              Voor meer informatie over retourneren, zie ons{" "}
              <a href="/retourbeleid" className="text-primary hover:underline font-semibold">
                Retourbeleid
              </a>.
            </p>
          </CardContent>
        </Card>

        {/* Section 8: Intellectueel eigendom */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              8. Intellectueel Eigendom
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Alle content op MusicScan, inclusief maar niet beperkt tot teksten, logo's, 
              afbeeldingen, software en ontwerpen, is eigendom van MusicScan of onze licentiegevers.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Je mag content niet kopiëren, reproduceren of verspreiden zonder toestemming.</li>
              <li>Door content te uploaden, geef je ons een licentie om deze te gebruiken op het Platform.</li>
              <li>Je behoudt eigendom van je eigen geüploade content (zoals fotos van je collectie).</li>
              <li>Albumhoezen en muziekgerelateerde afbeeldingen zijn eigendom van de respectievelijke rechthebbenden.</li>
            </ul>
          </CardContent>
        </Card>

        {/* Section 9: Aansprakelijkheid */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              9. Aansprakelijkheid
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>MusicScan is niet aansprakelijk voor:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Indirecte schade, gevolgschade of gederfde winst.</li>
              <li>Schade door onjuiste of onvolledige informatie op het Platform.</li>
              <li>Schade door technische storingen of onderhoud.</li>
              <li>Handelingen van derden, waaronder andere gebruikers.</li>
              <li>Schade aan je muziekcollectie bij het scannen (wij geven alleen advies).</li>
            </ul>
            <p className="mt-4">
              Onze maximale aansprakelijkheid is beperkt tot het bedrag dat je hebt betaald voor 
              de betreffende dienst of product.
            </p>
          </CardContent>
        </Card>

        {/* Section 10: Geschillen */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              10. Toepasselijk Recht en Geschillen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Op deze voorwaarden is Nederlands recht van toepassing. Geschillen worden bij 
              voorkeur in onderling overleg opgelost.
            </p>
            <p>
              Indien dit niet lukt, kunnen geschillen worden voorgelegd aan de bevoegde rechter 
              in Nederland, of aan een door de Europese Commissie erkende geschillencommissie 
              voor online aankopen.
            </p>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p>
                <strong>EU Online Dispute Resolution:</strong>{" "}
                <a 
                  href="https://ec.europa.eu/consumers/odr" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  https://ec.europa.eu/consumers/odr
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Section 11: Wijzigingen */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              11. Wijzigingen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Wij kunnen deze voorwaarden van tijd tot tijd aanpassen. De meest recente versie 
              is altijd beschikbaar op deze pagina. Bij belangrijke wijzigingen informeren wij 
              geregistreerde gebruikers per e-mail.
            </p>
            <p>
              Door het Platform te blijven gebruiken na wijzigingen, ga je akkoord met de 
              aangepaste voorwaarden.
            </p>
          </CardContent>
        </Card>

        {/* Contact CTA */}
        <Card className="overflow-hidden bg-gradient-to-br from-primary/5 to-vinyl-gold/5">
          <CardContent className="p-8 text-center">
            <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-semibold mb-3">Vragen over de Voorwaarden?</h3>
            <p className="text-muted-foreground mb-4">
              Neem gerust contact met ons op als je vragen hebt over deze algemene voorwaarden.
            </p>
            <a 
              href="mailto:info@musicscan.nl"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Mail className="h-4 w-4" />
              info@musicscan.nl
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
