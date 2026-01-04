import { Card, CardContent } from "@/components/ui/card";
import { RevealButton } from "./RevealButton";
import { RatingButtons } from "./RatingButtons";
import type { FlashcardDisplayProps } from "./types";

/**
 * FlashcardDisplay - Centralna karta wyświetlająca fiszkę
 *
 * Pokazuje przód fiszki, a po odsłonięciu również tył.
 * Zawiera przycisk odsłonięcia lub przyciski oceny w zależności od stanu.
 */
export function FlashcardDisplay({ card, isRevealed, onReveal, onRate, isSubmitting }: FlashcardDisplayProps) {
  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <Card className="shadow-lg" role="article" aria-label="Fiszka do nauki">
        {/* Przód fiszki - zawsze widoczny */}
        <CardContent className="pt-6 pb-6">
          <div className="prose prose-sm sm:prose-base max-w-none dark:prose-invert">
            <div className="text-sm text-muted-foreground mb-2" aria-label="Pytanie">
              Pytanie:
            </div>
            <div className="text-base sm:text-lg whitespace-pre-wrap break-words" id="flashcard-question">
              {card.front}
            </div>
          </div>
        </CardContent>

        {/* Separator i tył fiszki - warunkowy */}
        {isRevealed && (
          <>
            <hr className="border-border" aria-hidden="true" />
            <CardContent className="pt-6 pb-6" aria-live="polite">
              <div className="prose prose-sm sm:prose-base max-w-none dark:prose-invert">
                <div className="text-sm text-muted-foreground mb-2" aria-label="Odpowiedź">
                  Odpowiedź:
                </div>
                <div className="text-base sm:text-lg whitespace-pre-wrap break-words" id="flashcard-answer">
                  {card.back}
                </div>
              </div>
            </CardContent>
          </>
        )}

        {/* Akcje - przycisk odsłonięcia lub przyciski oceny */}
        <CardContent className="pb-6">
          {!isRevealed ? (
            <RevealButton onReveal={onReveal} />
          ) : (
            <RatingButtons onRate={onRate} isSubmitting={isSubmitting} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
