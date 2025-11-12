import { SinglesImporter } from '@/components/admin/SinglesImporter';

export default function SinglesImporterPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Singles Import & Batch Processing</h1>
        <p className="text-muted-foreground mt-2">
          Importeer singles in bulk en laat ze automatisch verwerken tot muziekverhalen
        </p>
      </div>
      <SinglesImporter />
    </div>
  );
}
