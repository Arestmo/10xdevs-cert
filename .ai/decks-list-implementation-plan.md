# API Endpoint Implementation Plan: GET /api/decks

## 1. Przegląd punktu końcowego

Endpoint `GET /api/decks` zwraca listę wszystkich talii fiszek należących do zalogowanego użytkownika wraz z metadanymi (liczba wszystkich fiszek i fiszek do powtórki). Obsługuje paginację, sortowanie i porządkowanie wyników.

**Główne funkcjonalności:**
- Pobieranie talii z izolacją danych użytkownika (RLS)
- Dynamiczne obliczanie metadanych dla każdej talii
- Elastyczna paginacja i sortowanie
- Walidacja parametrów zapytania

## 2. Szczegóły żądania

- **Metoda HTTP:** `GET`
- **Struktura URL:** `/api/decks`
- **Uwierzytelnienie:** Wymagane (Supabase Auth via session/token)

**Parametry Query:**

| Parametr | Typ | Wymagany | Wartości | Domyślnie | Walidacja |
|----------|-----|----------|----------|-----------|-----------|
| `limit` | integer | Nie | 1-100 | 20 | `z.coerce.number().int().min(1).max(100).default(20)` |
| `offset` | integer | Nie | ≥0 | 0 | `z.coerce.number().int().min(0).default(0)` |
| `sort` | string | Nie | `"created_at"`, `"name"`, `"updated_at"` | `"created_at"` | `z.enum(["created_at", "name", "updated_at"]).default("created_at")` |
| `order` | string | Nie | `"asc"`, `"desc"` | `"desc"` | `z.enum(["asc", "desc"]).default("desc")` |

**Request Body:** Brak (GET nie przyjmuje body)

**Nagłówki:**
- `Authorization: Bearer <token>` lub cookie sesji Supabase

## 3. Wykorzystywane typy

**Istniejące typy z `src/types.ts`:**

```typescript
// Response główny
export interface DecksListResponseDTO {
  data: DeckWithMetadataDTO[];
  pagination: PaginationDTO;
}

// Item z metadanymi
export interface DeckWithMetadataDTO extends Omit<Deck, "user_id"> {
  total_flashcards: number;
  due_flashcards: number;
}

// Paginacja
export interface PaginationDTO {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

// Błędy
export interface ErrorResponseDTO {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
```

**Nowe typy do stworzenia (w pliku API route lub service):**

```typescript
// Parametry zapytania po walidacji
interface ListDecksQueryParams {
  limit: number;
  offset: number;
  sort: "created_at" | "name" | "updated_at";
  order: "asc" | "desc";
}

// Schemat walidacji Zod
const listDecksQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  sort: z.enum(["created_at", "name", "updated_at"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
});
```

## 4. Szczegóły odpowiedzi

**Sukces (200 OK):**

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Biology 101",
      "created_at": "2024-12-01T10:00:00Z",
      "updated_at": "2024-12-05T14:00:00Z",
      "total_flashcards": 50,
      "due_flashcards": 12
    }
  ],
  "pagination": {
    "total": 5,
    "limit": 20,
    "offset": 0,
    "has_more": false
  }
}
```

**Błąd walidacji (400 Bad Request):**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid query parameters",
    "details": {
      "limit": ["Number must be less than or equal to 100"]
    }
  }
}
```

**Brak uwierzytelnienia (401 Unauthorized):**

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**Błąd serwera (500 Internal Server Error):**

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

## 5. Przepływ danych

```
1. Request → API Route (/api/decks.ts)
   ↓
2. Walidacja parametrów query (Zod schema)
   ↓
3. Sprawdzenie uwierzytelnienia (context.locals.supabase.auth.getUser())
   ↓
4. Wywołanie DeckService.listDecks(userId, params)
   ↓
5. Service wykonuje zapytanie SQL:
   - SELECT decks z filtrem user_id (RLS automatycznie egzekwuje)
   - LEFT JOIN flashcards dla metadanych
   - GROUP BY dla agregacji COUNT
   - ORDER BY według parametru sort
   - LIMIT/OFFSET dla paginacji
   ↓
6. Service pobiera total count (bez LIMIT/OFFSET)
   ↓
7. Service formatuje dane do DeckWithMetadataDTO[]
   ↓
8. Service oblicza has_more (offset + limit < total)
   ↓
9. API Route konstruuje DecksListResponseDTO
   ↓
10. Zwrot Response z JSON + status 200
```

**Główne zapytanie SQL (wykonywane przez Supabase client):**

