# Plan implementacji widoku Dashboard

## 1. Przegląd

Dashboard to centralny hub aplikacji Flashcards AI, zapewniający użytkownikowi przegląd materiałów do nauki oraz szybki dostęp do głównych funkcji. Widok wyświetla:

- Liczbę fiszek do powtórki (kafelek nawigacyjny do sesji nauki)
- Kafelek CTA do tworzenia nowej talii lub generowania fiszek AI
- Siatkę kafelków z taliami użytkownika
- Stan pusty dla nowych użytkowników bez talii
- Nagłówek z menu użytkownika (wylogowanie, ustawienia)

Widok jest responsywny (mobile-first) z layoutem kafelkowym 1/2/3-4 kolumny w zależności od szerokości ekranu.

## 2. Routing widoku

**Ścieżka:** `/dashboard`

**Plik:** `src/pages/dashboard.astro`

**Ochrona:** Widok wymaga autentykacji. Niezalogowani użytkownicy są przekierowywani do `/login?redirect=/dashboard`.

## 3. Struktura komponentów

```
dashboard.astro (Astro Page)
├── DashboardLayout.astro (Layout)
│   ├── AppHeader (React Component)
│   │   ├── Logo
│   │   └── UserDropdownMenu (React Component)
│   │       ├── Avatar
│   │       └── DropdownMenu items (Ustawienia, Wyloguj)
│   └── <slot /> (main content)
│
└── DashboardContent (React Component - client:load)
    ├── DueReviewTile (React Component) [conditional]
    ├── CreateDeckTile (React Component)
    ├── DeckGrid (React Component)
    │   └── DeckTile[] (React Component)
    └── EmptyState (React Component) [conditional]
```

## 4. Szczegóły komponentów

### 4.1 DashboardPage (`src/pages/dashboard.astro`)

- **Opis:** Strona Astro obsługująca routing i server-side sprawdzenie autentykacji. Przekazuje dane sesji do layoutu.
- **Główne elementy:** Sprawdzenie sesji w frontmatter, renderowanie `DashboardLayout` ze slotem `DashboardContent`.
- **Obsługiwane interakcje:** Brak (statyczna strona).
- **Obsługiwana walidacja:** Sprawdzenie sesji użytkownika - redirect do `/login` gdy brak sesji.
- **Typy:** `Session` z Supabase.
- **Propsy:** Brak.

### 4.2 DashboardLayout (`src/layouts/DashboardLayout.astro`)

- **Opis:** Layout dla zalogowanych użytkowników z nagłówkiem aplikacji i miejscem na zawartość strony.
- **Główne elementy:**
  - `<html>` z `lang="pl"`
  - `<head>` z meta tagami
  - `<body>` z klasami tła
  - `AppHeader` jako React component z `client:load`
  - `<main>` ze slotem na zawartość
- **Obsługiwane interakcje:** Brak (layout).
- **Obsługiwana walidacja:** Brak.
- **Typy:** `Props { userEmail?: string }`.
- **Propsy:** `userEmail` - email użytkownika do wyświetlenia w menu.

### 4.3 AppHeader (`src/components/AppHeader.tsx`)

- **Opis:** Nagłówek aplikacji z logo i menu użytkownika. Wyświetla się na wszystkich stronach dla zalogowanych użytkowników.
- **Główne elementy:**
  - `<header>` z klasami stylowania
  - Logo (link do `/dashboard`)
  - `UserDropdownMenu` po prawej stronie
- **Obsługiwane interakcje:** Kliknięcie logo → nawigacja do dashboard.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `AppHeaderProps`.
- **Propsy:**
  - `userEmail?: string` - email do wyświetlenia w avatar/menu

### 4.4 UserDropdownMenu (`src/components/UserDropdownMenu.tsx`)

- **Opis:** Menu rozwijane z opcjami użytkownika (Ustawienia, Wyloguj). Wykorzystuje komponent Avatar i dropdown.
- **Główne elementy:**
  - `Button` z `Avatar` jako trigger
  - Menu rozwijane z opcjami:
    - "Ustawienia" → link do `/settings`
    - "Wyloguj" → wywołanie Supabase signOut
