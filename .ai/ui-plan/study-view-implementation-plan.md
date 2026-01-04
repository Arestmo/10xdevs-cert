# Plan implementacji widoku Sesji Nauki (Study View)

## 1. Przegląd

Widok Sesji Nauki (`/study` i `/study/{deckId}`) to interaktywny ekran do nauki fiszek z wykorzystaniem algorytmu FSRS (Free Spaced Repetition Scheduler). Widok umożliwia przeglądanie fiszek zaplanowanych do powtórki, odsłanianie odpowiedzi i ocenianie znajomości materiału. Na podstawie oceny użytkownika, algorytm FSRS oblicza optymalny termin kolejnej powtórki.

Kluczowe funkcjonalności:
- Wyświetlanie fiszek do powtórki (przód/tył)
- Śledzenie postępu sesji (pasek postępu X/Y)
- Ocenianie fiszek (Again/Hard/Good/Easy)
- Obsługa skrótów klawiszowych
- Ekran zakończenia sesji z podsumowaniem
- Stan pusty gdy brak fiszek do powtórki

## 2. Routing widoku

Widok dostępny pod dwoma ścieżkami:
- `/study` - sesja nauki ze wszystkich talii użytkownika
- `/study/{deckId}` - sesja nauki z konkretnej talii (UUID)

Obie ścieżki są chronione - wymagają autentykacji użytkownika.

## 3. Struktura komponentów

```
src/pages/study/
├── index.astro                 # Strona sesji nauki ze wszystkich talii
└── [deckId].astro              # Strona sesji nauki z konkretnej talii

src/layouts/
└── StudyLayout.astro           # Minimalistyczny layout dla sesji nauki

src/components/study/
├── StudyView.tsx               # Główny kontener sesji nauki (React)
├── StudyHeader.tsx             # Nagłówek z przyciskiem X i paskiem postępu
├── ProgressBar.tsx             # Pasek postępu "X/Y kart"
├── FlashcardDisplay.tsx        # Centralna karta fiszki
├── RevealButton.tsx            # Przycisk "Pokaż odpowiedź"
├── RatingButtons.tsx           # Przyciski oceny (Again/Hard/Good/Easy)
├── SessionComplete.tsx         # Ekran zakończenia sesji
├── EmptyStudyState.tsx         # Stan gdy brak fiszek do powtórki
├── types.ts                    # Typy specyficzne dla widoku
└── transformers.ts             # Transformacje DTO -> ViewModel

src/components/hooks/
└── useStudySession.ts          # Hook zarządzający stanem sesji nauki
```

Hierarchia komponentów:
```
StudyLayout (Astro)
└── StudyView (React - client:load)
    ├── StudyHeader
    │   ├── CloseButton (X)
    │   └── ProgressBar
    ├── FlashcardDisplay (warunkowy: gdy cards.length > 0)
    │   ├── CardFront
    │   ├── CardBack (warunkowy: gdy isAnswerRevealed)
    │   ├── RevealButton (warunkowy: gdy !isAnswerRevealed)
    │   └── RatingButtons (warunkowy: gdy isAnswerRevealed)
    ├── SessionComplete (warunkowy: gdy isSessionComplete)
    └── EmptyStudyState (warunkowy: gdy cards.length === 0 i !isLoading)
```

## 4. Szczegóły komponentów

### StudyLayout.astro

- **Opis**: Minimalistyczny layout Astro dla sesji nauki, bez pełnego nagłówka aplikacji i stopki. Zapewnia czysty, skoncentrowany interfejs do nauki.
- **Główne elementy**:
  - `<html>` z atrybutem `lang="pl"`
  - `<head>` z meta tagami i tytułem strony
  - `<body>` z minimalnym paddingiem
  - `<slot />` dla zawartości strony
- **Obsługiwane interakcje**: Brak (layout statyczny)
- **Obsługiwana walidacja**: Brak
- **Typy**: Brak
- **Propsy**:
  - `title?: string` - tytuł strony (domyślnie: "Nauka - Flashcards AI")

### StudyView

- **Opis**: Główny kontener React zarządzający logiką sesji nauki. Używa hooka `useStudySession` do pobierania danych i obsługi interakcji. Renderuje odpowiednie komponenty w zależności od stanu sesji.
- **Główne elementy**:
  - `StudyHeader` - nagłówek z paskiem postępu
  - `FlashcardDisplay` - karta z fiszką (gdy są karty)
  - `SessionComplete` - ekran zakończenia (gdy sesja ukończona)
  - `EmptyStudyState` - stan pusty (gdy brak kart)
  - Stan ładowania z `Loader2` z lucide-react
  - Komunikat błędu z przyciskiem retry
