import { TestAnecdoteGeneration } from "@/components/admin/TestAnecdoteGeneration";

export default function TestAnecdoteGenerationPage() {
  return (
    <div className="w-full min-w-0 p-4 space-y-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Test Anekdote Generatie</h1>
        <TestAnecdoteGeneration />
      </div>
    </div>
  );
}
