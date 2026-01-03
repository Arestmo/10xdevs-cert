# Plan implementacji widoku Deck View

## 1. Przegląd

Widok talii (`/decks/{deckId}`) służy do zarządzania pojedynczą talią i jej fiszkami. Umożliwia użytkownikowi przeglądanie, edycję i usuwanie fiszek, a także modyfikację nazwy talii i rozpoczynanie sesji nauki. Widok wyświetla listę fiszek w formie akordeonu z podglądem przodu karty (~50 znaków), który po rozwinięciu pokazuje pełną treść przodu i tyłu wraz z opcjami edycji i usunięcia.

## 2. Routing widoku

**Ścieżka**: `/decks/[deckId]`

Widok dostępny jako strona Astro z dynamicznym parametrem `deckId` (UUID). Wymaga autentykacji - niezalogowani użytkownicy przekierowywani są do `/login?redirect=/decks/{deckId}`.

## 3. Struktura komponentów

```
src/pages/decks/[deckId].astro (Astro Page)
└── DeckView (React Component - client:load)
    ├── DeckHeader
    │   ├── BackButton (link do /dashboard)
    │   ├── InlineEditField (edytowalna nazwa talii)
    │   └── DeckStats (liczba fiszek, liczba do powtórki)
    ├── DeckActions
    │   ├── Button "Ucz się (X)"
    │   ├── Button "Generuj fiszki"
    │   ├── Button "Dodaj fiszkę"
    │   └── Button "Usuń talię"
    ├── FlashcardList
    │   └── FlashcardAccordionItem[]
    │       ├── AccordionTrigger (podgląd ~50 znaków)
    │       └── AccordionContent
    │           ├── FlashcardContent (przód + tył)
    │           └── FlashcardItemActions (Edytuj, Usuń)
    ├── FlashcardFormModal (tworzenie/edycja fiszki)
    ├── DeleteDeckDialog (potwierdzenie usunięcia talii)
    └── DeleteFlashcardDialog (potwierdzenie usunięcia fiszki)
```

## 4. Szczegóły komponentów

### 4.1 DeckPage (`src/pages/decks/[deckId].astro`)

- **Opis**: Strona Astro obsługująca routing i autoryzację SSR. Przekazuje `deckId` do komponentu React.
- **Główne elementy**: `DashboardLayout`, `DeckView` z `client:load`
- **Obsługiwane interakcje**: Brak (logika w React)
- **Walidacja**: Sprawdzenie autentykacji po stronie serwera
- **Typy**: `params.deckId: string`
- **Propsy**: `deckId` przekazywany do `DeckView`

### 4.2 DeckView

- **Opis**: Główny kontener widoku talii, zarządza stanem i orkiestruje wszystkie pod-komponenty.
- **Główne elementy**: `DeckHeader`, `DeckActions`, `FlashcardList`, modale i dialogi
- **Obsługiwane interakcje**:
  - Inicjalizacja pobierania danych przy montowaniu
  - Obsługa stanów ładowania, błędu, sukcesu
  - Koordynacja operacji CRUD
- **Walidacja**: Walidacja deckId (UUID format)
- **Typy**: `DeckViewModel`, `FlashcardViewModel[]`, `UseDeckViewReturn`
- **Propsy**: `{ deckId: string }`

### 4.3 DeckHeader

- **Opis**: Nagłówek widoku z nazwą talii (edytowalną inline) i statystykami.
- **Główne elementy**: `BackButton`, `InlineEditField`, `DeckStats`
- **Obsługiwane interakcje**:
  - Kliknięcie przycisku powrotu → nawigacja do /dashboard
  - Kliknięcie nazwy → przejście w tryb edycji
  - Enter/Escape w trybie edycji → zapis/anulowanie
- **Walidacja**: Nazwa: 1-100 znaków, niepusta
- **Typy**: `DeckHeaderProps`, `DeckViewModel`
- **Propsy**:
  ```typescript
  {
    deck: DeckViewModel;
    isEditingName: boolean;
    editedName: string;
    onEditNameStart: () => void;
    onEditNameChange: (name: string) => void;
    onEditNameSave: () => void;
    onEditNameCancel: () => void;
    isUpdatingName: boolean;
    nameError: string | null;
  }
  ```

