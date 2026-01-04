/**
 * Type definitions for Study View components
 */

/**
 * Props dla głównego komponentu StudyView
 */
export interface StudyViewProps {
  /** Opcjonalny UUID talii do filtrowania */
  deckId?: string;
}

/**
 * ViewModel dla fiszki w sesji nauki
 * Transformacja StudyCardDTO z formatowaniem dla UI
 */
export interface StudyCardViewModel {
  id: string;
  deckId: string;
  deckName: string;
  front: string;
  back: string;
  /** Podgląd przodu (pierwsze ~50 znaków) dla accessibility */
  frontPreview: string;
}

/**
 * Stan sesji nauki
 */
export interface StudySessionState {
  /** Lista kart do przejrzenia w tej sesji */
  cards: StudyCardViewModel[];
  /** Indeks aktualnej karty (0-based) */
  currentIndex: number;
  /** Czy odpowiedź jest odsłonięta */
  isAnswerRevealed: boolean;
  /** Czy sesja jest ukończona */
  isSessionComplete: boolean;
  /** Liczba przejrzanych kart */
  reviewedCount: number;
  /** Łączna liczba kart do powtórki (może być większa niż cards.length) */
  totalDue: number;
}

/**
 * Props dla komponentu StudyHeader
 */
export interface StudyHeaderProps {
  /** Indeks aktualnej karty (0-based) */
  currentIndex: number;
  /** Łączna liczba kart w sesji */
  totalCards: number;
  /** Callback zamknięcia sesji */
  onClose: () => void;
}

/**
 * Props dla komponentu ProgressBar
 */
export interface ProgressBarProps {
  /** Liczba przejrzanych kart */
  current: number;
  /** Łączna liczba kart */
  total: number;
  /** Dodatkowe klasy CSS */
  className?: string;
}

/**
 * Props dla komponentu FlashcardDisplay
 */
export interface FlashcardDisplayProps {
  /** Aktualna fiszka do wyświetlenia */
  card: StudyCardViewModel;
  /** Czy odpowiedź jest odsłonięta */
  isRevealed: boolean;
  /** Callback odsłonięcia odpowiedzi */
  onReveal: () => void;
  /** Callback wysłania oceny */
  onRate: (rating: 1 | 2 | 3 | 4) => void;
  /** Czy trwa wysyłanie oceny */
  isSubmitting: boolean;
}

/**
 * Props dla komponentu RevealButton
 */
export interface RevealButtonProps {
  /** Callback odsłonięcia odpowiedzi */
  onReveal: () => void;
  /** Czy automatycznie ustawić focus (domyślnie: true) */
  autoFocus?: boolean;
}

/**
 * Typ oceny fiszki
 */
export type Rating = 1 | 2 | 3 | 4;

/**
 * Etykiety dla przycisków oceny
 */
export const RATING_LABELS: Record<Rating, string> = {
  1: "Again",
  2: "Hard",
  3: "Good",
  4: "Easy",
};

/**
 * Props dla komponentu RatingButtons
 */
export interface RatingButtonsProps {
  /** Callback wysłania oceny */
  onRate: (rating: Rating) => void;
  /** Czy przyciski są wyłączone */
  disabled?: boolean;
  /** Czy trwa wysyłanie (pokazuje spinner) */
  isSubmitting?: boolean;
}

/**
 * Props dla komponentu SessionComplete
 */
export interface SessionCompleteProps {
  /** Liczba ukończonych fiszek */
  reviewedCount: number;
  /** URL powrotu (domyślnie: "/dashboard") */
  returnUrl?: string;
}

/**
 * Props dla komponentu EmptyStudyState
 */
export interface EmptyStudyStateProps {
  /** Data najbliższej powtórki (ISO string) */
  nextReviewDate?: string | null;
  /** URL powrotu (domyślnie: "/dashboard") */
  returnUrl?: string;
}

/**
 * Wartość zwracana przez hook useStudySession
 */
export interface UseStudySessionReturn {
  // Stan sesji
  cards: StudyCardViewModel[];
  currentIndex: number;
  isAnswerRevealed: boolean;
  isSessionComplete: boolean;
  reviewedCount: number;
  totalDue: number;

  // Aktualna karta (helper)
  currentCard: StudyCardViewModel | null;

  // Stany ładowania i błędów
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  // Akcje
  revealAnswer: () => void;
  submitRating: (rating: Rating) => Promise<void>;
  endSession: () => void;
  retryFetch: () => void;
}
