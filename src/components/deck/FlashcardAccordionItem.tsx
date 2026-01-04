/**
 * FlashcardAccordionItem Component
 *
 * Single accordion item representing a flashcard.
 * Shows preview (~50 characters) and expands to full view.
 * Provides edit and delete actions when expanded.
 */

import { Pencil, Trash2 } from "lucide-react";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import type { FlashcardAccordionItemProps } from "./types";

export function FlashcardAccordionItem({
  flashcard,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
}: FlashcardAccordionItemProps) {
  return (
    <AccordionItem value={flashcard.id}>
      <AccordionTrigger
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={`flashcard-content-${flashcard.id}`}
      >
        <div className="flex items-center gap-2 text-left">
          <span className="font-medium">{flashcard.frontPreview}</span>
          {flashcard.source === "ai" && (
            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
              AI
            </span>
          )}
        </div>
      </AccordionTrigger>

      <AccordionContent id={`flashcard-content-${flashcard.id}`}>
        <div className="space-y-4 pt-2">
          {/* Front side */}
          <div className="space-y-1">
            <div className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Przód</div>
            <div className="bg-muted/50 rounded-md p-3 text-sm">{flashcard.front}</div>
          </div>

          {/* Back side */}
          <div className="space-y-1">
            <div className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Tył</div>
            <div className="bg-muted/50 rounded-md p-3 text-sm">{flashcard.back}</div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onEdit} className="gap-2">
              <Pencil className="h-4 w-4" />
              Edytuj
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="text-destructive hover:bg-destructive/10 gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Usuń
            </Button>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