### 4.4 InlineEditField

- **Opis**: Pole tekstowe z trybem widoku i edycji inline. Obsługuje klawiaturę (Enter/Escape).
- **Główne elementy**: `<span>` (tryb widoku), `<input>` (tryb edycji), przyciski Save/Cancel
- **Obsługiwane interakcje**:
  - Kliknięcie tekstu lub ikony edycji → włączenie edycji
  - Enter → zapis zmian
  - Escape → anulowanie
  - Blur (opcjonalnie) → zapis zmian
- **Walidacja**: Przekazywana przez propsy (minLength, maxLength)
- **Typy**: `InlineEditFieldProps`
- **Propsy**:
  ```typescript
  {
    value: string;
    isEditing: boolean;
    editedValue: string;
    onEditStart: () => void;
    onChange: (value: string) => void;
    onSave: () => void;
    onCancel: () => void;
    isLoading: boolean;
    error: string | null;
    maxLength: number;
    placeholder?: string;
    ariaLabel: string;
  }
  ```

### 4.5 DeckStats

- **Opis**: Wyświetla statystyki talii (całkowita liczba fiszek, fiszki do powtórki).
- **Główne elementy**: Ikony + liczby w kontenerze flex
- **Obsługiwane interakcje**: Brak (tylko wyświetlanie)
- **Walidacja**: Brak
- **Typy**: `DeckStatsProps`
- **Propsy**:
  ```typescript
  {
    totalFlashcards: number;
    dueFlashcards: number;
  }
  ```

### 4.6 DeckActions

- **Opis**: Pasek akcji z przyciskami głównych operacji na talii.
- **Główne elementy**: 4 przyciski (`Button` z shadcn/ui)
- **Obsługiwane interakcje**:
  - Kliknięcie "Ucz się (X)" → nawigacja do `/study?deck={deckId}` (jeśli X > 0)
  - Kliknięcie "Generuj fiszki" → nawigacja do generatora lub otwarcie modalu
  - Kliknięcie "Dodaj fiszkę" → otwarcie `FlashcardFormModal`
  - Kliknięcie "Usuń talię" → otwarcie `DeleteDeckDialog`
- **Walidacja**: Brak
- **Typy**: `DeckActionsProps`
- **Propsy**:
  ```typescript
  {
    deckId: string;
    dueCount: number;
    onAddFlashcard: () => void;
    onDeleteDeck: () => void;
  }
  ```

### 4.7 FlashcardList

- **Opis**: Lista fiszek w formie akordeonu. Obsługuje stan pustej listy.
- **Główne elementy**: Kontener z listą `FlashcardAccordionItem`, komunikat pustego stanu
- **Obsługiwane interakcje**:
  - Rozwijanie/zwijanie pojedynczej fiszki
  - Tylko jedna fiszka rozwinięta naraz
- **Walidacja**: Brak
- **Typy**: `FlashcardListProps`, `FlashcardViewModel[]`
- **Propsy**:
  ```typescript
  {
    flashcards: FlashcardViewModel[];
    expandedId: string | null;
    onExpand: (id: string | null) => void;
    onEdit: (flashcard: FlashcardViewModel) => void;
    onDelete: (flashcard: FlashcardViewModel) => void;
  }
  ```

### 4.8 FlashcardAccordionItem

- **Opis**: Pojedynczy element akordeonu reprezentujący fiszkę. Pokazuje podgląd (~50 znaków) i rozwija się do pełnego widoku.
- **Główne elementy**: `AccordionTrigger` (nagłówek), `AccordionContent` (treść)
- **Obsługiwane interakcje**:
  - Kliknięcie nagłówka → rozwinięcie/zwinięcie
  - Kliknięcie "Edytuj" → wywołanie onEdit
  - Kliknięcie "Usuń" → wywołanie onDelete
