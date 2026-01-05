# Plan Testów - Flashcards AI

**Wersja:** 2.0
**Data:** 2026-01-05
**Projekt:** Flashcards AI - Aplikacja do nauki z fiszkami z wykorzystaniem AI

---

## 1. Wprowadzenie i cele testowania

### 1.1 Cele testowania

1. **Weryfikacja funkcjonalności** - Potwierdzenie, że wszystkie wymagania z PRD zostały poprawnie zaimplementowane
2. **Zapewnienie bezpieczeństwa** - Walidacja polityk RLS, autentykacji i ochrony danych (RODO)
3. **Gwarancja niezawodności** - Testowanie obsługi błędów i edge cases
4. **Walidacja integracji** - Testowanie poprawności integracji z Supabase, OpenRouter API i ts-fsrs

### 1.2 Stack technologiczny

- **Frontend:** Astro 5 + React 19 + TypeScript 5 + Tailwind CSS 4
- **Backend:** Supabase (PostgreSQL + Auth + RLS)
- **AI:** OpenRouter API (GPT-4o-mini)
- **Algorytm nauki:** ts-fsrs (Free Spaced Repetition Scheduler)

### 1.3 Kluczowe obszary testowe

- Miesięczny limit 200 fiszek AI z lazy reset
- Row Level Security (RLS) dla izolacji danych użytkowników
- Integracja z zewnętrznym API (OpenRouter)
- Logika biznesowa algorytmu FSRS
- Wymagania RODO (cascade delete)

### 1.4 Dokumenty referencyjne

- `/.ai/prd.md` - Product Requirements Document
- `/.ai/api-plan.md` - Dokumentacja API
- `/.ai/db-plan.md` - Schemat bazy danych
- `/.ai/ui-plan.md` - Architektura UI

---

## 2. Zakres testów

### 2.1 W zakresie testów

#### Moduł autentykacji
- FR-001: Logowanie przez Google OAuth
- FR-002: Logowanie przez Magic Link
- FR-003: Przekierowanie niezalogowanych użytkowników
- FR-004: Usuwanie konta z cascade delete
- FR-006: Zarządzanie sesją użytkownika

#### Moduł generowania fiszek AI
- FR-007 do FR-020: Kompletny flow generowania AI
  - Walidacja tekstu źródłowego (max 5000 znaków)
  - Generowanie maksymalnie 20 fiszek
  - Miesięczny limit 200 fiszek z lazy reset
  - Przeglądanie, akceptacja, edycja, odrzucanie draftów
  - Obsługa błędów AI

#### Moduł manualnego tworzenia fiszek
- FR-021 do FR-025: CRUD fiszek
  - Walidacja (przód: 200 znaków, tył: 500 znaków)
  - Przypisanie do talii

#### Moduł zarządzania taliami
- FR-026 do FR-033: CRUD talii
  - Tworzenie, edycja, usuwanie talii
  - Cascade delete fiszek

#### Moduł nauki (FSRS)
- FR-037 do FR-047: Sesja nauki
  - Integracja z ts-fsrs
  - Agregacja fiszek do powtórki
  - Filtrowanie po talii
  - Oceny (Again/Hard/Good/Easy)
  - Aktualizacja parametrów FSRS

#### Bezpieczeństwo
- Row Level Security (RLS) dla wszystkich tabel
- JWT token validation, session management
- Weryfikacja własności zasobów (IDOR prevention)
- Input validation (XSS, SQL injection)

#### Dostępność
- Zgodność z WCAG 2.1 Level AA
- Keyboard navigation
- Screen reader compatibility

### 2.2 Poza zakresem (MVP)

- Load testing >1000 concurrent users
- Stress testing / Soak testing
- Professional penetration testing
- Visual regression testing
- Localization testing (MVP tylko PL)
- Mobile native apps
- Offline functionality

---

## 3. Typy testów

### 3.1 Testy jednostkowe (Unit Tests)

**Narzędzia:** Vitest + @testing-library/react + MSW

**Kryteria pokrycia:** 70% minimum, 85% cel dla krytycznej logiki

#### 3.1.1 Serwisy (src/lib/services/)

