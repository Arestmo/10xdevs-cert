import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "./ProgressBar";
import type { StudyHeaderProps } from "./types";

/**
 * StudyHeader - Minimalistyczny nagłówek sesji nauki
 *
 * Zawiera przycisk zamknięcia (X) i pasek postępu.
 * Wyświetlany przez całą sesję z fixed positioning na górze ekranu.
 */
export function StudyHeader({ currentIndex, totalCards, onClose }: StudyHeaderProps) {
  // currentIndex jest 0-based, więc dla wyświetlenia dodajemy 1
  const displayedCurrent = currentIndex + 1;

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 fixed top-0 right-0 left-0 z-10 border-b backdrop-blur">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Przycisk zamknięcia */}
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Zakończ sesję nauki" className="shrink-0">
            <X className="h-5 w-5" />
          </Button>

          {/* Pasek postępu */}
          <div className="max-w-md flex-1">
            <ProgressBar current={displayedCurrent} total={totalCards} />
          </div>

          {/* Spacer dla symetrii */}
          <div className="w-10 shrink-0" />
        </div>
      </div>
    </header>
  );
}
