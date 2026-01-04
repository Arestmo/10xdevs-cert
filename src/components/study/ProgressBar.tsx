import { memo } from "react";
import type { ProgressBarProps } from "./types";

/**
 * ProgressBar - Wizualny pasek postępu pokazujący ile kart zostało przejrzanych
 *
 * Wyświetla tekst "X/Y kart" i proporcjonalnie wypełniony pasek z animacją.
 * Wykorzystuje atrybuty ARIA dla accessibility.
 *
 * Memoized: Re-renderuje się tylko gdy current lub total się zmieni.
 */
export const ProgressBar = memo(function ProgressBar({ current, total, className = "" }: ProgressBarProps) {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Tekst postępu */}
      <div className="text-sm text-muted-foreground text-center">
        <span className="font-medium">{current}</span> / {total} kart
      </div>

      {/* Pasek postępu */}
      <div
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`Postęp sesji nauki: ${current} z ${total} kart`}
        className="relative h-2 w-full overflow-hidden rounded-full bg-secondary"
      >
        <div
          className="h-full bg-primary transition-all duration-300 ease-in-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
});
