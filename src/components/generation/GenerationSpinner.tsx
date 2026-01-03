/**
 * GenerationSpinner Component
 *
 * Spinner displayed during flashcard generation with text message.
 */

import { Loader2 } from "lucide-react";

export function GenerationSpinner() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />

      <div className="text-center space-y-2">
        <p className="text-lg font-medium">Generowanie fiszek...</p>
        <p className="text-sm text-muted-foreground">To może potrwać do 30 sekund</p>
      </div>
    </div>
  );
}
