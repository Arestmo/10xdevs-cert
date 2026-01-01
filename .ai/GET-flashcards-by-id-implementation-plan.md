# API Endpoint Implementation Plan: GET /api/flashcards/{flashcardId}

## 1. Przegląd punktu końcowego

Endpoint służy do pobierania szczegółowych informacji o pojedynczej fiszce na podstawie jej unikalnego identyfikatora (UUID). Zwraca pełne dane fiszki włącznie z parametrami algorytmu FSRS (stability, difficulty, reps, lapses, state, next_review, etc.) oraz metadanymi (created_at, updated_at). Endpoint wymaga uwierzytelnienia użytkownika i weryfikuje, czy żądana fiszka należy do talii użytkownika.

## 2. Szczegóły żądania

- **Metoda HTTP**: GET
- **Struktura URL**: `/api/flashcards/{flashcardId}`
- **Parametry**:
  - **Wymagane**:
    - `flashcardId` (string, UUID) - parametr ścieżki URL, unikalny identyfikator fiszki
  - **Opcjonalne**: Brak
- **Request Body**: Brak (metoda GET)
- **Headers**:
  - `Authorization: Bearer <token>` - token uwierzytelniający Supabase (obsługiwany automatycznie przez middleware)

## 3. Wykorzystywane typy

### DTOs (z src/types.ts):

```typescript
// Response type - alias do typu bazowego Flashcard z database.types.ts
export type FlashcardDTO = Flashcard;

// Flashcard zawiera wszystkie pola z tabeli flashcards:
// - id: string
// - deck_id: string
// - front: string
// - back: string
// - source: SourceType ('ai' | 'manual')
// - stability: number
// - difficulty: number
// - elapsed_days: number
// - scheduled_days: number
// - reps: number
// - lapses: number
// - state: number (0-3)
// - last_review: string | null
// - next_review: string
// - created_at: string
// - updated_at: string

// Error response type
export interface ErrorResponseDTO {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
```

### Validation Schema (Zod):

```typescript
const GetFlashcardParamsSchema = z.object({
  flashcardId: z.string().uuid({
    message: "Invalid flashcard ID format"
  })
});
```

## 4. Szczegóły odpowiedzi

### Sukces (200 OK):

```json
{
  "id": "uuid",
  "deck_id": "uuid",
  "front": "What is mitochondria?",
  "back": "The powerhouse of the cell",
  "source": "ai",
  "stability": 2.5,
  "difficulty": 0.3,
  "elapsed_days": 5,
  "scheduled_days": 7,
  "reps": 3,
  "lapses": 0,
  "state": 2,
  "last_review": "2024-12-05T10:00:00Z",
  "next_review": "2024-12-12T10:00:00Z",
  "created_at": "2024-11-20T10:00:00Z",
  "updated_at": "2024-12-05T10:00:00Z"
}
```

### Błędy:

**400 Bad Request** - Nieprawidłowy format UUID:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid flashcard ID format",
    "details": {
      "field": "flashcardId",
      "issue": "Must be a valid UUID"
    }
  }
}
```

**401 Unauthorized** - Brak uwierzytelnienia:
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**404 Not Found** - Fiszka nie istnieje lub nie należy do użytkownika:
```json
{
  "error": {
    "code": "FLASHCARD_NOT_FOUND",
    "message": "Flashcard not found or not owned by user"
  }
}
```

**500 Internal Server Error** - Błąd serwera:
```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

## 5. Przepływ danych

1. **Walidacja parametru URL**:
   - Ekstrakcja `flashcardId` z parametrów ścieżki
   - Walidacja UUID przy użyciu Zod schema

2. **Uwierzytelnianie**:
   - Pobieranie sesji użytkownika z `context.locals.supabase.auth.getUser()`
   - Weryfikacja czy użytkownik jest zalogowany
   - Ekstrakcja `user_id` z sesji

