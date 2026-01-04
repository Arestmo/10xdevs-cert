/**
 * DeckGrid Component
 *
 * Responsive grid layout for deck tiles.
 * Adapts column count based on screen width:
 * - Mobile: 1 column
 * - Tablet (sm): 2 columns
 * - Desktop (lg): 3 columns
 * - Large desktop (xl): 4 columns
 */

import { DeckTile } from "./DeckTile";
import type { DeckGridProps } from "./types";

export function DeckGrid({ decks }: DeckGridProps) {
  if (decks.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {decks.map((deck) => (
        <DeckTile key={deck.id} deck={deck} />
      ))}
    </div>
  );
}