- **Walidacja**: Brak
- **Typy**: `FlashcardAccordionItemProps`
- **Propsy**:
  ```typescript
  {
    flashcard: FlashcardViewModel;
    isExpanded: boolean;
    onToggle: () => void;
    onEdit: () => void;
    onDelete: () => void;
  }
  ```

**Atrybuty dostępności**:

- `aria-expanded` na triggerze
- `aria-controls` wskazujący na panel treści
- Unikalne `id` dla panelu treści

### 4.9 FlashcardFormModal

- **Opis**: Modal z formularzem do tworzenia nowej lub edycji istniejącej fiszki.
- **Główne elementy**: `Dialog`, `Textarea` (przód), `Textarea` (tył), liczniki znaków, przyciski
- **Obsługiwane interakcje**:
  - Wpisywanie tekstu w pola
  - Kliknięcie "Zapisz" → walidacja i zapis
  - Kliknięcie "Anuluj" lub X → zamknięcie modalu
  - Escape → zamknięcie modalu
- **Walidacja**:
  - Przód: wymagany, 1-200 znaków
  - Tył: wymagany, 1-500 znaków
  - Oba pola muszą być wypełnione
- **Typy**: `FlashcardFormModalProps`, `FlashcardFormData`
- **Propsy**:
  ```typescript
  {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (flashcard: FlashcardDTO) => void;
    deckId: string;
    editingFlashcard?: FlashcardViewModel | null; // null = tryb tworzenia
  }
  ```

### 4.10 DeleteDeckDialog

- **Opis**: Dialog potwierdzenia usunięcia talii z informacją o liczbie fiszek.
- **Główne elementy**: `AlertDialog`, tekst ostrzeżenia, przyciski "Anuluj" i "Usuń"
- **Obsługiwane interakcje**:
  - Kliknięcie "Usuń" → usunięcie talii, przekierowanie do dashboard
  - Kliknięcie "Anuluj" → zamknięcie dialogu
- **Walidacja**: Brak (potwierdzenie tekstowe opcjonalne)
- **Typy**: `DeleteDeckDialogProps`
- **Propsy**:
  ```typescript
  {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    deckName: string;
    flashcardsCount: number;
    isDeleting: boolean;
  }
  ```

### 4.11 DeleteFlashcardDialog

- **Opis**: Dialog potwierdzenia usunięcia pojedynczej fiszki.
- **Główne elementy**: `AlertDialog`, tekst ostrzeżenia, przyciski "Anuluj" i "Usuń"
- **Obsługiwane interakcje**:
  - Kliknięcie "Usuń" → usunięcie fiszki
  - Kliknięcie "Anuluj" → zamknięcie dialogu
- **Walidacja**: Brak
- **Typy**: `DeleteFlashcardDialogProps`
- **Propsy**:
  ```typescript
  {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    flashcardPreview: string;
    isDeleting: boolean;
  }
  ```

## 5. Typy

### 5.1 ViewModels (w `src/components/deck/types.ts`)

```typescript
/**
 * ViewModel dla widoku talii
 * Transformacja z DeckWithMetadataDTO (snake_case → camelCase)
 */
export interface DeckViewModel {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  totalFlashcards: number;
  dueFlashcards: number;
}

/**
 * ViewModel dla pojedynczej fiszki
 * Transformacja z FlashcardDTO (snake_case → camelCase)
 */
export interface FlashcardViewModel {
  id: string;
  deckId: string;
  front: string;
  back: string;
  source: "ai" | "manual";
  /** Podgląd przodu (~50 znaków) */
  frontPreview: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Dane formularza fiszki
 */
export interface FlashcardFormData {
  front: string;
  back: string;
}

/**
 * Stan widoku talii
 */
export interface DeckViewState {
  deck: DeckViewModel | null;
  flashcards: FlashcardViewModel[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    total: number;
    hasMore: boolean;
    offset: number;
  };
}
```

### 5.2 Props Components (w `src/components/deck/types.ts`)