**GenerationService:**
```
✓ generateFlashcards() - happy path
✓ generateFlashcards() - deck not found (404)
✓ generateFlashcards() - AI limit exceeded (403)
✓ generateFlashcards() - OpenRouter API failure (503)
✓ checkAndUpdateLimit() - lazy reset when month changed
✓ checkAndUpdateLimit() - no reset when same month
✓ incrementAIUsage() - atomic increment success
✓ incrementAIUsage() - RPC failure handling
✓ rejectDraft() - generation not found
✓ rejectDraft() - success creates REJECTED event
```

**DeckService:**
```
✓ createDeck() - success
✓ createDeck() - duplicate name (409)
✓ getDeck() - success / not found (404)
✓ updateDeck() - success / duplicate name (409)
✓ deleteDeck() - success with cascade
✓ listDecks() - pagination and sorting
```

**FlashcardService:**
```
✓ createFlashcard() - manual source
✓ createFlashcard() - AI source with generation_id
✓ createFlashcard() - logs ACCEPTED/EDITED event for AI
✓ createFlashcard() - validation errors
✓ updateFlashcard() - doesn't reset FSRS params
✓ deleteFlashcard() - sets generation_events.flashcard_id to NULL
✓ getFlashcard() - RLS filters correctly
```

**StudyService:**
```
✓ getStudyCards() - returns cards where next_review <= NOW()
✓ getStudyCards() - filters by deck_id correctly
✓ getStudyCards() - sorts by next_review ASC
✓ submitReview() - FSRS params update correctly
✓ submitReview() - rating validation (1-4)
✓ submitReview() - calculates next_review correctly
✓ getStudySummary() - counts due cards correctly
```

**OpenRouterService:**
```
✓ generateFlashcards() - success with valid response
✓ generateFlashcards() - handles API rate limit (429)
✓ generateFlashcards() - handles API error (500)
✓ generateFlashcards() - handles timeout
✓ generateFlashcards() - validates response schema
✓ generateFlashcards() - max 20 cards enforced
```

**AccountService:**
```
✓ deleteAccount() - confirmation string validation
✓ deleteAccount() - cascade deletes all data
✓ deleteAccount() - invalidates session
```

#### 3.1.2 Walidacje (Zod schemas)

```
✓ createGenerationRequestSchema - source_text validation (1-5000 chars)
✓ createGenerationRequestSchema - invalid UUID fails
✓ createDeckSchema - name validation (1-100 chars)
✓ createFlashcardSchema - front (1-200), back (1-500)
✓ reviewFlashcardSchema - rating (1-4)
✓ deleteAccountSchema - confirmation string "USUŃ"
```

#### 3.1.3 Hooki React

**useAIGeneration:**
```
✓ fetchProfile() - updates state correctly
✓ generate() - happy path / AI limit exceeded / API errors
✓ acceptDraft() - creates flashcard
✓ rejectDraft() - logs rejection event
✓ startEditDraft/saveEditDraft - local state management
✓ canGenerate - computed value correctness
```

**useStudySession:**
```
✓ fetchStudyCards() - loads due cards
✓ submitReview() - updates FSRS params
✓ submitReview() - progresses to next card
✓ handleSessionComplete() - navigates to dashboard
```

**useDeckView / useDashboard / useSettings:**
```
✓ CRUD operations
✓ Error handling
✓ Loading states
```

### 3.2 Testy integracyjne (Integration Tests)

**Narzędzia:** Vitest + Supabase local + MSW

#### 3.2.1 API Endpoints

**GET /api/profile:**
```
✓ 200 - returns profile with remaining AI limit
✓ 401 - unauthorized when no session
✓ 404 - profile not found
```

**DELETE /api/account:**
```
✓ 200 - deletes account with correct confirmation
✓ 400 - invalid confirmation string
✓ 401 - unauthorized
✓ 200 - cascade deletes profiles, decks, flashcards, events
```

**GET /api/decks:**
```
✓ 200 - returns user's decks with metadata
✓ 200 - pagination and sorting work
✓ 400 - invalid pagination params
✓ 401 - unauthorized
```

**POST /api/decks:**
```
✓ 201 - creates deck successfully
✓ 400 - validation error
✓ 409 - duplicate deck name
✓ 401 - unauthorized
```

**GET /api/decks/{deckId}:**
```
✓ 200 - returns deck with metadata
✓ 404 - deck not found or belongs to another user (RLS)
✓ 401 - unauthorized
```

