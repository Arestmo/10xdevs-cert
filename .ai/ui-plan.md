# Architektura UI dla Flashcards AI

## 1. Przegląd struktury UI

Flashcards AI to aplikacja webowa do tworzenia i nauki fiszek edukacyjnych z wykorzystaniem AI. Interfejs zaprojektowano zgodnie z podejściem mobile-first, z minimalistycznym designem skoncentrowanym na dwóch głównych przepływach: tworzeniu fiszek (AI i manualne) oraz nauce z algorytmem FSRS.

### Założenia architektoniczne

- **Stack**: Astro 5 (SSR) + React 19 + TypeScript + Tailwind CSS 4 + Shadcn/ui
- **Język interfejsu**: Polski
- **Responsywność**: Mobile-first z breakpointami <640px, 640-1024px, >1024px
- **Autentykacja**: Supabase Auth (Google OAuth + Magic Link)
- **Stan aplikacji**: React hooks dla stanu lokalnego, Astro SSR dla początkowego ładowania danych

### Struktura nawigacyjna

```
/login                    - Strona logowania (publiczna)
/dashboard                - Dashboard użytkownika (chroniona)
/decks/{deckId}           - Widok pojedynczej talii (chroniona)
/study                    - Sesja nauki ze wszystkich talii (chroniona)
/study/{deckId}           - Sesja nauki z pojedynczej talii (chroniona)
/settings                 - Ustawienia konta (chroniona)
/privacy                  - Polityka prywatności (publiczna)
/terms                    - Regulamin (publiczna)
```

---

## 2. Lista widoków

### 2.1 Strona logowania (`/login`)

**Główny cel**: Umożliwienie użytkownikom zalogowania się do aplikacji.

**Kluczowe informacje**:

- Logo aplikacji
- Opcje logowania (Google OAuth, Magic Link)
- Linki do dokumentów prawnych

**Kluczowe komponenty**:

| Komponent           | Opis                                         | Typ             |
| ------------------- | -------------------------------------------- | --------------- |
| `LoginPage`         | Główny kontener strony logowania             | Astro Page      |
| `GoogleOAuthButton` | Przycisk logowania przez Google (główny CTA) | React Component |
| `MagicLinkForm`     | Formularz wysyłania magic link               | React Component |
| `LegalLinks`        | Linki do regulaminu i polityki prywatności   | Astro Component |

**Wymagania UX**:

- Minimalistyczny design bez rozpraszaczy
- Przycisk Google OAuth jako główne CTA (wyróżniony wizualnie)
- Opcja Magic Link jako alternatywa (mniej wyróżniona)
- Komunikat o wysłaniu linku po wypełnieniu formularza email

**Dostępność**:

- Focus visible na wszystkich interaktywnych elementach
- Prawidłowe etykiety ARIA dla formularzy
- Kontrast kolorów zgodny z WCAG 2.1 AA

**Bezpieczeństwo**:

- Walidacja adresu email po stronie klienta i serwera
- CSRF protection przez Supabase
- Rate limiting na wysyłanie magic linków

**Mapowanie historyjek**: US-001, US-002, US-003

---

### 2.2 Dashboard (`/dashboard`)

**Główny cel**: Centralny hub aplikacji z przeglądem materiałów i szybkim dostępem do głównych funkcji.

**Kluczowe informacje**:

- Liczba fiszek do powtórki
- Lista talii użytkownika
- Status AI limitu (opcjonalnie w UI)

**Kluczowe komponenty**:

| Komponent          | Opis                                      | Typ             |
| ------------------ | ----------------------------------------- | --------------- |
| `DashboardPage`    | Główny kontener z layoutem                | Astro Page      |
| `AppHeader`        | Nagłówek z logo i menu użytkownika        | React Component |
| `UserDropdownMenu` | Dropdown z opcjami Ustawienia/Wyloguj     | React Component |
| `DueReviewTile`    | Kafelek "Do powtórki: X"                  | React Component |
| `CreateDeckTile`   | Kafelek CTA "Nowa talia / Generuj fiszki" | React Component |
| `DeckGrid`         | Grid z kafelkami talii                    | React Component |
| `DeckTile`         | Pojedynczy kafelek talii                  | React Component |
| `EmptyState`       | Pusty stan dla nowych użytkowników        | React Component |
| `GenerationModal`  | Modal generowania AI                      | React Component |

