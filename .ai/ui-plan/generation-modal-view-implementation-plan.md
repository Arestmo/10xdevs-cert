# Plan implementacji widoku Modalu generowania AI

## 1. Przegląd

Modal generowania AI to interaktywny komponent dialogowy umożliwiający użytkownikowi generowanie fiszek za pomocą sztucznej inteligencji. Użytkownik wkleja tekst źródłowy (do 5000 znaków), wybiera talię docelową, a system generuje do 20 propozycji fiszek (draftów). Każdy draft może być zaakceptowany, edytowany lub odrzucony przed zapisaniem do bazy danych.

Główne funkcjonalności:

- Wprowadzanie tekstu źródłowego z licznikiem znaków
- Wybór istniejącej talii lub utworzenie nowej
- Wyświetlanie limitu AI (pozostało X/200 fiszek w miesiącu)
- Generowanie fiszek z wizualnym feedbackiem (spinner)
- Przeglądanie, akceptowanie, edycja i odrzucanie draftów
- Ostrzeżenie przy zamykaniu z nieprzetworzonymi draftami

## 2. Routing widoku

Modal nie posiada własnej ścieżki URL - jest komponentem nakładkowym wywoływanym z:

- **Dashboard** (`/dashboard`) - przycisk "Generuj fiszki" na kafelku głównym
- **Widok talii** (`/decks/[deckId]`) - przycisk "Generuj fiszki" w akcjach talii

Modal jest zarządzany przez stan rodzica i może być otwierany z preselekcją talii (gdy otwierany z widoku talii).

## 3. Struktura komponentów

```
GenerationModal
├── DialogHeader
│   ├── DialogTitle ("Generuj fiszki AI")
│   └── AILimitIndicator
├── GenerationForm (etap wprowadzania)
│   ├── DeckSelector
│   │   └── CreateDeckInput (opcjonalnie)
│   ├── SourceTextArea
│   └── GenerateButton
├── GenerationSpinner (etap generowania)
├── DraftsList (etap przeglądania draftów)
│   └── DraftItem (×N)
│       ├── DraftContent (wyświetlanie)
│       └── DraftEditForm (edycja)
├── GenerationError (etap błędu)
└── CloseConfirmDialog (dialog potwierdzenia zamknięcia)
```

## 4. Szczegóły komponentów

### GenerationModal

- **Opis**: Główny komponent modalny zarządzający całym przepływem generowania fiszek. Kontroluje etapy: wprowadzanie → generowanie → przeglądanie draftów. Wykorzystuje komponenty Dialog z shadcn/ui.
- **Główne elementy**:
  - `Dialog` (shadcn/ui) z `DialogContent` o szerszej szerokości (`max-w-2xl`)
  - `DialogHeader` z tytułem i wskaźnikiem limitu AI
  - Warunkowe renderowanie etapów (formularz / spinner / lista draftów / błąd)
- **Obsługiwane interakcje**:
  - `onOpenChange` - obsługa zamykania modalu (z walidacją nieprzetorzonych draftów)
  - Obsługa klawisza Escape (z potwierdzeniem jeśli są nieprzetworzene drafty)
- **Obsługiwana walidacja**:
  - Sprawdzenie czy są nieprzetworzene drafty przed zamknięciem
- **Typy**:
  - `GenerationModalProps`
  - `GenerationState` (wewnętrzny)
  - `DraftViewModel[]`
- **Propsy**:
  ```typescript
  interface GenerationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (acceptedCount: number) => void;
    preselectedDeckId?: string;
    decks: DeckOption[];
  }
  ```

### AILimitIndicator

- **Opis**: Wyświetla pozostały limit fiszek AI na bieżący miesiąc. Pokazuje licznik "Pozostało: X/200" oraz informację o dacie resetu gdy limit wyczerpany.
- **Główne elementy**:
  - `div` z tekstem limitu
  - Warunkowy `span` z datą resetu gdy `remainingLimit === 0`
  - Ikona `Info` z tooltipem wyjaśniającym limit
- **Obsługiwane interakcje**: Brak (komponent prezentacyjny)
- **Obsługiwana walidacja**: Brak
- **Typy**: `AILimitIndicatorProps`
- **Propsy**:
  ```typescript
  interface AILimitIndicatorProps {
    remainingLimit: number;
    resetDate: string;
    isLoading?: boolean;
  }
  ```

### DeckSelector

- **Opis**: Dropdown do wyboru talii docelowej z opcją utworzenia nowej talii. Wykorzystuje komponent Select z shadcn/ui (wymaga instalacji).
- **Główne elementy**:
  - `Select` z `SelectTrigger`, `SelectContent`, `SelectItem` (shadcn/ui)
  - Opcja "Utwórz nową talię" na początku listy
  - `CreateDeckInput` (warunkowy) - pole tekstowe do wpisania nazwy nowej talii