```typescript
export interface DeckViewProps {
  deckId: string;
}

export interface DeckHeaderProps {
  deck: DeckViewModel;
  isEditingName: boolean;
  editedName: string;
  onEditNameStart: () => void;
  onEditNameChange: (name: string) => void;
  onEditNameSave: () => void;
  onEditNameCancel: () => void;
  isUpdatingName: boolean;
  nameError: string | null;
}

export interface InlineEditFieldProps {
  value: string;
  isEditing: boolean;
  editedValue: string;
  onEditStart: () => void;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isLoading: boolean;
  error: string | null;
  maxLength: number;
  placeholder?: string;
  ariaLabel: string;
}

export interface DeckStatsProps {
  totalFlashcards: number;
  dueFlashcards: number;
}

export interface DeckActionsProps {
  deckId: string;
  dueCount: number;
  onAddFlashcard: () => void;
  onDeleteDeck: () => void;
}

export interface FlashcardListProps {
  flashcards: FlashcardViewModel[];
  expandedId: string | null;
  onExpand: (id: string | null) => void;
  onEdit: (flashcard: FlashcardViewModel) => void;
  onDelete: (flashcard: FlashcardViewModel) => void;
}

export interface FlashcardAccordionItemProps {
  flashcard: FlashcardViewModel;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export interface FlashcardFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (flashcard: FlashcardDTO) => void;
  deckId: string;
  editingFlashcard?: FlashcardViewModel | null;
}

export interface DeleteDeckDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  deckName: string;
  flashcardsCount: number;
  isDeleting: boolean;
}

export interface DeleteFlashcardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  flashcardPreview: string;
  isDeleting: boolean;
}
```

### 5.3 Hook Return Types

```typescript
export interface UseDeckViewReturn {
  // Dane
  deck: DeckViewModel | null;
  flashcards: FlashcardViewModel[];

  // Stany ładowania
  isLoading: boolean;
  isLoadingMore: boolean;

  // Błędy
  error: string | null;

  // Paginacja
  hasMore: boolean;

  // Akcje
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;

  // Operacje na talii
  updateDeckName: (name: string) => Promise<void>;
  deleteDeck: () => Promise<boolean>;
  isUpdatingName: boolean;
  isDeletingDeck: boolean;
  nameUpdateError: string | null;

  // Operacje na fiszkach
  createFlashcard: (data: FlashcardFormData) => Promise<FlashcardDTO>;
  updateFlashcard: (id: string, data: FlashcardFormData) => Promise<FlashcardDTO>;
  deleteFlashcard: (id: string) => Promise<boolean>;
  isCreatingFlashcard: boolean;
  isUpdatingFlashcard: boolean;
  isDeletingFlashcard: boolean;
}
```

## 6. Zarządzanie stanem

### 6.1 Custom Hook: `useDeckView`

Główny hook zarządzający całym stanem widoku talii. Lokalizacja: `src/components/hooks/useDeckView.ts`

```typescript
export function useDeckView(deckId: string): UseDeckViewReturn {
  // Stan danych
  const [deck, setDeck] = useState<DeckViewModel | null>(null);
  const [flashcards, setFlashcards] = useState<FlashcardViewModel[]>([]);

  // Stan ładowania
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Stan błędu
  const [error, setError] = useState<string | null>(null);

  // Paginacja
  const [pagination, setPagination] = useState({
    total: 0,
    offset: 0,
    hasMore: false,
  });

  // Stany operacji CRUD
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [isDeletingDeck, setIsDeletingDeck] = useState(false);
  const [isCreatingFlashcard, setIsCreatingFlashcard] = useState(false);
  const [isUpdatingFlashcard, setIsUpdatingFlashcard] = useState(false);
  const [isDeletingFlashcard, setIsDeletingFlashcard] = useState(false);
  const [nameUpdateError, setNameUpdateError] = useState<string | null>(null);

  // ... implementacja metod
}
```

### 6.2 Stan UI w komponencie DeckView