3. **Wywołanie serwisu**:
   - Wywołanie `flashcardService.getFlashcardByIdForUser(flashcardId, userId)`
   - Serwis wykonuje zapytanie SQL z JOIN:
     ```sql
     SELECT f.*
     FROM flashcards f
     INNER JOIN decks d ON f.deck_id = d.id
     WHERE f.id = $flashcardId AND d.user_id = $userId
     ```

4. **Weryfikacja istnienia**:
   - Jeśli `flashcard === null`, zwróć 404
   - W przeciwnym razie zwróć dane fiszki

5. **Zwrócenie odpowiedzi**:
   - Status 200 z obiektem `FlashcardDTO`

## 6. Względy bezpieczeństwa

### Uwierzytelnianie:
- Endpoint wymaga aktywnej sesji użytkownika Supabase
- Token JWT weryfikowany automatycznie przez middleware Supabase
- Brak tokena lub wygasły token = 401 Unauthorized

### Autoryzacja (weryfikacja własności):
- **KRYTYCZNE**: Fiszka musi należeć do talii użytkownika
- Implementacja przez JOIN z tabelą `decks` i filtr na `user_id`
- **Nigdy nie polegać tylko na RLS** - zawsze weryfikować własność w kodzie aplikacji
- Zapobiega IDOR (Insecure Direct Object Reference) - użytkownik nie może dostać się do fiszek innych użytkowników poprzez zgadywanie UUID

### Walidacja danych wejściowych:
- Walidacja UUID przy użyciu Zod zapobiega SQL injection
- Walidacja na poziomie aplikacji przed wywołaniem bazy danych

### Information Disclosure:
- Zwracanie identycznego komunikatu błędu 404 niezależnie od tego czy:
  - Fiszka nie istnieje w bazie
  - Fiszka istnieje ale należy do innego użytkownika
- Zapobiega to wyciekowi informacji o istnieniu zasobów

### Row Level Security (RLS):
- RLS na tabeli `flashcards` działa jako dodatkowa warstwa ochrony
- Nie zastępuje walidacji na poziomie aplikacji

## 7. Obsługa błędów

### Scenariusze błędów i odpowiedzi:

| Scenariusz | Status | Code | Message | Działanie |
|------------|--------|------|---------|-----------|
| Brak tokena uwierzytelniającego | 401 | UNAUTHORIZED | Authentication required | Zwróć błąd natychmiast |
| Token wygasły lub nieprawidłowy | 401 | UNAUTHORIZED | Authentication required | Zwróć błąd natychmiast |
| Nieprawidłowy format UUID | 400 | VALIDATION_ERROR | Invalid flashcard ID format | Walidacja Zod, zwróć szczegóły |
| Fiszka nie istnieje | 404 | FLASHCARD_NOT_FOUND | Flashcard not found or not owned by user | Zwróć po sprawdzeniu w bazie |
| Fiszka należy do innego użytkownika | 404 | FLASHCARD_NOT_FOUND | Flashcard not found or not owned by user | Zwróć po sprawdzeniu własności |
| Błąd połączenia z bazą danych | 500 | INTERNAL_SERVER_ERROR | An unexpected error occurred | Loguj szczegóły, zwróć ogólny błąd |
| Nieoczekiwany wyjątek | 500 | INTERNAL_SERVER_ERROR | An unexpected error occurred | Loguj stack trace, zwróć ogólny błąd |

### Error Handling Pattern:

```typescript
// 1. Walidacja danych wejściowych (Guard clause)
const validation = GetFlashcardParamsSchema.safeParse({ flashcardId });
if (!validation.success) {
  return new Response(JSON.stringify({
    error: {
      code: "VALIDATION_ERROR",
      message: "Invalid flashcard ID format",
      details: validation.error.flatten()
    }
  }), { status: 400 });
}

// 2. Uwierzytelnianie (Guard clause)
const { data: { user }, error: authError } = await supabase.auth.getUser();
if (authError || !user) {
  return new Response(JSON.stringify({
    error: {
      code: "UNAUTHORIZED",
      message: "Authentication required"
    }
  }), { status: 401 });
}

// 3. Weryfikacja istnienia i własności (Guard clause)
const flashcard = await flashcardService.getFlashcardByIdForUser(flashcardId, user.id);
if (!flashcard) {
  return new Response(JSON.stringify({
    error: {
      code: "FLASHCARD_NOT_FOUND",
      message: "Flashcard not found or not owned by user"
    }
  }), { status: 404 });
}

// 4. Happy path - zwróć dane
return new Response(JSON.stringify(flashcard), { status: 200 });
```

## 8. Rozważania dotyczące wydajności

### Optymalizacje zapytań:

1. **Single Query z JOIN**:
   - Użyj jednego zapytania SQL z INNER JOIN zamiast dwóch osobnych zapytań
   - Sprawdzenie własności i pobranie danych w jednym round-trip do bazy

2. **Indeksy bazodanowe**:
   - Primary key index na `flashcards.id` (automatyczny)
   - Foreign key index na `flashcards.deck_id` (automatyczny)
   - Composite index na `(deck_id, id)` może przyspieszyć JOIN (opcjonalnie)

3. **Minimalizacja połączeń**:
   - Wykorzystanie connection pooling Supabase
   - Jeden round-trip do bazy danych

### Caching:

- **Brak cache na poziomie aplikacji**: Dane fiszek są często aktualizowane (FSRS parameters po każdej sesji nauki)
- **Cache HTTP**: Brak cache-control headers - dane powinny być zawsze świeże
- **Opcjonalnie**: Client-side cache w React Query z krótkim TTL (5-10s) dla lepszego UX

### Potential Bottlenecks:

- **Database query**: ~5-20ms (zależy od obciążenia Supabase)
- **JWT verification**: ~1-5ms (przez middleware)
- **JSON serialization**: < 1ms (mały obiekt)
- **Total expected latency**: 10-30ms

### Load considerations:

- Endpoint nie jest resource-intensive
- Można obsłużyć setki żądań na sekundę
- Rate limiting na poziomie Supabase (domyślne limity API)

## 9. Etapy wdrożenia

### Krok 1: Utworzenie/aktualizacja serwisu flashcard

**Plik**: `src/lib/services/flashcard.service.ts`

```typescript
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import type { Flashcard } from "@/types";

export async function getFlashcardByIdForUser(
  supabase: SupabaseClient<Database>,
  flashcardId: string,
  userId: string
): Promise<Flashcard | null> {
  // Query z JOIN aby sprawdzić własność fiszki
  const { data, error } = await supabase
    .from("flashcards")
    .select("*")
    .eq("id", flashcardId)
    .eq("decks.user_id", userId) // Weryfikacja przez JOIN
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}
```

**Uwaga**: Sprawdzić czy plik `flashcard.service.ts` już istnieje i czy zawiera podobne funkcje.

### Krok 2: Utworzenie validation schema

**Plik**: `src/pages/api/flashcards/[flashcardId].ts` (na początku pliku)

```typescript
import { z } from "zod";

const GetFlashcardParamsSchema = z.object({
  flashcardId: z.string().uuid({
    message: "Invalid flashcard ID format"
  })
});
```

### Krok 3: Implementacja GET handler

**Plik**: `src/pages/api/flashcards/[flashcardId].ts`