**Wymagania UX**:

- Layout kafelkowy responsywny (1/2/3-4 kolumny)
- Kafelek "Do powtórki" ukryty gdy 0 fiszek
- Pusty stan z CTA "Utwórz pierwszą talię" dla nowych użytkowników
- Kliknięcie kafelka talii otwiera widok talii
- Kliknięcie "Do powtórki" rozpoczyna sesję nauki

**Dostępność**:

- Kafelki jako interaktywne elementy z `role="button"` lub jako linki
- `aria-label` dla kafelków z dodatkowymi informacjami
- Keyboard navigation między kafelkami
- `aria-live` dla dynamicznych aktualizacji liczby fiszek

**Bezpieczeństwo**:

- Strona chroniona - wymaga autentykacji
- Dane ładowane tylko dla zalogowanego użytkownika (RLS)

**Mapowanie historyjek**: US-006, US-021, US-022, US-030, US-040, US-041, US-042

**Integracja z API**:

- `GET /api/decks` - lista talii
- `GET /api/study/summary` - liczba fiszek do powtórki
- `POST /api/decks` - tworzenie nowej talii

---

### 2.3 Widok talii (`/decks/{deckId}`)

**Główny cel**: Zarządzanie pojedynczą talią i jej fiszkami.

**Kluczowe informacje**:

- Nazwa talii (edytowalna inline)
- Liczba fiszek w talii
- Liczba fiszek do powtórki w tej talii
- Lista fiszek z podglądem

**Kluczowe komponenty**:

| Komponent                | Opis                                            | Typ             |
| ------------------------ | ----------------------------------------------- | --------------- |
| `DeckPage`               | Główny kontener widoku talii                    | Astro Page      |
| `DeckHeader`             | Nagłówek z nazwą talii i akcjami                | React Component |
| `InlineEditField`        | Edytowalne pole nazwy talii                     | React Component |
| `DeckActions`            | Przyciski akcji (Ucz się, Generuj, Dodaj, Usuń) | React Component |
| `FlashcardList`          | Lista fiszek z accordion                        | React Component |
| `FlashcardAccordionItem` | Pojedyncza fiszka z rozwinięciem                | React Component |
| `FlashcardForm`          | Formularz tworzenia/edycji fiszki               | React Component |
| `DeleteDeckDialog`       | Dialog potwierdzenia usunięcia talii            | React Component |
| `DeleteFlashcardDialog`  | Dialog potwierdzenia usunięcia fiszki           | React Component |

**Wymagania UX**:

- Inline editing nazwy talii (Enter/Escape lub przyciski Save/Cancel)
- Przycisk "Ucz się (X)" pokazujący liczbę due flashcards
- Lista fiszek z accordion pattern (pierwsze ~50 znaków, rozwijane)
- Rozwinięta fiszka pokazuje przód/tył + przyciski Edytuj/Usuń
- Dialog potwierdzenia przed usunięciem talii/fiszki

**Dostępność**:

- Accordion z `aria-expanded` i `aria-controls`
- Focus trap w dialogach
- Keyboard shortcuts (Enter/Escape dla inline edit)
- `aria-describedby` dla pól formularza z walidacją

**Bezpieczeństwo**:

- Weryfikacja własności talii (RLS + sprawdzenie w API)
- Walidacja danych wejściowych (front: max 200, back: max 500 znaków)

**Mapowanie historyjek**: US-018, US-019, US-023, US-024, US-025, US-026, US-027, US-028, US-029, US-032

**Integracja z API**:

- `GET /api/decks/{deckId}` - dane talii
- `PATCH /api/decks/{deckId}` - aktualizacja nazwy
- `DELETE /api/decks/{deckId}` - usunięcie talii
- `GET /api/flashcards?deck_id={deckId}` - lista fiszek
- `POST /api/flashcards` - tworzenie fiszki
- `PATCH /api/flashcards/{flashcardId}` - edycja fiszki
- `DELETE /api/flashcards/{flashcardId}` - usunięcie fiszki

---

### 2.4 Modal generowania AI

**Główny cel**: Generowanie fiszek z tekstu za pomocą AI.

**Kluczowe informacje**:

