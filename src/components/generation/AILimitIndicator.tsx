/**
 * AILimitIndicator Component
 *
 * Displays the remaining AI flashcard generation limit for the current month.
 * Shows a counter "Pozostało: X/200" and reset date information when limit is exhausted.
 */

import { Info } from "lucide-react";
import type { AILimitIndicatorProps } from "./types";

export function AILimitIndicator({ remainingLimit, resetDate, isLoading = false }: AILimitIndicatorProps) {
  const totalLimit = 200;
  const isLimitExhausted = remainingLimit === 0;

  // Format reset date for display
  const formatResetDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("pl-PL", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className={isLimitExhausted ? "text-destructive" : "text-muted-foreground"}>
        Pozostało:{" "}
        <span className="font-semibold">
          {remainingLimit}/{totalLimit}
        </span>
      </div>

      {isLimitExhausted && <span className="text-xs text-muted-foreground">Reset: {formatResetDate(resetDate)}</span>}

      <div className="group relative">
        <Info className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors cursor-help" />
        <div className="absolute right-0 top-6 z-50 hidden w-64 rounded-md border bg-popover p-3 text-xs text-popover-foreground shadow-md group-hover:block">
          <p>
            Możesz wygenerować do {totalLimit} fiszek miesięcznie za pomocą AI. Limit odnawia się pierwszego dnia
            każdego miesiąca.
          </p>
        </div>
      </div>
    </div>
  );
}
