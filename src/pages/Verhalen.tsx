import { BreadcrumbNavigation } from "@/components/SEO/BreadcrumbNavigation";
import { VerhaalTab } from "@/components/VerhaalTab";
import { Helmet } from "react-helmet";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Verhalen() {
  const { tr } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{tr.verhalen.metaTitle}</title>
        <meta name="description" content={tr.verhalen.metaDesc} />
      </Helmet>

      <BreadcrumbNavigation className="max-w-7xl mx-auto px-4 pt-4" />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            📚 {tr.verhalen.title}
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {tr.verhalen.subtitle}
          </p>
        </div>

        <VerhaalTab />
      </main>
    </div>
  );
}
