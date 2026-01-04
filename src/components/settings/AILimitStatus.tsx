import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { AILimitStatusProps } from "./types";

/**
 * Formats ISO date (YYYY-MM-DD) to Polish format (DD.MM.YYYY)
 *
 * @param isoDate - Date string in YYYY-MM-DD format
 * @returns Formatted date string in DD.MM.YYYY format
 */
function formatResetDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}.${month}.${year}`;
}

/**
 * AILimitStatus Component
 *
 * Displays the user's AI flashcard generation limit status:
 * - Usage counter (X / 200 flashcards)
 * - Progress bar visualization
 * - Reset date information
 *
 * @param usedCount - Number of AI flashcards generated this month
 * @param totalLimit - Total monthly limit (200)
 * @param resetDate - Date when the limit resets (YYYY-MM-DD format)
 */
export function AILimitStatus({ usedCount, totalLimit, resetDate }: AILimitStatusProps) {
  // Calculate percentage for progress bar (0-100)
  const percentage = Math.round((usedCount / totalLimit) * 100);

  // Format reset date from YYYY-MM-DD to DD.MM.YYYY
  const formattedResetDate = formatResetDate(resetDate);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Limit fiszek AI</CardTitle>
        <CardDescription>
          Możesz wygenerować do {totalLimit} fiszek miesięcznie za pomocą sztucznej inteligencji
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Usage counter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Wykorzystano:</span>
            <span className="font-medium">
              {usedCount} / {totalLimit} fiszek w tym miesiącu
            </span>
          </div>

          {/* Progress bar */}
          <Progress value={percentage} aria-label={`Wykorzystano ${percentage}% limitu`} />
        </div>

        {/* Reset date */}
        <div className="text-sm text-muted-foreground">
          Limit odnowi się: <span className="font-medium text-foreground">{formattedResetDate}</span>
        </div>
      </CardContent>
    </Card>
  );
}
