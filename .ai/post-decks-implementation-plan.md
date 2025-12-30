# API Endpoint Implementation Plan: POST /api/decks

## 1. Przegląd punktu końcowego

Endpoint `POST /api/decks` służy do tworzenia nowej talii fiszek dla zalogowanego użytkownika. Talia jest podstawową jednostką organizacyjną w aplikacji - użytkownik może mieć wiele talii, ale każda talia musi mieć unikalną nazwę w obrębie użytkownika (zgodnie z ograniczeniem `UNIQUE(user_id, name)` w bazie danych).

**Kluczowe cechy:**
- Wymaga uwierzytelnienia użytkownika
- Przyjmuje tylko nazwę talii (pozostałe pola generowane automatycznie)
- Waliduje długość nazwy (1-100 znaków)
- Zapobiega duplikacji nazw dla tego samego użytkownika
- Zwraca 201 Created przy sukcesie z pełnym obiektem talii

## 2. Szczegóły żądania

### Metoda HTTP
`POST`

### Struktura URL
```
/api/decks
```

### Nagłówki żądania
- `Content-Type: application/json` (wymagany)
- `Authorization: Bearer <token>` (obsługiwany przez Supabase middleware)

### Parametry
**Wymagane (w body):**
- `name` (string) - nazwa talii, 1-100 znaków

**Opcjonalne:**
- Brak

**Auto-generowane:**
- `id` (UUID) - generowany przez bazę danych
- `user_id` (UUID) - pobierany z sesji uwierzytelnionego użytkownika
- `created_at` (TIMESTAMPTZ) - generowany przez bazę danych
- `updated_at` (TIMESTAMPTZ) - generowany przez bazę danych

### Request Body
```json
{
  "name": "Biology 101"
}
```

### Walidacja wejścia (Zod Schema)
```typescript
const createDeckBodySchema = z.object({
  name: z.string().min(1, "Name must not be empty").max(100, "Name must not exceed 100 characters")
});
```

## 3. Wykorzystywane typy

### DTOs (już zdefiniowane w src/types.ts)

**Request DTO:**
```typescript
// Line 130 w src/types.ts
export type CreateDeckRequestDTO = Pick<TablesInsert<"decks">, "name">;
```

**Response DTO:**
```typescript
// Line 115 w src/types.ts
export type DeckDTO = Deck;

// gdzie Deck to:
export type Deck = Tables<"decks">;
```

**Error Response DTO:**
```typescript
// Line 82-89 w src/types.ts
export interface ErrorResponseDTO {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
```

### Command Models
Nie są potrzebne dodatkowe Command Modele - używamy bezpośrednio `TablesInsert<"decks">` z Supabase.

## 4. Szczegóły odpowiedzi

### Sukces (201 Created)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
  "name": "Biology 101",
  "created_at": "2024-12-30T10:00:00Z",
  "updated_at": "2024-12-30T10:00:00Z"
}
```

**Nagłówki:**
- `Content-Type: application/json`
- `X-Content-Type-Options: nosniff`

### Błędy

#### 401 Unauthorized
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

#### 400 Bad Request (walidacja)
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": {
      "name": ["Name must not be empty"]
    }
  }
}
```

#### 409 Conflict (duplikat nazwy)
```json
{
  "error": {
    "code": "DUPLICATE_DECK",
    "message": "A deck with this name already exists"
  }
}
```

#### 500 Internal Server Error
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

## 5. Przepływ danych

### Diagram przepływu
```
1. Request → API Route (POST /api/decks)
   ↓
2. Middleware (Astro) - dostarcza context.locals.supabase
   ↓
3. Walidacja uwierzytelnienia (supabase.auth.getUser())
   ↓ (jeśli OK)
4. Parsowanie body JSON
   ↓
5. Walidacja Zod (name: 1-100 chars)
   ↓ (jeśli OK)
6. DeckService.createDeck(userId, { name })
   ↓
7. Supabase INSERT do tabeli "decks"
   ↓
8. Database generuje: id, created_at, updated_at
   ↓
9. Database sprawdza UNIQUE constraint (user_id, name)
   ↓ (jeśli unique)
10. Zwraca pełny obiekt deck
    ↓
11. API zwraca 201 Created z DeckDTO
```

