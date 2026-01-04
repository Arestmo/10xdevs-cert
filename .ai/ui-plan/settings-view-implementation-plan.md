# Plan implementacji widoku Ustawień (`/settings`)

## 1. Przegląd

Widok ustawień (`/settings`) umożliwia zalogowanemu użytkownikowi zarządzanie swoim kontem. Strona prezentuje:

- Informacje o koncie (adres email)
- Status limitu generowania fiszek AI (wykorzystane/dostępne z datą resetu)
- Sekcję usuwania konta z dwuetapowym dialogiem potwierdzenia

Jest to strona chroniona wymagająca autentykacji. Realizuje wymagania historyjek US-005 (usuwanie konta zgodne z RODO) oraz US-043 (dostęp do ustawień konta).

## 2. Routing widoku

**Ścieżka:** `/settings`

**Typ strony:** Chroniona (wymaga autentykacji)

**Przekierowanie:** Niezalogowani użytkownicy są przekierowywani do `/login?redirect=/settings`

## 3. Struktura komponentów

```
SettingsPage (Astro)
├── DashboardLayout
│   ├── AppHeader
│   │   └── UserDropdownMenu
│   └── Main Content
│       ├── BackButton (powrót do dashboardu)
│       └── SettingsContent (React, client:load)
│           ├── AccountInfo
│           ├── AILimitStatus
│           │   └── Progress (shadcn/ui)
│           └── DeleteAccountSection
│               ├── DeleteAccountButton
│               └── DeleteAccountDialog (AlertDialog)
│                   ├── WarningStep (krok 1)
│                   └── ConfirmationStep (krok 2)
```

## 4. Szczegóły komponentów

### 4.1 SettingsPage (`src/pages/settings.astro`)

- **Opis:** Strona Astro obsługująca routing i autentykację. Renderuje layout dashboardu z zawartością ustawień.
- **Główne elementy:**
  - Import `DashboardLayout`
  - Sprawdzenie autentykacji przez `Astro.locals.supabase.auth.getUser()`
  - Przekierowanie do logowania jeśli brak autentykacji
  - Slot z komponentem `SettingsContent`
- **Obsługiwane interakcje:** Brak (strona statyczna)
- **Obsługiwana walidacja:** Weryfikacja autentykacji użytkownika
- **Typy:** Brak dodatkowych typów
- **Propsy:** Brak

### 4.2 SettingsContent (`src/components/settings/SettingsContent.tsx`)

- **Opis:** Główny komponent React zarządzający stanem widoku ustawień. Pobiera dane profilu przez hook `useSettings` i renderuje sekcje ustawień.
- **Główne elementy:**
  - Wrapper `div` z klasami spacing
  - Nagłówek strony z tytułem "Ustawienia"
  - Przycisk powrotu do dashboardu (`BackButton`)
  - Komponenty `AccountInfo`, `AILimitStatus`, `DeleteAccountSection`
  - Stany ładowania i błędów
- **Obsługiwane interakcje:**
  - Kliknięcie "Wróć do dashboardu" → nawigacja do `/dashboard`
  - Obsługa refetch przy błędach
- **Obsługiwana walidacja:** Brak bezpośredniej walidacji
- **Typy:**
  - `SettingsViewModel` (dane z hooka)
  - `UseSettingsReturn` (return type hooka)
- **Propsy:** Brak (komponent pobiera dane wewnętrznie)

### 4.3 AccountInfo (`src/components/settings/AccountInfo.tsx`)

- **Opis:** Sekcja wyświetlająca podstawowe informacje o koncie użytkownika (email). Wykorzystuje komponenty Card z shadcn/ui.
- **Główne elementy:**
  - `Card` z `CardHeader` i `CardContent`
  - `CardTitle`: "Informacje o koncie"
  - Wiersz z etykietą "Email" i wartością emaila użytkownika
- **Obsługiwane interakcje:** Brak (tylko wyświetlanie)
- **Obsługiwana walidacja:** Brak
- **Typy:** `AccountInfoProps`
- **Propsy:**
  - `email: string` - adres email użytkownika

### 4.4 AILimitStatus (`src/components/settings/AILimitStatus.tsx`)

- **Opis:** Sekcja prezentująca status limitu generowania fiszek AI. Pokazuje wykorzystanie (X/200), pasek postępu oraz datę resetu limitu.
- **Główne elementy:**
  - `Card` z `CardHeader` i `CardContent`
  - `CardTitle`: "Limit fiszek AI"
  - `CardDescription`: krótki opis funkcji
  - Tekstowy wskaźnik: "Wykorzystano: X / 200 fiszek w tym miesiącu"
  - Komponent `Progress` z shadcn/ui (wartość procentowa)
  - Tekstowa informacja o dacie resetu: "Limit odnowi się: DD.MM.YYYY"