```typescript
// Stan UI zarządzany lokalnie w DeckView
const [isEditingName, setIsEditingName] = useState(false);
const [editedName, setEditedName] = useState("");
const [expandedFlashcardId, setExpandedFlashcardId] = useState<string | null>(null);
const [isAddFormOpen, setIsAddFormOpen] = useState(false);
const [editingFlashcard, setEditingFlashcard] = useState<FlashcardViewModel | null>(null);
const [isDeleteDeckDialogOpen, setIsDeleteDeckDialogOpen] = useState(false);
const [deletingFlashcard, setDeletingFlashcard] = useState<FlashcardViewModel | null>(null);
```

## 7. Integracja API

### 7.1 Pobieranie danych talii

**Endpoint**: `GET /api/decks/{deckId}`

**Typ żądania**: Brak body (parametr w URL)

**Typ odpowiedzi**: `DeckWithMetadataDTO`

```typescript
{
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  total_flashcards: number;
  due_flashcards: number;
}
```

**Transformacja do ViewModel**:

```typescript
const transformDeckDTO = (dto: DeckWithMetadataDTO): DeckViewModel => ({
  id: dto.id,
  name: dto.name,
  createdAt: dto.created_at,
  updatedAt: dto.updated_at,
  totalFlashcards: dto.total_flashcards,
  dueFlashcards: dto.due_flashcards,
});
```

### 7.2 Pobieranie listy fiszek

**Endpoint**: `GET /api/flashcards?deck_id={deckId}&limit=50&offset=0&sort=created_at&order=desc`

**Typ odpowiedzi**: `FlashcardsListResponseDTO`

```typescript
{
  data: FlashcardDTO[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}
```

**Transformacja do ViewModel**:

```typescript
const transformFlashcardDTO = (dto: FlashcardDTO): FlashcardViewModel => ({
  id: dto.id,
  deckId: dto.deck_id,
  front: dto.front,
  back: dto.back,
  source: dto.source,
  frontPreview: dto.front.length > 50 ? dto.front.substring(0, 50) + "..." : dto.front,
  createdAt: dto.created_at,
  updatedAt: dto.updated_at,
});
```

### 7.3 Aktualizacja nazwy talii

**Endpoint**: `PATCH /api/decks/{deckId}`

**Typ żądania**: `UpdateDeckRequestDTO`

```typescript
{
  name: string;
}
```

**Typ odpowiedzi**: `DeckDTO`

### 7.4 Usunięcie talii

**Endpoint**: `DELETE /api/decks/{deckId}`

**Typ odpowiedzi**: `204 No Content`

### 7.5 Tworzenie fiszki

**Endpoint**: `POST /api/flashcards`

**Typ żądania**: `CreateFlashcardRequestDTO`

```typescript
{
  deck_id: string;
  front: string;
  back: string;
  source: "manual";
}
```

**Typ odpowiedzi**: `FlashcardDTO` (201 Created)

### 7.6 Aktualizacja fiszki

**Endpoint**: `PATCH /api/flashcards/{flashcardId}`

**Typ żądania**: `UpdateFlashcardRequestDTO`

```typescript
{
  front?: string;
  back?: string;
}
```

**Typ odpowiedzi**: `FlashcardDTO`

### 7.7 Usunięcie fiszki

**Endpoint**: `DELETE /api/flashcards/{flashcardId}`

**Typ odpowiedzi**: `204 No Content`

## 8. Interakcje użytkownika

### 8.1 Nawigacja

| Interakcja                   | Akcja                  | Rezultat                            |
| ---------------------------- | ---------------------- | ----------------------------------- |
| Kliknięcie przycisku powrotu | -                      | Nawigacja do `/dashboard`           |
| Kliknięcie "Ucz się (X)"     | `window.location.href` | Nawigacja do `/study?deck={deckId}` |
| Kliknięcie "Generuj fiszki"  | -                      | Nawigacja do widoku generatora      |

### 8.2 Edycja nazwy talii

