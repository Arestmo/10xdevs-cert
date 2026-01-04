/**
 * DeckActions Component
 *
 * Action bar with main deck operation buttons.
 * Buttons:
 * - Study - navigate to study session
 *   - Shows "Ucz się (X)" when X cards are due
 *   - Shows "Ćwicz losowe" when no cards due but flashcards exist (practice mode)
 *   - Disabled only when deck has no flashcards
 * - Generate flashcards - open AI generation modal
 * - Add flashcard - open flashcard form modal
 * - Delete deck - open delete confirmation dialog
 */

import { Play, Sparkles, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DeckActionsProps } from "./types";

export function DeckActions({
  deckId,
  dueCount,
  totalFlashcards,
  onAddFlashcard,
  onGenerateFlashcards,
  onDeleteDeck,
}: DeckActionsProps) {
  const hasDueCards = dueCount > 0;
  const hasAnyCards = totalFlashcards > 0;
  const isPracticeMode = !hasDueCards && hasAnyCards;

  // Button text logic
  const buttonText = hasDueCards ? `Ucz się (${dueCount})` : isPracticeMode ? "Ćwicz losowe" : "Ucz się";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Study button */}
      <Button asChild disabled={!hasAnyCards} className="gap-2">
        <a href={hasAnyCards ? `/study/${deckId}` : undefined}>
          <Play className="h-4 w-4" />
          {buttonText}
        </a>
      </Button>

      {/* Generate flashcards button */}
      <Button variant="outline" onClick={onGenerateFlashcards} className="gap-2">
        <Sparkles className="h-4 w-4" />
        Generuj fiszki
      </Button>

      {/* Add flashcard button */}
      <Button variant="outline" onClick={onAddFlashcard} className="gap-2">
        <Plus className="h-4 w-4" />
        Dodaj fiszkę
      </Button>

      {/* Delete deck button */}
      <Button
        variant="outline"
        onClick={onDeleteDeck}
        className="text-destructive hover:bg-destructive/10 hover:text-destructive gap-2"
      >
        <Trash2 className="h-4 w-4" />
        Usuń talię
      </Button>
    </div>
  );
}
