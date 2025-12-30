# API Endpoint Implementation Plan: PATCH /api/decks/{deckId}

## 1. Przegląd punktu końcowego

Endpoint umożliwia aktualizację nazwy istniejącej talii fiszek. Użytkownik musi być uwierzytelniony i może aktualizować tylko swoje własne talie. Operacja jest atomowa i respektuje ograniczenie unikalności nazw talii w obrębie konta użytkownika.

**Kluczowe funkcjonalności:**
- Aktualizacja nazwy talii
- Walidacja własności zasobu (authorization)
- Obsługa konfliktów nazw (UNIQUE constraint)
- Automatyczna aktualizacja pola `updated_at`

## 2. Szczegóły żądania

### Metoda HTTP
`PATCH`

### Struktura URL
```
/api/decks/{deckId}
```

### Parametry

**Path Parameters:**
- `deckId` (wymagany): UUID - Unikalny identyfikator talii do aktualizacji

**Request Body:**
```json
{
  "name": "Advanced Biology"
}
```

**Struktura Request Body:**
- `name` (wymagany): string
  - Minimalna długość: 1 znak
  - Maksymalna długość: 100 znaków
  - Walidacja: Zod schema oraz database CHECK constraint

**Request Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer <token>` (zarządzane przez Supabase)

## 3. Wykorzystywane typy

### Istniejące typy (z src/types.ts)

**Request DTO:**
```typescript
// Już zdefiniowany w src/types.ts (linie 136-138)
export type UpdateDeckRequestDTO = Pick<TablesUpdate<"decks">, "name"> & {
  name: string; // name jest wymagane dla update
};
```

**Response DTO:**
```typescript
// Już zdefiniowany w src/types.ts (linia 115)
export type DeckDTO = Deck;

// Struktura Deck z database.types.ts:
// {
//   id: string (UUID)
//   user_id: string (UUID)
//   name: string
//   created_at: string (ISO 8601)
//   updated_at: string (ISO 8601)
// }
```

**Error Response:**
```typescript
// Już zdefiniowany w src/types.ts (linie 82-89)
export interface ErrorResponseDTO {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
```

### Zod Schemas (do utworzenia w endpoint)

```typescript
// Walidacja deckId z path parameter
const deckIdSchema = z.string().uuid("Invalid deck ID format");

// Walidacja request body
const updateDeckSchema = z.object({
  name: z
    .string()
    .min(1, "Deck name must be at least 1 character")
    .max(100, "Deck name must not exceed 100 characters"),
});
```

## 4. Szczegóły odpowiedzi

### Sukces (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "name": "Advanced Biology",
  "created_at": "2024-12-01T10:00:00Z",
  "updated_at": "2024-12-10T15:00:00Z"
}
```

**Headers:**
- `Content-Type: application/json`

**Uwagi:**
- Pole `updated_at` jest automatycznie aktualizowane przez bazę danych
- Zwracany jest pełny obiekt DeckDTO zawierający wszystkie pola

### Błędy

**400 Bad Request - Walidacja**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": {
      "name": ["Deck name must be at least 1 character"]
    }
  }
}
```

**401 Unauthorized**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**404 Not Found**
```json
{
  "error": {
    "code": "DECK_NOT_FOUND",
    "message": "Deck not found"
  }
}
```

**409 Conflict**
```json
{
  "error": {
    "code": "DUPLICATE_DECK_NAME",
    "message": "A deck with this name already exists"
  }
}
```

**500 Internal Server Error**
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
[Client]
   |
   | PATCH /api/decks/{deckId}
   | Body: { name: "Advanced Biology" }
   v
[API Route: src/pages/api/decks/[deckId].ts - PATCH handler]
   |
   | 1. Walidacja deckId (Zod UUID)
   | 2. Walidacja request body (Zod schema)
   | 3. Uwierzytelnienie (Supabase auth.getUser())
   |
   v
[DeckService.updateDeck(userId, deckId, data)]
   |
   | 4. Wykonanie UPDATE query z filtrowaniem:
   |    - WHERE id = deckId
   |    - AND user_id = userId
   |
   v
[Supabase PostgreSQL]
   |
   | 5. Walidacja database constraints:
   |    - CHECK (char_length(name) BETWEEN 1 AND 100)
   |    - UNIQUE (user_id, name)
   | 6. Automatyczna aktualizacja updated_at (trigger/default)
   | 7. Zwrócenie zaktualizowanego wiersza
   |
   v
[DeckService]
   |
   | 8. Obsługa błędów:
   |    - Brak zmodyfikowanych wierszy → DeckNotFoundError
   |    - Kod błędu 23505 (unique violation) → DuplicateDeckError
   |
   v
[API Route]
   |
   | 9. Transformacja błędów na odpowiednie HTTP response
   | 10. Zwrócenie DeckDTO jako JSON (200)
   |
   v
[Client]
```

