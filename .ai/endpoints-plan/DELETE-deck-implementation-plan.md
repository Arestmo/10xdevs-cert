# API Endpoint Implementation Plan: DELETE /api/decks/{deckId}

## 1. Przegląd punktu końcowego

Endpoint służy do usuwania talii fiszek wraz z wszystkimi jej kartami w sposób kaskadowy. Tylko właściciel talii może ją usunąć. Endpoint implementuje wzorzec "soft delete by ownership verification" - jeśli talia nie istnieje lub nie należy do użytkownika, zwracany jest ten sam kod 404 (nie ujawniamy czy talia w ogóle istnieje).

**Kluczowe założenia:**

- Cascade delete fiszek obsługiwane przez bazę danych (foreign key constraint `ON DELETE CASCADE`)
- Weryfikacja własności przed usunięciem (security)
- Brak możliwości cofnięcia operacji
- Zwraca 204 No Content przy sukcesie (brak response body)

## 2. Szczegóły żądania

- **Metoda HTTP:** DELETE
- **Struktura URL:** `/api/decks/{deckId}`
- **Parametry:**
  - **Wymagane:**
    - `deckId` (path parameter) - UUID talii do usunięcia
  - **Opcjonalne:** Brak
- **Request Body:** Brak (DELETE nie przyjmuje body)
- **Headers:**
  - `Authorization: Bearer <JWT_TOKEN>` (wymagany, obsługiwany przez middleware Supabase)

**Przykład żądania:**

```http
DELETE /api/decks/123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer eyJhbGc...
```

## 3. Wykorzystywane typy

**Istniejące typy z `src/types.ts`:**

```typescript
// Dla obsługi błędów
type ErrorResponseDTO = {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};

// Dla weryfikacji właściciela (wewnętrznie w service)
type Deck = Tables<"decks">; // zawiera: id, user_id, name, created_at, updated_at
```

**Nowe typy - NIE WYMAGANE**
Endpoint nie wymaga tworzenia nowych typów DTO, ponieważ:

- Nie zwraca body przy sukcesie (204 No Content)
- Nie przyjmuje request body
- Wykorzystuje istniejące typy dla walidacji i błędów

## 4. Szczegóły odpowiedzi

### Sukces (204 No Content)

```http
HTTP/1.1 204 No Content
```

Brak response body - talia i wszystkie jej fiszki zostały usunięte.

### Błędy

**400 Bad Request - Nieprawidłowy UUID**

```json
{
  "error": {
    "code": "INVALID_DECK_ID",
    "message": "Invalid deck ID format",
    "details": {
      "deckId": "abc-invalid-uuid"
    }
  }
}
```

**401 Unauthorized - Brak lub nieprawidłowy token**

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**404 Not Found - Talia nie istnieje lub nie należy do użytkownika**

```json
{
  "error": {
    "code": "DECK_NOT_FOUND",
    "message": "Deck not found or access denied"
  }
}
```

**500 Internal Server Error - Błąd serwera**

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An error occurred while deleting the deck"
  }
}
```

## 5. Przepływ danych

```
1. Request → Middleware Supabase
   ↓
2. Weryfikacja JWT tokenu (automatycznie przez middleware)
   ↓
3. Endpoint handler `/api/decks/[deckId].ts`
   ↓
4. Walidacja deckId (Zod schema - UUID format)
   ↓
5. Ekstrakcja user_id z JWT (context.locals.supabase.auth.getUser())
   ↓
6. Wywołanie DeckService.deleteDeck(userId, deckId)
   ↓
7. Service: Weryfikacja własności talii
   - Query: SELECT user_id FROM decks WHERE id = deckId
   - Sprawdzenie: user_id === userId z JWT
   ↓
8. Service: Usunięcie talii
   - DELETE FROM decks WHERE id = deckId AND user_id = userId
   - Cascade delete fiszek (automatycznie przez ON DELETE CASCADE)
   ↓