- **Obsługiwane interakcje**:
  - Skróty klawiszowe: 1/2/3/4 lub A/H/G/E dla ocen, Spacja dla odsłonięcia odpowiedzi, Escape dla zakończenia sesji
- **Obsługiwana walidacja**: Brak bezpośredniej walidacji (delegacja do hooka)
- **Typy**: `StudyViewProps`, `StudyCardViewModel`
- **Propsy**:
  - `deckId?: string` - opcjonalny UUID talii do filtrowania

### StudyHeader

- **Opis**: Minimalistyczny nagłówek sesji nauki zawierający przycisk zamknięcia (X) i pasek postępu. Wyświetlany przez całą sesję.
- **Główne elementy**:
  - `<header>` z `className="fixed top-0 left-0 right-0 z-10 bg-background/95 backdrop-blur"`
  - `Button` (variant="ghost", size="icon") z ikoną `X` - zamknięcie sesji
  - `ProgressBar` - pasek postępu
- **Obsługiwane interakcje**:
  - Kliknięcie przycisku X → nawigacja do dashboardu (lub `/decks/{deckId}` jeśli deckId podany)
- **Obsługiwana walidacja**: Brak
- **Typy**: `StudyHeaderProps`
- **Propsy**:
  - `currentIndex: number` - indeks aktualnej karty (0-based)
  - `totalCards: number` - łączna liczba kart w sesji
  - `onClose: () => void` - callback zamknięcia sesji

### ProgressBar

- **Opis**: Wizualny pasek postępu pokazujący ile kart zostało przejrzanych. Wyświetla tekst "X/Y kart" i proporcjonalnie wypełniony pasek.
- **Główne elementy**:
  - `<div>` kontener z `role="progressbar"` i atrybutami ARIA
  - `<div>` tło paska (szare)
  - `<div>` wypełnienie paska (kolor primary) z `transition-all duration-300`
  - `<span>` tekst "X/Y kart"
- **Obsługiwane interakcje**: Brak (komponent prezentacyjny)
- **Obsługiwana walidacja**: Brak
- **Typy**: `ProgressBarProps`
- **Propsy**:
  - `current: number` - liczba przejrzanych kart
  - `total: number` - łączna liczba kart
  - `className?: string` - dodatkowe klasy CSS

### FlashcardDisplay

- **Opis**: Centralna karta wyświetlająca fiszkę. Pokazuje przód fiszki, a po odsłonięciu również tył. Zawiera przycisk odsłonięcia lub przyciski oceny w zależności od stanu.
- **Główne elementy**:
  - `Card` (shadcn/ui) jako kontener główny z `className="max-w-2xl mx-auto"`
  - `CardContent` z przodu fiszki (zawsze widoczny)
  - `<hr>` separator (gdy odpowiedź odsłonięta)
  - `CardContent` z tyłu fiszki (warunkowy)
  - `RevealButton` (warunkowy: gdy !isRevealed)
  - `RatingButtons` (warunkowy: gdy isRevealed)
- **Obsługiwane interakcje**:
  - Kliknięcie `RevealButton` → odsłonięcie odpowiedzi
  - Kliknięcie przycisku oceny → wysłanie oceny
- **Obsługiwana walidacja**: Brak
- **Typy**: `FlashcardDisplayProps`, `StudyCardViewModel`
- **Propsy**:
  - `card: StudyCardViewModel` - aktualna fiszka do wyświetlenia
  - `isRevealed: boolean` - czy odpowiedź jest odsłonięta
  - `onReveal: () => void` - callback odsłonięcia
  - `onRate: (rating: 1 | 2 | 3 | 4) => void` - callback oceny
  - `isSubmitting: boolean` - czy trwa wysyłanie oceny

### RevealButton

- **Opis**: Duży, prominentny przycisk "Pokaż odpowiedź" zachęcający użytkownika do odsłonięcia tyłu fiszki. Automatycznie otrzymuje focus po wyrenderowaniu.
- **Główne elementy**:
  - `Button` (shadcn/ui) z `variant="default"` i `size="lg"`
  - Tekst "Pokaż odpowiedź"
  - `ref` dla auto-focus
- **Obsługiwane interakcje**:
  - Kliknięcie → wywołanie `onReveal`
  - Klawisz Space/Enter → wywołanie `onReveal`