- **Obsługiwane interakcje:** Brak (tylko wyświetlanie)
- **Obsługiwana walidacja:** Brak
- **Typy:** `AILimitStatusProps`
- **Propsy:**
  - `usedCount: number` - liczba wykorzystanych fiszek AI
  - `totalLimit: number` - całkowity limit (200)
  - `resetDate: string` - data resetu w formacie ISO (YYYY-MM-DD)

### 4.5 DeleteAccountSection (`src/components/settings/DeleteAccountSection.tsx`)

- **Opis:** Sekcja z ostrzeżeniem i przyciskiem do usuwania konta. Zarządza stanem otwarcia dialogu potwierdzenia.
- **Główne elementy:**
  - `Card` z `CardHeader` i `CardContent` (wariant destructive/ostrzegawczy)
  - `CardTitle`: "Strefa niebezpieczna"
  - `CardDescription`: ostrzeżenie o nieodwracalności
  - Przycisk "Usuń konto" (wariant destructive)
  - Komponent `DeleteAccountDialog`
- **Obsługiwane interakcje:**
  - Kliknięcie "Usuń konto" → otwarcie dialogu
- **Obsługiwana walidacja:** Brak
- **Typy:** `DeleteAccountSectionProps`
- **Propsy:**
  - `onDeleteSuccess: () => void` - callback po pomyślnym usunięciu

### 4.6 DeleteAccountDialog (`src/components/settings/DeleteAccountDialog.tsx`)

- **Opis:** Dwuetapowy dialog potwierdzenia usunięcia konta. Krok 1: ostrzeżenie. Krok 2: pole do wpisania "DELETE".
- **Główne elementy:**
  - `AlertDialog` z shadcn/ui jako kontener
  - **Krok 1 (warning):**
    - `AlertDialogHeader` z tytułem "Czy na pewno chcesz usunąć konto?"
    - `AlertDialogDescription` z listą konsekwencji (talie, fiszki, logi, parametry FSRS)
    - `AlertDialogFooter` z przyciskami "Anuluj" i "Kontynuuj"
  - **Krok 2 (confirmation):**
    - `AlertDialogHeader` z tytułem "Potwierdź usunięcie"
    - Instrukcja: wpisz "DELETE" aby potwierdzić
    - `Input` do wpisania tekstu potwierdzenia
    - Komunikat błędu walidacji (jeśli tekst niepoprawny)
    - Komunikat błędu API (jeśli usunięcie się nie powiodło)
    - `AlertDialogFooter` z "Anuluj" i "Potwierdź usunięcie" (disabled gdy tekst !== "DELETE")
- **Obsługiwane interakcje:**
  - Kliknięcie "Anuluj" → zamknięcie dialogu, reset stanu
  - Kliknięcie "Kontynuuj" (krok 1) → przejście do kroku 2
  - Wpisywanie tekstu → aktualizacja stanu, walidacja
  - Kliknięcie "Potwierdź usunięcie" → wywołanie API, obsługa sukcesu/błędu
  - Zamknięcie dialogu (ESC, klik poza) → reset stanu
- **Obsługiwana walidacja:**
  - Tekst potwierdzenia musi być dokładnie "DELETE" (case-sensitive)
  - Przycisk "Potwierdź usunięcie" aktywny tylko gdy walidacja przejdzie
- **Typy:** `DeleteAccountDialogProps`, `DialogStep`
- **Propsy:**
  - `isOpen: boolean` - czy dialog jest otwarty
  - `onOpenChange: (open: boolean) => void` - callback zmiany stanu otwarcia
  - `onSuccess: () => void` - callback po pomyślnym usunięciu

## 5. Typy

### 5.1 Typy z API (istniejące w `src/types.ts`)

```typescript
// Odpowiedź z GET /api/profile
interface ProfileResponseDTO extends Profile {
  remaining_ai_limit: number;
}

// Profile z bazy danych
interface Profile {
  user_id: string;
  monthly_ai_flashcards_count: number;
  ai_limit_reset_date: string;
  created_at: string;
  updated_at: string;
}

// Żądanie DELETE /api/account
interface DeleteAccountRequestDTO {
  confirmation: string;
}

// Odpowiedź DELETE /api/account
interface DeleteAccountResponseDTO {
  message: string;
}
```