**PATCH /api/decks/{deckId}:**
```
✓ 200 - updates deck name
✓ 400 - validation error
✓ 404 - deck not found or not owned
✓ 409 - duplicate name
```

**DELETE /api/decks/{deckId}:**
```
✓ 204 - deletes deck and cascades flashcards
✓ 404 - deck not found or not owned (IDOR protection)
✓ 400 - invalid UUID format
```

**GET /api/flashcards:**
```
✓ 200 - returns flashcards with optional deck_id filter
✓ 200 - pagination and sorting
✓ 400 - invalid query params
✓ 404 - deck not found (if deck_id provided)
```

**POST /api/flashcards:**
```
✓ 201 - creates manual flashcard
✓ 201 - creates AI flashcard with generation_id
✓ 201 - logs ACCEPTED/EDITED event for AI source
✓ 400 - validation error (front/back too long)
✓ 404 - deck not found or not owned
```

**PATCH /api/flashcards/{flashcardId}:**
```
✓ 200 - updates content without resetting FSRS
✓ 400 - validation error
✓ 404 - flashcard not found or not owned
```

**DELETE /api/flashcards/{flashcardId}:**
```
✓ 204 - deletes flashcard
✓ 204 - sets generation_events.flashcard_id to NULL
✓ 404 - flashcard not found or not owned
```

**POST /api/generations:**
```
✓ 200 - generates flashcard drafts successfully
✓ 200 - increments AI usage count atomically
✓ 200 - logs GENERATED events
✓ 400 - validation error (source_text too long)
✓ 403 - AI limit exceeded with reset date
✓ 404 - deck not found or not owned
✓ 503 - OpenRouter API error (mocked)
```

**POST /api/generations/{generationId}/reject:**
```
✓ 201 - logs REJECTED event
✓ 404 - generation not found or not owned
✓ 400 - invalid draft_index
```

**GET /api/study/cards:**
```
✓ 200 - returns due flashcards (next_review <= NOW)
✓ 200 - filters by deck_id correctly
✓ 200 - limit param works (default 50, max 200)
```

**POST /api/study/review:**
```
✓ 200 - updates FSRS params correctly
✓ 200 - calculates next_review based on rating
✓ 400 - invalid rating (not 1-4)
✓ 404 - flashcard not found or not owned
```

#### 3.2.2 Middleware

```
✓ authenticated users can access protected routes
✓ unauthenticated users redirected to /login
✓ authenticated users redirected from /login to /dashboard
✓ redirect parameter works correctly (same origin only)
✓ public routes accessible without auth (/login, /privacy, /terms)
✓ Supabase client injected into context.locals
```

#### 3.2.3 Row Level Security (RLS)

**Profiles:**
```
✓ User can view/update own profile
✓ User cannot view/update other user's profile
✓ Anon role has no access
```

**Decks:**
```
✓ User can SELECT/INSERT/UPDATE/DELETE own decks
✓ User cannot access other user's decks
✓ Anon role has no access
```

**Flashcards:**
```
✓ User can SELECT/INSERT/UPDATE/DELETE flashcards from own decks
✓ User cannot access flashcards from other user's decks
✓ Anon role has no access
```

**Generation Events:**
```
✓ User can SELECT/INSERT own events
✓ User cannot access other user's events
✓ Anon role has no access
```

#### 3.2.4 Integracja z ts-fsrs

```
✓ New card (state=0) transitions to learning on first review
✓ Again (rating=1) increases lapses count
✓ Good (rating=3) increases stability and scheduled_days
✓ Easy (rating=4) significantly increases interval
✓ Multiple reviews maintain FSRS state consistency
✓ Difficulty parameter adjusts based on performance
✓ next_review calculated correctly based on scheduled_days
```

#### 3.2.5 Integracja z OpenRouter API (mocked)

```
✓ Success response parsed correctly
✓ API returns max 20 flashcards
✓ API timeout handled gracefully (10s timeout)
✓ API rate limit (429) handled with retry
✓ API error (500) returns 503 to client
✓ Malformed response handled without crash
```

### 3.3 Testy E2E (End-to-End)

**Narzędzia:** Playwright

#### 3.3.1 User Journey: Rejestracja i pierwsze użycie