- **Obsługiwana walidacja**: Brak
- **Typy**: `RevealButtonProps`
- **Propsy**:
  - `onReveal: () => void` - callback odsłonięcia
  - `autoFocus?: boolean` - czy automatycznie ustawić focus (domyślnie: true)

### RatingButtons

- **Opis**: Grupa 4 przycisków oceny (Again, Hard, Good, Easy) wyświetlana po odsłonięciu odpowiedzi. Każdy przycisk ma odpowiedni kolor i etykietę. Przyciski są responsywne (duże na mobile, mniejsze na desktop).
- **Główne elementy**:
  - `<div>` kontener z `className="flex flex-wrap gap-2 justify-center"`
  - 4x `Button` z wariantami kolorystycznymi:
    - Again (1): czerwony/destructive - `variant="destructive"`
    - Hard (2): pomarańczowy - `variant="outline"` z czerwoną obwódką
    - Good (3): zielony - `variant="default"`
    - Easy (4): niebieski - `variant="secondary"`
- **Obsługiwane interakcje**:
  - Kliknięcie przycisku → wywołanie `onRate(rating)`
  - Skróty klawiszowe: 1/A=Again, 2/H=Hard, 3/G=Good, 4/E=Easy
- **Obsługiwana walidacja**:
  - Rating musi być 1, 2, 3 lub 4
- **Typy**: `RatingButtonsProps`, `Rating`
- **Propsy**:
  - `onRate: (rating: 1 | 2 | 3 | 4) => void` - callback oceny
  - `disabled?: boolean` - czy przyciski są wyłączone
  - `isSubmitting?: boolean` - czy trwa wysyłanie (pokazuje spinner)

### SessionComplete

- **Opis**: Ekran zakończenia sesji wyświetlany po ocenieniu wszystkich fiszek. Pokazuje podsumowanie (liczba ukończonych fiszek) i przycisk powrotu do dashboardu.
- **Główne elementy**:
  - `Card` (shadcn/ui) jako kontener
  - Ikona sukcesu (`CheckCircle2` z lucide-react)
  - `<h2>` z tekstem "Sesja zakończona"
  - `<p>` z tekstem "Ukończono X fiszek"
  - `Button` z `asChild` i `<a href="/dashboard">` - "Wróć do dashboardu"
- **Obsługiwane interakcje**:
  - Kliknięcie przycisku → nawigacja do dashboardu
- **Obsługiwana walidacja**: Brak
- **Typy**: `SessionCompleteProps`
- **Propsy**:
  - `reviewedCount: number` - liczba ukończonych fiszek
  - `returnUrl?: string` - URL powrotu (domyślnie: "/dashboard")

### EmptyStudyState

- **Opis**: Ekran wyświetlany gdy brak fiszek do powtórki. Pokazuje przyjazny komunikat i informację o najbliższej powtórce (jeśli dostępna). Zachęca do tworzenia nowych fiszek lub powrotu później.
- **Główne elementy**:
  - `Card` (shadcn/ui) jako kontener
  - Ikona (`BookOpen` z lucide-react)
  - `<h2>` z tekstem "Brak fiszek do powtórki"
  - `<p>` z komunikatem zachęcającym
  - `<p>` z datą najbliższej powtórki (warunkowy)
  - `Button` z `asChild` i `<a href="/dashboard">` - "Wróć do dashboardu"
- **Obsługiwane interakcje**:
  - Kliknięcie przycisku → nawigacja do dashboardu
- **Obsługiwana walidacja**: Brak
- **Typy**: `EmptyStudyStateProps`
- **Propsy**:
  - `nextReviewDate?: string | null` - data najbliższej powtórki (ISO string)
  - `returnUrl?: string` - URL powrotu (domyślnie: "/dashboard")

## 5. Typy

### Typy importowane z `@/types`

```typescript
// Flashcard z informacją o talii (z API)
interface StudyCardDTO {
  id: string;
  deck_id: string;
  deck_name: string;
  front: string;
  back: string;
  source: SourceType;
  stability: number | null;
  difficulty: number | null;
  elapsed_days: number | null;
  scheduled_days: number | null;
  reps: number | null;
  lapses: number | null;
  state: number | null;
  last_review: string | null;
  next_review: string;
}

// Odpowiedź z API dla listy kart do nauki
interface StudyCardsResponseDTO {
  data: StudyCardDTO[];
  total_due: number;
  returned_count: number;
}

// Request wysłania oceny
interface SubmitReviewRequestDTO {
  flashcard_id: string;
  rating: 1 | 2 | 3 | 4;
}

// Interwały dla każdej oceny
interface NextIntervalsDTO {
  again: string;
  hard: string;
  good: string;
  easy: string;
}

// Odpowiedź po wysłaniu oceny
interface ReviewResponseDTO {
  flashcard: FlashcardDTO;
  next_intervals: NextIntervalsDTO;
}
```