### Interakcje z bazą danych

**Query wykonywane w DeckService:**

```typescript
// Pojedyncze zapytanie UPDATE z ownership validation
await this.supabase
  .from("decks")
  .update({ name: data.name })
  .eq("id", deckId)
  .eq("user_id", userId)  // CRITICAL: ownership validation
  .select()
  .single();
```

**Mechanizmy bazodanowe:**
- **RLS (Row Level Security)**: Powinien być włączony na tabeli `decks`
- **CHECK constraint**: `char_length(name) BETWEEN 1 AND 100`
- **UNIQUE constraint**: `UNIQUE(user_id, name)`
- **Trigger/Default**: Automatyczna aktualizacja `updated_at` na NOW()

## 6. Względy bezpieczeństwa

### Uwierzytelnienie (Authentication)

**Mechanizm:**
- Wykorzystanie Supabase Auth poprzez `context.locals.supabase.auth.getUser()`
- Token JWT przekazywany w headerze Authorization przez Supabase SDK
- Supabase automatycznie weryfikuje token i zwraca obiekt użytkownika

**Implementacja:**
```typescript
const {
  data: { user },
  error: authError,
} = await context.locals.supabase.auth.getUser();

// Guard clause pattern
if (authError || !user) {
  return errorResponse("UNAUTHORIZED", "Authentication required", 401);
}
```

**Scenariusze błędów:**
- Token wygasły → 401
- Token nieprawidłowy → 401
- Brak tokenu → 401

### Autoryzacja (Authorization - Ownership Validation)

**KRYTYCZNE: Walidacja własności zasobu**

Użytkownik może aktualizować tylko swoje własne talie. Implementacja "defense in depth":

1. **Poziom aplikacji (Service Layer):**
   ```typescript
   .eq("id", deckId)
   .eq("user_id", userId)  // Filtrowanie po user_id
   ```

2. **Poziom bazy danych (RLS):**
   - Row Level Security powinien być skonfigurowany zgodnie z CLAUDE.md
   - Policy dla UPDATE: `user_id = auth.uid()`

**Scenariusze ataków:**
- Użytkownik A próbuje zaktualizować talię użytkownika B → 404 (nie ujawniamy, czy talia istnieje)
- Manipulacja deckId w URL → 404 lub 400 (invalid UUID)

### Walidacja danych wejściowych

**Warstwa 1: Zod Schema Validation (API Route)**
```typescript
// Walidacja na poziomie endpointu
const updateDeckSchema = z.object({
  name: z.string().min(1).max(100),
});
```

**Warstwa 2: Database Constraints**
- CHECK constraint: `char_length(name) BETWEEN 1 AND 100`
- UNIQUE constraint: `UNIQUE(user_id, name)`