- **Obsługiwane interakcje**:
  - `onValueChange` - zmiana wybranej talii
  - `onCreateNew` - przejście do trybu tworzenia nowej talii
  - `onCreateDeckSubmit` - zatwierdzenie nazwy nowej talii
  - `onCreateDeckCancel` - anulowanie tworzenia nowej talii
- **Obsługiwana walidacja**:
  - Nazwa nowej talii: 1-100 znaków
  - Unikalność nazwy talii (obsługa błędu 409 z API)
- **Typy**: `DeckSelectorProps`, `DeckOption`
- **Propsy**:
  ```typescript
  interface DeckSelectorProps {
    decks: DeckOption[];
    selectedDeckId: string | null;
    onSelect: (deckId: string) => void;
    onCreateDeck: (name: string) => Promise<DeckOption>;
    isCreatingDeck: boolean;
    createDeckError: string | null;
    disabled?: boolean;
  }
  ```

### SourceTextArea

- **Opis**: Pole tekstowe do wprowadzenia materiału źródłowego z licznikiem znaków w czasie rzeczywistym. Obsługuje wklejanie ze schowka.
- **Główne elementy**:
  - `Textarea` (shadcn/ui) z atrybutem `maxLength={5000}`
  - `Label` z opisem pola
  - `div` z licznikiem znaków (`{currentLength}/5000`)
  - Warunkowy `span` z ostrzeżeniem gdy zbliżamy się do limitu (>4500 znaków)
- **Obsługiwane interakcje**:
  - `onChange` - aktualizacja tekstu
  - `onPaste` - wklejanie ze schowka
- **Obsługiwana walidacja**:
  - Tekst wymagany (min. 1 znak)
  - Maksymalnie 5000 znaków
  - Wizualne oznaczenie przekroczenia limitu
- **Typy**: `SourceTextAreaProps`
- **Propsy**:
  ```typescript
  interface SourceTextAreaProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    error?: string | null;
  }
  ```

### GenerateButton

- **Opis**: Przycisk uruchamiający generowanie fiszek. Aktywny tylko gdy spełnione są warunki walidacji.
- **Główne elementy**:
  - `Button` (shadcn/ui) z wariantem `default`
  - Ikona `Sparkles` przed tekstem
  - Tekst "Generuj fiszki"
- **Obsługiwane interakcje**:
  - `onClick` - uruchomienie generowania
- **Obsługiwana walidacja**:
  - Przycisk disabled gdy:
    - Brak tekstu źródłowego
    - Tekst przekracza 5000 znaków
    - Brak wybranej talii
    - Limit AI wyczerpany (remainingLimit === 0)
    - Generowanie w toku
- **Typy**: `GenerateButtonProps`
- **Propsy**:
  ```typescript
  interface GenerateButtonProps {
    onClick: () => void;
    disabled: boolean;
    isLoading?: boolean;
  }
  ```

### GenerationSpinner

- **Opis**: Spinner wyświetlany podczas generowania fiszek z komunikatem tekstowym.
- **Główne elementy**:
  - `div` centrujący zawartość
  - `Loader2` (lucide-react) z animacją `animate-spin`
  - `p` z tekstem "Generowanie fiszek..."
  - Opcjonalny `p` z informacją "To może potrwać do 30 sekund"
- **Obsługiwane interakcje**: Brak (komponent prezentacyjny)
- **Obsługiwana walidacja**: Brak
- **Typy**: Brak (prosty komponent)
- **Propsy**: Brak

### DraftsList

- **Opis**: Przewijalna lista wygenerowanych draftów z numeracją i przyciskami akcji.
- **Główne elementy**:
  - `div` z `overflow-y-auto` i `max-h-[400px]`
  - Nagłówek z liczbą draftów "Wygenerowano X fiszek"
  - Lista `DraftItem` komponentów
  - `aria-live="polite"` dla dostępności
- **Obsługiwane interakcje**:
  - Przewijanie listy
- **Obsługiwana walidacja**: Brak
- **Typy**: `DraftsListProps`
- **Propsy**:
  ```typescript
  interface DraftsListProps {
    drafts: DraftViewModel[];
    onAccept: (index: number) => void;
    onReject: (index: number) => void;
    onEdit: (index: number) => void;
    onSaveEdit: (index: number, front: string, back: string) => void;
    onCancelEdit: (index: number) => void;
    generationId: string;
  }
  ```

### DraftItem