### 5.2 Nowe typy ViewModel (`src/components/settings/types.ts`)

```typescript
/**
 * ViewModel dla widoku ustawień
 * Transformacja ProfileResponseDTO (snake_case → camelCase)
 */
export interface SettingsViewModel {
  /** Email użytkownika (z sesji auth) */
  email: string;
  /** Liczba wygenerowanych fiszek AI w tym miesiącu */
  usedAIFlashcards: number;
  /** Pozostały limit fiszek AI */
  remainingAILimit: number;
  /** Całkowity miesięczny limit (200) */
  totalAILimit: number;
  /** Data resetu limitu (format YYYY-MM-DD) */
  aiLimitResetDate: string;
}

/**
 * Stan hooka useSettings
 */
export interface UseSettingsState {
  data: SettingsViewModel | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Return type hooka useSettings
 */
export interface UseSettingsReturn extends UseSettingsState {
  /** Funkcja do ponownego pobrania danych */
  refetch: () => Promise<void>;
  /** Funkcja do usunięcia konta */
  deleteAccount: (confirmation: string) => Promise<DeleteAccountResult>;
}

/**
 * Wynik operacji usunięcia konta
 */
export interface DeleteAccountResult {
  success: boolean;
  error?: string;
}

/**
 * Krok w dialogu usuwania konta
 */
export type DialogStep = "warning" | "confirmation";

/**
 * Props dla AccountInfo
 */
export interface AccountInfoProps {
  email: string;
}

/**
 * Props dla AILimitStatus
 */
export interface AILimitStatusProps {
  usedCount: number;
  totalLimit: number;
  resetDate: string;
}

/**
 * Props dla DeleteAccountSection
 */
export interface DeleteAccountSectionProps {
  onDeleteSuccess: () => void;
}

/**
 * Props dla DeleteAccountDialog
 */
export interface DeleteAccountDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}
```

## 6. Zarządzanie stanem

### 6.1 Hook `useSettings` (`src/components/hooks/useSettings.ts`)

Hook zarządzający pobieraniem danych profilu i operacją usuwania konta.

**Stan wewnętrzny:**

- `data: SettingsViewModel | null` - dane profilu
- `isLoading: boolean` - stan ładowania
- `error: string | null` - komunikat błędu

**Funkcje:**

- `fetchProfile()` - pobiera dane z `GET /api/profile`, transformuje do ViewModel
- `deleteAccount(confirmation: string)` - wysyła `DELETE /api/account`, zwraca wynik
- `refetch()` - ponownie pobiera dane profilu

**Przepływ:**

1. Przy montowaniu komponentu wywołuje `fetchProfile()`
2. Transformuje `ProfileResponseDTO` do `SettingsViewModel`
3. W przypadku błędu 401 → przekierowanie do `/login`
4. W przypadku innych błędów → ustawia `error`

**Uwaga o email:** Email użytkownika nie jest częścią `ProfileResponseDTO`. Należy go pobrać z sesji auth w komponencie Astro i przekazać jako prop do `SettingsContent`, lub pobrać przez `supabaseClient.auth.getUser()` w hooku.

### 6.2 Stan w `DeleteAccountDialog`

**Stan lokalny:**

- `step: DialogStep` - aktualny krok ('warning' | 'confirmation')
- `confirmationText: string` - tekst wpisany przez użytkownika
- `isDeleting: boolean` - czy trwa usuwanie
- `deleteError: string | null` - błąd z API

**Reset stanu:** Przy zamknięciu dialogu wszystkie stany wracają do wartości początkowych.

## 7. Integracja API

### 7.1 GET /api/profile

**Wywołanie:** Przy montowaniu `SettingsContent`

**Żądanie:**

```http
GET /api/profile
Authorization: Bearer <token> (automatycznie przez cookies)
```

**Odpowiedź sukcesu (200):**

```json
{
  "user_id": "uuid",
  "monthly_ai_flashcards_count": 45,
  "ai_limit_reset_date": "2024-12-01",
  "remaining_ai_limit": 155,
  "created_at": "2024-11-15T10:30:00Z",
  "updated_at": "2024-12-05T14:20:00Z"
}
```

**Transformacja do ViewModel:**

```typescript
const viewModel: SettingsViewModel = {
  email: userEmail, // z sesji lub props
  usedAIFlashcards: profile.monthly_ai_flashcards_count,
  remainingAILimit: profile.remaining_ai_limit,
  totalAILimit: 200,
  aiLimitResetDate: profile.ai_limit_reset_date,
};
```

**Obsługa błędów:**

