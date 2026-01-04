import { CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { SessionCompleteProps } from "./types";

/**
 * SessionComplete - Ekran zakończenia sesji
 *
 * Wyświetlany po ocenieniu wszystkich fiszek.
 * Pokazuje podsumowanie i przycisk powrotu do dashboardu.
 */
export function SessionComplete({ reviewedCount, returnUrl = "/dashboard" }: SessionCompleteProps) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mb-4 flex justify-center">
            <CheckCircle2 className="h-16 w-16 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Sesja zakończona</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            Ukończono <span className="text-foreground font-semibold">{reviewedCount}</span>{" "}
            {reviewedCount === 1 ? "fiszkę" : "fiszek"}
          </p>
          <Button asChild className="w-full">
            <a href={returnUrl}>Wróć do dashboardu</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
