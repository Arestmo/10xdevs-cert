/**
 * CreateDeckTile Component
 *
 * CTA tile for creating a new deck or generating AI flashcards.
 * Clicking opens a modal with deck creation form.
 * Styled with dashed border to indicate it's an action tile.
 */

import { Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { CreateDeckTileProps } from "./types";

export function CreateDeckTile({ onClick }: CreateDeckTileProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left transition-all hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      aria-label="Utwórz nową talię lub wygeneruj fiszki AI"
    >
      <Card className="h-full border-2 border-dashed border-muted-foreground/25 bg-muted/30 hover:border-primary/50 hover:bg-muted/50 cursor-pointer">
        <CardContent className="flex flex-col items-center justify-center gap-4 py-8">
          {/* Icon */}
          <div className="rounded-full bg-primary/10 p-4">
            <Plus className="size-8 text-primary" />
          </div>

          {/* Title */}
          <div className="text-center">
            <h3 className="text-lg font-semibold">Nowa talia</h3>
            <p className="mt-1 text-sm text-muted-foreground">lub generuj fiszki AI</p>
          </div>
        </CardContent>
      </Card>
    </button>
  );
}