- Pole tekstowe na materiał źródłowy
- Wybór talii docelowej
- Licznik pozostałego limitu AI
- Lista wygenerowanych draftów

**Kluczowe komponenty**:

| Komponent            | Opis                                  | Typ             |
| -------------------- | ------------------------------------- | --------------- |
| `GenerationModal`    | Główny modal z logiką generowania     | React Component |
| `SourceTextArea`     | Pole tekstowe z licznikiem znaków     | React Component |
| `DeckSelector`       | Dropdown wyboru talii                 | React Component |
| `AILimitIndicator`   | Wskaźnik "Pozostało: X/200"           | React Component |
| `GenerationSpinner`  | Spinner z tekstem podczas generowania | React Component |
| `DraftsList`         | Lista przewijana draftów              | React Component |
| `DraftItem`          | Pojedynczy draft z akcjami            | React Component |
| `DraftEditForm`      | Formularz inline edycji draftu        | React Component |
| `CloseConfirmDialog` | Dialog ostrzeżenia przy zamknięciu    | React Component |

**Wymagania UX**:

- Blokujący modal z możliwością zamknięcia (X, klik poza obszar)
- Pole tekstowe do 5000 znaków z licznikiem real-time
- Preselekcja talii jeśli modal otwierany z widoku talii
- Spinner z tekstem "Generowanie fiszek..." podczas ładowania
- Lista przewijana draftów z numeracją "1/15", "2/15"
- Przyciski Akceptuj/Edytuj/Odrzuć przy każdym drafcie
- Natychmiastowy zapis przy akceptacji (bez możliwości cofnięcia)
- Ostrzeżenie przy zamknięciu z nieprzetworzonymi draftami
- Przyjazny komunikat przy pustych wynikach lub błędach AI

**Dostępność**:

- Focus trap wewnątrz modalu
- `aria-modal="true"` i `role="dialog"`
- Focus na pierwszym interaktywnym elemencie przy otwarciu
- `aria-live="polite"` dla statusu generowania
- Obsługa Escape do zamknięcia

**Bezpieczeństwo**:

- Walidacja długości tekstu (max 5000 znaków)
- Sprawdzenie limitu AI przed generowaniem
- Sanityzacja tekstu wejściowego

**Mapowanie historyjek**: US-007, US-008, US-009, US-010, US-011, US-012, US-013, US-014, US-015, US-016, US-017

**Integracja z API**:

- `GET /api/profile` - sprawdzenie limitu AI
- `POST /api/generations` - generowanie draftów
- `POST /api/flashcards` - akceptacja draftu (source: "ai")
- `POST /api/generations/{generationId}/reject` - odrzucenie draftu

---

### 2.5 Sesja nauki (`/study` lub `/study/{deckId}`)

**Główny cel**: Nauka fiszek z wykorzystaniem algorytmu FSRS.

**Kluczowe informacje**:

- Aktualna fiszka (przód/tył)
- Postęp sesji (X/Y kart)
- Przyciski oceny po odsłonięciu odpowiedzi

**Kluczowe komponenty**:

| Komponent          | Opis                                    | Typ             |
| ------------------ | --------------------------------------- | --------------- |
| `StudyPage`        | Główny kontener sesji nauki             | Astro Page      |
| `StudyHeader`      | Minimalna nawigacja (X + pasek postępu) | React Component |
| `ProgressBar`      | Pasek postępu "X/Y kart"                | React Component |
| `FlashcardDisplay` | Centralna karta fiszki                  | React Component |
| `RevealButton`     | Przycisk "Pokaż odpowiedź"              | React Component |
| `RatingButtons`    | Przyciski oceny (Again/Hard/Good/Easy)  | React Component |
| `SessionComplete`  | Ekran zakończenia sesji                 | React Component |
| `EmptyStudyState`  | Stan gdy brak fiszek do powtórki        | React Component |

**Wymagania UX**:

- Minimalna nawigacja (tylko X/zakończ i pasek postępu)
- Ukryty pełny header podczas sesji
- Centralnie wyświetlana karta z przodu
- Przycisk "Pokaż odpowiedź" odsłania tył
- 4 przyciski oceny bez pokazywania interwałów czasowych
- Automatyczny zapis po każdej ocenie
- Ekran zakończenia: "Ukończono X fiszek" + przycisk powrotu
- Możliwość przerwania sesji w dowolnym momencie (bez potwierdzenia)