### Nowe typy w `src/components/study/types.ts`

```typescript
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
```

### Transformer w `src/components/study/transformers.ts`

```typescript
import type { StudyCardDTO } from "@/types";
import type { StudyCardViewModel } from "./types";

/**
 * Tworzy podgląd tekstu (pierwsze ~50 znaków)
 */
function createPreview(text: string, maxLength = 50): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength).trim() + "...";
}

/**
 * Transformuje StudyCardDTO na StudyCardViewModel
 */
export function transformStudyCardDTO(dto: StudyCardDTO): StudyCardViewModel {
  return {
    id: dto.id,
    deckId: dto.deck_id,
    deckName: dto.deck_name,
    front: dto.front,
    back: dto.back,
    frontPreview: createPreview(dto.front),
  };
}

/**
 * Transformuje tablicę StudyCardDTO na tablicę StudyCardViewModel
 */
export function transformStudyCardDTOs(dtos: StudyCardDTO[]): StudyCardViewModel[] {
  return dtos.map(transformStudyCardDTO);
}
```

## 6. Zarządzanie stanem

### Hook `useStudySession`

Hook zarządzający całą logiką sesji nauki. Odpowiada za:
- Pobieranie fiszek do powtórki z API
- Zarządzanie stanem sesji (aktualna karta, odsłonięcie odpowiedzi)
- Wysyłanie ocen i przechodzenie do następnej karty
- Obsługę błędów i stanów ładowania
- Skróty klawiszowe

```typescript
// src/components/hooks/useStudySession.ts

import { useState, useEffect, useCallback, useMemo } from "react";
import type { StudyCardsResponseDTO, SubmitReviewRequestDTO } from "@/types";
import type {
  StudyCardViewModel,
  Rating,
  UseStudySessionReturn
} from "@/components/study/types";
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
        const redirectUrl = deckId ? `/decks/${deckId}` : '/dashboard';
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
  const submitRating = useCallback(async (rating: Rating) => {
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
        const redirectUrl = deckId ? `/decks/${deckId}` : '/dashboard';
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
  }, [currentCard, isSubmitting, deckId]);

  // Zakończenie sesji
  const endSession = useCallback(() => {
    const returnUrl = deckId ? `/decks/${deckId}` : '/dashboard';
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
      if (event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement) {
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
          "1": 1, "a": 1, "A": 1,
          "2": 2, "h": 2, "H": 2,
          "3": 3, "g": 3, "G": 3,
          "4": 4, "e": 4, "E": 4,
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
    endSession
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
```

## 7. Integracja API

### Pobieranie fiszek do nauki

**Endpoint:** `GET /api/study/cards`

**Query Parameters:**
- `deck_id` (optional): UUID talii do filtrowania
- `limit` (optional): Maksymalna liczba kart (1-200, domyślnie 50)

**Response (200):**
```typescript
{
  data: StudyCardDTO[];
  total_due: number;
  returned_count: number;
}
```

**Błędy:**
- `401 Unauthorized` - przekierowanie do `/login`
- `400 Bad Request` - nieprawidłowe parametry
- `404 Not Found` - talia nie znaleziona

### Wysyłanie oceny

**Endpoint:** `POST /api/study/review`

**Request Body:**
```typescript
{
  flashcard_id: string; // UUID fiszki
  rating: 1 | 2 | 3 | 4; // 1=Again, 2=Hard, 3=Good, 4=Easy
}
```

**Response (200):**
```typescript
{
  flashcard: FlashcardDTO; // Zaktualizowana fiszka
  next_intervals: {
    again: string;
    hard: string;
    good: string;
    easy: string;
  };
}
```

**Błędy:**
- `401 Unauthorized` - przekierowanie do `/login`
- `400 Bad Request` - nieprawidłowe dane
- `404 Not Found` - fiszka nie znaleziona

## 8. Interakcje użytkownika

