/**
 * GenerationError Component
 *
 * Displays user-friendly error message with retry option.
 */

import { AlertCircle, RefreshCw, Clock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { GenerationErrorProps } from "./types";

export function GenerationError({ error, onRetry }: GenerationErrorProps) {
  const getErrorContent = () => {
    switch (error.code) {
      case "AI_SERVICE_ERROR":
        return {
          title: "Usługa AI niedostępna",
          description: "Usługa generowania fiszek jest tymczasowo niedostępna. Spróbuj ponownie za chwilę.",
          icon: <AlertCircle className="h-5 w-5" />,
        };

      case "AI_LIMIT_EXCEEDED":
        return {
          title: "Wyczerpano limit AI",
          description: `Wykorzystałeś limit ${error.currentCount}/${error.limit} fiszek AI w tym miesiącu. Limit odnowi się ${new Date(error.resetDate).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" })}. W międzyczasie możesz tworzyć fiszki ręcznie.`,
          icon: <Clock className="h-5 w-5" />,
        };

      case "DECK_NOT_FOUND":
        return {
          title: "Talia nie znaleziona",
          description: "Wybrana talia nie istnieje lub została usunięta. Odśwież listę talii i spróbuj ponownie.",
          icon: <AlertCircle className="h-5 w-5" />,
        };

      case "VALIDATION_ERROR":
        return {
          title: "Błąd walidacji",
          description:
            error.message || "Dane formularza są nieprawidłowe. Sprawdź wprowadzone wartości i spróbuj ponownie.",
          icon: <AlertCircle className="h-5 w-5" />,
        };

      case "NETWORK_ERROR":
        return {
          title: "Błąd połączenia",
          description: "Nie udało się połączyć z serwerem. Sprawdź połączenie internetowe i spróbuj ponownie.",
          icon: <AlertCircle className="h-5 w-5" />,
        };

      case "UNKNOWN":
      default:
        return {
          title: "Wystąpił nieoczekiwany błąd",
          description:
            error.message ||
            "Coś poszło nie tak. Spróbuj ponownie, a jeśli problem będzie się powtarzał, skontaktuj się z pomocą techniczną.",
          icon: <AlertCircle className="h-5 w-5" />,
        };
    }
  };

  const { title, description, icon } = getErrorContent();
  const showRetryButton = error.code !== "AI_LIMIT_EXCEEDED";

  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <div className="flex items-start gap-3">
          {icon}
          <div className="flex-1 space-y-1">
            <AlertTitle>{title}</AlertTitle>
            <AlertDescription className="text-sm">{description}</AlertDescription>
          </div>
        </div>
      </Alert>

      {showRetryButton && (
        <div className="flex justify-center">
          <Button onClick={onRetry} variant="outline" size="lg">
            <RefreshCw className="mr-2 h-4 w-4" />
            Spróbuj ponownie
          </Button>
        </div>
      )}
    </div>
  );
}