**Zapobieganie atakom:**
- **SQL Injection**: Parametryzowane zapytania Supabase SDK
- **XSS**: Walidacja długości i typu danych (string)
- **Buffer Overflow**: Limit 100 znaków
- **Empty/Whitespace names**: min(1) w Zod
- **Unicode/Special chars**: PostgreSQL TEXT type obsługuje prawidłowo

### Ochrona przed Race Conditions

**Scenariusz:**
Użytkownik wysyła dwa równoczesne requesty PATCH z różnymi nazwami.

**Ochrona:**
- PostgreSQL ACID guarantees zapewniają atomowość
- Ostatni commit wygrywa (last-write-wins)
- Brak potrzeby pessimistic locking dla tej operacji

### Logging bezpieczeństwa

```typescript
// Logowanie nieoczekiwanych błędów (mogą wskazywać ataki)
// eslint-disable-next-line no-console
console.error("Error in PATCH /api/decks/[deckId]:", error);
```

**Uwaga:** W produkcji rozważyć structured logging z kontekstem:
- userId (po uwierzytelnieniu)
- deckId
- IP address
- Timestamp

## 7. Obsługa błędów

### Katalog błędów

| Kod błędu | HTTP Status | Przyczyna | Obsługa |
|-----------|-------------|-----------|---------|
| `VALIDATION_ERROR` | 400 | Nieprawidłowy format deckId (nie UUID) | Zod validation w endpoint, zwróć details |
| `VALIDATION_ERROR` | 400 | Nieprawidłowy request body (name poza zakresem 1-100) | Zod validation w endpoint, zwróć details |
| `UNAUTHORIZED` | 401 | Brak lub nieprawidłowy token uwierzytelnienia | Guard clause po auth.getUser() |
| `DECK_NOT_FOUND` | 404 | Talia nie istnieje lub nie należy do użytkownika | Catch DeckNotFoundError w endpoint |
| `DUPLICATE_DECK_NAME` | 409 | Użytkownik ma już talię o tej nazwie | Catch DuplicateDeckError w endpoint |
| `INTERNAL_ERROR` | 500 | Nieoczekiwany błąd bazy danych lub aplikacji | Catch-all handler, log error |

### Implementacja obsługi błędów w DeckService

```typescript
async updateDeck(userId: string, deckId: string, data: UpdateDeckRequestDTO): Promise<DeckDTO> {
  const { data: deck, error } = await this.supabase
    .from("decks")
    .update({ name: data.name })
    .eq("id", deckId)
    .eq("user_id", userId)
    .select()
    .single();

  // Guard clause: database error
  if (error) {
    // Unique constraint violation (23505 = duplicate key)
    if (error.code === "23505") {
      throw new DuplicateDeckError("A deck with this name already exists");
    }
    throw new Error(`Failed to update deck: ${error.message}`);
  }

  // Guard clause: deck not found or not owned
  if (!deck) {
    throw new DeckNotFoundError("Deck not found");
  }

  // Happy path
  return deck;
}
```

### Implementacja obsługi błędów w API Route

```typescript
export const PATCH: APIRoute = async (context) => {
  try {
    // ... validation, auth, service call ...
    return successResponse(deck, 200);
  } catch (error) {
    // Handle known errors with specific codes
    if (error instanceof DeckNotFoundError) {
      return errorResponse("DECK_NOT_FOUND", "Deck not found", 404);
    }

    if (error instanceof DuplicateDeckError) {
      return errorResponse("DUPLICATE_DECK_NAME", error.message, 409);
    }

    // Log and handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("Error in PATCH /api/decks/[deckId]:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
};
```

### Error Response Pattern

Wszystkie błędy zwracane są w standardowym formacie ErrorResponseDTO:

```typescript
{
  error: {
    code: string,        // Machine-readable code
    message: string,     // Human-readable message
    details?: object     // Optional validation details (dla 400)
  }
}
```

## 8. Rozważania dotyczące wydajności

### Optymalizacje