9. Zwrócenie odpowiedzi 204 No Content
```

**Interakcje z bazą danych:**

1. **Weryfikacja własności** (opcjonalne - można pominąć jeśli używamy warunku WHERE user_id):

```sql
SELECT user_id FROM decks WHERE id = $1
```

2. **Usunięcie talii** (z automatycznym cascade delete):

```sql
DELETE FROM decks
WHERE id = $1 AND user_id = $2
RETURNING id
```

Zwracamy `RETURNING id` aby sprawdzić czy faktycznie coś usunięto (0 rows = 404).

## 6. Względy bezpieczeństwa

### 6.1 Autoryzacja i Autentykacja

**Middleware Supabase:**

- Automatyczna weryfikacja JWT tokenu
- Zwrot 401 jeśli token jest nieprawidłowy, wygasły lub brak tokenu
- Dostęp do user_id z zweryfikowanego tokenu

**Weryfikacja własności:**

```typescript
// W service - KRYTYCZNE dla bezpieczeństwa
const { data, error } = await supabase
  .from("decks")
  .delete()
  .eq("id", deckId)
  .eq("user_id", userId) // <- MUST HAVE: zapobiega IDOR
  .select("id")
  .single();

if (!data) {
  // Talia nie istnieje LUB nie należy do użytkownika
  // Zwracamy 404 w obu przypadkach (nie ujawniamy czy talia istnieje)
  throw new Error("DECK_NOT_FOUND");
}
```

### 6.2 Walidacja danych wejściowych

**Zod schema dla deckId:**

```typescript
import { z } from "zod";

const DeleteDeckParamsSchema = z.object({
  deckId: z.string().uuid({ message: "Invalid deck ID format" }),
});
```

### 6.3 Ochrona przed atakami

1. **IDOR (Insecure Direct Object Reference):**
   - Mitigacja: Zawsze dodawaj `eq('user_id', userId)` w query
   - Nigdy nie polegaj tylko na samym `deckId`

2. **SQL Injection:**
   - Mitigacja: Supabase SDK używa prepared statements
   - Dodatkowa walidacja przez Zod (UUID format)

3. **Information Disclosure:**
   - Zawsze zwracaj 404 zarówno gdy talia nie istnieje, jak i gdy należy do innego użytkownika
   - NIE zwracaj 403 Forbidden (ujawniałoby istnienie talii)

### 6.4 RLS (Row Level Security)

Chociaż weryfikujemy własność w kodzie, RLS policies w bazie danych powinny zapewniać dodatkową warstwę ochrony:

```sql
-- Policy powinna już istnieć, ale dla pewności:
CREATE POLICY "Users can delete own decks"
ON decks FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
```

## 7. Obsługa błędów

### 7.1 Katalog błędów

| Kod błędu         | Status HTTP | Sytuacja                                         | Komunikat                                   |
| ----------------- | ----------- | ------------------------------------------------ | ------------------------------------------- |
| `INVALID_DECK_ID` | 400         | deckId nie jest prawidłowym UUID                 | "Invalid deck ID format"                    |
| `UNAUTHORIZED`    | 401         | Brak tokenu lub token nieprawidłowy              | "Authentication required"                   |
| `DECK_NOT_FOUND`  | 404         | Talia nie istnieje lub nie należy do użytkownika | "Deck not found or access denied"           |
| `INTERNAL_ERROR`  | 500         | Błąd bazy danych lub serwera                     | "An error occurred while deleting the deck" |

### 7.2 Implementacja error handling

```typescript
// Wzorzec error-first z guard clauses