| Interakcja             | Akcja                        | Rezultat                                   |
| ---------------------- | ---------------------------- | ------------------------------------------ |
| Kliknięcie nazwy talii | `setIsEditingName(true)`     | Pole staje się edytowalne                  |
| Wpisywanie tekstu      | `setEditedName(value)`       | Aktualizacja stanu                         |
| Enter                  | `updateDeckName(editedName)` | Zapis do API, aktualizacja UI              |
| Escape                 | `setIsEditingName(false)`    | Anulowanie, przywrócenie oryginalnej nazwy |
| Kliknięcie poza polem  | `onSave()` lub `onCancel()`  | Zależnie od konfiguracji                   |

### 8.3 Zarządzanie fiszkami

| Interakcja                | Akcja                             | Rezultat                             |
| ------------------------- | --------------------------------- | ------------------------------------ |
| Kliknięcie "Dodaj fiszkę" | `setIsAddFormOpen(true)`          | Otwarcie modalu formularza           |
| Zapisanie formularza      | `createFlashcard(data)`           | Utworzenie fiszki, dodanie do listy  |
| Kliknięcie fiszki         | `setExpandedFlashcardId(id)`      | Rozwinięcie/zwinięcie akordeonu      |
| Kliknięcie "Edytuj"       | `setEditingFlashcard(flashcard)`  | Otwarcie modalu z danymi             |
| Zapisanie edycji          | `updateFlashcard(id, data)`       | Aktualizacja fiszki w liście         |
| Kliknięcie "Usuń"         | `setDeletingFlashcard(flashcard)` | Otwarcie dialogu potwierdzenia       |
| Potwierdzenie usunięcia   | `deleteFlashcard(id)`             | Usunięcie fiszki, aktualizacja listy |

### 8.4 Usuwanie talii

| Interakcja              | Akcja                              | Rezultat                               |
| ----------------------- | ---------------------------------- | -------------------------------------- |
| Kliknięcie "Usuń talię" | `setIsDeleteDeckDialogOpen(true)`  | Otwarcie dialogu                       |
| Potwierdzenie           | `deleteDeck()`                     | Usunięcie, przekierowanie do dashboard |
| Anulowanie              | `setIsDeleteDeckDialogOpen(false)` | Zamknięcie dialogu                     |

## 9. Warunki i walidacja

### 9.1 Walidacja nazwy talii

| Warunek              | Komponent         | Wpływ na UI                                    |
| -------------------- | ----------------- | ---------------------------------------------- |
| Nazwa pusta          | `InlineEditField` | Przycisk "Zapisz" nieaktywny, komunikat błędu  |
| Nazwa > 100 znaków   | `InlineEditField` | Przycisk "Zapisz" nieaktywny, licznik czerwony |
| Duplikat nazwy (409) | `InlineEditField` | Wyświetlenie błędu po stronie serwera          |

### 9.2 Walidacja formularza fiszki

| Warunek            | Komponent            | Wpływ na UI                           |
| ------------------ | -------------------- | ------------------------------------- |
| Przód pusty        | `FlashcardFormModal` | Przycisk "Zapisz" nieaktywny          |
| Przód > 200 znaków | `FlashcardFormModal` | Licznik czerwony, przycisk nieaktywny |
| Tył pusty          | `FlashcardFormModal` | Przycisk "Zapisz" nieaktywny          |
| Tył > 500 znaków   | `FlashcardFormModal` | Licznik czerwony, przycisk nieaktywny |

### 9.3 Warunki wyświetlania

| Warunek                   | Komponent       | Wpływ na UI                             |
| ------------------------- | --------------- | --------------------------------------- |
| `dueFlashcards === 0`     | `DeckActions`   | Przycisk "Ucz się" wyłączony lub ukryty |
| `flashcards.length === 0` | `FlashcardList` | Wyświetlenie pustego stanu              |
| `hasMore === true`        | `FlashcardList` | Wyświetlenie przycisku "Załaduj więcej" |

## 10. Obsługa błędów

### 10.1 Błędy pobierania danych

