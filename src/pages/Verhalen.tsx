import { BreadcrumbNavigation } from "@/components/SEO/BreadcrumbNavigation";
import { VerhaalTab } from "@/components/VerhaalTab";
import { Helmet } from "react-helmet";

export default function Verhalen() {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Muziekverhalen - Albums, Artiesten & Singles | MusicScan</title>
        <meta name="description" content="Ontdek de verhalen achter je favoriete albums, artiesten en singles. Achtergrondinformatie, geschiedenis en bijzondere details over muziek." />
      </Helmet>

      <BreadcrumbNavigation className="max-w-7xl mx-auto px-4 pt-4" />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            📚 Muziekverhalen
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Ontdek de verhalen achter albums, artiesten en de geschiedenis van de muziek
          </p>
        </div>

        <VerhaalTab />
      </main>
    </div>
  );
}
