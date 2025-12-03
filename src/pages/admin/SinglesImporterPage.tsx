import { SinglesImporter } from '@/components/admin/SinglesImporter';
import { DanceHouseQueueManager } from '@/components/admin/DanceHouseQueueManager';

export default function SinglesImporterPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Singles Import & Batch Processing</h1>
        <p className="text-muted-foreground mt-2">
          Importeer singles in bulk en laat ze automatisch verwerken tot muziekverhalen
        </p>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-1">
          <DanceHouseQueueManager />
        </div>
      </div>
      
      <SinglesImporter />
    </div>
  );
}