| Kod błędu        | Obsługa                                                                      |
| ---------------- | ---------------------------------------------------------------------------- |
| 401 Unauthorized | Przekierowanie do `/login?redirect=/decks/{deckId}`                          |
| 404 Not Found    | Wyświetlenie komunikatu "Talia nie została znaleziona" z przyciskiem powrotu |
| 500 Server Error | Alert z komunikatem i przyciskiem "Spróbuj ponownie"                         |
| Network Error    | Alert z komunikatem o problemie z połączeniem                                |

### 10.2 Błędy operacji CRUD

| Operacja           | Błąd           | Obsługa                                              |
| ------------------ | -------------- | ---------------------------------------------------- |
| Aktualizacja nazwy | 409 Conflict   | Wyświetlenie błędu "Talia o tej nazwie już istnieje" |
| Aktualizacja nazwy | 400 Validation | Wyświetlenie szczegółów walidacji                    |
| Tworzenie fiszki   | 400 Validation | Wyświetlenie błędów przy polach                      |
| Usuwanie           | 404 Not Found  | Odświeżenie listy (element mógł być już usunięty)    |

### 10.3 Optymistyczne aktualizacje

Dla lepszego UX, rozważyć implementację optymistycznych aktualizacji:

- Natychmiastowe dodanie fiszki do listy po kliknięciu "Zapisz"
- Natychmiastowe usunięcie z listy po potwierdzeniu usunięcia
- Rollback w przypadku błędu API

## 11. Kroki implementacji

### Krok 1: Struktura plików

1. Utworzenie katalogu `src/components/deck/`
2. Utworzenie pliku typów `src/components/deck/types.ts`
3. Utworzenie strony Astro `src/pages/decks/[deckId].astro`

### Krok 2: Typy i ViewModel

1. Zdefiniowanie `DeckViewModel` i `FlashcardViewModel`
2. Zdefiniowanie wszystkich interfejsów Props
3. Zdefiniowanie funkcji transformacji DTO → ViewModel

### Krok 3: Custom Hook useDeckView

1. Implementacja pobierania danych talii i fiszek
2. Implementacja paginacji (load more)
3. Implementacja operacji CRUD dla talii
4. Implementacja operacji CRUD dla fiszek
5. Obsługa błędów i stanów ładowania

### Krok 4: Komponenty prezentacyjne

1. `DeckStats` - statystyki talii
2. `InlineEditField` - edycja inline z obsługą klawiatury
3. `FlashcardAccordionItem` - element akordeonu
4. `FlashcardList` - lista z akordeonem i pustym stanem

### Krok 5: Komponenty nagłówka i akcji

1. `DeckHeader` - kompozycja nagłówka
2. `DeckActions` - pasek akcji z przyciskami

### Krok 6: Modale i dialogi

1. `FlashcardFormModal` - formularz tworzenia/edycji
2. `DeleteDeckDialog` - potwierdzenie usunięcia talii
3. `DeleteFlashcardDialog` - potwierdzenie usunięcia fiszki

### Krok 7: Główny kontener

1. `DeckView` - kompozycja wszystkich komponentów
2. Zarządzanie stanem UI (rozwinięty akordeon, otwarte modale)
3. Integracja z useDeckView hook

### Krok 8: Strona Astro

1. Implementacja autoryzacji SSR
2. Renderowanie DeckView z `client:load`
3. Przekazanie deckId z parametrów URL

### Krok 9: Instalacja brakujących komponentów shadcn/ui

1. `npx shadcn@latest add accordion` (jeśli nie zainstalowany)
2. `npx shadcn@latest add alert-dialog` (jeśli nie zainstalowany)
3. `npx shadcn@latest add textarea` (jeśli nie zainstalowany)

### Krok 10: Testy i dostępność

1. Weryfikacja atrybutów ARIA na akordeonach
2. Test nawigacji klawiaturą (Tab, Enter, Escape)
3. Test focus trap w modalach
4. Test responsywności na różnych rozdzielczościach