export async function DELETE(context: APIContext) {
  try {
    // 1. Walidacja deckId
    const { deckId } = context.params;
    const validation = DeleteDeckParamsSchema.safeParse({ deckId });

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: {
            code: "INVALID_DECK_ID",
            message: "Invalid deck ID format",
            details: validation.error.flatten(),
          },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Weryfikacja autoryzacji
    const {
      data: { user },
      error: authError,
    } = await context.locals.supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Wywołanie service
    const deleted = await DeckService.deleteDeck(user.id, validation.data.deckId);

    if (!deleted) {
      return new Response(
        JSON.stringify({
          error: {
            code: "DECK_NOT_FOUND",
            message: "Deck not found or access denied",
          },
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // 4. Happy path - sukces
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting deck:", error);
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred while deleting the deck",
        },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
```

### 7.3 Logowanie błędów

```typescript
// W catch block - logowanie szczegółów dla debugowania
console.error("Error deleting deck:", {
  userId: user?.id,
  deckId: validation.data.deckId,
  error: error instanceof Error ? error.message : "Unknown error",
  timestamp: new Date().toISOString(),
});
```

## 8. Rozważania dotyczące wydajności

### 8.1 Optymalizacja zapytań

**Single query approach:**

```typescript
// Zamiast dwóch zapytań (SELECT + DELETE), wykonaj jedno DELETE z warunkami
const { data } = await supabase.from("decks").delete().eq("id", deckId).eq("user_id", userId).select("id").single();

// Jeśli data === null, oznacza to że nie usunięto żadnego wiersza (404)
```

### 8.2 Cascade Delete

- Automatyczne usuwanie fiszek przez `ON DELETE CASCADE` w bazie danych
- Brak konieczności ręcznego usuwania fiszek w kodzie
- Transakcyjność zapewniona przez Postgres

### 8.3 Indeksy

Upewnij się, że istnieją następujące indeksy:

```sql
-- Primary key index (automatyczny)
CREATE INDEX idx_decks_pkey ON decks(id);

-- Index dla user_id (powinien już istnieć z unique constraint)
CREATE INDEX idx_decks_user_id ON decks(user_id);

-- Composite index dla optymalizacji DELETE query
CREATE INDEX idx_decks_id_user_id ON decks(id, user_id);
```

### 8.4 Potencjalne wąskie gardła

1. **Duże talie (tysiące fiszek):**
   - Cascade delete może być czasochłonny
   - Rozważenie: background job dla bardzo dużych talii (>10k fiszek)
   - Obecnie: Akceptowalne dla typowego use case (<1000 fiszek)

2. **Concurrent deletes:**
   - Race condition: dwukrotne kliknięcie przycisku "delete"
   - Mitigacja: Frontend debouncing + idempotentność DELETE (drugi request zwróci 404)

3. **Database locks:**
   - DELETE z CASCADE może zablokować tabelę fiszek
   - Monitoring długości transakcji

## 9. Etapy wdrożenia

### Krok 1: Utworzenie Zod schema walidacji

**Plik:** `src/pages/api/decks/[deckId].ts` (na górze pliku)

```typescript
import { z } from "zod";

const DeleteDeckParamsSchema = z.object({
  deckId: z.string().uuid({ message: "Invalid deck ID format" }),
});
```

### Krok 2: Implementacja DeckService.deleteDeck()

**Plik:** `src/lib/services/deck.service.ts` (utworzyć jeśli nie istnieje)

```typescript
export class DeckService {
  static async deleteDeck(userId: string, deckId: string): Promise<boolean> {
    const { data, error } = await supabaseClient
      .from("decks")
      .delete()
      .eq("id", deckId)
      .eq("user_id", userId) // KRYTYCZNE: weryfikacja własności
      .select("id")
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned - talia nie istnieje lub nie należy do użytkownika
        return false;
      }
      throw error;
    }

    return !!data;
  }
}
```

### Krok 3: Implementacja DELETE endpoint handler

**Plik:** `src/pages/api/decks/[deckId].ts`

```typescript
import type { APIContext } from "astro";
import { DeckService } from "@/lib/services/deck.service";
import { z } from "zod";

export const prerender = false;

const DeleteDeckParamsSchema = z.object({
  deckId: z.string().uuid({ message: "Invalid deck ID format" }),
});

export async function DELETE(context: APIContext) {
  try {
    // 1. Walidacja parametru deckId
    const { deckId } = context.params;
    const validation = DeleteDeckParamsSchema.safeParse({ deckId });

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: {
            code: "INVALID_DECK_ID",
            message: "Invalid deck ID format",
            details: validation.error.flatten(),
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 2. Autoryzacja - pobranie zalogowanego użytkownika
    const {
      data: { user },
      error: authError,
    } = await context.locals.supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 3. Usunięcie talii przez service
    const deleted = await DeckService.deleteDeck(user.id, validation.data.deckId);

    if (!deleted) {
      return new Response(
        JSON.stringify({
          error: {
            code: "DECK_NOT_FOUND",
            message: "Deck not found or access denied",
          },
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 4. Sukces - 204 No Content
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting deck:", {
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred while deleting the deck",
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
```

### Krok 4: Weryfikacja RLS policies w bazie danych

**Plik:** Sprawdzić istniejące migracje lub utworzyć nową w `supabase/migrations/`

Upewnić się, że istnieje policy:

```sql
-- Policy dla DELETE na tabeli decks
CREATE POLICY "Users can delete own decks"
ON decks FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
```

Jeśli policy nie istnieje, dodać do odpowiedniej migracji.

### Krok 5: Testowanie

**Testy manualne:**

1. **Test sukcesu (204):**

```bash
curl -X DELETE http://localhost:3000/api/decks/{valid-deck-id} \
  -H "Authorization: Bearer {valid-jwt-token}"
# Expected: 204 No Content
```

2. **Test nieprawidłowego UUID (400):**

```bash
curl -X DELETE http://localhost:3000/api/decks/invalid-uuid \
  -H "Authorization: Bearer {valid-jwt-token}"
# Expected: 400 Bad Request + error JSON
```

3. **Test brak autoryzacji (401):**

```bash
curl -X DELETE http://localhost:3000/api/decks/{valid-deck-id}
# Expected: 401 Unauthorized + error JSON
```

4. **Test nieistniejącej talii (404):**

```bash
curl -X DELETE http://localhost:3000/api/decks/{non-existent-deck-id} \
  -H "Authorization: Bearer {valid-jwt-token}"
# Expected: 404 Not Found + error JSON
```

5. **Test cudzej talii (404):**

```bash
curl -X DELETE http://localhost:3000/api/decks/{other-user-deck-id} \
  -H "Authorization: Bearer {valid-jwt-token}"
# Expected: 404 Not Found + error JSON (nie 403!)
```

6. **Test cascade delete:**

- Utworzyć talię z 10 fiszkami
- Usunąć talię
- Zweryfikować w bazie, że fiszki również zostały usunięte

### Krok 6: Code review checklist

- [ ] Walidacja UUID przez Zod
- [ ] Weryfikacja autoryzacji (JWT token)
- [ ] Weryfikacja własności talii (user_id check)
- [ ] Guard clauses dla wszystkich error cases
- [ ] Happy path na końcu funkcji
- [ ] Poprawne kody statusu HTTP (400, 401, 404, 500, 204)
- [ ] Brak ujawniania informacji (404 zamiast 403)
- [ ] Error logging z odpowiednimi szczegółami
- [ ] RLS policy włączone w bazie
- [ ] Cascade delete działa poprawnie
- [ ] Endpoint zwraca 204 bez body przy sukcesie

### Krok 7: Dokumentacja

Zaktualizować dokumentację API (jeśli istnieje) o nowy endpoint DELETE.

---

## Podsumowanie

Endpoint DELETE /api/decks/{deckId} implementuje bezpieczne usuwanie talii z następującymi kluczowymi elementami:

✅ **Security-first approach:** Weryfikacja własności przed każdym usunięciem
✅ **IDOR protection:** Nie ujawniamy czy talia istnieje dla innych użytkowników
✅ **Cascade delete:** Automatyczne usuwanie fiszek przez bazę danych
✅ **Proper HTTP semantics:** 204 No Content przy sukcesie
✅ **Error-first coding:** Guard clauses, wczesne zwroty
✅ **Type safety:** Zod validation + TypeScript

**Czas implementacji:** ~30-45 minut
**Złożoność:** Niska/Średnia
**Ryzyko:** Niskie (przy przestrzeganiu security guidelines)