- **Obsługiwane interakcje:**
  - Kliknięcie avatara → otwarcie/zamknięcie menu
  - "Ustawienia" → nawigacja do `/settings`
  - "Wyloguj" → wylogowanie i redirect do `/login`
- **Obsługiwana walidacja:** Brak.
- **Typy:** `UserDropdownMenuProps`.
- **Propsy:**
  - `userEmail?: string` - email do wyświetlenia w avatar (inicjały) i tooltip

### 4.5 DashboardContent (`src/components/dashboard/DashboardContent.tsx`)

- **Opis:** Główny kontener zawartości dashboardu. Pobiera dane z API i renderuje odpowiednie komponenty w zależności od stanu.
- **Główne elementy:**
  - Stan ładowania (skeleton/spinner)
  - Stan błędu (Alert z komunikatem)
  - `DueReviewTile` (gdy `total_due > 0`)
  - `CreateDeckTile`
  - `DeckGrid` z `DeckTile[]` (gdy są talie)
  - `EmptyState` (gdy brak talii)
- **Obsługiwane interakcje:**
  - Pobieranie danych przy montowaniu
  - Odświeżanie danych po utworzeniu talii
- **Obsługiwana walidacja:** Brak bezpośredniej walidacji.
- **Typy:** `DashboardViewModel`, `DashboardContentProps`.
- **Propsy:** Brak (pobiera dane z API).

### 4.6 DueReviewTile (`src/components/dashboard/DueReviewTile.tsx`)

- **Opis:** Kafelek wyświetlający liczbę fiszek do powtórki. Kliknięcie rozpoczyna sesję nauki.
- **Główne elementy:**
  - `Card` z ikoną (np. BookOpen)
  - Tytuł "Do powtórki"
  - Liczba fiszek (duża, wyróżniona)
  - Tekst pomocniczy "fiszek czeka na powtórkę"
- **Obsługiwane interakcje:**
  - Kliknięcie kafelka → nawigacja do `/study`
  - Hover → efekt wizualny
- **Obsługiwana walidacja:** Brak.
- **Typy:** `DueReviewTileProps`.
- **Propsy:**
  - `dueCount: number` - liczba fiszek do powtórki

### 4.7 CreateDeckTile (`src/components/dashboard/CreateDeckTile.tsx`)

- **Opis:** Kafelek CTA do tworzenia nowej talii lub generowania fiszek. Otwiera modal/formularz.
- **Główne elementy:**
  - `Card` z ikoną (np. Plus)
  - Tytuł "Nowa talia"
  - Podtytuł "lub generuj fiszki AI"
  - Efekt wizualny CTA (obramowanie przerywane lub gradient)
- **Obsługiwane interakcje:**
  - Kliknięcie → otwarcie modalu tworzenia talii / generowania
- **Obsługiwana walidacja:** Brak.
- **Typy:** `CreateDeckTileProps`.
- **Propsy:**
  - `onClick: () => void` - callback po kliknięciu

### 4.8 DeckGrid (`src/components/dashboard/DeckGrid.tsx`)

- **Opis:** Siatka kafelków talii z responsywnym layoutem.
- **Główne elementy:**
  - `<div>` z klasami grid (1/2/3-4 kolumny)
  - Lista `DeckTile` dla każdej talii
- **Obsługiwane interakcje:** Brak (kontener).
- **Obsługiwana walidacja:** Brak.
- **Typy:** `DeckGridProps`.
- **Propsy:**
  - `decks: DeckTileData[]` - lista talii do wyświetlenia

### 4.9 DeckTile (`src/components/dashboard/DeckTile.tsx`)

- **Opis:** Pojedynczy kafelek talii wyświetlający nazwę i statystyki.
- **Główne elementy:**
  - `Card` jako link do `/decks/{id}`
  - Nazwa talii (tytuł)
  - Liczba fiszek ogółem
  - Liczba fiszek do powtórki (jeśli > 0, wyróżniona)
- **Obsługiwane interakcje:**
  - Kliknięcie → nawigacja do `/decks/{deckId}`
  - Hover → efekt wizualny
