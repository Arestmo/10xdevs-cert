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
      className="focus-visible:outline-primary w-full text-left transition-all hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-2"
      aria-label="Utwórz nową talię lub wygeneruj fiszki AI"
    >
      <Card className="border-muted-foreground/25 bg-muted/30 hover:border-primary/50 hover:bg-muted/50 h-full cursor-pointer border-2 border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-4 py-8">
          {/* Icon */}
          <div className="bg-primary/10 rounded-full p-4">
            <Plus className="text-primary size-8" />
          </div>

          {/* Title */}
          <div className="text-center">
            <h3 className="text-lg font-semibold">Nowa talia</h3>
            <p className="text-muted-foreground mt-1 text-sm">lub generuj fiszki AI</p>
          </div>
        </CardContent>
      </Card>
    </button>
  );
}