1. **Single Database Round-Trip**
   - Operacja UPDATE z `.select().single()` zwraca zaktualizowany wiersz w jednym zapytaniu
   - Brak potrzeby osobnego SELECT po UPDATE

2. **Index Usage**
   - PRIMARY KEY index na `id` zapewnia O(log n) lookup
   - UNIQUE index na `(user_id, name)` automatycznie utworzony przez constraint
   - Composite filter `.eq("id", deckId).eq("user_id", userId)` wykorzystuje oba indexy

3. **Minimalizacja transferu danych**
   - Request body: ~20-150 bytes (tylko name)
   - Response: ~200-300 bytes (DeckDTO)
   - Brak paginacji ani agregacji - prostą operacja CRUD

### Potencjalne wąskie gardła

1. **Unique Constraint Check**
   - Każdy UPDATE musi sprawdzić UNIQUE(user_id, name) constraint
   - Koszt: dodatkowy index scan
   - Mitygacja: UNIQUE index jest wysoce zoptymalizowany w PostgreSQL

2. **updated_at Trigger/Default**
   - Jeśli `updated_at` aktualizowane przez trigger, dodatkowe overhead
   - Koszt: minimalny (microseconds)
   - Mitygacja: PostgreSQL triggers są bardzo wydajne

3. **Concurrent Updates**
   - Rzadki scenariusz: użytkownik aktualizuje tę samą talię równocześnie z dwóch urządzeń
   - Zachowanie: last-write-wins (ACID guarantees)
   - Brak deadlocków: operacja na pojedynczym wierszu

### Monitoring i metryki

Metryki do śledzenia w produkcji:
- **Latency p50/p95/p99**: Oczekiwane < 100ms dla p95
- **Error rate**: 4xx vs 5xx
- **Most common errors**: 404 (not found) vs 409 (duplicate) ratio
- **Database query time**: Powinno być < 50ms

### Skalowanie

**Obecne ograniczenia:**
- Brak limitów rate limiting (może być dodany przez Supabase lub middleware)
- Brak caching (niepotrzebny dla UPDATE operations)

**Przyszłe optymalizacje:**
- Rate limiting per user (np. 100 req/min)
- Request idempotency headers (dla retry logic)
- Optimistic locking z version field (jeśli potrzebny)

## 9. Etapy wdrożenia

### Krok 1: Rozszerzenie DeckService o metodę updateDeck

**Plik:** `src/lib/services/deck.service.ts`

**Zadanie:**
Dodaj metodę `updateDeck()` do istniejącej klasy DeckService.

**Implementacja:**
```typescript
/**
 * Updates a deck's name.
 *
 * Flow:
 * 1. Execute UPDATE with ownership validation (filter by id AND user_id)
 * 2. Database validates UNIQUE(user_id, name) constraint
 * 3. Database auto-updates updated_at timestamp
 * 4. Throw DeckNotFoundError if no rows affected
 * 5. Throw DuplicateDeckError if unique constraint violated
 * 6. Return updated DeckDTO
 *
 * @param userId - UUID of the authenticated user
 * @param deckId - UUID of the deck to update
 * @param data - Update data (name only)
 * @returns Updated deck with all fields
 * @throws {DeckNotFoundError} If deck not found or not owned by user
 * @throws {DuplicateDeckError} If deck with same name already exists
 * @throws {Error} If database operation fails
 */
async updateDeck(userId: string, deckId: string, data: UpdateDeckRequestDTO): Promise<DeckDTO> {
  const { data: deck, error } = await this.supabase
    .from("decks")
    .update({ name: data.name })
    .eq("id", deckId)
    .eq("user_id", userId) // CRITICAL: ownership validation
    .select()
    .single();

  // Guard clause: database error
  if (error) {
    // Check for unique constraint violation (duplicate name)
    if (error.code === "23505") {
      throw new DuplicateDeckError("A deck with this name already exists");
    }
    throw new Error(`Failed to update deck: ${error.message}`);
  }

  // Guard clause: deck not found or not owned
  if (!deck) {
    throw new DeckNotFoundError("Deck not found");
  }

  // Happy path
  return deck;
}
```