- **Obsługiwana walidacja:** Brak.
- **Typy:** `DeckTileProps`, `DeckTileData`.
- **Propsy:**
  - `deck: DeckTileData` - dane talii (id, name, total_flashcards, due_flashcards)

### 4.10 EmptyState (`src/components/dashboard/EmptyState.tsx`)

- **Opis:** Komponent wyświetlany dla nowych użytkowników bez talii. Zawiera komunikat powitalny i CTA.
- **Główne elementy:**
  - Ikona ilustracyjna (np. Inbox lub Cards)
  - Nagłówek "Witaj w Flashcards AI!"
  - Opis "Utwórz swoją pierwszą talię, aby rozpocząć naukę"
  - `Button` "Utwórz pierwszą talię"
- **Obsługiwane interakcje:**
  - Kliknięcie przycisku → otwarcie modalu tworzenia talii
- **Obsługiwana walidacja:** Brak.
- **Typy:** `EmptyStateProps`.
- **Propsy:**
  - `onCreateDeck: () => void` - callback do tworzenia talii

### 4.11 CreateDeckModal (`src/components/dashboard/CreateDeckModal.tsx`)

- **Opis:** Modal z formularzem tworzenia nowej talii.
- **Główne elementy:**
  - Overlay modalu
  - `Card` jako kontener
  - Nagłówek "Nowa talia"
  - Formularz z polem `Input` na nazwę
  - Licznik znaków (max 100)
  - Przyciski "Anuluj" i "Utwórz"
  - Komunikat błędu (jeśli występuje)
- **Obsługiwane interakcje:**
  - Wprowadzanie nazwy talii
  - Kliknięcie "Utwórz" → wywołanie API POST /api/decks
  - Kliknięcie "Anuluj" lub poza modalem → zamknięcie
  - Enter w polu → submit formularza
- **Obsługiwana walidacja:**
  - Nazwa wymagana (min 1 znak)
  - Nazwa max 100 znaków
  - Komunikat błędu przy duplikacie nazwy (409)
- **Typy:** `CreateDeckModalProps`, `CreateDeckFormData`.
- **Propsy:**
  - `isOpen: boolean` - czy modal jest otwarty
  - `onClose: () => void` - callback zamknięcia
  - `onSuccess: (deck: DeckDTO) => void` - callback po utworzeniu talii

## 5. Typy

### 5.1 Istniejące typy (z `src/types.ts`)

```typescript
// Odpowiedź z GET /api/decks
interface DecksListResponseDTO {
  data: DeckWithMetadataDTO[];
  pagination: PaginationDTO;
}

interface DeckWithMetadataDTO {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  total_flashcards: number;
  due_flashcards: number;
}

// Odpowiedź z GET /api/study/summary
interface StudySummaryResponseDTO {
  total_due: number;
  next_review_date: string | null;
  decks: DeckSummaryDTO[];
}

interface DeckSummaryDTO {
  id: string;
  name: string;
  due_count: number;
}

// Request do POST /api/decks
type CreateDeckRequestDTO = { name: string };

// Odpowiedź z POST /api/decks
type DeckDTO = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

// Błąd API
interface ErrorResponseDTO {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
```

### 5.2 Nowe typy ViewModel (do utworzenia w `src/components/dashboard/types.ts`)