| Interakcja | Element | Rezultat |
|------------|---------|----------|
| Kliknięcie X | StudyHeader | Powrót do dashboardu (lub widoku talii) |
| Kliknięcie "Pokaż odpowiedź" | RevealButton | Odsłonięcie tyłu fiszki, ukrycie przycisku, pokazanie RatingButtons |
| Kliknięcie Again | RatingButtons | Wysłanie oceny 1, przejście do następnej karty |
| Kliknięcie Hard | RatingButtons | Wysłanie oceny 2, przejście do następnej karty |
| Kliknięcie Good | RatingButtons | Wysłanie oceny 3, przejście do następnej karty |
| Kliknięcie Easy | RatingButtons | Wysłanie oceny 4, przejście do następnej karty |
| Kliknięcie "Wróć do dashboardu" | SessionComplete | Nawigacja do dashboardu |
| Naciśnięcie Space | Klawisz | Odsłonięcie odpowiedzi (gdy niewidoczna) |
| Naciśnięcie 1/A | Klawisz | Ocena Again (gdy odpowiedź widoczna) |
| Naciśnięcie 2/H | Klawisz | Ocena Hard (gdy odpowiedź widoczna) |
| Naciśnięcie 3/G | Klawisz | Ocena Good (gdy odpowiedź widoczna) |
| Naciśnięcie 4/E | Klawisz | Ocena Easy (gdy odpowiedź widoczna) |
| Naciśnięcie Escape | Klawisz | Zakończenie sesji, powrót do dashboardu |

## 9. Warunki i walidacja

### Walidacja po stronie klienta

| Warunek | Komponent | Efekt UI |
|---------|-----------|----------|
| `cards.length === 0 && !isLoading` | StudyView | Renderowanie EmptyStudyState |
| `isLoading === true` | StudyView | Renderowanie spinnera ładowania |
| `error !== null` | StudyView | Renderowanie komunikatu błędu z przyciskiem retry |
| `isSessionComplete === true` | StudyView | Renderowanie SessionComplete |
| `isAnswerRevealed === false` | FlashcardDisplay | Pokazanie tylko frontu i RevealButton |
| `isAnswerRevealed === true` | FlashcardDisplay | Pokazanie frontu, tyłu i RatingButtons |
| `isSubmitting === true` | RatingButtons | Disabled wszystkich przycisków, spinner na aktywnym |

### Walidacja API

| Pole | Warunek | Komunikat błędu |
|------|---------|-----------------|
| `flashcard_id` | Musi być prawidłowy UUID | "flashcard_id must be a valid UUID" |
| `rating` | Musi być 1, 2, 3 lub 4 | "rating must be 1 (Again), 2 (Hard), 3 (Good), or 4 (Easy)" |
| `deck_id` (query) | Jeśli podany, musi być prawidłowy UUID | "deck_id must be a valid UUID" |
| `limit` (query) | Musi być 1-200 | Automatyczna korekcja do 50 |

## 10. Obsługa błędów

### Błędy ładowania danych

| Błąd | Kod HTTP | Obsługa |
|------|----------|---------|
| Brak autentykacji | 401 | Przekierowanie do `/login?redirect=...` |
| Talia nie znaleziona | 404 | Wyświetlenie komunikatu błędu z przyciskiem powrotu |
| Błąd serwera | 500 | Wyświetlenie komunikatu błędu z przyciskiem retry |
| Błąd sieci | - | Wyświetlenie komunikatu błędu z przyciskiem retry |

### Błędy wysyłania oceny

| Błąd | Kod HTTP | Obsługa |
|------|----------|---------|
| Brak autentykacji | 401 | Przekierowanie do `/login?redirect=...` |
| Fiszka nie znaleziona | 404 | Logowanie błędu, kontynuacja do następnej karty |
| Nieprawidłowe dane | 400 | Logowanie błędu, kontynuacja do następnej karty |
| Błąd serwera | 500 | Logowanie błędu, automatyczne retry (max 2x), kontynuacja |
| Błąd sieci | - | Automatyczne retry (max 3x), kontynuacja do następnej karty |

### Strategia resilience

- Błędy wysyłania oceny nie przerywają sesji
- Nieudane oceny są logowane do konsoli
- Użytkownik kontynuuje do następnej karty nawet przy błędzie
- Stan sesji jest zachowywany lokalnie (przejrzane karty mają zaktualizowane daty po stronie serwera)

## 11. Kroki implementacji

### Faza 1: Przygotowanie struktury

1. **Instalacja brakujących komponentów Shadcn/ui**
   ```bash
   npx shadcn@latest add progress
   ```