### Interakcje z bazą danych

**Tabela:** `decks`

**Operacja:** INSERT
```sql
INSERT INTO decks (user_id, name)
VALUES ($1, $2)
RETURNING id, user_id, name, created_at, updated_at;
```

**Supabase Query:**
```typescript
const { data, error } = await this.supabase
  .from("decks")
  .insert({ user_id: userId, name: data.name })
  .select()
  .single();
```

**Ograniczenia sprawdzane przez bazę:**
- `NOT NULL` na user_id, name
- `CHECK (char_length(name) BETWEEN 1 AND 100)`
- `UNIQUE(user_id, name)` - może wywołać błąd 23505
- Foreign Key: `user_id → profiles(user_id)` ON DELETE CASCADE

## 6. Względy bezpieczeństwa

### Uwierzytelnienie
- **Mechanizm:** Supabase Auth przez middleware (context.locals.supabase)
- **Weryfikacja:** `supabase.auth.getUser()` - sprawdza JWT token
- **Obsługa błędów:** Zwróć 401 jeśli user is null lub authError występuje

### Autoryzacja
- **Zasada:** Użytkownik może tworzyć talie tylko dla siebie
- **Implementacja:** Użyj `user.id` z sesji, NIGDY nie pobieraj `user_id` z request body
- **RLS (Row Level Security):** Nie dotyczy bezpośrednio POST (policies na SELECT/UPDATE/DELETE)

### Walidacja danych wejściowych
- **Typ danych:** Zod wymusza, że `name` jest string
- **Długość:** 1-100 znaków (zgodne z CHECK constraint w bazie)
- **XSS:** Supabase obsługuje parametryzowane zapytania, brak ryzyka SQL injection
- **Sanitizacja:** Nie wymagana dla storage, ale długość jest ograniczona

### Ochrona przed atakami
- **SQL Injection:** Chronione przez Supabase (parametryzowane queries)
- **XSS:** Dane są tylko w JSON API i bazie danych (nie renderowane bezpośrednio w HTML)
- **CSRF:** Rozważ dodanie tokenów CSRF w produkcji (obecnie nie zaimplementowane)
- **Rate Limiting:** Rozważ implementację w produkcji (obecnie nie zaimplementowane)

### Bezpieczeństwo nagłówków
- Dodaj `X-Content-Type-Options: nosniff` do wszystkich odpowiedzi
- Używaj `Content-Type: application/json` dla consistency

### Obsługa duplikatów
- **Unikalność:** Database enforce UNIQUE(user_id, name)
- **Kod błędu PostgreSQL:** 23505 (unique_violation)
- **Odpowiedź API:** 409 Conflict (nie 500!)

## 7. Obsługa błędów

### Scenariusze błędów i odpowiedzi

| Scenariusz | Status | Error Code | Message | Details |
|------------|--------|------------|---------|---------|
| Brak/nieprawidłowy token auth | 401 | UNAUTHORIZED | "Authentication required" | - |
| Request body brak | 400 | VALIDATION_ERROR | "Invalid request body" | - |
| Nieprawidłowy JSON | 400 | VALIDATION_ERROR | "Invalid JSON in request body" | - |
| `name` brak/pusty | 400 | VALIDATION_ERROR | "Invalid request body" | Zod errors |
| `name` > 100 znaków | 400 | VALIDATION_ERROR | "Invalid request body" | Zod errors |
| `name` nie jest string | 400 | VALIDATION_ERROR | "Invalid request body" | Zod errors |
| Duplikat nazwy dla user | 409 | DUPLICATE_DECK | "A deck with this name already exists" | - |
| Błąd bazy danych | 500 | INTERNAL_ERROR | "An unexpected error occurred" | - |
| Nieoczekiwany błąd | 500 | INTERNAL_ERROR | "An unexpected error occurred" | - |

### Strategia obsługi błędów