**Testy weryfikacyjne:**
- Poprawna aktualizacja nazwy własnej talii
- Błąd 404 przy próbie aktualizacji nieistniejącej talii
- Błąd 404 przy próbie aktualizacji talii innego użytkownika
- Błąd 409 przy konflikcie nazw (UNIQUE constraint)

### Krok 2: Utworzenie PATCH handler w API Route

**Plik:** `src/pages/api/decks/[deckId].ts`

**Zadanie:**
Dodaj export funkcji `PATCH` do istniejącego pliku (który już ma handler `GET`).

**Implementacja:**
```typescript
// Import Zod na początku pliku
import { z } from "zod";

// Definicja Zod schema dla request body
const updateDeckSchema = z.object({
  name: z
    .string()
    .min(1, "Deck name must be at least 1 character")
    .max(100, "Deck name must not exceed 100 characters"),
});

/**
 * PATCH /api/decks/{deckId}
 *
 * Updates a deck's name.
 * Requires authentication and ownership validation.
 *
 * @param deckId - UUID path parameter
 * @param body - UpdateDeckRequestDTO { name: string }
 * @returns DeckDTO (200 OK)
 * @throws 400 if deckId or body is invalid
 * @throws 401 if user not authenticated
 * @throws 404 if deck not found or not owned by user
 * @throws 409 if deck with same name already exists
 * @throws 500 if unexpected error occurs
 */
export const PATCH: APIRoute = async (context) => {
  try {
    // Step 1: Validate deckId format
    const deckId = context.params.deckId;

    let validatedDeckId: string;
    try {
      validatedDeckId = deckIdSchema.parse(deckId);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return errorResponse(
          "VALIDATION_ERROR",
          "Invalid deck ID format",
          400,
          error.flatten().fieldErrors
        );
      }
      throw error;
    }

    // Step 2: Parse and validate request body
    let requestBody: unknown;
    try {
      requestBody = await context.request.json();
    } catch {
      return errorResponse("VALIDATION_ERROR", "Invalid JSON in request body", 400);
    }

    let validatedData: UpdateDeckRequestDTO;
    try {
      validatedData = updateDeckSchema.parse(requestBody);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return errorResponse(
          "VALIDATION_ERROR",
          "Invalid request data",
          400,
          error.flatten().fieldErrors
        );
      }
      throw error;
    }

    // Step 3: Authenticate user
    const {
      data: { user },
      error: authError,
    } = await context.locals.supabase.auth.getUser();

    // Guard clause: authentication failed
    if (authError || !user) {
      return errorResponse("UNAUTHORIZED", "Authentication required", 401);
    }

    // Step 4: Call service layer
    const deckService = new DeckService(context.locals.supabase);
    const deck = await deckService.updateDeck(user.id, validatedDeckId, validatedData);

    // Step 5: Return success response
    return successResponse(deck, 200);
  } catch (error) {
    // Handle DeckNotFoundError
    if (error instanceof DeckNotFoundError) {
      return errorResponse("DECK_NOT_FOUND", "Deck not found", 404);
    }

    // Handle DuplicateDeckError
    if (error instanceof DuplicateDeckError) {
      return errorResponse("DUPLICATE_DECK_NAME", error.message, 409);
    }

    // Log and handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("Error in PATCH /api/decks/[deckId]:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
};
```

**Uwagi:**
- Reuse istniejącego `deckIdSchema` z GET handlera
- Import `DuplicateDeckError` z deck.service.ts (już zaimportowany `DeckNotFoundError`)
- Zastosowanie guard clause pattern (zgodnie z CLAUDE.md)
- ESLint disable dla console.error (zgodnie z istniejącym wzorcem)