- 401 → przekierowanie do `/login?redirect=/settings`
- 404 → wyświetlenie komunikatu "Profil nie znaleziony"
- 500 → wyświetlenie komunikatu z opcją retry

### 7.2 DELETE /api/account

**Wywołanie:** Po kliknięciu "Potwierdź usunięcie" w dialogu

**Żądanie:**

```http
DELETE /api/account
Content-Type: application/json

{
  "confirmation": "DELETE"
}
```

**UWAGA:** Istniejący endpoint używa `"DELETE"` jako tekstu potwierdzenia (nie `"USUŃ"` jak w specyfikacji PRD). UI musi używać `"DELETE"`.

**Odpowiedź sukcesu (200):**

```json
{
  "message": "Account successfully deleted"
}
```

**Po sukcesie:**

1. Wyświetlenie komunikatu o usunięciu (opcjonalnie)
2. Przekierowanie do `/login`

**Obsługa błędów:**

- 400 → wyświetlenie błędu "Nieprawidłowe potwierdzenie"
- 401 → przekierowanie do `/login`
- 500 → wyświetlenie błędu "Nie udało się usunąć konta. Spróbuj ponownie."

## 8. Interakcje użytkownika

| Interakcja                       | Element                    | Oczekiwany rezultat                    |
| -------------------------------- | -------------------------- | -------------------------------------- |
| Kliknięcie "Wróć do dashboardu"  | BackButton                 | Nawigacja do `/dashboard`              |
| Kliknięcie "Usuń konto"          | DeleteAccountSection       | Otwarcie dialogu (krok 1 - warning)    |
| Kliknięcie "Anuluj" w dialogu    | AlertDialogCancel          | Zamknięcie dialogu, reset stanu        |
| Kliknięcie "Kontynuuj"           | AlertDialogAction (krok 1) | Przejście do kroku 2                   |
| Wpisanie tekstu                  | Input (krok 2)             | Aktualizacja stanu, walidacja          |
| Kliknięcie "Potwierdź usunięcie" | AlertDialogAction (krok 2) | Wywołanie API, spinner, obsługa wyniku |
| Naciśnięcie ESC                  | Dialog                     | Zamknięcie dialogu                     |
| Kliknięcie overlay               | Dialog                     | Zamknięcie dialogu                     |

## 9. Warunki i walidacja

### 9.1 Walidacja tekstu potwierdzenia

**Warunek:** Tekst wpisany przez użytkownika musi być dokładnie `"DELETE"` (case-sensitive)

**Wpływ na UI:**

- Przycisk "Potwierdź usunięcie" jest `disabled` gdy `confirmationText !== "DELETE"`
- Opcjonalnie: komunikat walidacji pod polem input gdy tekst niepusty ale niepoprawny

**Komponent:** `DeleteAccountDialog`

### 9.2 Walidacja autentykacji

**Warunek:** Użytkownik musi być zalogowany

**Wpływ na UI:**

- Strona Astro przekierowuje do `/login` przed renderowaniem
- Hook przekierowuje do `/login` przy błędzie 401

**Komponent:** `SettingsPage`, `useSettings`

## 10. Obsługa błędów

### 10.1 Błąd pobierania profilu

**Scenariusz:** `GET /api/profile` zwraca błąd

**Obsługa:**

- Wyświetlenie komponentu `Alert` z komunikatem błędu
- Przycisk "Spróbuj ponownie" wywołujący `refetch()`

**Komunikaty:**

- 401: Przekierowanie (brak komunikatu)
- 404: "Nie znaleziono profilu użytkownika"
- 500/sieć: "Nie udało się załadować danych. Sprawdź połączenie i spróbuj ponownie."

### 10.2 Błąd usuwania konta

**Scenariusz:** `DELETE /api/account` zwraca błąd

**Obsługa:**

- Wyświetlenie komunikatu błędu w dialogu (pod inputem)
- Dialog pozostaje otwarty
- Użytkownik może spróbować ponownie

**Komunikaty:**

- 400: "Nieprawidłowy tekst potwierdzenia"
- 401: Przekierowanie do `/login`
- 500/sieć: "Nie udało się usunąć konta. Spróbuj ponownie."

### 10.3 Błąd sieci

**Scenariusz:** Brak połączenia z internetem

**Obsługa:**

- Wyświetlenie ogólnego komunikatu o problemie z połączeniem
- Opcja retry dla operacji pobierania danych

## 11. Kroki implementacji

### Krok 1: Utworzenie struktury plików

Utworzyć następujące pliki:

