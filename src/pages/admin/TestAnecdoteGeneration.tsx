import { TestAnecdoteGeneration } from "@/components/admin/TestAnecdoteGeneration";

export default function TestAnecdoteGenerationPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Test Anekdote Generatie</h1>
        <TestAnecdoteGeneration />
      </div>
    </div>
  );
}