### Krok 3: Aktualizacja importów w [deckId].ts

**Plik:** `src/pages/api/decks/[deckId].ts`

**Zadanie:**
Upewnij się, że wszystkie potrzebne typy i funkcje są zaimportowane.

**Zmiany:**
```typescript
import type { APIRoute } from "astro";
import { z } from "zod";
import { DeckService, DeckNotFoundError, DuplicateDeckError } from "@/lib/services/deck.service";
import { errorResponse, successResponse } from "@/lib/utils/api-response";
import type { UpdateDeckRequestDTO } from "@/types";
```

**Nowe importy:**
- `DuplicateDeckError` (do obsługi 409)
- `UpdateDeckRequestDTO` (type dla request body)

### Krok 4: Testowanie endpoint

**Testy manualne:**

1. **Test sukcesu (200):**
   ```bash
   curl -X PATCH http://localhost:3000/api/decks/{valid-deck-id} \
     -H "Authorization: Bearer {valid-token}" \
     -H "Content-Type: application/json" \
     -d '{"name": "Updated Deck Name"}'
   ```
   Oczekiwane: 200 OK, zwrócony DeckDTO z nową nazwą i zaktualizowanym `updated_at`

2. **Test walidacji - invalid UUID (400):**
   ```bash
   curl -X PATCH http://localhost:3000/api/decks/not-a-uuid \
     -H "Authorization: Bearer {valid-token}" \
     -H "Content-Type: application/json" \
     -d '{"name": "Test"}'
   ```
   Oczekiwane: 400 Bad Request, `VALIDATION_ERROR`

3. **Test walidacji - empty name (400):**
   ```bash
   curl -X PATCH http://localhost:3000/api/decks/{valid-deck-id} \
     -H "Authorization: Bearer {valid-token}" \
     -H "Content-Type: application/json" \
     -d '{"name": ""}'
   ```
   Oczekiwane: 400 Bad Request, `VALIDATION_ERROR`

4. **Test walidacji - name too long (400):**
   ```bash
   curl -X PATCH http://localhost:3000/api/decks/{valid-deck-id} \
     -H "Authorization: Bearer {valid-token}" \
     -H "Content-Type: application/json" \
     -d '{"name": "a very long name exceeding one hundred characters...{101+ chars}"}'
   ```
   Oczekiwane: 400 Bad Request, `VALIDATION_ERROR`

5. **Test authentication (401):**
   ```bash
   curl -X PATCH http://localhost:3000/api/decks/{valid-deck-id} \
     -H "Content-Type: application/json" \
     -d '{"name": "Test"}'
   ```
   Oczekiwane: 401 Unauthorized, `UNAUTHORIZED`

6. **Test ownership - deck nie istnieje (404):**
   ```bash
   curl -X PATCH http://localhost:3000/api/decks/00000000-0000-0000-0000-000000000000 \
     -H "Authorization: Bearer {valid-token}" \
     -H "Content-Type: application/json" \
     -d '{"name": "Test"}'
   ```
   Oczekiwane: 404 Not Found, `DECK_NOT_FOUND`

7. **Test duplicate name (409):**
   ```bash
   # Najpierw utwórz dwie talie o różnych nazwach
   # Następnie spróbuj zmienić nazwę jednej na nazwę drugiej
   curl -X PATCH http://localhost:3000/api/decks/{deck-1-id} \
     -H "Authorization: Bearer {valid-token}" \
     -H "Content-Type: application/json" \
     -d '{"name": "Existing Deck Name"}'
   ```
   Oczekiwane: 409 Conflict, `DUPLICATE_DECK_NAME`

**Testy integracyjne:**
- Wykonaj sekwencję: CREATE deck → PATCH deck → GET deck → verify updated name
- Sprawdź, że `updated_at` jest późniejszy niż `created_at` po PATCH
- Sprawdź, że użytkownik A nie może zaktualizować talii użytkownika B