2. **Utworzenie struktury katalogów**
   ```
   src/components/study/
   src/pages/study/
   src/layouts/StudyLayout.astro
   ```

3. **Utworzenie pliku typów** (`src/components/study/types.ts`)
   - Definicja wszystkich interfejsów i typów
   - Eksport stałych (RATING_LABELS)

4. **Utworzenie transformerów** (`src/components/study/transformers.ts`)
   - Funkcja `transformStudyCardDTO`
   - Funkcja `transformStudyCardDTOs`

### Faza 2: Implementacja layoutu i stron Astro

5. **Utworzenie StudyLayout.astro**
   - Minimalistyczny layout bez AppHeader
   - Meta tagi i tytuł strony
   - Slot dla zawartości

6. **Utworzenie strony `/study/index.astro`**
   - Sprawdzenie autentykacji
   - Przekierowanie do `/login` jeśli brak sesji
   - Renderowanie StudyView bez deckId

7. **Utworzenie strony `/study/[deckId].astro`**
   - Sprawdzenie autentykacji
   - Walidacja formatu UUID deckId
   - Renderowanie StudyView z deckId

### Faza 3: Implementacja hooka

8. **Utworzenie hooka useStudySession** (`src/components/hooks/useStudySession.ts`)
   - Stan sesji (cards, currentIndex, isAnswerRevealed, etc.)
   - Pobieranie kart z API
   - Wysyłanie ocen
   - Skróty klawiszowe
   - Obsługa błędów

### Faza 4: Implementacja komponentów UI

9. **Implementacja ProgressBar**
   - Wizualny pasek postępu
   - Tekst "X/Y kart"
   - Atrybuty ARIA

10. **Implementacja RevealButton**
    - Duży przycisk "Pokaż odpowiedź"
    - Auto-focus przy renderowaniu
    - Obsługa kliknięcia

11. **Implementacja RatingButtons**
    - 4 przyciski z różnymi wariantami kolorystycznymi
    - Stan disabled podczas wysyłania
    - Spinner na aktywnym przycisku

12. **Implementacja FlashcardDisplay**
    - Karta z frontem i tyłem (warunkowy)
    - Integracja RevealButton i RatingButtons
    - Separator między frontem a tyłem

13. **Implementacja StudyHeader**
    - Przycisk X (zamknięcie)
    - ProgressBar
    - Fixed positioning na górze ekranu

14. **Implementacja SessionComplete**
    - Ekran sukcesu z ikoną
    - Podsumowanie sesji
    - Przycisk powrotu

15. **Implementacja EmptyStudyState**
    - Komunikat o braku fiszek
    - Data najbliższej powtórki (jeśli dostępna)
    - Przycisk powrotu

16. **Implementacja StudyView**
    - Integracja wszystkich komponentów
    - Warunkowe renderowanie na podstawie stanu
    - Stan ładowania z spinnerem
    - Obsługa błędów

### Faza 5: Stylowanie i responsywność

17. **Dostosowanie stylów do mobile-first**
    - Duże przyciski (min 44px) na mobile
    - Responsywny rozmiar karty
    - Odpowiednie marginesy i paddingi

18. **Implementacja ciemnego motywu**
    - Użycie zmiennych CSS z Tailwind
    - Wsparcie dla `dark:` wariantów

### Faza 6: Dostępność

19. **Dodanie atrybutów ARIA**
    - `role="progressbar"` dla paska postępu
    - `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
    - `aria-label` dla przycisków
    - `aria-live="polite"` dla aktualizacji postępu

20. **Testowanie z czytnikiem ekranu**
    - Weryfikacja poprawności nawigacji
    - Sprawdzenie komunikatów dla screen reader

### Faza 7: Testowanie i poprawki

21. **Testowanie przepływów użytkownika**
    - Sesja ze wszystkich talii
    - Sesja z pojedynczej talii
    - Przerwanie sesji
    - Ukończenie sesji
    - Obsługa pustej sesji

22. **Testowanie skrótów klawiszowych**
    - Space dla odsłonięcia
    - 1/2/3/4 i A/H/G/E dla ocen
    - Escape dla zakończenia

23. **Testowanie obsługi błędów**
    - Błąd sieci podczas ładowania
    - Błąd sieci podczas wysyłania oceny
    - Nieprawidłowy deckId
    - Sesja wygasła (401)

24. **Optymalizacja wydajności**
    - Memoizacja komponentów gdzie potrzebne
    - Optymalizacja re-renderów
    - Prefetching dla nawigacji