- **Opis**: Pojedynczy draft fiszki z wyświetleniem przodu i tyłu oraz przyciskami akcji.
- **Główne elementy**:
  - `Card` (shadcn/ui) z `CardContent`
  - `div` z numerem draftu "X/Y"
  - `div` z treścią: przód i tył fiszki (lub `DraftEditForm` gdy w trybie edycji)
  - `div` z przyciskami akcji: Akceptuj (zielony), Edytuj (outline), Odrzuć (destructive)
  - Ikona statusu po akceptacji (zielony checkmark)
- **Obsługiwane interakcje**:
  - `onAccept` - akceptacja draftu
  - `onReject` - odrzucenie draftu
  - `onEdit` - przejście do trybu edycji
- **Obsługiwana walidacja**: Brak (walidacja w DraftEditForm)
- **Typy**: `DraftItemProps`, `DraftViewModel`
- **Propsy**:
  ```typescript
  interface DraftItemProps {
    draft: DraftViewModel;
    index: number;
    total: number;
    onAccept: () => void;
    onReject: () => void;
    onEdit: () => void;
    onSaveEdit: (front: string, back: string) => void;
    onCancelEdit: () => void;
    isSubmitting: boolean;
  }
  ```

### DraftEditForm

- **Opis**: Formularz inline do edycji draftu przed akceptacją.
- **Główne elementy**:
  - `div` z `space-y-4`
  - `Textarea` dla pola "Przód" z licznikiem (max 200 znaków)
  - `Textarea` dla pola "Tył" z licznikiem (max 500 znaków)
  - `div` z przyciskami: Zapisz (primary), Anuluj (outline)
- **Obsługiwane interakcje**:
  - `onChange` - aktualizacja pól formularza
  - `onSave` - zapisanie edycji
  - `onCancel` - anulowanie edycji
- **Obsługiwana walidacja**:
  - Przód: wymagany, 1-200 znaków
  - Tył: wymagany, 1-500 znaków
  - Wizualne oznaczenie przekroczenia limitów
- **Typy**: `DraftEditFormProps`
- **Propsy**:
  ```typescript
  interface DraftEditFormProps {
    initialFront: string;
    initialBack: string;
    onSave: (front: string, back: string) => void;
    onCancel: () => void;
    isSubmitting: boolean;
  }
  ```

### GenerationError

- **Opis**: Komponent wyświetlający przyjazny dla użytkownika komunikat błędu z opcją ponowienia próby.
- **Główne elementy**:
  - `Alert` (shadcn/ui) z wariantem `destructive`
  - Ikona `AlertCircle`
  - Tytuł błędu
  - Opis błędu (różny w zależności od typu błędu)
  - `Button` "Spróbuj ponownie"
- **Obsługiwane interakcje**:
  - `onRetry` - ponowienie próby generowania
- **Obsługiwana walidacja**: Brak
- **Typy**: `GenerationErrorProps`
- **Propsy**:
  ```typescript
  interface GenerationErrorProps {
    error: GenerationErrorType;
    onRetry: () => void;
  }
  ```

### CloseConfirmDialog

- **Opis**: Dialog ostrzegający przed zamknięciem modalu gdy istnieją nieprzetworzene drafty.
- **Główne elementy**:
  - `AlertDialog` (shadcn/ui)
  - `AlertDialogContent` z ostrzeżeniem
  - `AlertDialogTitle`: "Nieprzetworzene fiszki"
  - `AlertDialogDescription`: "Masz X nieprzetworzone/ych fiszki/ek. Czy na pewno chcesz zamknąć? Nieprzetworzene drafty zostaną utracone."
  - `AlertDialogCancel`: "Wróć do draftów"
  - `AlertDialogAction`: "Zamknij mimo to"
- **Obsługiwane interakcje**:
  - `onConfirm` - potwierdzenie zamknięcia
  - `onCancel` - powrót do modalu
- **Obsługiwana walidacja**: Brak
- **Typy**: `CloseConfirmDialogProps`
- **Propsy**:
  ```typescript
  interface CloseConfirmDialogProps {
    isOpen: boolean;
    unprocessedCount: number;
    onConfirm: () => void;
    onCancel: () => void;
  }
  ```

## 5. Typy

### Typy DTO (z API)

