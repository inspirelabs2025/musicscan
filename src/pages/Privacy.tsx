import { useSEO } from "@/hooks/useSEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Eye, Lock, UserCheck, Database, Cookie, Mail, Clock } from "lucide-react";

export default function Privacy() {
  useSEO({
    title: "Privacybeleid | MusicScan - Jouw Privacy is Onze Prioriteit",
    description: "Lees ons privacybeleid. MusicScan respecteert jouw privacy en beschermt je persoonlijke gegevens conform de AVG/GDPR wetgeving."
  });

  const lastUpdated = "30 november 2025";

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 via-vinyl-purple/10 to-vinyl-gold/10 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-10 w-10 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-vinyl-gold bg-clip-text text-transparent">
              Privacybeleid
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
              MusicScan ("wij", "ons", "onze") respecteert de privacy van alle gebruikers van onze website 
              en diensten. Wij zijn gevestigd in Nederland en handelen conform de Algemene Verordening 
              Gegevensbescherming (AVG/GDPR). Dit privacybeleid legt uit welke gegevens wij verzamelen, 
              waarom wij dat doen, en hoe wij deze gegevens beschermen.
            </p>
          </CardContent>
        </Card>

        {/* Section 1: Verantwoordelijke */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              1. Verantwoordelijke
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              MusicScan is verantwoordelijk voor de verwerking van persoonsgegevens zoals weergegeven 
              in dit privacybeleid.
            </p>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p><strong>Contactgegevens:</strong></p>
              <p>MusicScan</p>
              <p>E-mail: <a href="mailto:info@musicscan.nl" className="text-primary hover:underline">info@musicscan.nl</a></p>
              <p>Website: <a href="https://www.musicscan.app" className="text-primary hover:underline">www.musicscan.app</a></p>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Welke gegevens verzamelen wij */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              2. Welke Gegevens Verzamelen Wij
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Wij verzamelen en verwerken de volgende categorieën persoonsgegevens:</p>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Accountgegevens</h4>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>E-mailadres (voor registratie en communicatie)</li>
                  <li>Wachtwoord (versleuteld opgeslagen)</li>
                  <li>Profielnaam en avatar (optioneel)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Gebruiksgegevens</h4>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Muziekcollectie-informatie (vinyl, CDs, scans)</li>
                  <li>Geüploade fotos en afbeeldingen</li>
                  <li>Interacties met de community (likes, comments)</li>
                  <li>Slimme analyses en chatgeschiedenis</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Technische gegevens</h4>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>IP-adres</li>
                  <li>Browsertype en -versie</li>
                  <li>Apparaatinformatie</li>
                  <li>Datum en tijd van toegang</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Bestelgegevens (bij aankopen)</h4>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Naam en adresgegevens</li>
                  <li>Betalingsgegevens (verwerkt via Stripe)</li>
                  <li>Bestelgeschiedenis</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Doeleinden */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              3. Doeleinden van Gegevensverwerking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Wij verwerken jouw persoonsgegevens voor de volgende doeleinden:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Dienstverlening:</strong> Om onze diensten aan te bieden, waaronder het scannen en catalogiseren van je muziekcollectie.</li>
              <li><strong className="text-foreground">Accountbeheer:</strong> Om je account te beheren en je toegang te geven tot onze functies.</li>
              <li><strong className="text-foreground">AI-functionaliteit:</strong> Om gepersonaliseerde AI-analyses en aanbevelingen te genereren op basis van je collectie.</li>
              <li><strong className="text-foreground">Community:</strong> Om sociale functies mogelijk te maken zoals het delen van fotos en interacties.</li>
              <li><strong className="text-foreground">Bestellingen:</strong> Om bestellingen te verwerken en producten te leveren.</li>
              <li><strong className="text-foreground">Communicatie:</strong> Om je te informeren over belangrijke updates, nieuwe functies of servicewijzigingen.</li>
              <li><strong className="text-foreground">Beveiliging:</strong> Om fraude te voorkomen en de veiligheid van onze diensten te waarborgen.</li>
              <li><strong className="text-foreground">Verbetering:</strong> Om onze diensten te analyseren en te verbeteren.</li>
            </ul>
          </CardContent>
        </Card>

        {/* Section 4: Rechtsgrond */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              4. Rechtsgrond voor Verwerking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Wij verwerken jouw gegevens op basis van de volgende rechtsgronden:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Uitvoering van de overeenkomst:</strong> Voor het leveren van onze diensten waarvoor je je hebt aangemeld.</li>
              <li><strong className="text-foreground">Toestemming:</strong> Voor het versturen van marketingberichten en optionele functies.</li>
              <li><strong className="text-foreground">Gerechtvaardigd belang:</strong> Voor het verbeteren van onze diensten en het voorkomen van fraude.</li>
              <li><strong className="text-foreground">Wettelijke verplichting:</strong> Voor het voldoen aan fiscale en andere wettelijke verplichtingen.</li>
            </ul>
          </CardContent>
        </Card>

        {/* Section 5: Opslag en beveiliging */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              5. Opslag en Beveiliging
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Jouw gegevens worden opgeslagen op beveiligde servers van Supabase, onze hosting- en 
              databaseprovider. Supabase is gevestigd in de EU en voldoet aan de AVG/GDPR-vereisten.
            </p>
            <p>Wij nemen de volgende beveiligingsmaatregelen:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>SSL/TLS-encryptie voor alle dataoverdracht</li>
              <li>Versleutelde opslag van wachtwoorden (bcrypt)</li>
              <li>Row Level Security (RLS) voor database-toegang</li>
              <li>Regelmatige beveiligingsaudits</li>
              <li>Beperkte toegang tot persoonsgegevens binnen onze organisatie</li>
            </ul>
          </CardContent>
        </Card>

        {/* Section 6: Bewaartermijnen */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              6. Bewaartermijnen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Wij bewaren jouw gegevens niet langer dan noodzakelijk:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Accountgegevens:</strong> Zolang je account actief is, plus 30 dagen na verwijdering.</li>
              <li><strong className="text-foreground">Bestelgegevens:</strong> 7 jaar conform fiscale bewaarplicht.</li>
              <li><strong className="text-foreground">Technische logs:</strong> Maximaal 90 dagen.</li>
              <li><strong className="text-foreground">AI-chatgeschiedenis:</strong> Zolang je account actief is.</li>
            </ul>
          </CardContent>
        </Card>

        {/* Section 7: Cookies */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cookie className="h-5 w-5 text-primary" />
              7. Cookies en Tracking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>MusicScan maakt gebruik van de volgende soorten cookies:</p>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Noodzakelijke cookies</h4>
                <p className="text-muted-foreground">
                  Deze cookies zijn essentieel voor het functioneren van de website, zoals het 
                  onthouden van je inlogstatus.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Functionele cookies</h4>
                <p className="text-muted-foreground">
                  Deze cookies onthouden je voorkeuren, zoals taalinstellingen en thema (dark/light mode).
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Analytische cookies</h4>
                <p className="text-muted-foreground">
                  Wij gebruiken analytische tools om te begrijpen hoe bezoekers onze website gebruiken. 
                  Deze data wordt geanonimiseerd verwerkt.
                </p>
              </div>
            </div>

            <p className="mt-4">
              Je kunt cookies beheren via je browserinstellingen. Het uitschakelen van bepaalde 
              cookies kan de functionaliteit van onze website beperken.
            </p>
          </CardContent>
        </Card>

        {/* Section 8: Derde partijen */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              8. Delen met Derden
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Wij delen jouw gegevens alleen met derden wanneer dit noodzakelijk is:</p>
            
            <div className="space-y-3">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-semibold">Supabase (Database & Hosting)</h4>
                <p className="text-sm text-muted-foreground">Opslag van accountgegevens en collectiedata. EU-gevestigd, AVG-compliant.</p>
              </div>
              
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-semibold">Stripe (Betalingen)</h4>
                <p className="text-sm text-muted-foreground">Verwerking van betalingen. Stripe is PCI-DSS gecertificeerd.</p>
              </div>
              
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-semibold">OpenAI / Anthropic (AI-diensten)</h4>
                <p className="text-sm text-muted-foreground">AI-analyses worden uitgevoerd met geanonimiseerde data waar mogelijk.</p>
              </div>
              
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-semibold">Discogs (Muziekdata)</h4>
                <p className="text-sm text-muted-foreground">Ophalen van release-informatie voor je collectie.</p>
              </div>
            </div>

            <p className="mt-4 font-semibold text-primary">
              Wij verkopen nooit jouw persoonsgegevens aan derden voor marketingdoeleinden.
            </p>
          </CardContent>
        </Card>

        {/* Section 9: Jouw rechten */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              9. Jouw Rechten (AVG/GDPR)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Onder de AVG heb je de volgende rechten:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Recht op inzage:</strong> Je kunt opvragen welke gegevens wij van je hebben.</li>
              <li><strong className="text-foreground">Recht op rectificatie:</strong> Je kunt onjuiste gegevens laten corrigeren.</li>
              <li><strong className="text-foreground">Recht op verwijdering:</strong> Je kunt verzoeken om verwijdering van je gegevens.</li>
              <li><strong className="text-foreground">Recht op beperking:</strong> Je kunt de verwerking van je gegevens laten beperken.</li>
              <li><strong className="text-foreground">Recht op dataportabiliteit:</strong> Je kunt je gegevens in een leesbaar formaat opvragen.</li>
              <li><strong className="text-foreground">Recht op bezwaar:</strong> Je kunt bezwaar maken tegen bepaalde verwerkingen.</li>
              <li><strong className="text-foreground">Recht om toestemming in te trekken:</strong> Je kunt eerder gegeven toestemming intrekken.</li>
            </ul>
            
            <div className="bg-primary/10 p-4 rounded-lg mt-4">
              <p>
                Om een van deze rechten uit te oefenen, neem contact met ons op via{" "}
                <a href="mailto:info@musicscan.nl" className="text-primary font-semibold hover:underline">
                  info@musicscan.nl
                </a>
                . Wij reageren binnen 30 dagen op je verzoek.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Section 10: Klachten */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              10. Klachten
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Als je een klacht hebt over de verwerking van je persoonsgegevens, neem dan eerst 
              contact met ons op zodat we kunnen proberen het probleem op te lossen.
            </p>
            <p>
              Je hebt ook het recht om een klacht in te dienen bij de Autoriteit Persoonsgegevens, 
              de Nederlandse toezichthoudende autoriteit voor gegevensbescherming:
            </p>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p><strong>Autoriteit Persoonsgegevens</strong></p>
              <p>Website: <a href="https://www.autoriteitpersoonsgegevens.nl" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.autoriteitpersoonsgegevens.nl</a></p>
            </div>
          </CardContent>
        </Card>

        {/* Section 11: Wijzigingen */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              11. Wijzigingen in dit Privacybeleid
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Wij kunnen dit privacybeleid van tijd tot tijd bijwerken. De meest recente versie is 
              altijd beschikbaar op deze pagina. Bij belangrijke wijzigingen informeren wij je via 
              e-mail of een melding op onze website.
            </p>
            <p>
              Wij raden je aan dit privacybeleid regelmatig te raadplegen om op de hoogte te blijven 
              van eventuele wijzigingen.
            </p>
          </CardContent>
        </Card>

        {/* Contact CTA */}
        <Card className="overflow-hidden bg-gradient-to-br from-primary/5 to-vinyl-gold/5">
          <CardContent className="p-8 text-center">
            <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-semibold mb-3">Vragen over je Privacy?</h3>
            <p className="text-muted-foreground mb-4">
              Neem gerust contact met ons op als je vragen hebt over dit privacybeleid of over 
              hoe wij omgaan met je persoonsgegevens.
            </p>
            <a 
              href="mailto:info@musicscan.nl" 
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
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
