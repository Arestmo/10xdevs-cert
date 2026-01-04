import { BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { EmptyStudyStateProps } from "./types";

/**
 * EmptyStudyState - Ekran wyświetlany gdy brak fiszek do powtórki
 *
 * Pokazuje przyjazny komunikat i informację o najbliższej powtórce (jeśli dostępna).
 * Zachęca do tworzenia nowych fiszek lub powrotu później.
 */
export function EmptyStudyState({ nextReviewDate, returnUrl = "/dashboard" }: EmptyStudyStateProps) {
  // Formatowanie daty najbliższej powtórki
  const formattedNextReview = nextReviewDate
    ? new Date(nextReviewDate).toLocaleDateString("pl-PL", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mb-4 flex justify-center">
            <BookOpen className="text-muted-foreground h-16 w-16" />
          </div>
          <CardTitle className="text-2xl">Brak fiszek do powtórki</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Świetna robota! Nie masz żadnych fiszek zaplanowanych do powtórki w tej chwili.
          </p>

          {formattedNextReview && (
            <p className="text-muted-foreground text-sm">
              Najbliższa powtórka: <span className="text-foreground font-medium">{formattedNextReview}</span>
            </p>
          )}

          <div className="pt-2">
            <Button asChild className="w-full">
              <a href={returnUrl}>Wróć do dashboardu</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
