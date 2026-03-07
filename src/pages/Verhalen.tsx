import { BreadcrumbNavigation } from "@/components/SEO/BreadcrumbNavigation";
import { VerhaalTab } from "@/components/VerhaalTab";
import { Helmet } from "react-helmet";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Verhalen() {
  const { tr } = useLanguage();

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.musicscan.app" },
      { "@type": "ListItem", "position": 2, "name": "Verhalen", "item": "https://www.musicscan.app/verhalen" }
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{tr.verhalen.metaTitle}</title>
        <meta name="description" content={tr.verhalen.metaDesc} />
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      <BreadcrumbNavigation className="max-w-7xl mx-auto px-4 pt-4" />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            📚 {tr.verhalen.title}
          </h1>
          <h2 className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Het Verhaal Achter Legendarische Albums & Singles
          </h2>
        </div>

        <VerhaalTab />
      </main>
    </div>
  );
}