```typescript
// Już zdefiniowane w src/types.ts
interface ProfileResponseDTO {
  user_id: string;
  monthly_ai_flashcards_count: number;
  ai_limit_reset_date: string;
  remaining_ai_limit: number;
  created_at: string;
  updated_at: string;
}

interface CreateGenerationRequestDTO {
  source_text: string;
  deck_id: string;
}

interface GenerationResponseDTO {
  generation_id: string;
  drafts: FlashcardDraftDTO[];
  generated_count: number;
  remaining_ai_limit: number;
}

interface FlashcardDraftDTO {
  index: number;
  front: string;
  back: string;
}

interface CreateFlashcardRequestDTO {
  deck_id: string;
  front: string;
  back: string;
  source: "ai" | "manual";
  generation_id?: string | null;
  was_edited?: boolean;
}

interface RejectDraftRequestDTO {
  draft_index: number;
}
```

### Typy ViewModel (nowe, do utworzenia w `src/components/generation/types.ts`)

```typescript
/**
 * Status draftu w przepływie generowania
 */
type DraftStatus = "pending" | "accepted" | "rejected" | "editing";

/**
 * ViewModel dla pojedynczego draftu
 * Rozszerza FlashcardDraftDTO o stan lokalny
 */
interface DraftViewModel {
  index: number;
  front: string;
  back: string;
  status: DraftStatus;
  /** Edytowana treść przodu (gdy status === 'editing') */
  editedFront?: string;
  /** Edytowana treść tyłu (gdy status === 'editing') */
  editedBack?: string;
  /** Czy operacja na drafcie jest w toku */
  isSubmitting: boolean;
  /** Czy draft był edytowany przed akceptacją */
  wasEdited: boolean;
}

/**
 * Opcja talii w selektorze
 */
interface DeckOption {
  id: string;
  name: string;
}

/**
 * Etapy przepływu generowania
 */
type GenerationStage = "input" | "generating" | "reviewing" | "error";

/**
 * Stan modalu generowania
 */
interface GenerationState {
  stage: GenerationStage;
  sourceText: string;
  selectedDeckId: string | null;
  isCreatingNewDeck: boolean;
  newDeckName: string;
  generationId: string | null;
  drafts: DraftViewModel[];
  remainingLimit: number;
  resetDate: string;
  error: GenerationErrorType | null;
}

/**
 * Typy błędów generowania
 */
type GenerationErrorType =
  | { code: "AI_SERVICE_ERROR"; message: string }
  | { code: "AI_LIMIT_EXCEEDED"; resetDate: string; currentCount: number; limit: number }
  | { code: "DECK_NOT_FOUND"; message: string }
  | { code: "VALIDATION_ERROR"; message: string; details?: Record<string, string[]> }
  | { code: "NETWORK_ERROR"; message: string }
  | { code: "UNKNOWN"; message: string };
```

### Typy Props komponentów

```typescript
interface GenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (acceptedCount: number) => void;
  preselectedDeckId?: string;
  decks: DeckOption[];
}

interface AILimitIndicatorProps {
  remainingLimit: number;
  resetDate: string;
  isLoading?: boolean;
}

interface DeckSelectorProps {
  decks: DeckOption[];
  selectedDeckId: string | null;
  onSelect: (deckId: string) => void;
  onCreateDeck: (name: string) => Promise<DeckOption>;
  isCreatingDeck: boolean;
  createDeckError: string | null;
  disabled?: boolean;
}

interface SourceTextAreaProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string | null;
}

interface GenerateButtonProps {
  onClick: () => void;
  disabled: boolean;
  isLoading?: boolean;
}

interface DraftsListProps {
  drafts: DraftViewModel[];
  onAccept: (index: number) => void;
  onReject: (index: number) => void;
  onEdit: (index: number) => void;
  onSaveEdit: (index: number, front: string, back: string) => void;
  onCancelEdit: (index: number) => void;
  generationId: string;
}

interface DraftItemProps {
  draft: DraftViewModel;
  index: number;
  total: number;
  onAccept: () => void;
  onReject: () => void;
  onEdit: () => void;
  onSaveEdit: (front: string, back: string) => void;
  onCancelEdit: () => void;
  isSubmitting: boolean;
}

interface DraftEditFormProps {
  initialFront: string;
  initialBack: string;
  onSave: (front: string, back: string) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

interface GenerationErrorProps {
  error: GenerationErrorType;
  onRetry: () => void;
}

interface CloseConfirmDialogProps {
  isOpen: boolean;
  unprocessedCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}
```

### Typ zwracany przez hook

```typescript
interface UseAIGenerationReturn {
  // Stan
  state: GenerationState;

  // Limity
  remainingLimit: number;
  resetDate: string;
  isLoadingProfile: boolean;

  // Akcje formularza
  setSourceText: (text: string) => void;
  setSelectedDeckId: (deckId: string | null) => void;

  // Akcje generowania
  generate: () => Promise<void>;
  isGenerating: boolean;

  // Akcje na draftach
  acceptDraft: (index: number) => Promise<void>;
  rejectDraft: (index: number) => Promise<void>;
  startEditDraft: (index: number) => void;
  saveEditDraft: (index: number, front: string, back: string) => void;
  cancelEditDraft: (index: number) => void;

  // Tworzenie talii
  createDeck: (name: string) => Promise<DeckOption>;
  isCreatingDeck: boolean;
  createDeckError: string | null;

  // Pomocnicze
  unprocessedCount: number;
  acceptedCount: number;
  canGenerate: boolean;
  reset: () => void;
}
```