```typescript
/**
 * ViewModel dla głównego widoku dashboardu
 * Agreguje dane z wielu endpointów
 */
interface DashboardViewModel {
  /** Liczba fiszek do powtórki ze wszystkich talii */
  totalDue: number;
  /** Data najbliższej zaplanowanej powtórki (null jeśli brak) */
  nextReviewDate: string | null;
  /** Lista talii użytkownika z metadanymi */
  decks: DeckTileData[];
  /** Czy użytkownik ma jakiekolwiek talie */
  hasDecks: boolean;
  /** Czy są fiszki do powtórki */
  hasDueCards: boolean;
}

/**
 * Dane pojedynczego kafelka talii
 */
interface DeckTileData {
  id: string;
  name: string;
  totalFlashcards: number;
  dueFlashcards: number;
}

/**
 * Stan formularza tworzenia talii
 */
interface CreateDeckFormData {
  name: string;
}

/**
 * Stan hooka useDashboard
 */
interface UseDashboardState {
  data: DashboardViewModel | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Props dla AppHeader
 */
interface AppHeaderProps {
  userEmail?: string;
}

/**
 * Props dla UserDropdownMenu
 */
interface UserDropdownMenuProps {
  userEmail?: string;
}

/**
 * Props dla DueReviewTile
 */
interface DueReviewTileProps {
  dueCount: number;
}

/**
 * Props dla CreateDeckTile
 */
interface CreateDeckTileProps {
  onClick: () => void;
}

/**
 * Props dla DeckGrid
 */
interface DeckGridProps {
  decks: DeckTileData[];
}

/**
 * Props dla DeckTile
 */
interface DeckTileProps {
  deck: DeckTileData;
}

/**
 * Props dla EmptyState
 */
interface EmptyStateProps {
  onCreateDeck: () => void;
}

/**
 * Props dla CreateDeckModal
 */
interface CreateDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (deck: DeckDTO) => void;
}
```

## 6. Zarządzanie stanem

### 6.1 Custom Hook: `useDashboard`

Plik: `src/components/hooks/useDashboard.ts`

Hook zarządza pobieraniem i agregacją danych z dwóch endpointów:

- `GET /api/decks` - lista talii z metadanymi
- `GET /api/study/summary` - podsumowanie nauki

```typescript
interface UseDashboardReturn {
  /** Zagregowane dane dashboardu */
  data: DashboardViewModel | null;
  /** Stan ładowania */
  isLoading: boolean;
  /** Komunikat błędu */
  error: string | null;
  /** Funkcja do odświeżenia danych */
  refetch: () => Promise<void>;
}
```

**Logika hooka:**

1. Przy montowaniu wywołuje równolegle oba endpointy
2. Agreguje odpowiedzi do `DashboardViewModel`
3. Mapuje `DeckWithMetadataDTO` na `DeckTileData` (camelCase)
4. Obsługuje stany ładowania i błędów
5. Udostępnia funkcję `refetch` do odświeżania po utworzeniu talii

### 6.2 Stan modalu tworzenia talii

Stan lokalny w `DashboardContent`:

```typescript
const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
```

### 6.3 Stan formularza w CreateDeckModal

Stan lokalny w komponencie:

```typescript
const [name, setName] = useState("");
const [isSubmitting, setIsSubmitting] = useState(false);
const [error, setError] = useState<string | null>(null);
```

## 7. Integracja API

### 7.1 GET /api/decks

**Wywołanie:** Przy montowaniu `DashboardContent` (przez `useDashboard`)

**Request:**

```
GET /api/decks?limit=100&sort=name&order=asc
```

**Response (200):**

```typescript
DecksListResponseDTO;
```

**Obsługa błędów:**

- `401` → Redirect do `/login`
- `500` → Wyświetlenie komunikatu błędu

### 7.2 GET /api/study/summary

**Wywołanie:** Przy montowaniu `DashboardContent` (przez `useDashboard`)

**Request:**

```
GET /api/study/summary
```

**Response (200):**

```typescript
StudySummaryResponseDTO;
```

**Obsługa błędów:**

- `401` → Redirect do `/login`
- `500` → Wyświetlenie komunikatu błędu

### 7.3 POST /api/decks

**Wywołanie:** Po kliknięciu "Utwórz" w `CreateDeckModal`

**Request:**

```typescript
POST /api/decks
Content-Type: application/json

{
  "name": "Nazwa talii"
}
```

**Response (201):**

```typescript
DeckDTO;
```

**Obsługa błędów:**

- `400` → Wyświetlenie błędu walidacji
- `401` → Redirect do `/login`
- `409` → Wyświetlenie "Talia o tej nazwie już istnieje"
- `500` → Wyświetlenie ogólnego komunikatu błędu

## 8. Interakcje użytkownika