**Dostępność**:

- Duże przyciski (min 44px) dla obsługi dotykowej
- Keyboard shortcuts dla ocen (1/2/3/4 lub A/H/G/E)
- Focus automatycznie na przycisku "Pokaż odpowiedź"
- `aria-live` dla aktualizacji postępu

**Bezpieczeństwo**:

- Weryfikacja własności fiszek (RLS)
- Walidacja rating (1-4)

**Mapowanie historyjek**: US-031, US-032, US-033, US-034, US-035, US-036, US-037, US-038, US-039

**Integracja z API**:

- `GET /api/study/cards` - fiszki do powtórki
- `GET /api/study/cards?deck_id={deckId}` - fiszki z konkretnej talii
- `POST /api/study/review` - wysłanie oceny

---

### 2.6 Strona ustawień (`/settings`)

**Główny cel**: Zarządzanie kontem użytkownika i preferencjami.

**Kluczowe informacje**:

- Informacje o koncie (email)
- Status limitu AI (wykorzystane/dostępne)
- Opcja usunięcia konta

**Kluczowe komponenty**:

| Komponent              | Opis                                | Typ             |
| ---------------------- | ----------------------------------- | --------------- |
| `SettingsPage`         | Główny kontener ustawień            | Astro Page      |
| `AccountInfo`          | Sekcja z informacjami o koncie      | React Component |
| `AILimitStatus`        | Status limitu AI z datą resetu      | React Component |
| `DeleteAccountSection` | Sekcja usuwania konta               | React Component |
| `DeleteAccountDialog`  | Dialog z dwuetapowym potwierdzeniem | React Component |

**Wymagania UX**:

- Prosty layout z sekcjami
- Wyraźne pokazanie wykorzystanego/pozostałego limitu AI
- Informacja o dacie resetu limitu
- Dwuetapowe usuwanie konta:
  1. Kliknięcie "Usuń konto" pokazuje ostrzeżenie
  2. Potwierdzenie przez wpisanie "USUŃ"
- Przycisk powrotu do dashboardu

**Dostępność**:

- Jasne etykiety sekcji
- Focus trap w dialogu usuwania
- Czytelne komunikaty ostrzegawcze

**Bezpieczeństwo**:

- Potwierdzenie przez wpisanie tekstu "USUŃ"
- Cascade delete wszystkich danych użytkownika
- Wylogowanie po usunięciu konta

**Mapowanie historyjek**: US-005, US-043

**Integracja z API**:

- `GET /api/profile` - informacje o koncie i limicie AI
- `DELETE /api/account` - usunięcie konta

---

### 2.7 Strony prawne (`/privacy`, `/terms`)

**Główny cel**: Informacje prawne wymagane przez RODO.

**Kluczowe informacje**:

- Pełna treść polityki prywatności / regulaminu
- Informacje kontaktowe

**Kluczowe komponenty**:

| Komponent      | Opis                                      | Typ             |
| -------------- | ----------------------------------------- | --------------- |
| `PrivacyPage`  | Strona polityki prywatności               | Astro Page      |
| `TermsPage`    | Strona regulaminu                         | Astro Page      |
| `LegalContent` | Komponent do wyświetlania treści prawnych | Astro Component |

**Wymagania UX**:

- Czytelna typografia dla długiego tekstu
- Nawigacja w treści (opcjonalnie spis treści)
- Link powrotu do poprzedniej strony lub dashboardu

**Dostępność**:

- Prawidłowa struktura nagłówków (h1, h2, h3)
- Czytelny kontrast tekstu
- Responsywne marginesy

**Bezpieczeństwo**:

- Strony publiczne (bez autentykacji)

**Mapowanie historyjek**: US-044, US-045

---

## 3. Mapa podróży użytkownika

### 3.1 Flow: Rejestracja i pierwsze użycie

```
[Niezalogowany użytkownik]
          │
          ▼
    /login (strona logowania)
          │
          ├─── Klik "Zaloguj przez Google" ───► Google OAuth ───┐
          │                                                      │
          └─── Wpisz email + "Wyślij link" ──► Email + klik ────┤
                                                                 │
                                                                 ▼
                                                        /dashboard
                                                              │
                                            [Nowy użytkownik: pusty stan]
                                                              │
                                                              ▼
                                                   Klik "Utwórz pierwszą talię"
                                                              │
                                                              ▼
                                                   Wpisz nazwę → Zapisz
                                                              │
                                                              ▼
                                              /decks/{deckId} (nowa talia)
```