```sql
-- Pobieranie talii z metadanymi
SELECT
  d.id,
  d.name,
  d.created_at,
  d.updated_at,
  COUNT(f.id) AS total_flashcards,
  COUNT(CASE WHEN f.next_review <= NOW() THEN 1 END) AS due_flashcards
FROM decks d
LEFT JOIN flashcards f ON d.id = f.deck_id
WHERE d.user_id = $1
GROUP BY d.id, d.name, d.created_at, d.updated_at
ORDER BY d.{sort} {order}
LIMIT $2 OFFSET $3;

-- Zapytanie dla total count
SELECT COUNT(*) FROM decks WHERE user_id = $1;
```

## 6. Względy bezpieczeństwa

### Uwierzytelnienie
- **Mechanizm:** Supabase Auth (session cookie lub Bearer token)
- **Implementacja:**
  ```typescript
  const { data: { user }, error } = await context.locals.supabase.auth.getUser();
  if (error || !user) {
    return new Response(JSON.stringify({
      error: { code: "UNAUTHORIZED", message: "Authentication required" }
    }), { status: 401 });
  }
  ```

### Autoryzacja (RLS - Row Level Security)
- Supabase automatycznie egzekwuje polityki RLS na tabeli `decks`
- Polityka: `user_id = auth.uid()` zapewnia izolację danych
- Użytkownik widzi tylko własne talie

### Walidacja danych wejściowych
- **Zod schema** waliduje wszystkie parametry query
- **Sanityzacja:** Supabase client automatycznie zabezpiecza przed SQL injection
- **Limitowanie:** max `limit=100` zapobiega DoS przez duże zapytania

### Zapobieganie atakom
- **SQL Injection:** Używamy Supabase client z parametryzowanymi zapytaniami
- **DoS:** Limit maksymalny 100 elementów na stronę
- **User Enumeration:** Generyczne komunikaty błędów (nie ujawniamy istnienia użytkowników)

### Nagłówki bezpieczeństwa
```typescript
headers: {
  'Content-Type': 'application/json',
  'X-Content-Type-Options': 'nosniff',
}
```

## 7. Obsługa błędów

| Kod | Scenariusz | Response Code | Response Body |
|-----|------------|---------------|---------------|
| E1 | Brak uwierzytelnienia | 401 | `{"error": {"code": "UNAUTHORIZED", "message": "Authentication required"}}` |
| E2 | Nieprawidłowy `limit` (<1 lub >100) | 400 | `{"error": {"code": "VALIDATION_ERROR", "message": "Invalid query parameters", "details": {"limit": [...]}}}` |
| E3 | Nieprawidłowy `offset` (<0) | 400 | `{"error": {"code": "VALIDATION_ERROR", "message": "Invalid query parameters", "details": {"offset": [...]}}}` |
| E4 | Nieprawidłowy `sort` | 400 | `{"error": {"code": "VALIDATION_ERROR", "message": "Invalid query parameters", "details": {"sort": [...]}}}` |
| E5 | Nieprawidłowy `order` | 400 | `{"error": {"code": "VALIDATION_ERROR", "message": "Invalid query parameters", "details": {"order": [...]}}}` |
| E6 | Błąd połączenia z bazą danych | 500 | `{"error": {"code": "INTERNAL_ERROR", "message": "An unexpected error occurred"}}` |
| E7 | Nieoczekiwany błąd serwera | 500 | `{"error": {"code": "INTERNAL_ERROR", "message": "An unexpected error occurred"}}` |

**Implementacja obsługi błędów:**

```typescript
// W API route
try {
  // Walidacja Zod
  const params = listDecksQuerySchema.parse(queryParams);
} catch (error) {
  if (error instanceof z.ZodError) {
    return new Response(JSON.stringify({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid query parameters",
        details: error.flatten().fieldErrors
      }
    }), { status: 400 });
  }
}

// W service
try {
  const { data, error } = await supabase.from('decks')...;
  if (error) throw error;
} catch (error) {
  console.error('Error fetching decks:', error);
  throw new Error('Failed to fetch decks');
}
```

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła
1. **JOIN z flashcards:** Dla użytkowników z dużą liczbą fiszek może być kosztowny
2. **COUNT agregacje:** Obliczanie total_flashcards i due_flashcards dla każdej talii
3. **Dwa zapytania:** Jedno dla danych, drugie dla total count

### Strategie optymalizacji

**1. Wykorzystanie indeksów (już istnieją w db-plan.md):**
- `idx_decks_user` na `(user_id, created_at DESC)` - szybkie sortowanie
- `idx_flashcards_review_queue` na `(deck_id, next_review)` - szybkie COUNT dla due_flashcards

**2. Limit domyślny 20 elementów:**
- Zmniejsza obciążenie na pierwsze wczytanie
- Max 100 zapobiega przeciążeniu

