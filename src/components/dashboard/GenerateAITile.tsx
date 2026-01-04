/**
 * GenerateAITile Component
 *
 * CTA tile for generating flashcards with AI.
 * Clicking opens the AI generation modal.
 * Styled with dashed border to indicate it's an action tile.
 */

import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export interface GenerateAITileProps {
  onClick: () => void;
}

export function GenerateAITile({ onClick }: GenerateAITileProps) {
  return (
    <button
      onClick={onClick}
      className="focus-visible:outline-primary w-full text-left transition-all hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-2"
      aria-label="Generuj fiszki za pomocą AI"
    >
      <Card className="border-primary/25 bg-primary/5 hover:border-primary/50 hover:bg-primary/10 h-full cursor-pointer border-2 border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-4 py-8">
          {/* Icon */}
          <div className="bg-primary/10 rounded-full p-4">
            <Sparkles className="text-primary size-8" />
          </div>

          {/* Title */}
          <div className="text-center">
            <h3 className="text-lg font-semibold">Generuj fiszki AI</h3>
            <p className="text-muted-foreground mt-1 text-sm">Automatycznie z tekstu</p>
          </div>
        </CardContent>
      </Card>
    </button>
  );
}