### 3.2 Flow: Generowanie fiszek AI

```
/dashboard lub /decks/{deckId}
          │
          ▼
    Klik "Generuj fiszki"
          │
          ▼
    [Modal generowania AI]
          │
          ├─── 1. Wklej tekst (max 5000 znaków)
          │
          ├─── 2. Wybierz talię (preselekcja jeśli z widoku talii)
          │
          └─── 3. Klik "Generuj"
                    │
                    ▼
            [Spinner: "Generowanie fiszek..."]
                    │
                    ▼
            [Lista draftów 1/15, 2/15, ...]
                    │
          ┌─────────┼─────────┐
          ▼         ▼         ▼
      Akceptuj   Edytuj   Odrzuć
          │         │         │
          ▼         ▼         ▼
      [Zapis]   [Inline]  [Usuń z listy]
                  edit
                    │
                    ▼
              Akceptuj edytowany
                    │
                    ▼
                [Zapis]
                    │
                    ▼
    [Wszystkie drafty przetworzone → Zamknij modal]
```

### 3.3 Flow: Manualne tworzenie fiszki

```
/decks/{deckId}
          │
          ▼
    Klik "Dodaj fiszkę"
          │
          ▼
    [Formularz tworzenia]
          │
          ├─── Wpisz przód (max 200 znaków)
          │
          ├─── Wpisz tył (max 500 znaków)
          │
          └─── Klik "Zapisz"
                    │
                    ▼
            [Fiszka dodana do listy]
```

### 3.4 Flow: Sesja nauki

```
/dashboard                          /decks/{deckId}
     │                                     │
     ▼                                     ▼
Klik "Do powtórki"               Klik "Ucz się (X)"
     │                                     │
     └─────────────┬───────────────────────┘
                   │
                   ▼
            /study lub /study/{deckId}
                   │
                   ▼
    ┌──────────────────────────────┐
    │  [Przód fiszki]              │
    │                              │
    │  [Pokaż odpowiedź]           │
    └──────────────────────────────┘
                   │
                   ▼ (klik)
    ┌──────────────────────────────┐
    │  [Przód fiszki]              │
    │  ─────────────               │
    │  [Tył fiszki]                │
    │                              │
    │ [Again] [Hard] [Good] [Easy] │
    └──────────────────────────────┘
                   │
                   ▼ (ocena)
           [Następna fiszka...]
                   │
                   ▼ (wszystkie)
    ┌──────────────────────────────┐
    │  Ukończono X fiszek          │
    │                              │
    │  [Wróć do dashboardu]        │
    └──────────────────────────────┘
                   │
                   ▼
              /dashboard
```

### 3.5 Flow: Zarządzanie talią

```
/decks/{deckId}
          │
    ┌─────┼─────┬─────────────┐
    │     │     │             │
    ▼     ▼     ▼             ▼
Edytuj  Usuń  Przeglądaj   Rozwiń
nazwę  talię    listę      fiszkę
    │     │     │             │
    ▼     ▼     │             ▼
[Inline [Dialog │         [Accordion:
 edit]  potw.]  │          przód+tył]
    │     │     │             │
    ▼     ▼     │       ┌─────┼─────┐
[Zapis] [Usuń   │       ▼     ▼     ▼
        i wróć  │    Edytuj Usuń  Zwiń
        do      │       │     │
        dash]   │       ▼     ▼
                │   [Form] [Dialog]
                │       │     │
                │       ▼     ▼
                │   [Zapis] [Usuń]
```

### 3.6 Flow: Usuwanie konta

```
/settings
     │
     ▼
Klik "Usuń konto"
     │
     ▼
[Dialog: Ostrzeżenie o konsekwencjach]
     │
     ├─── Anuluj → zamknij dialog
     │
     └─── Kontynuuj
              │
              ▼
[Pole tekstowe: wpisz "USUŃ"]
              │
              ▼
Klik "Potwierdź usunięcie"
              │
              ▼
[Usunięcie konta + wylogowanie]
              │
              ▼
         /login
```

