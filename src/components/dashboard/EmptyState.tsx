/**
 * EmptyState Component
 *
 * Displayed for new users without any decks.
 * Shows a welcome message and CTA button to create the first deck.
 */

import { FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EmptyStateProps } from "./types";

export function EmptyState({ onCreateDeck }: EmptyStateProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-6 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 px-6 py-12 text-center">
      {/* Illustration icon */}
      <div className="rounded-full bg-primary/10 p-6">
        <FolderPlus className="size-16 text-primary" />
      </div>

      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Witaj w Flashcards AI!</h2>
        <p className="max-w-md text-muted-foreground">
          Utwórz swoją pierwszą talię, aby rozpocząć naukę z fiszkami wspieranymi przez sztuczną inteligencję
        </p>
      </div>

      {/* CTA Button */}
      <Button size="lg" onClick={onCreateDeck} className="mt-4" aria-label="Utwórz pierwszą talię">
        <FolderPlus className="mr-2 size-5" />
        Utwórz pierwszą talię
      </Button>
    </div>
  );
}