## 6. Zarządzanie stanem

### Hook `useAIGeneration`

Należy utworzyć dedykowany hook `useAIGeneration` w `src/components/hooks/useAIGeneration.ts` który zarządza całym przepływem generowania.

**Główne odpowiedzialności:**

1. **Pobieranie profilu użytkownika** - Na otwarcie modalu pobiera `GET /api/profile` dla limitu AI
2. **Zarządzanie stanem formularza** - Przechowuje tekst źródłowy i wybraną talię
3. **Wywołanie generowania** - `POST /api/generations`
4. **Zarządzanie draftami** - Lista z lokalnym stanem (pending/accepted/rejected/editing)
5. **Akceptacja draftów** - `POST /api/flashcards` z `source: "ai"`
6. **Odrzucanie draftów** - `POST /api/generations/{generationId}/reject`
7. **Tworzenie talii** - `POST /api/decks`
8. **Obsługa błędów** - Mapowanie błędów API na typy błędów

**Stan wewnętrzny hooka:**

```typescript
const [state, setState] = useState<GenerationState>({
  stage: "input",
  sourceText: "",
  selectedDeckId: preselectedDeckId ?? null,
  isCreatingNewDeck: false,
  newDeckName: "",
  generationId: null,
  drafts: [],
  remainingLimit: 200,
  resetDate: "",
  error: null,
});
```

**Logika transformacji draftów:**

Przy otrzymaniu odpowiedzi z `POST /api/generations`, drafty z API są transformowane do `DraftViewModel[]`:

```typescript
const transformDrafts = (apiDrafts: FlashcardDraftDTO[]): DraftViewModel[] => {
  return apiDrafts.map((draft) => ({
    ...draft,
    status: "pending",
    isSubmitting: false,
    wasEdited: false,
  }));
};
```

**Obliczanie stanu pomocniczego:**

```typescript
const unprocessedCount = useMemo(
  () => state.drafts.filter((d) => d.status === "pending" || d.status === "editing").length,
  [state.drafts]
);

const acceptedCount = useMemo(() => state.drafts.filter((d) => d.status === "accepted").length, [state.drafts]);

const canGenerate = useMemo(
  () =>
    state.sourceText.trim().length > 0 &&
    state.sourceText.length <= 5000 &&
    state.selectedDeckId !== null &&
    state.remainingLimit > 0,
  [state.sourceText, state.selectedDeckId, state.remainingLimit]
);
```

## 7. Integracja API

### GET /api/profile

**Wywołanie:** Na otwarcie modalu
**Cel:** Pobranie aktualnego limitu AI użytkownika

```typescript
const fetchProfile = async (): Promise<void> => {
  setIsLoadingProfile(true);
  try {
    const response = await fetch("/api/profile");

    if (response.status === 401) {
      window.location.href = "/login?redirect=/dashboard";
      return;
    }

    if (!response.ok) {
      throw new Error("Failed to fetch profile");
    }

    const profile: ProfileResponseDTO = await response.json();
    setState((prev) => ({
      ...prev,
      remainingLimit: profile.remaining_ai_limit,
      resetDate: profile.ai_limit_reset_date,
    }));
  } catch (error) {
    console.error("Error fetching profile:", error);
    setState((prev) => ({
      ...prev,
      error: { code: "NETWORK_ERROR", message: "Nie udało się pobrać danych profilu" },
    }));
  } finally {
    setIsLoadingProfile(false);
  }
};
```

### POST /api/generations

**Wywołanie:** Kliknięcie przycisku "Generuj"
**Request:** `CreateGenerationRequestDTO`
**Response:** `GenerationResponseDTO`

