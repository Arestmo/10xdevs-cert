/**
 * DeckTile Component
 *
 * Single deck tile displaying name and statistics.
 * Clicking navigates to the deck details page.
 * Highlights decks with cards due for review.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DeckTileProps } from "./types";

export function DeckTile({ deck }: DeckTileProps) {
  const hasDueCards = deck.dueFlashcards > 0;

  return (
    <a
      href={`/decks/${deck.id}`}
      className="focus-visible:outline-primary block transition-all hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-2"
      aria-label={`Otwórz talię ${deck.name}${hasDueCards ? ` - ${deck.dueFlashcards} fiszek do powtórki` : ""}`}
    >
      <Card
        className={`hover:border-primary/50 h-full cursor-pointer ${
          hasDueCards ? "border-orange-500/30 bg-orange-50/50 dark:bg-orange-950/10" : ""
        }`}
      >
        <CardHeader>
          <CardTitle className="line-clamp-2">{deck.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {/* Total flashcards count */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Wszystkie fiszki:</span>
              <span className="font-medium">{deck.totalFlashcards}</span>
            </div>

            {/* Due flashcards count - highlighted if > 0 */}
            {hasDueCards && (
              <div className="flex items-center justify-between rounded-md bg-orange-100 px-3 py-2 text-sm dark:bg-orange-900/20">
                <span className="font-medium text-orange-900 dark:text-orange-100">Do powtórki:</span>
                <span className="font-bold text-orange-900 dark:text-orange-100">{deck.dueFlashcards}</span>
              </div>
            )}

            {/* No cards due message */}
            {!hasDueCards && deck.totalFlashcards > 0 && (
              <div className="text-muted-foreground text-xs italic">Brak fiszek do powtórki</div>
            )}

            {/* Empty deck message */}
            {deck.totalFlashcards === 0 && (
              <div className="text-muted-foreground text-xs italic">Pusta talia - dodaj fiszki</div>
            )}
          </div>
        </CardContent>
      </Card>
    </a>
  );
}
