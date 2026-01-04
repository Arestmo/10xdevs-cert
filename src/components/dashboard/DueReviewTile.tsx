/**
 * DueReviewTile Component
 *
 * Displays the number of flashcards due for review.
 * Clicking the tile navigates to the study session.
 * Only shown when there are cards due for review (dueCount > 0).
 */

import { BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { DueReviewTileProps } from "./types";

export function DueReviewTile({ dueCount }: DueReviewTileProps) {
  return (
    <a
      href="/study"
      className="focus-visible:outline-primary block transition-all hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-2"
      aria-label={`Rozpocznij sesję nauki - ${dueCount} fiszek czeka na powtórkę`}
    >
      <Card className="border-primary/50 bg-primary/5 hover:border-primary hover:bg-primary/10 h-full cursor-pointer">
        <CardContent className="flex flex-col items-center justify-center gap-4 py-8">
          {/* Icon */}
          <div className="bg-primary/10 rounded-full p-4">
            <BookOpen className="text-primary size-8" />
          </div>

          {/* Title */}
          <div className="text-center">
            <h3 className="text-lg font-semibold">Do powtórki</h3>
          </div>

          {/* Count - large and prominent */}
          <div className="text-center">
            <p className="text-primary text-5xl font-bold" aria-label={`${dueCount} fiszek`}>
              {dueCount}
            </p>
            <p className="text-muted-foreground mt-2 text-sm">
              {dueCount === 1 ? "fiszka czeka" : "fiszek czeka"} na powtórkę
            </p>
          </div>
        </CardContent>
      </Card>
    </a>
  );
}