| Interakcja               | Komponent        | Akcja                                  |
| ------------------------ | ---------------- | -------------------------------------- |
| Kliknięcie logo          | AppHeader        | Nawigacja do `/dashboard`              |
| Kliknięcie avatara       | UserDropdownMenu | Otwarcie menu                          |
| "Ustawienia" w menu      | UserDropdownMenu | Nawigacja do `/settings`               |
| "Wyloguj" w menu         | UserDropdownMenu | Supabase signOut → redirect `/login`   |
| Kliknięcie "Do powtórki" | DueReviewTile    | Nawigacja do `/study`                  |
| Kliknięcie "Nowa talia"  | CreateDeckTile   | Otwarcie `CreateDeckModal`             |
| Kliknięcie kafelka talii | DeckTile         | Nawigacja do `/decks/{id}`             |
| "Utwórz pierwszą talię"  | EmptyState       | Otwarcie `CreateDeckModal`             |
| Wpisanie nazwy w modalu  | CreateDeckModal  | Aktualizacja stanu `name`              |
| "Utwórz" w modalu        | CreateDeckModal  | POST /api/decks → zamknięcie → refetch |
| "Anuluj" w modalu        | CreateDeckModal  | Zamknięcie modalu                      |
| Kliknięcie poza modalem  | CreateDeckModal  | Zamknięcie modalu                      |
| Escape w modalu          | CreateDeckModal  | Zamknięcie modalu                      |

## 9. Warunki i walidacja

### 9.1 Warunki wyświetlania komponentów

| Warunek              | Komponent        | Zachowanie                 |
| -------------------- | ---------------- | -------------------------- |
| `isLoading === true` | DashboardContent | Wyświetla skeleton/spinner |
| `error !== null`     | DashboardContent | Wyświetla Alert z błędem   |
| `totalDue > 0`       | DueReviewTile    | Wyświetla kafelek          |
| `totalDue === 0`     | DueReviewTile    | Ukrywa kafelek             |
| `hasDecks === true`  | DeckGrid         | Wyświetla siatkę talii     |
| `hasDecks === false` | EmptyState       | Wyświetla pusty stan       |

### 9.2 Walidacja formularza tworzenia talii

| Pole   | Warunek               | Komunikat błędu                               |
| ------ | --------------------- | --------------------------------------------- |
| `name` | Wymagane (min 1 znak) | "Nazwa talii jest wymagana"                   |
| `name` | Max 100 znaków        | "Nazwa może mieć maksymalnie 100 znaków"      |
| `name` | Unikalność            | "Talia o tej nazwie już istnieje" (z API 409) |

### 9.3 Walidacja przycisków

| Przycisk                  | Warunek aktywności                                       |
| ------------------------- | -------------------------------------------------------- |
| "Utwórz" w modalu         | `name.length > 0 && name.length <= 100 && !isSubmitting` |
| "Utwórz" w modalu (tekst) | `isSubmitting ? "Tworzenie..." : "Utwórz"`               |

## 10. Obsługa błędów

### 10.1 Błędy sieciowe (fetch failed)

- **Komponent:** `DashboardContent`
- **Obsługa:** Wyświetlenie `Alert` z komunikatem "Nie udało się załadować danych. Sprawdź połączenie i odśwież stronę."
- **Akcja:** Przycisk "Spróbuj ponownie" wywołujący `refetch()`

### 10.2 Błąd 401 (Unauthorized)

- **Komponent:** `useDashboard` hook
- **Obsługa:** Przekierowanie do `/login?redirect=/dashboard`
- **Implementacja:** `window.location.href = '/login?redirect=/dashboard'`

### 10.3 Błąd 409 (Duplicate deck)

- **Komponent:** `CreateDeckModal`
- **Obsługa:** Wyświetlenie komunikatu pod polem input
- **Komunikat:** "Talia o tej nazwie już istnieje. Wybierz inną nazwę."

### 10.4 Błąd 500 (Server error)

- **Komponent:** `DashboardContent` lub `CreateDeckModal`
- **Obsługa:** Wyświetlenie ogólnego komunikatu
- **Komunikat:** "Wystąpił błąd serwera. Spróbuj ponownie później."