### Krok 5: Weryfikacja jakości kodu

**Zadanie:**
Uruchom narzędzia jakości kodu i napraw wszelkie problemy.

**Komendy:**
```bash
# Sprawdź TypeScript errors
npm run build

# Sprawdź linting
npm run lint

# Auto-fix lint issues
npm run lint:fix
```

**Oczekiwane rezultaty:**
- Brak błędów TypeScript compilation
- Brak błędów ESLint (lub tylko warnings dla console.error z disable comment)
- Kod zgodny z konwencjami projektu

### Krok 6: Dokumentacja i commit

**Zadanie:**
Upewnij się, że kod jest dobrze udokumentowany i stwórz commit zgodnie z Conventional Commits.

**Dokumentacja:**
- JSDoc comments dla metody `updateDeck()` w DeckService (already included)
- JSDoc comment dla PATCH handler (already included)
- Flow description w komentarzach (already included)

**Commit message:**
```
feat(api): implement PATCH /api/decks/{deckId} endpoint

Add functionality to update deck names with proper validation and ownership checks.

- Add updateDeck() method to DeckService
- Implement PATCH handler in /api/decks/[deckId] route
- Validate request body with Zod schema (1-100 chars)
- Handle duplicate name conflicts (409 Conflict)
- Ensure ownership validation for authorization
- Update updated_at timestamp automatically

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**Weryfikacja przed commit:**
- [ ] TypeScript compilation successful
- [ ] Linting passed
- [ ] Manual testing completed (all 7 test scenarios)
- [ ] Code reviewed for security issues
- [ ] Documentation complete

### Krok 7: Opcjonalne - Testy jednostkowe/e2e

**Uwaga:** Ten krok jest opcjonalny, ponieważ projekt nie ma jeszcze skonfigurowanego frameworka testowego.

**Sugestie na przyszłość:**
- Vitest dla unit tests
- Playwright lub Cypress dla e2e tests

**Scenariusze testowe do pokrycia:**
```typescript
describe("PATCH /api/decks/[deckId]", () => {
  it("should update deck name successfully", async () => { /* ... */ });
  it("should return 400 for invalid UUID", async () => { /* ... */ });
  it("should return 400 for empty name", async () => { /* ... */ });
  it("should return 400 for name > 100 chars", async () => { /* ... */ });
  it("should return 401 when not authenticated", async () => { /* ... */ });
  it("should return 404 when deck not found", async () => { /* ... */ });
  it("should return 404 when deck owned by another user", async () => { /* ... */ });
  it("should return 409 when duplicate name exists", async () => { /* ... */ });
  it("should update updated_at timestamp", async () => { /* ... */ });
});

describe("DeckService.updateDeck", () => {
  it("should throw DeckNotFoundError when deck doesn't exist", async () => { /* ... */ });
  it("should throw DeckNotFoundError when deck owned by another user", async () => { /* ... */ });
  it("should throw DuplicateDeckError when name conflicts", async () => { /* ... */ });
  it("should return updated DeckDTO on success", async () => { /* ... */ });
});
```

---

## Podsumowanie

Ten plan implementacji zapewnia:
- ✅ Pełną walidację danych wejściowych (Zod + database constraints)
- ✅ Bezpieczne uwierzytelnianie i autoryzację (ownership validation)
- ✅ Obsługę wszystkich scenariuszy błędów zgodnie ze specyfikacją
- ✅ Zgodność z istniejącymi wzorcami kodu (GET /api/decks/[deckId])
- ✅ Wykorzystanie istniejących typów i infrastruktury
- ✅ Performance optimization (single database round-trip)
- ✅ Dokumentację i komentarze zgodnie z CLAUDE.md
- ✅ Bezpieczeństwo zgodne z najlepszymi praktykami

Implementacja powinna zająć około 30-45 minut dla doświadczonego programisty, z uwzględnieniem testowania manualnego.