```gherkin
Scenario: Nowy użytkownik rejestruje się i tworzy pierwszą fiszkę
  Given użytkownik nie jest zalogowany
  When użytkownik odwiedza "/"
  Then jest przekierowany do "/login"

  When użytkownik klika "Zaloguj przez Google"
  And kończy OAuth flow (mocked)
  Then jest przekierowany do "/dashboard"
  And widzi pusty stan z komunikatem powitalnym

  When użytkownik klika "Utwórz pierwszą talię"
  And wpisuje nazwę "Biologia"
  And klika "Zapisz"
  Then talia zostaje utworzona
  And użytkownik jest przekierowany do "/decks/{deckId}"

  When użytkownik klika "Dodaj fiszkę"
  And wypełnia przód: "Co to mitochondrium?"
  And wypełnia tył: "Elektrownia komórki"
  And klika "Zapisz"
  Then fiszka zostaje dodana do listy
```

#### 3.3.2 User Journey: Generowanie fiszek AI

```gherkin
Scenario: Użytkownik generuje fiszki przez AI
  Given użytkownik jest zalogowany
  And ma talię "Historia"
  And ma dostępny limit AI (remaining > 0)

  When użytkownik otwiera talię
  And klika "Generuj fiszki"
  Then modal generowania się otwiera
  And widzi licznik limitu AI

  When użytkownik wkleja tekst (500 znaków)
  And klika "Generuj"
  Then widzi spinner "Generowanie fiszek..."
  And po ~3s widzi listę draftów (mocked)

  When użytkownik klika "Akceptuj" przy drafcie 1
  Then draft zostaje zapisany jako fiszka

  When użytkownik klika "Edytuj" przy drafcie 2
  And modyfikuje przód
  And klika "Zapisz" → "Akceptuj"
  Then edytowany draft zostaje zapisany
  And event EDITED zostaje zalogowany

  When użytkownik klika "Odrzuć" przy drafcie 3
  Then draft znika z listy
  And event REJECTED zostaje zalogowany
```

#### 3.3.3 User Journey: Sesja nauki z FSRS

```gherkin
Scenario: Użytkownik uczy się fiszek
  Given użytkownik ma talię z 5 fiszkami do powtórki

  When użytkownik klika kafelek "Do powtórki: 5"
  Then jest przekierowany do "/study"
  And widzi pasek postępu "0/5 kart"
  And widzi przód pierwszej fiszki

  When użytkownik klika "Pokaż odpowiedź"
  Then widzi tył fiszki
  And widzi przyciski: Again / Hard / Good / Easy

  When użytkownik klika "Good"
  Then fiszka zostaje oceniona (FSRS params updated)
  And pasek postępu: "1/5 kart"
  And widzi następną fiszkę

  When użytkownik oceni wszystkie 5 fiszek
  Then widzi ekran zakończenia "Ukończono 5 fiszek"
  And ma przycisk "Wróć do dashboardu"
```

#### 3.3.4 User Journey: Limit AI exceeded

```gherkin
Scenario: Użytkownik przekracza miesięczny limit AI
  Given użytkownik wygenerował już 200 fiszek w tym miesiącu

  When użytkownik próbuje wygenerować więcej fiszek
  Then widzi komunikat "Limit AI wyczerpany"
  And widzi datę resetu (1. dzień następnego miesiąca)
  And przycisk "Generuj" jest nieaktywny
  And może nadal tworzyć fiszki manualnie
```

#### 3.3.5 User Journey: Usuwanie konta (RODO)

```gherkin
Scenario: Użytkownik usuwa swoje konto
  Given użytkownik jest zalogowany
  And ma 3 talie i 50 fiszek

  When użytkownik otwiera "/settings"
  And klika "Usuń konto"
  Then widzi dialog z ostrzeżeniem

  When użytkownik wpisuje "USUŃ"
  And klika "Potwierdź usunięcie"
  Then konto zostaje usunięte (cascade delete)
  And sesja zostaje unieważniona
  And użytkownik jest przekierowany do "/login"
```

### 3.4 Testy bezpieczeństwa (Security Tests)

#### 3.4.1 RLS Penetration Testing

