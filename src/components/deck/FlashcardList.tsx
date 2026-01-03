/**
 * FlashcardList Component
 *
 * List of flashcards in accordion format.
 * Handles empty state when no flashcards exist.
 * Only one flashcard can be expanded at a time.
 */

import { FileStack } from "lucide-react";
import { Accordion } from "@/components/ui/accordion";
import { FlashcardAccordionItem } from "./FlashcardAccordionItem";
import type { FlashcardListProps } from "./types";

export function FlashcardList({ flashcards, expandedId, onExpand, onEdit, onDelete }: FlashcardListProps) {
  // Empty state - no flashcards
  if (flashcards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 bg-muted/10 py-12">
        <FileStack className="mb-4 h-12 w-12 text-muted-foreground/50" />
        <h3 className="mb-2 text-lg font-semibold">Brak fiszek</h3>
        <p className="text-sm text-muted-foreground">Dodaj pierwszą fiszkę, aby zacząć naukę</p>
      </div>
    );
  }

  // Flashcards list with accordion
  return (
    <Accordion type="single" collapsible value={expandedId || undefined} onValueChange={onExpand}>
      {flashcards.map((flashcard) => (
        <FlashcardAccordionItem
          key={flashcard.id}
          flashcard={flashcard}
          isExpanded={expandedId === flashcard.id}
          onToggle={() => onExpand(expandedId === flashcard.id ? null : flashcard.id)}
          onEdit={() => onEdit(flashcard)}
          onDelete={() => onDelete(flashcard)}
        />
      ))}
    </Accordion>
  );
}
