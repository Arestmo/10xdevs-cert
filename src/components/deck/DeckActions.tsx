/**
 * DeckActions Component
 *
 * Action bar with main deck operation buttons.
 * Buttons:
 * - Study (X) - navigate to study session (disabled if X = 0)
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
  onAddFlashcard,
  onGenerateFlashcards,
  onDeleteDeck,
}: DeckActionsProps) {
  const hasCardsToStudy = dueCount > 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Study button */}
      <Button asChild disabled={!hasCardsToStudy} className="gap-2">
        <a href={hasCardsToStudy ? `/study?deck=${deckId}` : undefined}>
          <Play className="h-4 w-4" />
          Ucz się {hasCardsToStudy && `(${dueCount})`}
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
        className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
        Usuń talię
      </Button>
    </div>
  );
}