**1. Walidacja uwierzytelnienia (krok 1):**
```typescript
const { data: { user }, error: authError } = await context.locals.supabase.auth.getUser();

if (authError || !user) {
  return new Response(JSON.stringify({
    error: { code: "UNAUTHORIZED", message: "Authentication required" }
  }), { status: 401 });
}
```

**2. Parsowanie i walidacja body (krok 2):**
```typescript
let body: unknown;
try {
  body = await context.request.json();
} catch {
  return new Response(JSON.stringify({
    error: { code: "VALIDATION_ERROR", message: "Invalid JSON in request body" }
  }), { status: 400 });
}

let validatedData: CreateDeckRequestDTO;
try {
  validatedData = createDeckBodySchema.parse(body);
} catch (error) {
  if (error instanceof z.ZodError) {
    return new Response(JSON.stringify({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request body",
        details: error.flatten().fieldErrors
      }
    }), { status: 400 });
  }
  throw error; // Re-throw unexpected errors
}
```

**3. Obsługa duplikatu (w service layer):**
```typescript
// W DeckService.createDeck()
const { data, error } = await this.supabase
  .from("decks")
  .insert({ user_id: userId, name: data.name })
  .select()
  .single();

if (error) {
  // Check for unique constraint violation
  if (error.code === "23505") {
    throw new DuplicateDeckError("A deck with this name already exists");
  }
  throw new Error(`Failed to create deck: ${error.message}`);
}
```

**4. Obsługa błędów w route (krok 3):**
```typescript
try {
  const deckService = new DeckService(context.locals.supabase);
  const deck = await deckService.createDeck(user.id, validatedData);

  return new Response(JSON.stringify(deck), {
    status: 201,
    headers: {
      "Content-Type": "application/json",
      "X-Content-Type-Options": "nosniff"
    }
  });
} catch (error) {
  if (error instanceof DuplicateDeckError) {
    return new Response(JSON.stringify({
      error: { code: "DUPLICATE_DECK", message: error.message }
    }), { status: 409 });
  }

  console.error("Error in POST /api/decks:", error);
  return new Response(JSON.stringify({
    error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" }
  }), { status: 500 });
}
```

### Logowanie błędów
- Używaj `console.error()` w development (zgodnie z istniejącym wzorcem)
- Dołącz kontekst: nazwa endpointa, szczegóły błędu
- W produkcji: rozważ proper logging service (Sentry, DataDog, etc.)

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła

1. **Database INSERT operation** - pojedyncza operacja, bardzo szybka
2. **Authentication check** - JWT verification, szybkie
3. **JSON parsing** - nieznaczny overhead dla małego payload

### Strategie optymalizacji

**Nie wymagane w tym endpoincie** - operacja jest prosta i szybka:
- Pojedyncze INSERT do bazy danych
- Brak złożonych zapytań ani JOIN
- Brak zewnętrznych API calls
- Minimalna walidacja

**Monitoring:**
- Rozważ dodanie metryk czasu odpowiedzi w produkcji
- Monitoruj częstotliwość błędów 409 (może wskazywać na problemy UX)

**Skalowalność:**
- Database indexes na (user_id, name) już istnieją (dla UNIQUE constraint)
- Supabase Connection Pooling obsługuje concurrent requests
- Rozważ rate limiting per user w produkcji

## 9. Etapy wdrożenia

### Krok 1: Rozszerzenie DeckService
**Plik:** [src/lib/services/deck.service.ts](src/lib/services/deck.service.ts)

**Zadanie:** Dodaj metodę `createDeck()` do istniejącej klasy `DeckService`