### 10.5 Błąd walidacji 400

- **Komponent:** `CreateDeckModal`
- **Obsługa:** Parsowanie `details` z odpowiedzi i wyświetlenie przy odpowiednim polu
- **Przykład:** `details.name[0]` → wyświetlenie pod polem nazwy

## 11. Kroki implementacji

### Faza 1: Struktura i layout

1. **Utwórz `DashboardLayout.astro`**
   - Skopiuj strukturę z `LoginLayout.astro`
   - Zmień tytuł na "Dashboard - Flashcards AI"
   - Dodaj slot na główną zawartość
   - Zaimportuj globalne style

2. **Utwórz stronę `dashboard.astro`**
   - Dodaj sprawdzenie sesji w frontmatter
   - Implementuj redirect do `/login` gdy brak sesji
   - Użyj `DashboardLayout`

3. **Zainstaluj wymagane komponenty shadcn/ui**
   ```bash
   npx shadcn@latest add dropdown-menu
   npx shadcn@latest add dialog
   ```

### Faza 2: Komponenty nagłówka

4. **Utwórz `AppHeader.tsx`**
   - Implementuj logo jako link
   - Dodaj kontener na `UserDropdownMenu`
   - Styluj z Tailwind (sticky, tło, padding)

5. **Utwórz `UserDropdownMenu.tsx`**
   - Użyj `Avatar` z inicjałami email
   - Implementuj dropdown z opcjami
   - Dodaj obsługę wylogowania (Supabase signOut)

### Faza 3: Hook i pobieranie danych

6. **Utwórz typy w `src/components/dashboard/types.ts`**
   - Zdefiniuj wszystkie interfejsy ViewModel i Props

7. **Utwórz hook `useDashboard.ts`**
   - Implementuj równoległe wywołania API
   - Dodaj mapowanie na `DashboardViewModel`
   - Obsłuż stany loading, error, data
   - Dodaj funkcję `refetch`

### Faza 4: Komponenty kafelków

8. **Utwórz `DueReviewTile.tsx`**
   - Użyj komponentu `Card`
   - Dodaj ikonę i licznik
   - Implementuj nawigację do `/study`

9. **Utwórz `CreateDeckTile.tsx`**
   - Styluj jako wyróżniony CTA
   - Dodaj ikonę Plus
   - Implementuj callback `onClick`

10. **Utwórz `DeckTile.tsx`**
    - Wyświetl nazwę i statystyki
    - Implementuj link do `/decks/{id}`
    - Dodaj wyróżnienie dla `due_flashcards > 0`

11. **Utwórz `DeckGrid.tsx`**
    - Implementuj responsywny grid
    - Mapuj `decks` na `DeckTile`

### Faza 5: Stany specjalne

12. **Utwórz `EmptyState.tsx`**
    - Dodaj ilustrację/ikonę
    - Implementuj komunikat powitalny
    - Dodaj przycisk CTA

13. **Utwórz `CreateDeckModal.tsx`**
    - Użyj komponentu `Dialog` z shadcn/ui
    - Implementuj formularz z walidacją
    - Dodaj obsługę API POST /api/decks
    - Obsłuż błędy (400, 409, 500)

### Faza 6: Integracja główna

14. **Utwórz `DashboardContent.tsx`**
    - Użyj hooka `useDashboard`
    - Renderuj skeleton podczas ładowania
    - Renderuj Alert przy błędzie
    - Renderuj kafelki warunkowo
    - Zarządzaj stanem modalu

15. **Podłącz w `dashboard.astro`**
    - Przekaż email użytkownika do layoutu
    - Użyj `client:load` dla `DashboardContent`

### Faza 7: Testy i poprawki

16. **Testy manualne**
    - Sprawdź wszystkie interakcje
    - Przetestuj responsywność
    - Zweryfikuj obsługę błędów
    - Sprawdź dostępność (keyboard navigation, ARIA)

17. **Poprawki i optymalizacje**
    - Dodaj `aria-label` gdzie potrzeba
    - Upewnij się o poprawnej kolejności fokusa
    - Zoptymalizuj re-rendery (memo, useCallback)