- `src/pages/settings.astro`
- `src/components/settings/SettingsContent.tsx`
- `src/components/settings/AccountInfo.tsx`
- `src/components/settings/AILimitStatus.tsx`
- `src/components/settings/DeleteAccountSection.tsx`
- `src/components/settings/DeleteAccountDialog.tsx`
- `src/components/settings/types.ts`
- `src/components/hooks/useSettings.ts`

### Krok 2: Implementacja typów

Utworzyć plik `src/components/settings/types.ts` z definicjami:

- `SettingsViewModel`
- `UseSettingsState`
- `UseSettingsReturn`
- `DeleteAccountResult`
- `DialogStep`
- Props dla wszystkich komponentów

### Krok 3: Implementacja hooka useSettings

Utworzyć `src/components/hooks/useSettings.ts`:

1. Zdefiniować stan: `data`, `isLoading`, `error`
2. Zaimplementować `fetchProfile()` z transformacją DTO → ViewModel
3. Zaimplementować `deleteAccount(confirmation)` z obsługą błędów
4. Wywołać `fetchProfile` w `useEffect` przy montowaniu
5. Zwrócić `{ data, isLoading, error, refetch, deleteAccount }`

### Krok 4: Implementacja komponentu AccountInfo

Utworzyć prosty komponent wyświetlający:

- Card z tytułem "Informacje o koncie"
- Wiersz: "Email: {email}"

### Krok 5: Implementacja komponentu AILimitStatus

Utworzyć komponent z:

- Card z tytułem "Limit fiszek AI"
- Tekst: "Wykorzystano: X / 200 fiszek w tym miesiącu"
- Komponent Progress z wartością `(usedCount / totalLimit) * 100`
- Tekst: "Limit odnowi się: {formatDate(resetDate)}"

Dodać funkcję formatowania daty ISO → DD.MM.YYYY.

### Krok 6: Implementacja DeleteAccountDialog

Utworzyć komponent z dwuetapowym flow:

1. Stan: `step`, `confirmationText`, `isDeleting`, `deleteError`
2. Krok 1 (warning): ostrzeżenie + przyciski Anuluj/Kontynuuj
3. Krok 2 (confirmation): input + walidacja + przyciski Anuluj/Potwierdź
4. Logika walidacji tekstu "DELETE"
5. Wywołanie API przez props `onSuccess` przekazujące funkcję z hooka
6. Reset stanu przy zamknięciu

### Krok 7: Implementacja DeleteAccountSection

Utworzyć komponent z:

- Card (wariant ostrzegawczy - czerwone/pomarańczowe tło)
- Tytuł "Strefa niebezpieczna"
- Opis konsekwencji usunięcia
- Przycisk "Usuń konto" (variant destructive)
- Zarządzanie stanem `isDialogOpen`
- Renderowanie `DeleteAccountDialog`

### Krok 8: Implementacja SettingsContent

Złożyć wszystkie komponenty:

1. Użyć hooka `useSettings`
2. Obsłużyć stany: loading, error, success
3. Renderować sekcje: AccountInfo, AILimitStatus, DeleteAccountSection
4. Przekazać callback `deleteAccount` do DeleteAccountSection
5. Po pomyślnym usunięciu → przekierowanie do `/login`

### Krok 9: Implementacja strony Astro

Utworzyć `src/pages/settings.astro`:

1. Sprawdzić autentykację
2. Przekierować do `/login` jeśli brak sesji
3. Pobrać email z `user.email`
4. Renderować `DashboardLayout` z `SettingsContent`
5. Przekazać email jako prop (lub pobrać w hooku)

### Krok 10: Aktualizacja tytułu strony

W `DashboardLayout` lub dedykowanym `SettingsLayout`:

- Tytuł strony: "Ustawienia - Flashcards AI"

### Krok 11: Testy manualne

Przetestować:

1. Nawigacja z dropdown menu → /settings
2. Wyświetlanie danych profilu (email, limit AI)
3. Flow usuwania konta (oba kroki)
4. Walidacja tekstu "DELETE"
5. Obsługa błędów (symulacja 401, 500)
6. Responsywność na różnych breakpointach
7. Dostępność (focus trap w dialogu, etykiety ARIA)

### Krok 12: Dostępność i finalizacja

Upewnić się, że:

- Dialog ma `aria-modal="true"` i `role="dialog"`
- Focus trap działa w dialogu
- Przycisk powrotu do dashboardu jest widoczny i dostępny
- Komunikaty błędów są czytelne dla czytników ekranu
- Kontrast kolorów spełnia WCAG 2.1 AA