**Implementacja:**
```typescript
/**
 * Custom error for duplicate deck names
 */
export class DuplicateDeckError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DuplicateDeckError";
  }
}

/**
 * Creates a new deck for the specified user.
 *
 * Flow:
 * 1. Insert deck with user_id and name
 * 2. Database generates id, created_at, updated_at
 * 3. Database validates UNIQUE(user_id, name) constraint
 * 4. Return created deck
 *
 * @param userId - UUID of the authenticated user
 * @param data - Deck creation data (name only)
 * @returns Created deck with all fields
 * @throws {DuplicateDeckError} If deck with same name already exists
 * @throws {Error} If database operation fails
 */
async createDeck(userId: string, data: CreateDeckRequestDTO): Promise<DeckDTO> {
  const { data: deck, error } = await this.supabase
    .from("decks")
    .insert({
      user_id: userId,
      name: data.name,
    })
    .select()
    .single();

  if (error) {
    // Check for unique constraint violation (duplicate name)
    if (error.code === "23505") {
      throw new DuplicateDeckError("A deck with this name already exists");
    }
    throw new Error(`Failed to create deck: ${error.message}`);
  }

  if (!deck) {
    throw new Error("Deck creation succeeded but no data returned");
  }

  return deck;
}
```

**Import statements do dodania:**
```typescript
import type { CreateDeckRequestDTO, DeckDTO } from "@/types";
```

### Krok 2: Aktualizacja API Route
**Plik:** [src/pages/api/decks.ts](src/pages/api/decks.ts)

**Zadanie:** Dodaj handler `POST` do istniejącego pliku (który obecnie ma tylko `GET`)

**Implementacja:**
```typescript
// Dodaj import dla DuplicateDeckError
import { DeckService, DuplicateDeckError } from "@/lib/services/deck.service";
import type { CreateDeckRequestDTO, DeckDTO } from "@/types";

// Dodaj schemat walidacji (przed GET handler)
const createDeckBodySchema = z.object({
  name: z
    .string()
    .min(1, "Name must not be empty")
    .max(100, "Name must not exceed 100 characters"),
});

/**
 * POST /api/decks
 *
 * Creates a new deck for the authenticated user.
 * Requires authentication.
 *
 * Request body:
 * - name: string (1-100 characters, required)
 *
 * @returns DeckDTO (201 Created)
 * @throws 401 if user not authenticated
 * @throws 400 if validation fails
 * @throws 409 if deck with same name exists
 * @throws 500 if unexpected error occurs
 */
export const POST: APIRoute = async (context) => {
  // Step 1: Validate authentication
  const {
    data: { user },
    error: authError,
  } = await context.locals.supabase.auth.getUser();

  if (authError || !user) {
    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Step 2: Parse and validate request body
  let body: unknown;
  try {
    body = await context.request.json();
  } catch {
    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid JSON in request body",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let validatedData: CreateDeckRequestDTO;
  try {
    validatedData = createDeckBodySchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request body",
          details: error.flatten().fieldErrors,
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    // Re-throw unexpected validation errors
    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Step 3: Call service to create deck
  try {
    const deckService = new DeckService(context.locals.supabase);
    const deck: DeckDTO = await deckService.createDeck(user.id, validatedData);

    return new Response(JSON.stringify(deck), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    // Handle duplicate deck name
    if (error instanceof DuplicateDeckError) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "DUPLICATE_DECK",
          message: error.message,
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Log unexpected errors
    // eslint-disable-next-line no-console
    console.error("Error in POST /api/decks:", error);

    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

### Krok 3: Testowanie manualne

**Przygotowanie:**
1. Upewnij się, że lokalny Supabase działa (`supabase status`)
2. Uzyskaj prawidłowy auth token (zaloguj się w aplikacji lub użyj Supabase Dashboard)

**Test Case 1: Sukces (201 Created)**
```bash
curl -X POST http://localhost:3000/api/decks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{"name": "Test Deck"}'

# Oczekiwana odpowiedź: 201 Created
# {
#   "id": "uuid",
#   "user_id": "uuid",
#   "name": "Test Deck",
#   "created_at": "2024-12-30T...",
#   "updated_at": "2024-12-30T..."
# }
```

**Test Case 2: Brak autentykacji (401)**
```bash
curl -X POST http://localhost:3000/api/decks \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Deck"}'

# Oczekiwana odpowiedź: 401
# {
#   "error": {
#     "code": "UNAUTHORIZED",
#     "message": "Authentication required"
#   }
# }
```

**Test Case 3: Walidacja - name za długi (400)**
```bash
curl -X POST http://localhost:3000/api/decks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{"name": "'"$(printf 'a%.0s' {1..101})"'"}'

