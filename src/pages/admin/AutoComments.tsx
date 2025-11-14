import { AutoCommentsForm } from "@/components/admin/AutoCommentsForm";

export default function AutoCommentsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Geautomatiseerde Comments</h1>
          <p className="text-muted-foreground">
            Beheer AI-gegenereerde comments voor blog posts. Het systeem genereert natuurlijke,
            contextrijke comments met Nederlandse namen voor authentieke interactie.
          </p>
        </div>
        <AutoCommentsForm />
      </div>
    </div>
  );
}