```typescript
const generate = async (): Promise<void> => {
  if (!canGenerate) return;

  setState((prev) => ({ ...prev, stage: "generating", error: null }));

  try {
    const requestBody: CreateGenerationRequestDTO = {
      source_text: state.sourceText,
      deck_id: state.selectedDeckId!,
    };

    const response = await fetch("/api/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (response.status === 401) {
      window.location.href = "/login?redirect=/dashboard";
      return;
    }

    if (response.status === 403) {
      const error = await response.json();
      setState((prev) => ({
        ...prev,
        stage: "error",
        error: {
          code: "AI_LIMIT_EXCEEDED",
          resetDate: error.error.details.reset_date,
          currentCount: error.error.details.current_count,
          limit: error.error.details.limit,
        },
      }));
      return;
    }

    if (response.status === 503) {
      setState((prev) => ({
        ...prev,
        stage: "error",
        error: { code: "AI_SERVICE_ERROR", message: "Usługa AI jest tymczasowo niedostępna" },
      }));
      return;
    }

    if (!response.ok) {
      throw new Error("Generation failed");
    }

    const data: GenerationResponseDTO = await response.json();
    const drafts = transformDrafts(data.drafts);

    setState((prev) => ({
      ...prev,
      stage: "reviewing",
      generationId: data.generation_id,
      drafts,
      remainingLimit: data.remaining_ai_limit,
    }));
  } catch (error) {
    console.error("Error generating flashcards:", error);
    setState((prev) => ({
      ...prev,
      stage: "error",
      error: { code: "UNKNOWN", message: "Wystąpił nieoczekiwany błąd" },
    }));
  }
};
```

### POST /api/flashcards (akceptacja draftu)

**Wywołanie:** Kliknięcie "Akceptuj" na drafcie
**Request:** `CreateFlashcardRequestDTO` z `source: "ai"`

```typescript
const acceptDraft = async (index: number): Promise<void> => {
  const draft = state.drafts[index];
  if (!draft || draft.status !== "pending") return;

  setDraftSubmitting(index, true);

  try {
    const requestBody: CreateFlashcardRequestDTO = {
      deck_id: state.selectedDeckId!,
      front: draft.front,
      back: draft.back,
      source: "ai",
      generation_id: state.generationId,
      was_edited: draft.wasEdited,
    };

    const response = await fetch("/api/flashcards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (response.status === 401) {
      window.location.href = "/login?redirect=/dashboard";
      return;
    }

    if (!response.ok) {
      throw new Error("Failed to accept draft");
    }

    setDraftStatus(index, "accepted");
  } catch (error) {
    console.error("Error accepting draft:", error);
    // Pokaż toast z błędem
  } finally {
    setDraftSubmitting(index, false);
  }
};
```

### POST /api/generations/{generationId}/reject

**Wywołanie:** Kliknięcie "Odrzuć" na drafcie
**Request:** `RejectDraftRequestDTO`