# Oczekiwana odpowiedź: 400
# {
#   "error": {
#     "code": "VALIDATION_ERROR",
#     "message": "Invalid request body",
#     "details": { "name": ["Name must not exceed 100 characters"] }
#   }
# }
```

**Test Case 4: Walidacja - name pusty (400)**
```bash
curl -X POST http://localhost:3000/api/decks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{"name": ""}'

# Oczekiwana odpowiedź: 400
```

**Test Case 5: Duplikat nazwy (409)**
```bash
# Pierwszy request - sukces
curl -X POST http://localhost:3000/api/decks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{"name": "Duplicate Test"}'

# Drugi request - duplikat
curl -X POST http://localhost:3000/api/decks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{"name": "Duplicate Test"}'

# Oczekiwana odpowiedź drugiego: 409
# {
#   "error": {
#     "code": "DUPLICATE_DECK",
#     "message": "A deck with this name already exists"
#   }
# }
```

**Test Case 6: Nieprawidłowy JSON (400)**
```bash
curl -X POST http://localhost:3000/api/decks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{invalid json}'

# Oczekiwana odpowiedź: 400
```

### Krok 4: Weryfikacja typu

**Zadanie:** Upewnij się, że TypeScript nie zgłasza błędów

```bash
npm run lint
```

**Oczekiwany rezultat:** Brak błędów TypeScript ani ESLint

### Krok 5: Weryfikacja w bazie danych

**Zadanie:** Sprawdź, czy deck został poprawnie utworzony w bazie danych

```sql
-- Podłącz się do lokalnej Supabase database
-- psql postgres://postgres:postgres@localhost:54322/postgres

SELECT id, user_id, name, created_at, updated_at
FROM decks
ORDER BY created_at DESC
LIMIT 5;
```

**Weryfikuj:**
- `id` jest UUID
- `user_id` odpowiada autentykowanemu użytkownikowi
- `name` pasuje do wysłanego
- `created_at` i `updated_at` są prawidłowe timestamps

### Krok 6: Dokumentacja

**Plik:** [.ai/api-endpoints.md](.ai/api-endpoints.md) (jeśli istnieje) lub README

**Zadanie:** Dodaj dokumentację endpointa POST /api/decks z przykładami request/response

**Struktura:**
- Opis endpointa
- Wymagania uwierzytelnienia
- Request format
- Response format
- Wszystkie kody błędów z przykładami

### Podsumowanie kroków implementacji

| Krok | Plik | Akcja | Czas szacowany |
|------|------|-------|----------------|
| 1 | deck.service.ts | Dodaj createDeck() i DuplicateDeckError | 15 min |
| 2 | pages/api/decks.ts | Dodaj POST handler z walidacją | 25 min |
| 3 | Manual | Testowanie 6 scenariuszy | 20 min |
| 4 | CLI | npm run lint | 2 min |
| 5 | Database | Weryfikacja SQL | 5 min |
| 6 | Docs | Aktualizacja dokumentacji | 10 min |
| **TOTAL** | | | **~77 min** |

## 10. Checklist przed merge

- [ ] Metoda `createDeck()` dodana do `DeckService`
- [ ] Custom error `DuplicateDeckError` zdefiniowany i eksportowany
- [ ] Handler `POST` dodany do `/api/decks`
- [ ] Walidacja Zod dla request body zaimplementowana
- [ ] Obsługa wszystkich błędów (401, 400, 409, 500) działa poprawnie
- [ ] Wszystkie 6 test cases przechodzą pomyślnie
- [ ] `npm run lint` nie zgłasza błędów
- [ ] Deck pojawia się w bazie danych z poprawnymi wartościami
- [ ] Dokumentacja zaktualizowana
- [ ] Kod przestrzega wzorców z CLAUDE.md (early returns, error handling)
- [ ] Response headers zawierają `X-Content-Type-Options: nosniff`