```
// Test: User A nie może odczytać talii User B
Given User A (UUID: aaa) is authenticated
And User B (UUID: bbb) has deck with ID: deck-123
When User A requests GET /api/decks/deck-123
Then response is 404 (not 403 - information hiding)

// Test: User A nie może wstawiać fiszki do talii User B
Given User A is authenticated
And User B has deck with ID: deck-789
When User A requests POST /api/flashcards with deck_id: deck-789
Then response is 404

// Test: Anon role has zero access
Given request without authentication
When trying to SELECT any table
Then query returns 0 rows
```

#### 3.4.2 Authentication & Authorization

```
✓ Invalid/expired/tampered token returns 401
✓ Missing token redirects to /login for protected routes
✓ Token refresh works correctly
✓ Logout invalidates session correctly
✓ Session cookies: secure, HttpOnly, SameSite
✓ UUID enumeration doesn't reveal other users' resources
✓ 404 returned for both non-existent and unauthorized (not 403)
```

#### 3.4.3 Input Validation

```
✓ XSS: Flashcard front/back with <script> tags sanitized
✓ XSS: Deck name with JavaScript payload escaped
✓ SQL Injection: Supabase parameterized queries prevent injection
✓ No reflected XSS in error messages
✓ No stored XSS in user-generated content
```

#### 3.4.4 Security Headers

```
✓ Content-Security-Policy (CSP)
✓ X-Content-Type-Options: nosniff
✓ X-Frame-Options: DENY
✓ Referrer-Policy: strict-origin-when-cross-origin
✓ Strict-Transport-Security (HSTS)
```

### 3.5 Testy dostępności (Accessibility Tests)

**Narzędzia:** @axe-core/playwright

#### 3.5.1 Automated Checks (wszystkie strony)

```
Pages: /login, /dashboard, /decks/{id}, /study, /settings, /privacy-policy, /terms-of-service

✓ No WCAG 2.1 Level AA violations
✓ Color contrast ratio ≥ 4.5:1 for normal text
✓ Color contrast ratio ≥ 3:1 for large text
✓ Form inputs have associated labels
✓ Links have discernible text
✓ Headings in logical order
✓ ARIA roles used correctly
```

#### 3.5.2 Keyboard Navigation

```
✓ Tab/Shift+Tab moves focus correctly
✓ Focus visible (clear outline)
✓ Logical tab order
✓ Modals: focus trapped, Escape closes, focus returns
✓ Buttons: Enter and Space activate
✓ Flashcard Study: keyboard shortcuts for ratings (1/2/3/4)
```

#### 3.5.3 Screen Reader (manual testing)

```
✓ Page title announced correctly
✓ Headings and landmarks identified
✓ Buttons/links announced with role and label
✓ Form inputs announced with label
✓ Dynamic content updates announced (aria-live)
✓ Loading/success/error states announced
```

### 3.6 Testy wydajności (Performance Tests)

**Narzędzia:** Lighthouse CLI

#### 3.6.1 Web Vitals Targets

| Strona | FCP | LCP | CLS | INP | TTI |
|--------|-----|-----|-----|-----|-----|
| /dashboard | <1.5s | <2.0s | <0.1 | <100ms | <3.0s |
| /decks/{id} | <1.5s | <2.0s | <0.1 | <100ms | <3.0s |
| /study | <1.0s | <1.5s | <0.05 | <50ms | <2.0s |
| /login | <1.0s | <1.5s | <0.1 | <100ms | <2.0s |

#### 3.6.2 API Response Times

| Endpoint | P50 | P95 | P99 |
|----------|-----|-----|-----|
| GET /api/profile | <50ms | <100ms | <200ms |
| GET /api/decks | <100ms | <200ms | <300ms |
| POST /api/flashcards | <200ms | <400ms | <600ms |
| POST /api/generations | <3s | <5s | <8s |
| POST /api/study/review | <100ms | <200ms | <350ms |

---

## 4. Scenariusze testowe

### 4.1 Autentykacja

#### TC-AUTH-001: Logowanie przez Google OAuth
**Priorytet:** P0

**Warunki wstępne:** Użytkownik nie jest zalogowany

**Kroki:**
1. Otwórz `/login`
2. Kliknij "Zaloguj przez Google"
3. Zaakceptuj zgody OAuth (mocked)

**Oczekiwany rezultat:**
- Przekierowanie do `/dashboard`
- Sesja utworzona, cookie ustawione
- Profil utworzony automatycznie (trigger)

---

#### TC-AUTH-002: Logowanie przez Magic Link
**Priorytet:** P0