```typescript
const rejectDraft = async (index: number): Promise<void> => {
  const draft = state.drafts[index];
  if (!draft || draft.status !== "pending") return;

  setDraftSubmitting(index, true);

  try {
    const requestBody: RejectDraftRequestDTO = { draft_index: index };

    const response = await fetch(`/api/generations/${state.generationId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (response.status === 401) {
      window.location.href = "/login?redirect=/dashboard";
      return;
    }

    if (!response.ok) {
      throw new Error("Failed to reject draft");
    }

    setDraftStatus(index, "rejected");
  } catch (error) {
    console.error("Error rejecting draft:", error);
    // Pokaż toast z błędem
  } finally {
    setDraftSubmitting(index, false);
  }
};
```

### POST /api/decks (tworzenie nowej talii)

**Wywołanie:** Zatwierdzenie nazwy nowej talii w DeckSelector
**Request:** `CreateDeckRequestDTO`

```typescript
const createDeck = async (name: string): Promise<DeckOption> => {
  setIsCreatingDeck(true);
  setCreateDeckError(null);

  try {
    const response = await fetch("/api/decks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (response.status === 401) {
      window.location.href = "/login?redirect=/dashboard";
      throw new Error("Unauthorized");
    }

    if (response.status === 409) {
      setCreateDeckError("Talia o tej nazwie już istnieje");
      throw new Error("Duplicate deck name");
    }

    if (!response.ok) {
      throw new Error("Failed to create deck");
    }

    const deck: DeckDTO = await response.json();
    return { id: deck.id, name: deck.name };
  } catch (error) {
    console.error("Error creating deck:", error);
    throw error;
  } finally {
    setIsCreatingDeck(false);
  }
};
```

## 8. Interakcje użytkownika

| Interakcja                     | Element               | Akcja                     | Rezultat                                                |
| ------------------------------ | --------------------- | ------------------------- | ------------------------------------------------------- |
| Otwarcie modalu                | Przycisk zewnętrzny   | Ustawienie `isOpen: true` | Modal się otwiera, pobierany jest profil                |
| Wklejenie tekstu               | SourceTextArea        | `onChange`                | Aktualizacja `sourceText`, licznik się aktualizuje      |
| Wybór talii                    | DeckSelector          | `onSelect`                | Aktualizacja `selectedDeckId`                           |
| Tworzenie nowej talii          | DeckSelector          | `onCreateDeck`            | Wywołanie API, dodanie talii do listy                   |
| Kliknięcie "Generuj"           | GenerateButton        | `onClick`                 | Wywołanie API, przejście do etapu generowania           |
| Akceptacja draftu              | DraftItem             | `onAccept`                | Wywołanie API, zmiana statusu na "accepted"             |
| Odrzucenie draftu              | DraftItem             | `onReject`                | Wywołanie API, zmiana statusu na "rejected"             |
| Edycja draftu                  | DraftItem             | `onEdit`                  | Zmiana statusu na "editing", wyświetlenie formularza    |
| Zapisanie edycji               | DraftEditForm         | `onSave`                  | Aktualizacja treści draftu, powrót do statusu "pending" |
| Anulowanie edycji              | DraftEditForm         | `onCancel`                | Odrzucenie zmian, powrót do statusu "pending"           |
| Zamknięcie modalu (z draftami) | DialogClose / Overlay | `onOpenChange`            | Wyświetlenie CloseConfirmDialog                         |
| Potwierdzenie zamknięcia       | CloseConfirmDialog    | `onConfirm`               | Zamknięcie modalu, utrata draftów                       |
| Anulowanie zamknięcia          | CloseConfirmDialog    | `onCancel`                | Powrót do listy draftów                                 |
| Ponowienie próby               | GenerationError       | `onRetry`                 | Powrót do etapu input                                   |

## 9. Warunki i walidacja

### Walidacja na poziomie formularza

| Pole           | Warunek               | Wpływ na UI                                                    |
| -------------- | --------------------- | -------------------------------------------------------------- |
| Tekst źródłowy | Wymagany (min 1 znak) | Przycisk "Generuj" disabled                                    |
| Tekst źródłowy | Max 5000 znaków       | Licznik zmienia kolor na czerwony, przycisk "Generuj" disabled |
| Wybór talii    | Wymagany              | Przycisk "Generuj" disabled                                    |
| Limit AI       | remainingLimit > 0    | Przycisk "Generuj" disabled, komunikat o wyczerpaniu limitu    |

### Walidacja przy edycji draftu

| Pole         | Warunek               | Wpływ na UI                       |
| ------------ | --------------------- | --------------------------------- |
| Przód fiszki | Wymagany (min 1 znak) | Przycisk "Zapisz" disabled        |
| Przód fiszki | Max 200 znaków        | Licznik zmienia kolor na czerwony |
| Tył fiszki   | Wymagany (min 1 znak) | Przycisk "Zapisz" disabled        |
| Tył fiszki   | Max 500 znaków        | Licznik zmienia kolor na czerwony |

### Walidacja przy tworzeniu nowej talii

| Pole        | Warunek               | Wpływ na UI                                     |
| ----------- | --------------------- | ----------------------------------------------- |
| Nazwa talii | Wymagana (min 1 znak) | Przycisk "Utwórz" disabled                      |
| Nazwa talii | Max 100 znaków        | Licznik zmienia kolor na czerwony               |
| Nazwa talii | Unikalna              | Błąd 409 - wyświetlenie komunikatu o duplikacie |

### Walidacja zamknięcia modalu

| Warunek                                                    | Wpływ na UI                     |
| ---------------------------------------------------------- | ------------------------------- |
| Są nieprzetworzene drafty (status "pending" lub "editing") | Wyświetlenie CloseConfirmDialog |
| Brak nieprzetworzoonych draftów                            | Bezpośrednie zamknięcie modalu  |

## 10. Obsługa błędów

### Błędy API

| Kod błędu           | Status HTTP | Obsługa                                                                |
| ------------------- | ----------- | ---------------------------------------------------------------------- |
| `UNAUTHORIZED`      | 401         | Przekierowanie do `/login` z parametrem redirect                       |
| `AI_LIMIT_EXCEEDED` | 403         | Wyświetlenie komunikatu z datą resetu, sugestia ręcznego tworzenia     |
| `DECK_NOT_FOUND`    | 404         | Wyświetlenie komunikatu, odświeżenie listy talii                       |
| `VALIDATION_ERROR`  | 400         | Wyświetlenie szczegółów błędu walidacji                                |
| `AI_SERVICE_ERROR`  | 503         | Przyjazny komunikat "Usługa AI tymczasowo niedostępna", przycisk ponów |
| `INTERNAL_ERROR`    | 500         | Ogólny komunikat błędu, przycisk ponów                                 |

### Błędy sieciowe

- Timeout (30s) - komunikat "Generowanie trwa dłużej niż zwykle", opcja anulowania
- Brak połączenia - komunikat "Sprawdź połączenie internetowe"
- Nieoczekiwany błąd - ogólny komunikat z opcją ponowienia

### Błędy operacji na draftach

- Błąd akceptacji - toast z komunikatem, draft pozostaje w stanie "pending"
- Błąd odrzucenia - toast z komunikatem, draft pozostaje w stanie "pending"
- Nie blokujemy całego przepływu przy błędzie pojedynczego draftu

### Wzorzec wyświetlania błędów

```tsx
{
  state.stage === "error" && (
    <GenerationError
      error={state.error}
      onRetry={() => setState((prev) => ({ ...prev, stage: "input", error: null }))}
    />
  );
}
```

## 11. Kroki implementacji

### Faza 1: Przygotowanie

1. Zainstalować brakujący komponent Select z shadcn/ui:

   ```bash
   npx shadcn@latest add select
   ```

2. Utworzyć strukturę folderów:

   ```
   src/components/generation/
   ├── types.ts
   ├── GenerationModal.tsx
   ├── AILimitIndicator.tsx
   ├── DeckSelector.tsx
   ├── SourceTextArea.tsx
   ├── GenerateButton.tsx
   ├── GenerationSpinner.tsx
   ├── DraftsList.tsx
   ├── DraftItem.tsx
   ├── DraftEditForm.tsx
   ├── GenerationError.tsx
   └── CloseConfirmDialog.tsx
   ```

3. Utworzyć plik typów `src/components/generation/types.ts` z wszystkimi interfejsami

### Faza 2: Hook

4. Utworzyć hook `src/components/hooks/useAIGeneration.ts`:
   - Zaimplementować pobieranie profilu
   - Zaimplementować zarządzanie stanem formularza
   - Zaimplementować wywołanie generowania
   - Zaimplementować akcje na draftach
   - Zaimplementować tworzenie talii

### Faza 3: Komponenty prezentacyjne

5. Zaimplementować `AILimitIndicator` - prosty komponent wyświetlający limit

6. Zaimplementować `SourceTextArea`:
   - Textarea z licznikiem znaków
   - Walidacja długości
   - Style dla przekroczonego limitu

7. Zaimplementować `DeckSelector`:
   - Select z listą talii
   - Opcja tworzenia nowej talii
   - Walidacja nazwy nowej talii

8. Zaimplementować `GenerateButton`:
   - Logika disabled state
   - Ikona i tekst

9. Zaimplementować `GenerationSpinner`:
   - Animowany loader
   - Komunikat tekstowy

### Faza 4: Komponenty draftów

10. Zaimplementować `DraftEditForm`:
    - Dwa pola textarea
    - Liczniki znaków
    - Przyciski Zapisz/Anuluj

11. Zaimplementować `DraftItem`:
    - Wyświetlanie treści draftu
    - Przyciski akcji (Akceptuj/Edytuj/Odrzuć)
    - Stan ładowania
    - Status (ikona checkmark po akceptacji)

12. Zaimplementować `DraftsList`:
    - Nagłówek z liczbą draftów
    - Przewijalna lista DraftItem
    - Obsługa pustego stanu

### Faza 5: Komponenty pomocnicze

13. Zaimplementować `GenerationError`:
    - Różne komunikaty dla różnych typów błędów
    - Przycisk ponowienia próby

14. Zaimplementować `CloseConfirmDialog`:
    - AlertDialog z ostrzeżeniem
    - Przyciski Wróć/Zamknij

### Faza 6: Komponent główny

15. Zaimplementować `GenerationModal`:
    - Integracja wszystkich komponentów
    - Zarządzanie etapami przepływu
    - Obsługa zamykania z potwierdzeniem
    - Focus trap i dostępność

### Faza 7: Integracja

16. Zintegrować modal z Dashboard:
    - Dodać przycisk otwierający modal
    - Przekazać listę talii
    - Obsłużyć callback `onSuccess`

17. Zintegrować modal z widokiem Deck:
    - Dodać przycisk otwierający modal
    - Przekazać preselekcję talii
    - Obsłużyć callback `onSuccess`

### Faza 8: Testy i dostępność

18. Przetestować przepływ manualnie:
    - Generowanie bez błędów
    - Obsługa limitu AI
    - Akceptacja/edycja/odrzucenie draftów
    - Zamykanie z potwierdzeniem

19. Sprawdzić dostępność:
    - Focus trap w modalu
    - Obsługa klawiatury (Escape, Tab)
    - Atrybuty ARIA
    - Kontrast kolorów

20. Przetestować responsywność:
    - Mobile (320px+)
    - Tablet
    - Desktop
