import { useState, useEffect, useCallback, useMemo } from "react";
import type { StudyCardsResponseDTO, SubmitReviewRequestDTO } from "@/types";
import type { StudyCardViewModel, Rating, UseStudySessionReturn } from "@/components/study/types";
import { transformStudyCardDTOs } from "@/components/study/transformers";

const STUDY_CARDS_LIMIT = 50;

export function useStudySession(deckId?: string): UseStudySessionReturn {
  // Stan danych
  const [cards, setCards] = useState<StudyCardViewModel[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [totalDue, setTotalDue] = useState(0);

  // Stany ładowania i błędów
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obliczone wartości
  const isSessionComplete = useMemo(() => {
    return cards.length > 0 && currentIndex >= cards.length;
  }, [cards.length, currentIndex]);

  const currentCard = useMemo(() => {
    if (currentIndex >= cards.length) return null;
    return cards[currentIndex];
  }, [cards, currentIndex]);

  // Pobieranie kart
  const fetchCards = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const url = deckId
        ? `/api/study/cards?deck_id=${deckId}&limit=${STUDY_CARDS_LIMIT}`
        : `/api/study/cards?limit=${STUDY_CARDS_LIMIT}`;

      const response = await fetch(url);

      if (response.status === 401) {
        const redirectUrl = deckId ? `/decks/${deckId}` : "/dashboard";
        window.location.href = `/login?redirect=${redirectUrl}`;
        return;
      }

      if (response.status === 404) {
        setError("Talia nie została znaleziona");
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        setError("Nie udało się załadować fiszek. Spróbuj ponownie.");
        setIsLoading(false);
        return;
      }

      const data: StudyCardsResponseDTO = await response.json();
      const viewModels = transformStudyCardDTOs(data.data);

      setCards(viewModels);
      setTotalDue(data.total_due);
      setCurrentIndex(0);
      setReviewedCount(0);
      setIsAnswerRevealed(false);
    } catch (err) {
      console.error("Error fetching study cards:", err);
      setError("Nie udało się załadować fiszek. Sprawdź połączenie i spróbuj ponownie.");
    } finally {
      setIsLoading(false);
    }
  }, [deckId]);

  // Odsłonięcie odpowiedzi
  const revealAnswer = useCallback(() => {
    setIsAnswerRevealed(true);
  }, []);

  // Wysłanie oceny
  const submitRating = useCallback(
    async (rating: Rating) => {
      if (!currentCard || isSubmitting) return;

      setIsSubmitting(true);

      try {
        const requestBody: SubmitReviewRequestDTO = {
          flashcard_id: currentCard.id,
          rating,
        };

        const response = await fetch("/api/study/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        if (response.status === 401) {
          const redirectUrl = deckId ? `/decks/${deckId}` : "/dashboard";
          window.location.href = `/login?redirect=${redirectUrl}`;
          return;
        }

        if (!response.ok) {
          // Automatyczne retry lub pokazanie błędu
          console.error("Failed to submit review");
          // Kontynuuj do następnej karty mimo błędu
        }

        // Przejdź do następnej karty
        setReviewedCount((prev) => prev + 1);
        setCurrentIndex((prev) => prev + 1);
        setIsAnswerRevealed(false);
      } catch (err) {
        console.error("Error submitting review:", err);
      } finally {
        setIsSubmitting(false);
      }
    },
    [currentCard, isSubmitting, deckId]
  );

  // Zakończenie sesji
  const endSession = useCallback(() => {
    const returnUrl = deckId ? `/decks/${deckId}` : "/dashboard";
    window.location.href = returnUrl;
  }, [deckId]);

  // Pobierz karty przy montowaniu
  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  // Skróty klawiszowe
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignoruj jeśli focus w input/textarea
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Escape - zakończ sesję
      if (event.key === "Escape") {
        endSession();
        return;
      }

      // Jeśli sesja ukończona, ignoruj pozostałe skróty
      if (isSessionComplete || isLoading || !currentCard) return;

      // Space - odsłoń odpowiedź
      if (event.key === " " && !isAnswerRevealed) {
        event.preventDefault();
        revealAnswer();
        return;
      }

      // Oceny (tylko gdy odpowiedź odsłonięta)
      if (isAnswerRevealed && !isSubmitting) {
        const ratingMap: Record<string, Rating> = {
          "1": 1,
          a: 1,
          A: 1,
          "2": 2,
          h: 2,
          H: 2,
          "3": 3,
          g: 3,
          G: 3,
          "4": 4,
          e: 4,
          E: 4,
        };

        const rating = ratingMap[event.key];
        if (rating) {
          event.preventDefault();
          submitRating(rating);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isSessionComplete,
    isLoading,
    currentCard,
    isAnswerRevealed,
    isSubmitting,
    revealAnswer,
    submitRating,
    endSession,
  ]);

  return {
    cards,
    currentIndex,
    isAnswerRevealed,
    isSessionComplete,
    reviewedCount,
    totalDue,
    currentCard,
    isLoading,
    isSubmitting,
    error,
    revealAnswer,
    submitRating,
    endSession,
    retryFetch: fetchCards,
  };
}
