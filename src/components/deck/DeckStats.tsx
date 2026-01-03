/**
 * DeckStats Component
 *
 * Displays deck statistics (total flashcards, flashcards due for review).
 * Read-only component with icons and numbers in a flex container.
 */

import { FileStack, Clock } from "lucide-react";
import type { DeckStatsProps } from "./types";

export function DeckStats({ totalFlashcards, dueFlashcards }: DeckStatsProps) {
  return (
    <div className="flex items-center gap-6 text-sm text-muted-foreground">
      {/* Total flashcards */}
      <div className="flex items-center gap-2">
        <FileStack className="h-4 w-4" />
        <span>
          <span className="font-medium text-foreground">{totalFlashcards}</span> fiszek
        </span>
      </div>

      {/* Due flashcards */}
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4" />
        <span>
          <span className="font-medium text-foreground">{dueFlashcards}</span> do powtórki
        </span>
      </div>
    </div>
  );
}