**3. Pojedyncze zapytanie dla count:**
```typescript
// Zamiast dwóch zapytań, użyć .count() w tym samym zapytaniu Supabase
const { data, count } = await supabase
  .from('decks')
  .select('*, flashcards(count)', { count: 'exact' })
  ...
```

**4. Cache na poziomie Supabase:**
- Supabase PostgREST ma wbudowane cache dla częstych zapytań
- Rozważyć dodanie cache-control headers dla statycznych list

**5. Monitoring wydajności:**
- EXPLAIN ANALYZE dla zapytań w PostgreSQL
- Monitoring czasu odpowiedzi w production

## 9. Etapy wdrożenia

### Krok 1: Utworzenie schematu walidacji
**Plik:** `src/pages/api/decks.ts` (lub osobny plik schemas)

```typescript
import { z } from 'zod';

const listDecksQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  sort: z.enum(['created_at', 'name', 'updated_at']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

type ListDecksQueryParams = z.infer<typeof listDecksQuerySchema>;
```

### Krok 2: Utworzenie DeckService
**Plik:** `src/lib/services/deck.service.ts`

```typescript
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/db/database.types';
import type { DeckWithMetadataDTO, DecksListResponseDTO } from '@/types';

interface ListDecksParams {
  limit: number;
  offset: number;
  sort: 'created_at' | 'name' | 'updated_at';
  order: 'asc' | 'desc';
}

export class DeckService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async listDecks(
    userId: string,
    params: ListDecksParams
  ): Promise<DecksListResponseDTO> {
    // Implementacja zapytania do Supabase
    // 1. Pobierz talie z metadanymi (GROUP BY + COUNT)
    // 2. Pobierz total count
    // 3. Oblicz has_more
    // 4. Zwróć DecksListResponseDTO
  }
}
```

### Krok 3: Implementacja logiki DeckService.listDecks()
- Wykonanie zapytania SELECT z JOIN flashcards
- Agregacja COUNT dla total_flashcards i due_flashcards
- Sortowanie według parametru sort + order
- Paginacja LIMIT/OFFSET
- Osobne zapytanie dla total count
- Formatowanie do DeckWithMetadataDTO[]

### Krok 4: Utworzenie API route
**Plik:** `src/pages/api/decks.ts`

```typescript
import type { APIRoute } from 'astro';
import { DeckService } from '@/lib/services/deck.service';
import { listDecksQuerySchema } from './schemas'; // lub inline

export const prerender = false;

export const GET: APIRoute = async (context) => {
  // 1. Walidacja uwierzytelnienia
  // 2. Walidacja query params
  // 3. Wywołanie DeckService.listDecks()
  // 4. Zwrot Response z JSON
};
```

### Krok 5: Implementacja walidacji uwierzytelnienia
```typescript
const { data: { user }, error: authError } =
  await context.locals.supabase.auth.getUser();

if (authError || !user) {
  return new Response(
    JSON.stringify({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
    }),
    { status: 401, headers: { 'Content-Type': 'application/json' } }
  );
}
```

### Krok 6: Implementacja walidacji parametrów query
```typescript
const url = new URL(context.request.url);
const queryParams = {
  limit: url.searchParams.get('limit'),
  offset: url.searchParams.get('offset'),
  sort: url.searchParams.get('sort'),
  order: url.searchParams.get('order'),
};

try {
  const validatedParams = listDecksQuerySchema.parse(queryParams);
} catch (error) {
  if (error instanceof z.ZodError) {
    return new Response(
      JSON.stringify({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: error.flatten().fieldErrors
        }
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
```

### Krok 7: Wywołanie service i zwrot odpowiedzi
```typescript
try {
  const deckService = new DeckService(context.locals.supabase);
  const response = await deckService.listDecks(user.id, validatedParams);

  return new Response(
    JSON.stringify(response),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff'
      }
    }
  );
} catch (error) {
  console.error('Error in GET /api/decks:', error);
  return new Response(
    JSON.stringify({
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }
    }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  );
}
```

### Krok 8: Code review i optymalizacja
- Przegląd kodu według wytycznych z CLAUDE.md
- Sprawdzenie ESLint i Prettier
- Optymalizacja zapytań SQL (EXPLAIN ANALYZE)

### Krok 9: Dokumentacja
- Dodanie komentarzy JSDoc do funkcji service
- Aktualizacja dokumentacji API (jeśli istnieje)
- Dodanie przykładów użycia w komentarzach

---

**Plan gotowy do implementacji.** Wszystkie kroki są szczegółowo opisane i zgodne z tech stackiem (Astro + Supabase + TypeScript) oraz zasadami z CLAUDE.md.