**Kroki:**
1. Otwórz `/login`
2. Wybierz "Zaloguj przez email"
3. Wpisz poprawny email, kliknij "Wyślij link"
4. Kliknij link w emailu (mocked)

**Oczekiwany rezultat:**
- Komunikat "Link wysłany na email"
- Po kliknięciu linku: zalogowany, przekierowanie do `/dashboard`

---

#### TC-AUTH-003: Przekierowanie niezalogowanego
**Priorytet:** P0

**Kroki:**
1. Otwórz `/dashboard` bezpośrednio (bez sesji)

**Oczekiwany rezultat:**
- Przekierowanie do `/login?redirect=%2Fdashboard`
- Po zalogowaniu: przekierowanie do `/dashboard`

---

### 4.2 Generowanie fiszek AI

#### TC-GEN-001: Generowanie fiszek - happy path
**Priorytet:** P0

**Warunki wstępne:** Użytkownik zalogowany, ma talię, remaining AI limit > 0

**Kroki:**
1. Otwórz talię
2. Kliknij "Generuj fiszki"
3. Wklej tekst (500 znaków)
4. Kliknij "Generuj"

**Oczekiwany rezultat:**
- Spinner ~3s, lista 10-20 draftów
- Przyciski Akceptuj/Edytuj/Odrzuć dostępne
- Licznik limitu AI zaktualizowany
- GENERATED eventy zalogowane

---

#### TC-GEN-002: Akceptacja draftu
**Priorytet:** P0

**Kroki:**
1. Kliknij "Akceptuj" przy drafcie

**Oczekiwany rezultat:**
- Draft zapisany jako flashcard
- Event ACCEPTED zalogowany
- Draft oznaczony jako zaakceptowany

---

#### TC-GEN-003: Edycja draftu przed akceptacją
**Priorytet:** P0

**Kroki:**
1. Kliknij "Edytuj" przy drafcie
2. Zmień treść, kliknij "Zapisz"
3. Kliknij "Akceptuj"

**Oczekiwany rezultat:**
- Fiszka zapisana z edytowaną treścią
- Event EDITED zalogowany (was_edited=true)

---

#### TC-GEN-004: Limit AI exceeded
**Priorytet:** P0

**Warunki wstępne:** `monthly_ai_flashcards_count = 200`

**Kroki:**
1. Otwórz modal generowania
2. Kliknij "Generuj"

**Oczekiwany rezultat:**
- 403 Forbidden
- Komunikat "Limit AI wyczerpany (200 fiszek/miesiąc)"
- Data resetu widoczna
- Przycisk "Generuj" nieaktywny

---

#### TC-GEN-005: Lazy reset limitu AI
**Priorytet:** P0

**Warunki wstępne:**
- `monthly_ai_flashcards_count = 200`
- `ai_limit_reset_date < pierwszy dzień bieżącego miesiąca`

**Kroki:**
1. Otwórz modal generowania
2. Kliknij "Generuj"

**Oczekiwany rezultat:**
- Lazy reset wykonany przed generowaniem
- `monthly_ai_flashcards_count` zresetowany do 0
- Generowanie przebiega pomyślnie

---

#### TC-GEN-006: Błąd OpenRouter API
**Priorytet:** P1

**Warunki wstępne:** OpenRouter zwraca błąd 500 (mock)

**Oczekiwany rezultat:**
- 503 Service Unavailable
- Komunikat "Usługa AI jest tymczasowo niedostępna"
- Licznik AI NIE zostaje zmniejszony
- Możliwość retry

---

### 4.3 Sesja nauki (FSRS)

#### TC-STUDY-001: Rozpoczęcie sesji nauki
**Priorytet:** P0

**Warunki wstępne:** 5 fiszek do powtórki (next_review <= NOW)

**Kroki:**
1. Kliknij kafelek "Do powtórki: 5"

**Oczekiwany rezultat:**
- Przekierowanie do `/study`
- Sesja zawiera 5 fiszek (sorted by next_review ASC)
- Pasek postępu "0/5 kart"

---

#### TC-STUDY-002: Ocena fiszki - Good (rating=3)
**Priorytet:** P0

**Warunki wstępne:** Fiszka w stanie new (state=0)

**Kroki:**
1. Kliknij "Pokaż odpowiedź"
2. Kliknij "Good"