```typescript
import type { APIRoute } from "astro";
import { getFlashcardByIdForUser } from "@/lib/services/flashcard.service";
import type { FlashcardDTO, ErrorResponseDTO } from "@/types";

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // 1. Walidacja parametru URL
    const validation = GetFlashcardParamsSchema.safeParse({
      flashcardId: params.flashcardId
    });

    if (!validation.success) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid flashcard ID format",
          details: validation.error.flatten()
        }
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const { flashcardId } = validation.data;

    // 2. Uwierzytelnianie
    const { data: { user }, error: authError } = await locals.supabase.auth.getUser();

    if (authError || !user) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required"
        }
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 3. Pobranie fiszki z weryfikacją własności
    const flashcard = await getFlashcardByIdForUser(
      locals.supabase,
      flashcardId,
      user.id
    );

    if (!flashcard) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "FLASHCARD_NOT_FOUND",
          message: "Flashcard not found or not owned by user"
        }
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 4. Happy path - zwróć fiszkę
    const response: FlashcardDTO = flashcard;
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    // 5. Obsługa nieoczekiwanych błędów
    console.error("Error fetching flashcard:", error);

    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred"
      }
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
```

### Krok 4: Weryfikacja struktury plików

Upewnić się, że istnieją następujące pliki:
- `src/lib/services/flashcard.service.ts` (utworzony w kroku 1)
- `src/pages/api/flashcards/[flashcardId].ts` (utworzony w kroku 3)
- `src/types.ts` (już istnieje - zawiera FlashcardDTO)
- `src/db/database.types.ts` (już istnieje - typy z Supabase)

### Krok 5: Testowanie endpointu

**Test 1: Sukces (200)**
```bash
curl -X GET \
  'http://localhost:3000/api/flashcards/{valid-flashcard-id}' \
  -H 'Authorization: Bearer {valid-token}'
```

**Test 2: Nieprawidłowy UUID (400)**
```bash
curl -X GET \
  'http://localhost:3000/api/flashcards/invalid-uuid' \
  -H 'Authorization: Bearer {valid-token}'
```

**Test 3: Brak uwierzytelnienia (401)**
```bash
curl -X GET \
  'http://localhost:3000/api/flashcards/{valid-flashcard-id}'
```

**Test 4: Fiszka nie należy do użytkownika (404)**
```bash
curl -X GET \
  'http://localhost:3000/api/flashcards/{someone-elses-flashcard-id}' \
  -H 'Authorization: Bearer {valid-token}'
```

**Test 5: Fiszka nie istnieje (404)**
```bash
curl -X GET \
  'http://localhost:3000/api/flashcards/00000000-0000-0000-0000-000000000000' \
  -H 'Authorization: Bearer {valid-token}'
```

### Krok 6: Code quality check

```bash
# Uruchom linter
npm run lint

# Automatyczne poprawki
npm run lint:fix

# Formatowanie kodu
npm run format
```

### Krok 7: Weryfikacja RLS policies

Upewnić się, że w bazie danych istnieją odpowiednie RLS policies dla tabeli `flashcards`:

```sql
-- Sprawdź istniejące policies
SELECT * FROM pg_policies WHERE tablename = 'flashcards';
```

RLS policies powinny zapewniać, że użytkownik może odczytać tylko fiszki ze swoich talii.

### Krok 8: Dokumentacja i commit

1. Zaktualizować dokumentację API (jeśli istnieje)
2. Utworzyć commit zgodnie z Conventional Commits:
   ```bash
   git add .
   git commit -m "feat(api): implement GET /api/flashcards/{flashcardId} endpoint"
   ```

### Checklist implementacji:

- [ ] Utworzono/zaktualizowano `flashcard.service.ts` z funkcją `getFlashcardByIdForUser`
- [ ] Utworzono validation schema z Zod
- [ ] Zaimplementowano GET handler w `[flashcardId].ts`
- [ ] Dodano `export const prerender = false`
- [ ] Obsłużono wszystkie scenariusze błędów (400, 401, 404, 500)
- [ ] Wykorzystano guard clauses i early returns
- [ ] Użyto typów `FlashcardDTO` i `ErrorResponseDTO`
- [ ] Zweryfikowano własność fiszki przez JOIN z tabelą decks
- [ ] Przetestowano wszystkie scenariusze (sukces i błędy)
- [ ] Uruchomiono linter i formatter
- [ ] Zweryfikowano RLS policies w bazie danych
- [ ] Utworzono commit z odpowiednim komunikatem