---

## 4. Układ i struktura nawigacji

### 4.1 Globalny layout aplikacji

```
┌─────────────────────────────────────────────────┐
│                   AppHeader                      │
│  ┌─────────┐                    ┌─────────────┐ │
│  │  Logo   │                    │ UserDropdown│ │
│  └─────────┘                    └─────────────┘ │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│                                                 │
│               Main Content Area                 │
│                                                 │
│                                                 │
│                                                 │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│                    Footer                        │
│         [Polityka prywatności] [Regulamin]       │
└─────────────────────────────────────────────────┘
```

### 4.2 Layout sesji nauki (zminimalizowany)

```
┌─────────────────────────────────────────────────┐
│  [X]                              [12/25 kart]  │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│                                                 │
│                                                 │
│              [Centralna karta]                  │
│                                                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 4.3 Nawigacja główna

| Element                | Lokalizacja    | Funkcja                              |
| ---------------------- | -------------- | ------------------------------------ |
| Logo                   | Header (lewy)  | Link do /dashboard                   |
| UserDropdownMenu       | Header (prawy) | Dostęp do ustawień i wylogowania     |
| Breadcrumb/Back button | Pod headerem   | Nawigacja wstecz (tylko widok talii) |
| Footer links           | Stopka         | Dokumenty prawne                     |

### 4.4 Struktura menu użytkownika

```
┌─────────────────┐
│ ▼ user@email    │
├─────────────────┤
│   Ustawienia    │ → /settings
├─────────────────┤
│   Wyloguj       │ → logout + /login
└─────────────────┘
```

### 4.5 Responsywność nawigacji

| Breakpoint          | Zmiany w nawigacji            |
| ------------------- | ----------------------------- |
| <640px (mobile)     | Logo mniejsze, dropdown ikona |
| 640-1024px (tablet) | Pełne logo, dropdown z email  |
| >1024px (desktop)   | Pełny layout                  |

---

## 5. Kluczowe komponenty

### 5.1 Komponenty layoutu

| Komponent     | Opis                                   | Użycie                     |
| ------------- | -------------------------------------- | -------------------------- |
| `AppLayout`   | Główny layout z headerem i footerem    | Wszystkie strony chronione |
| `AuthLayout`  | Layout dla stron publicznych           | /login, /privacy, /terms   |
| `StudyLayout` | Minimalistyczny layout dla sesji nauki | /study, /study/{deckId}    |
| `AppHeader`   | Nagłówek z logo i menu użytkownika     | AppLayout                  |
| `AppFooter`   | Stopka z linkami prawnymi              | Wszystkie layouty          |

### 5.2 Komponenty nawigacyjne

| Komponent          | Opis                                  | Użycie                  |
| ------------------ | ------------------------------------- | ----------------------- |
| `UserDropdownMenu` | Menu użytkownika z opcjami            | AppHeader               |
| `BackButton`       | Przycisk powrotu                      | Widok talii, ustawienia |
| `Logo`             | Logo aplikacji z linkiem do dashboard | Header                  |

### 5.3 Komponenty formularzy

| Komponent                | Opis                      | Użycie                  |
| ------------------------ | ------------------------- | ----------------------- |
| `InlineEditField`        | Pole z edycją inline      | Nazwa talii             |
| `CharacterCountInput`    | Input z licznikiem znaków | Tworzenie/edycja fiszek |
| `CharacterCountTextarea` | Textarea z licznikiem     | Tekst źródłowy AI       |
| `DeckSelector`           | Dropdown wyboru talii     | Modal generowania       |

### 5.4 Komponenty wyświetlania danych

| Komponent                | Opis                          | Użycie                        |
| ------------------------ | ----------------------------- | ----------------------------- |
| `DeckTile`               | Kafelek talii na dashboard    | DeckGrid                      |
| `FlashcardAccordionItem` | Fiszka z rozwinięciem         | FlashcardList                 |
| `DraftItem`              | Draft AI z akcjami            | DraftsList                    |
| `FlashcardDisplay`       | Centralna karta w sesji nauki | StudyPage                     |
| `ProgressBar`            | Pasek postępu sesji           | StudyHeader                   |
| `AILimitIndicator`       | Wskaźnik limitu AI            | Modal generowania, ustawienia |

### 5.5 Komponenty feedbacku

| Komponent        | Opis                          | Użycie                           |
| ---------------- | ----------------------------- | -------------------------------- |
| `LoadingSpinner` | Spinner z opcjonalnym tekstem | Ładowanie danych, generowanie AI |
| `EmptyState`     | Pusty stan z CTA              | Dashboard, widok talii           |
| `ErrorMessage`   | Komunikat błędu               | Formularze, API errors           |
| `SuccessToast`   | Toast potwierdzenia           | Po zapisie, usunięciu            |
| `ConfirmDialog`  | Dialog potwierdzenia          | Usuwanie talii/fiszek/konta      |

### 5.6 Komponenty modalne

| Komponent             | Opis                                 | Użycie                 |
| --------------------- | ------------------------------------ | ---------------------- |
| `GenerationModal`     | Modal generowania AI                 | Dashboard, widok talii |
| `DeleteConfirmDialog` | Dialog usuwania z potwierdzeniem     | Talii, fiszki, konta   |
| `CloseConfirmDialog`  | Dialog ostrzeżenia przed zamknięciem | Modal generowania      |

### 5.7 Komponenty sesji nauki

| Komponent         | Opis                        | Użycie           |
| ----------------- | --------------------------- | ---------------- |
| `StudyHeader`     | Minimalny header sesji      | StudyLayout      |
| `FlashcardFront`  | Przód fiszki                | FlashcardDisplay |
| `FlashcardBack`   | Tył fiszki (po odsłonięciu) | FlashcardDisplay |
| `RevealButton`    | Przycisk odsłonięcia        | FlashcardDisplay |
| `RatingButtons`   | Przyciski oceny             | FlashcardDisplay |
| `SessionComplete` | Ekran zakończenia           | StudyPage        |

### 5.8 Mapowanie komponentów na wymagania UI (Shadcn/ui)

| Komponent aplikacji      | Bazowy komponent Shadcn/ui |
| ------------------------ | -------------------------- |
| `UserDropdownMenu`       | `DropdownMenu`             |
| `DeckTile`               | `Card`                     |
| `FlashcardAccordionItem` | `Accordion`                |
| `ConfirmDialog`          | `AlertDialog`              |
| `GenerationModal`        | `Dialog`                   |
| `DeckSelector`           | `Select`                   |
| `CharacterCountInput`    | `Input`                    |
| `CharacterCountTextarea` | `Textarea`                 |
| `LoadingSpinner`         | `Spinner` (custom)         |
| `RatingButtons`          | `Button` (variants)        |
| `ProgressBar`            | `Progress`                 |
| `SuccessToast`           | `Sonner`                   |

---

## 6. Obsługa stanów i błędów

### 6.1 Stany ładowania

| Kontekst             | Zachowanie UI                    |
| -------------------- | -------------------------------- |
| Ładowanie dashboardu | Skeleton dla kafelków            |
| Ładowanie talii      | Skeleton dla listy fiszek        |
| Generowanie AI       | Blokujący spinner z tekstem      |
| Wysyłanie oceny      | Disabled buttons, krótki spinner |
| Zapisywanie fiszki   | Loading state na przycisku       |

### 6.2 Stany błędów

| Typ błędu                 | Zachowanie UI                                  |
| ------------------------- | ---------------------------------------------- |
| Błąd autentykacji (401)   | Redirect do /login                             |
| Błąd walidacji (400)      | Inline error pod polem                         |
| Konflikt nazwy (409)      | Inline error "Talia o tej nazwie już istnieje" |
| Błąd AI (503)             | Modal z komunikatem + retry button             |
| Limit AI (403)            | Komunikat w modalu + data resetu               |
| Błąd sieciowy             | Toast z retry option                           |
| Nieznaleziony zasób (404) | Przekierowanie lub komunikat                   |

### 6.3 Stany puste

| Kontekst                  | Komunikat                                  | CTA                               |
| ------------------------- | ------------------------------------------ | --------------------------------- |
| Nowy użytkownik (0 talii) | "Witaj! Utwórz swoją pierwszą talię..."    | "Utwórz pierwszą talię"           |
| Pusta talia (0 fiszek)    | "Ta talia nie ma jeszcze fiszek"           | "Dodaj fiszkę" / "Generuj fiszki" |
| Brak fiszek do powtórki   | "Brak fiszek do powtórki"                  | Info o następnej dacie            |
| Puste wyniki generowania  | "AI nie wygenerowało fiszek z tego tekstu" | "Spróbuj z dłuższym tekstem"      |

### 6.4 Strategie retry

| Operacja          | Retry strategy                         |
| ----------------- | -------------------------------------- |
| Pobieranie danych | Auto-retry x3 z exponential backoff    |
| Generowanie AI    | Manual retry (przycisk)                |
| Zapisywanie       | Auto-retry x2, potem manual            |
| Wysyłanie oceny   | Auto-retry x3, fallback do local queue |

---

## 7. Wymagania responsywności

### 7.1 Breakpointy

| Breakpoint | Szerokość  | Urządzenia            |
| ---------- | ---------- | --------------------- |
| Mobile     | <640px     | Smartfony             |
| Tablet     | 640-1024px | Tablety, małe laptopy |
| Desktop    | >1024px    | Laptopy, monitory     |

### 7.2 Adaptacje layoutu

| Element      | Mobile          | Tablet              | Desktop             |
| ------------ | --------------- | ------------------- | ------------------- |
| Grid talii   | 1 kolumna       | 2 kolumny           | 3-4 kolumny         |
| Modal        | Fullscreen      | Centered, 80% width | Centered, max 600px |
| Header       | Kompaktowy      | Pełny               | Pełny               |
| Przyciski    | min 44px touch  | 40px                | 36px                |
| Lista fiszek | Pełna szerokość | Pełna szerokość     | max 800px centered  |

### 7.3 Touch-friendly design

- Wszystkie interaktywne elementy min 44x44px
- Odpowiednie odstępy między elementami (min 8px)
- Swipe gestures dla accordion (opcjonalnie)
- Pull-to-refresh dla list (opcjonalnie)

---

## 8. Mapowanie wymagań funkcjonalnych na UI

| FR     | Opis                      | Komponent/Widok                              |
| ------ | ------------------------- | -------------------------------------------- |
| FR-001 | Google OAuth              | `GoogleOAuthButton` w `/login`               |
| FR-002 | Magic Link                | `MagicLinkForm` w `/login`                   |
| FR-003 | Redirect niezalogowanych  | Middleware + `AuthLayout`                    |
| FR-004 | Usuwanie konta            | `DeleteAccountSection` w `/settings`         |
| FR-005 | Brak landing page         | Redirect `/` → `/login` lub `/dashboard`     |
| FR-007 | Pole tekstowe 5000 znaków | `CharacterCountTextarea` w `GenerationModal` |
| FR-009 | Max 20 fiszek na sesję    | Logika w `GenerationModal`                   |
| FR-010 | Limit 200 fiszek/miesiąc  | `AILimitIndicator`                           |
| FR-011 | Spinner generowania       | `GenerationSpinner`                          |
| FR-012 | Lista draftów             | `DraftsList`                                 |
| FR-013 | Akcje draftu              | `DraftItem` z przyciskami                    |
| FR-014 | Walidacja fiszek          | `CharacterCountInput` z walidacją            |
| FR-019 | Licznik limitu            | `AILimitIndicator`                           |
| FR-021 | Formularz tworzenia       | `FlashcardForm`                              |
| FR-026 | Tworzenie talii           | Dialog w `DashboardPage`                     |
| FR-027 | Edycja nazwy              | `InlineEditField` w `DeckHeader`             |
| FR-028 | Usuwanie talii            | `DeleteDeckDialog`                           |
| FR-031 | Widok talii jako lista    | `FlashcardList` z accordion                  |
| FR-040 | Ekran nauki               | `FlashcardDisplay`                           |
| FR-041 | Pokaż odpowiedź           | `RevealButton`                               |
| FR-042 | Przyciski oceny           | `RatingButtons`                              |
| FR-043 | Pasek postępu             | `ProgressBar`                                |
| FR-048 | Layout kafelkowy          | `DeckGrid` w `/dashboard`                    |
| FR-049 | Kafelek Do powtórki       | `DueReviewTile`                              |
| FR-052 | Puste stany               | `EmptyState`                                 |
| FR-059 | Polityka prywatności      | `/privacy`                                   |
| FR-060 | Regulamin                 | `/terms`                                     |
