import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStudySession } from "@/components/hooks/useStudySession";
import { StudyHeader } from "./StudyHeader";
import { FlashcardDisplay } from "./FlashcardDisplay";
import { SessionComplete } from "./SessionComplete";
import { EmptyStudyState } from "./EmptyStudyState";
import type { StudyViewProps } from "./types";

/**
 * StudyView - Główny kontener sesji nauki
 *
 * Zarządza logiką sesji nauki używając hooka useStudySession.
 * Renderuje odpowiednie komponenty w zależności od stanu sesji:
 * - Loading spinner
 * - Error message z przyciskiem retry
 * - Empty state (brak fiszek)
 * - Session complete (sesja ukończona)
 * - Flashcard display (aktywna sesja)
 */
export function StudyView({ deckId }: StudyViewProps) {
  const {
    cards,
    currentIndex,
    isAnswerRevealed,
    isSessionComplete,
    reviewedCount,
    currentCard,
    isLoading,
    isSubmitting,
    error,
    revealAnswer,
    submitRating,
    endSession,
    retryFetch,
  } = useStudySession(deckId);

  // Stan ładowania
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" role="status" aria-live="polite">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" aria-hidden="true" />
          <p className="text-muted-foreground">Ładowanie fiszek...</p>
        </div>
      </div>
    );
  }

  // Stan błędu
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4" role="alert" aria-live="assertive">
        <div className="text-center space-y-4 max-w-md">
          <p className="text-destructive font-medium">{error}</p>
          <Button onClick={retryFetch} variant="outline" aria-label="Spróbuj ponownie załadować fiszki">
            Spróbuj ponownie
          </Button>
        </div>
      </div>
    );
  }

  // Stan pusty - brak fiszek do powtórki
  if (cards.length === 0) {
    const returnUrl = deckId ? `/decks/${deckId}` : "/dashboard";
    return <EmptyStudyState returnUrl={returnUrl} />;
  }

  // Sesja ukończona
  if (isSessionComplete) {
    const returnUrl = deckId ? `/decks/${deckId}` : "/dashboard";
    return <SessionComplete reviewedCount={reviewedCount} returnUrl={returnUrl} />;
  }

  // Aktywna sesja nauki
  return (
    <div className="min-h-screen" role="application" aria-label="Sesja nauki fiszek">
      {/* Nagłówek z przyciskiem X i paskiem postępu */}
      <StudyHeader currentIndex={currentIndex} totalCards={cards.length} onClose={endSession} />

      {/* Główna zawartość - fiszka */}
      <main className="pt-20 pb-8 px-4" aria-label="Fiszka do nauki">
        {currentCard && (
          <FlashcardDisplay
            card={currentCard}
            isRevealed={isAnswerRevealed}
            onReveal={revealAnswer}
            onRate={submitRating}
            isSubmitting={isSubmitting}
          />
        )}
      </main>

      {/* Ukryty komunikat dla screen readerów o skrótach klawiszowych */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {!isAnswerRevealed && "Naciśnij spację aby odsłonić odpowiedź"}
        {isAnswerRevealed &&
          !isSubmitting &&
          "Oceń swoją znajomość: 1 lub A - Again, 2 lub H - Hard, 3 lub G - Good, 4 lub E - Easy"}
      </div>
    </div>
  );
}
