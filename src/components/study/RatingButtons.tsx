import { memo } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RatingButtonsProps, Rating } from "./types";
import { RATING_LABELS } from "./types";

/**
 * RatingButtons - Grupa 4 przycisków oceny (Again, Hard, Good, Easy)
 *
 * Wyświetlana po odsłonięciu odpowiedzi. Każdy przycisk ma odpowiedni kolor i etykietę.
 * Przyciski są responsywne (duże na mobile, mniejsze na desktop).
 * Obsługuje stan wysyłania z spinnerem.
 *
 * Memoized: Re-renderuje się tylko gdy props się zmienią.
 */
export const RatingButtons = memo(function RatingButtons({
  onRate,
  disabled = false,
  isSubmitting = false,
}: RatingButtonsProps) {
  const handleRate = (rating: Rating) => {
    if (!disabled && !isSubmitting) {
      onRate(rating);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 justify-center mt-6">
      {/* Again (1) - Czerwony/Destructive */}
      <Button
        variant="destructive"
        size="lg"
        onClick={() => handleRate(1)}
        disabled={disabled || isSubmitting}
        className="min-w-[120px] min-h-[44px] flex-1 sm:flex-none"
        aria-label="Ocena: Again (1). Naciśnij 1 lub A"
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : RATING_LABELS[1]}
      </Button>

      {/* Hard (2) - Pomarańczowy (outline z custom kolorem) */}
      <Button
        variant="outline"
        size="lg"
        onClick={() => handleRate(2)}
        disabled={disabled || isSubmitting}
        className="min-w-[120px] min-h-[44px] flex-1 sm:flex-none border-orange-500 text-orange-600 hover:bg-orange-50 dark:border-orange-400 dark:text-orange-400 dark:hover:bg-orange-950"
        aria-label="Ocena: Hard (2). Naciśnij 2 lub H"
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : RATING_LABELS[2]}
      </Button>

      {/* Good (3) - Zielony/Default */}
      <Button
        variant="default"
        size="lg"
        onClick={() => handleRate(3)}
        disabled={disabled || isSubmitting}
        className="min-w-[120px] min-h-[44px] flex-1 sm:flex-none bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
        aria-label="Ocena: Good (3). Naciśnij 3 lub G"
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : RATING_LABELS[3]}
      </Button>

      {/* Easy (4) - Niebieski/Secondary */}
      <Button
        variant="secondary"
        size="lg"
        onClick={() => handleRate(4)}
        disabled={disabled || isSubmitting}
        className="min-w-[120px] min-h-[44px] flex-1 sm:flex-none bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
        aria-label="Ocena: Easy (4). Naciśnij 4 lub E"
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : RATING_LABELS[4]}
      </Button>
    </div>
  );
});