**Oczekiwany rezultat:**
- FSRS params zaktualizowane (state=1, reps=1, stability>0)
- next_review = NOW + scheduled_days
- Pasek postępu "1/5 kart"
- Następna fiszka wyświetlona

---

#### TC-STUDY-003: Zakończenie sesji
**Priorytet:** P0

**Kroki:**
1. Oceń wszystkie fiszki

**Oczekiwany rezultat:**
- Ekran zakończenia "Ukończono X fiszek"
- Przycisk "Wróć do dashboardu"

---

### 4.4 Zarządzanie taliami

#### TC-DECK-001: Tworzenie talii
**Priorytet:** P0

**Kroki:**
1. Kliknij "Nowa talia"
2. Wpisz nazwę "Chemia"
3. Kliknij "Zapisz"

**Oczekiwany rezultat:**
- Talia utworzona
- Przekierowanie do `/decks/{deckId}`

---

#### TC-DECK-002: Konflikt nazwy talii
**Priorytet:** P1

**Warunki wstępne:** Użytkownik ma talię "Test Deck"

**Kroki:**
1. Spróbuj utworzyć talię "Test Deck"

**Oczekiwany rezultat:**
- 409 Conflict
- Komunikat "Talia o tej nazwie już istnieje"

---

#### TC-DECK-003: Usuwanie talii z cascade delete
**Priorytet:** P0

**Warunki wstępne:** Talia z 10 fiszkami

**Kroki:**
1. Kliknij "Usuń talię"
2. Potwierdź w dialogu

**Oczekiwany rezultat:**
- Talia usunięta
- 10 fiszek usunięte (cascade)
- Generation events: flashcard_id → NULL
- Przekierowanie do `/dashboard`

---

### 4.5 Zarządzanie fiszkami

#### TC-FLASH-001: Manualne tworzenie fiszki
**Priorytet:** P0

**Kroki:**
1. Kliknij "Dodaj fiszkę"
2. Wypełnij przód/tył
3. Kliknij "Zapisz"

**Oczekiwany rezultat:**
- Fiszka utworzona (source: "manual", generation_id: NULL)
- FSRS params: domyślne (state=0, next_review=NOW)

---

#### TC-FLASH-002: Edycja fiszki bez resetu FSRS
**Priorytet:** P0

**Warunki wstępne:** Fiszka z FSRS params (stability=5.0, reps=10)

**Kroki:**
1. Edytuj treść fiszki
2. Zapisz

**Oczekiwany rezultat:**
- Treść zaktualizowana
- FSRS params NIE zresetowane (stability=5.0, reps=10)

---

### 4.6 Usuwanie konta (RODO)

#### TC-ACCOUNT-001: Usuwanie konta z cascade delete
**Priorytet:** P0

**Warunki wstępne:** 3 talie, 50 fiszek, 100 generation events

**Kroki:**
1. Otwórz `/settings`
2. Kliknij "Usuń konto"
3. Wpisz "USUŃ"
4. Potwierdź

**Oczekiwany rezultat:**
- Użytkownik usunięty z auth.users
- Cascade delete: profile, talie, fiszki, eventy
- Sesja unieważniona
- Przekierowanie do `/login`

---

#### TC-ACCOUNT-002: Niepoprawne potwierdzenie
**Priorytet:** P1

**Kroki:**
1. Wpisz "usun" (lowercase)
2. Kliknij "Potwierdź"

**Oczekiwany rezultat:**
- 400 Bad Request
- Komunikat "Wpisz dokładnie USUŃ"
- Konto NIE usunięte

---

## 5. Środowisko testowe

### 5.1 Test Data Management

#### Seed Data (Development & CI)

**Lokalizacja:** `supabase/seed.sql`

```sql
-- Test users (profiles created by trigger)
-- Test decks
INSERT INTO decks (id, user_id, name) VALUES
  ('deck-001', 'user-001', 'Test Deck 1'),
  ('deck-002', 'user-001', 'Test Deck 2');

-- Test flashcards with various FSRS states
-- Generation events for analytics
```

**Refresh:** `supabase db reset` przed test runs

#### Factory Functions

**Lokalizacja:** `tests/factories/`

