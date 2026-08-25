import { DiagramWorkspace } from "@/features/diagram";

export default function Home() {
  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <h1 className="sr-only">Diagram editor</h1>
      <div className="min-h-0 flex-1">
        <DiagramWorkspace />
      </div>
    </main>
  );
}