```typescript
// tests/factories/flashcard.factory.ts
export function createFlashcard(overrides?: Partial<Flashcard>): Flashcard {
  return {
    id: crypto.randomUUID(),
    deck_id: 'default-deck-id',
    front: 'Test Question',
    back: 'Test Answer',
    source: 'manual',
    // FSRS defaults...
    ...overrides,
  };
}
```

### 5.2 Mockowanie OpenRouter API (MSW)

```typescript
// tests/mocks/openrouter.mock.ts
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

export const openRouterMocks = [
  http.post('https://openrouter.ai/api/v1/chat/completions', () => {
    return HttpResponse.json({
      choices: [{
        message: {
          content: JSON.stringify({
            flashcards: [
              { front: 'Mock Q1', back: 'Mock A1' },
              { front: 'Mock Q2', back: 'Mock A2' },
            ],
          }),
        },
      }],
    });
  }),
];

export const openRouterServer = setupServer(...openRouterMocks);
```

**Scenariusze do mockowania:**
- Success (200)
- Rate limit (429)
- Server error (500)
- Timeout
- Malformed response

---

## 6. Narzędzia

| Kategoria | Narzędzie | Przeznaczenie |
|-----------|-----------|---------------|
| Unit Tests | Vitest | Serwisy, walidacje, hooki |
| Component Tests | @testing-library/react | Komponenty React |
| E2E Tests | Playwright | User journeys |
| API Mocking | MSW | OpenRouter API |
| Accessibility | @axe-core/playwright | WCAG 2.1 AA |
| Coverage | Vitest (v8 provider) | Code coverage |
| Performance | Lighthouse CLI | Web Vitals |
| CI/CD | GitHub Actions | Automated testing |

---

## 7. Kryteria akceptacji

### 7.1 Kryteria per typ testów

| Typ | Kryterium |
|-----|-----------|
| Unit Tests | 70% coverage dla serwisów i validations, 0 failures |
| Integration Tests | Wszystkie API endpoints (11), wszystkie RLS policies (4 tabele × 4 ops), 0 failures |
| E2E Tests | 6 kluczowych user journeys, <10% retry rate, 0 failures |
| Security Tests | Zero RLS bypass, input validation effective, IDOR prevention verified |
| Accessibility | 0 axe-core violations, keyboard navigation works, WCAG 2.1 AA |
| Performance | Web Vitals targets met, API P95 response times met |

### 7.2 Kryteria MVP Release

**Must-have (P0):**
- [ ] Wszystkie testy P0 passed
- [ ] Security audit passed (zero critical vulnerabilities)
- [ ] Core functionality działa (auth, generate AI, study FSRS, CRUD)
- [ ] RODO compliance verified (cascade delete)
- [ ] RLS policies secure
- [ ] No critical or blocker bugs

**Should-have (P1):**
- [ ] WCAG 2.1 AA compliance
- [ ] Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- [ ] Responsywność (mobile, tablet, desktop)
- [ ] < 10 major bugs

---

## 8. Priorytety implementacji

### Faza 1: Setup + Unit Tests (Tydzień 1-2)
- Instalacja Vitest, Playwright, MSW
- Konfiguracja test runners
- Factory functions i fixtures
- Unit testy dla serwisów (70% coverage)

### Faza 2: Integration Tests (Tydzień 2-3)
- Testy API endpoints
- Testy RLS policies
- Testy middleware
- Integracja ts-fsrs i OpenRouter (mocked)

### Faza 3: E2E + Security (Tydzień 3-4)
- 6 kluczowych user journeys
- RLS penetration testing
- Input validation tests
- IDOR prevention verification

### Faza 4: A11y + Performance (Tydzień 4-5)
- axe-core automated tests
- Keyboard navigation tests
- Lighthouse audits
- API response time verification

### Faza 5: QA + Regression (Tydzień 5-6)
- Manual exploratory testing
- Cross-browser testing
- Final smoke tests
- CI/CD pipeline finalization

---

## 9. Ryzyka

| Ryzyko | Mitigacja |
|--------|-----------|
| Flaky E2E tests | Retry logic, better selectors, wait strategies |
| OpenRouter API downtime | MSW mocking, cached responses |
| Supabase local setup issues | Documentation, Docker compose, CI cache |
| RLS policy gaps | Manual penetration testing, peer review |
| Insufficient coverage | CI enforcement (70% threshold) |

---

*Koniec dokumentu*
