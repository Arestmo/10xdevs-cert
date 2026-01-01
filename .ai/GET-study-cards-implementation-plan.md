# API Endpoint Implementation Plan: GET /api/study/cards

## 1. Endpoint Overview

This endpoint retrieves flashcards that are due for review in a study session. It implements the core functionality of the spaced repetition system by querying cards where `next_review <= NOW()` and returning them sorted by review priority (oldest due first).

**Key Features**:
- Returns flashcards due for review based on FSRS scheduling
- Optional filtering by specific deck
- Configurable limit (1-200 cards, default 50)
- Includes deck name for each card for display purposes
- Returns metadata about total due cards and returned count

**Use Case**: Primary endpoint for initiating study sessions in the flashcard application.

## 2. Request Details

- **HTTP Method**: GET
- **URL Structure**: `/api/study/cards`
- **Authentication**: Required (user must be logged in)
- **Query Parameters**:
  - **Optional**:
    - `deck_id` (string, uuid) - Filter cards to a specific deck
    - `limit` (integer, 1-200, default 50) - Maximum number of cards to return

**Example Requests**:
```
GET /api/study/cards
GET /api/study/cards?limit=20
GET /api/study/cards?deck_id=550e8400-e29b-41d4-a716-446655440000
GET /api/study/cards?deck_id=550e8400-e29b-41d4-a716-446655440000&limit=100
```

## 3. Type Definitions

### DTOs Used

**StudyCardDTO** (from `src/types.ts`):
```typescript
interface StudyCardDTO extends Omit<Flashcard, "created_at" | "updated_at"> {
  deck_name: string;
}
```

**StudyCardsResponseDTO** (from `src/types.ts`):
```typescript
interface StudyCardsResponseDTO {
  data: StudyCardDTO[];
  total_due: number;
  returned_count: number;
}
```

**ErrorResponseDTO** (from `src/types.ts`):
```typescript
interface ErrorResponseDTO {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
```

### Input Validation Schema

```typescript
import { z } from "zod";

const GetStudyCardsQuerySchema = z.object({
  deck_id: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50)
});
```

## 4. Response Details

### Success Response (200 OK)

```json
{
  "data": [
    {
      "id": "uuid",
      "deck_id": "uuid",
      "deck_name": "Biology 101",
      "front": "What is mitochondria?",
      "back": "The powerhouse of the cell",
      "stability": 2.5,
      "difficulty": 0.3,
      "elapsed_days": 5,
      "scheduled_days": 7,
      "reps": 3,
      "lapses": 0,
      "state": 2,
      "last_review": "2024-12-05T10:00:00Z",
      "next_review": "2024-12-10T08:00:00Z"
    }
  ],
  "total_due": 25,
  "returned_count": 25
}
```

**Response Fields**:
- `data`: Array of StudyCardDTO objects (flashcards with deck names)
- `total_due`: Total count of all due cards (respecting deck_id filter if provided)
- `returned_count`: Number of cards actually returned (limited by limit parameter)

### Error Responses

**400 Bad Request** - Invalid query parameters:
```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid query parameters",
    "details": {
      "deck_id": "Invalid UUID format",
      "limit": "Must be between 1 and 200"
    }
  }
}
```

**401 Unauthorized** - User not authenticated:
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**404 Not Found** - Deck not found or doesn't belong to user:
```json
{
  "error": {
    "code": "DECK_NOT_FOUND",
    "message": "Deck not found"
  }
}
```

**500 Internal Server Error** - Server-side error:
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

## 5. Data Flow

### Request Flow

1. **Request Reception**: Astro API endpoint receives GET request
2. **Query Parameter Extraction**: Extract `deck_id` and `limit` from URL query
3. **Input Validation**: Validate parameters using Zod schema
4. **Authentication Check**: Verify user session via Supabase Auth
5. **Service Layer Call**: Call `studyService.getStudyCards(userId, deckId?, limit)`
6. **Database Query**:
   - Query flashcards table with JOIN to decks table
   - Filter: `next_review <= NOW()` AND `user_id = current_user`
   - Optional: Additional filter for `deck_id` if provided
   - Sort: `next_review ASC`
   - Limit: Apply limit parameter
7. **Count Total Due**: Get count of all due cards (for metadata)
8. **Response Construction**: Build StudyCardsResponseDTO
9. **Response Return**: Return JSON with 200 status

### Database Interactions

**Main Query** (executed in service layer):
```sql
SELECT
  f.id,
  f.deck_id,
  d.name as deck_name,
  f.front,
  f.back,
  f.source,
  f.stability,
  f.difficulty,
  f.elapsed_days,
  f.scheduled_days,
  f.reps,
  f.lapses,
  f.state,
  f.last_review,
  f.next_review
FROM flashcards f
INNER JOIN decks d ON f.deck_id = d.id
WHERE f.next_review <= NOW()
  AND d.user_id = $1
  AND ($2::uuid IS NULL OR f.deck_id = $2)
ORDER BY f.next_review ASC
LIMIT $3;
```

**Count Query**:
```sql
SELECT COUNT(*)
FROM flashcards f
INNER JOIN decks d ON f.deck_id = d.id
WHERE f.next_review <= NOW()
  AND d.user_id = $1
  AND ($2::uuid IS NULL OR f.deck_id = $2);
```

**Parameters**:
- `$1`: userId (from session)
- `$2`: deck_id (optional filter)
- `$3`: limit (default 50)

### Service Layer Implementation

**File**: `src/lib/services/study.service.ts`

**Function Signature**:
```typescript
export async function getStudyCards(
  supabase: SupabaseClient<Database>,
  userId: string,
  deckId?: string,
  limit: number = 50
): Promise<StudyCardsResponseDTO>
```

**Responsibilities**:
- Execute database query to fetch due cards
- Verify deck ownership if deck_id provided
- Handle database errors gracefully
- Transform database rows to StudyCardDTO format
- Return complete response with metadata

## 6. Security Considerations

### Authentication
- **Requirement**: User must be authenticated via Supabase Auth
- **Implementation**: Check `context.locals.supabase.auth.getUser()`
- **Error Response**: 401 Unauthorized if not authenticated

### Authorization
- **Row-Level Security (RLS)**: Supabase RLS policies on `flashcards` and `decks` tables enforce user_id filtering
- **Deck Ownership**: When `deck_id` is provided, verify deck belongs to user
- **Implementation**: JOIN query ensures only user's decks are accessed

### Input Validation
- **Zod Schema**: Strict validation of query parameters
- **UUID Validation**: Ensure `deck_id` is valid UUID format
- **Range Validation**: Enforce `limit` between 1-200
- **SQL Injection Prevention**: Use Supabase client with parameterized queries

### Data Exposure
- **Omit Sensitive Fields**: `created_at` and `updated_at` omitted from response (StudyCardDTO)
- **User Isolation**: RLS ensures users only see their own flashcards
- **No User IDs**: Response doesn't expose user_id fields

### Rate Limiting Considerations
- **High Traffic Endpoint**: Study sessions may generate frequent requests
- **Recommendation**: Implement rate limiting (e.g., 100 requests/minute per user)
- **Implementation**: Consider Astro middleware or external service (e.g., Upstash Rate Limit)

## 7. Error Handling

### Validation Errors (400 Bad Request)

**Scenario**: Invalid query parameters
- Invalid UUID format for `deck_id`
- `limit` out of range (< 1 or > 200)
- Non-numeric `limit` value

**Handling**:
```typescript
try {
  const validatedQuery = GetStudyCardsQuerySchema.parse(queryParams);
} catch (error) {
  if (error instanceof z.ZodError) {
    return new Response(
      JSON.stringify({
        error: {
          code: "INVALID_REQUEST",
          message: "Invalid query parameters",
          details: error.flatten().fieldErrors
        }
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
}
```

### Authentication Errors (401 Unauthorized)

**Scenario**: User not logged in or session expired

**Handling**:
```typescript
const { data: { user }, error } = await supabase.auth.getUser();

if (error || !user) {
  return new Response(
    JSON.stringify({
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required"
      }
    }),
    { status: 401, headers: { "Content-Type": "application/json" } }
  );
}
```

### Resource Not Found Errors (404 Not Found)

**Scenario**: Deck specified in `deck_id` doesn't exist or doesn't belong to user

**Handling**:
```typescript
// In service layer, check if deck exists and belongs to user
if (deckId) {
  const { data: deck, error } = await supabase
    .from("decks")
    .select("id")
    .eq("id", deckId)
    .eq("user_id", userId)
    .single();

  if (error || !deck) {
    throw new Error("DECK_NOT_FOUND");
  }
}

// In API route
catch (error) {
  if (error.message === "DECK_NOT_FOUND") {
    return new Response(
      JSON.stringify({
        error: {
          code: "DECK_NOT_FOUND",
          message: "Deck not found"
        }
      }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }
}
```

### Database Errors (500 Internal Server Error)

**Scenario**: Database connection issues, query failures, unexpected errors

**Handling**:
```typescript
catch (error) {
  console.error("Error fetching study cards:", error);

  return new Response(
    JSON.stringify({
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred"
      }
    }),
    { status: 500, headers: { "Content-Type": "application/json" } }
  );
}
```

### Edge Cases

1. **No Due Cards**: Return empty array with `total_due: 0`, `returned_count: 0` (200 OK)
2. **Fewer Cards Than Limit**: Return all available cards, `returned_count < limit` (200 OK)
3. **Deleted Deck**: If deck was deleted between request validation and query, handle gracefully (404)

## 8. Performance Considerations

### Database Performance

**Indexes Required**:
```sql
-- Index on next_review for efficient filtering and sorting
CREATE INDEX idx_flashcards_next_review ON flashcards(next_review);

-- Composite index for deck_id filtering
CREATE INDEX idx_flashcards_deck_next_review ON flashcards(deck_id, next_review);

-- Index on deck user_id for JOIN performance
CREATE INDEX idx_decks_user_id ON decks(user_id);
```

**Query Optimization**:
- Use INNER JOIN instead of multiple queries
- Limit results at database level (not application level)
- Use `EXPLAIN ANALYZE` to verify query plan uses indexes

### Caching Strategy

**Not Recommended for This Endpoint**:
- Study cards are time-sensitive (`next_review <= NOW()`)
- Data changes frequently (after each review)
- Real-time accuracy is critical for spaced repetition

**Alternative**: Consider caching `total_due` count for dashboard (separate endpoint)

### Response Size

**Typical Response**:
- 50 cards × ~400 bytes per card = ~20 KB
- Acceptable for REST API, no compression needed

**Large Response Scenario**:
- 200 cards (max limit) × ~400 bytes = ~80 KB
- Still acceptable, but consider warning in docs

### Pagination Considerations

**Current Design**: No offset-based pagination (intentional per spec)
- `limit` controls batch size
- `total_due` and `returned_count` provide progress metadata

**Rationale**:
- Study sessions are meant to be completed in one sitting
- Cards are sorted by priority (next_review ASC)
- Users review a batch, then endpoint is called again for next batch

### Connection Pooling

- Supabase client handles connection pooling automatically
- No additional configuration needed

## 9. Implementation Steps

### Step 1: Create Service Layer

**File**: `src/lib/services/study.service.ts`

**Tasks**:
1. Create new service file
2. Import necessary types: `SupabaseClient`, `Database`, `StudyCardDTO`, `StudyCardsResponseDTO`
3. Implement `getStudyCards()` function:
   - Accept parameters: `supabase`, `userId`, `deckId?`, `limit`
   - Validate deck ownership if `deckId` provided (throw error if not found)
   - Build and execute main query with JOIN
   - Build and execute count query
   - Transform results to `StudyCardDTO[]`
   - Return `StudyCardsResponseDTO`
4. Add comprehensive error handling
5. Add JSDoc documentation

**Example Implementation**:
```typescript
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import type { StudyCardDTO, StudyCardsResponseDTO } from "@/types";

export async function getStudyCards(
  supabase: SupabaseClient<Database>,
  userId: string,
  deckId?: string,
  limit: number = 50
): Promise<StudyCardsResponseDTO> {
  // Validate deck ownership if deckId provided
  if (deckId) {
    const { data: deck, error: deckError } = await supabase
      .from("decks")
      .select("id")
      .eq("id", deckId)
      .eq("user_id", userId)
      .single();

    if (deckError || !deck) {
      throw new Error("DECK_NOT_FOUND");
    }
  }

  // Build query for due cards
  let query = supabase
    .from("flashcards")
    .select(`
      id,
      deck_id,
      decks!inner(name),
      front,
      back,
      source,
      stability,
      difficulty,
      elapsed_days,
      scheduled_days,
      reps,
      lapses,
      state,
      last_review,
      next_review
    `)
    .lte("next_review", new Date().toISOString())
    .eq("decks.user_id", userId)
    .order("next_review", { ascending: true })
    .limit(limit);

  if (deckId) {
    query = query.eq("deck_id", deckId);
  }

  const { data: flashcards, error: flashcardsError } = await query;

  if (flashcardsError) {
    throw flashcardsError;
  }

  // Get total count of due cards
  let countQuery = supabase
    .from("flashcards")
    .select("id", { count: "exact", head: true })
    .lte("next_review", new Date().toISOString())
    .eq("decks.user_id", userId);

  if (deckId) {
    countQuery = countQuery.eq("deck_id", deckId);
  }

  const { count, error: countError } = await countQuery;

  if (countError) {
    throw countError;
  }

  // Transform to StudyCardDTO
  const studyCards: StudyCardDTO[] = flashcards.map((card) => ({
    id: card.id,
    deck_id: card.deck_id,
    deck_name: card.decks.name,
    front: card.front,
    back: card.back,
    source: card.source,
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    last_review: card.last_review,
    next_review: card.next_review
  }));

  return {
    data: studyCards,
    total_due: count ?? 0,
    returned_count: studyCards.length
  };
}
```

### Step 2: Create API Route

**File**: `src/pages/api/study/cards.ts`

**Tasks**:
1. Create new API endpoint file
2. Add `export const prerender = false`
3. Create Zod validation schema for query parameters
4. Implement `GET` function:
   - Extract query parameters from `context.url.searchParams`
   - Validate with Zod schema
   - Get authenticated user from Supabase
   - Call `studyService.getStudyCards()`
   - Return JSON response
5. Implement comprehensive error handling for all error types
6. Set appropriate HTTP headers

**Example Implementation**:
```typescript
import type { APIContext } from "astro";
import { z } from "zod";
import { getStudyCards } from "@/lib/services/study.service";
import type { StudyCardsResponseDTO, ErrorResponseDTO } from "@/types";

export const prerender = false;

const GetStudyCardsQuerySchema = z.object({
  deck_id: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50)
});

export async function GET(context: APIContext): Promise<Response> {
  const supabase = context.locals.supabase;

  try {
    // Validate query parameters
    const queryParams = Object.fromEntries(context.url.searchParams.entries());
    const validatedQuery = GetStudyCardsQuerySchema.parse(queryParams);

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

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

    // Get study cards
    const response: StudyCardsResponseDTO = await getStudyCards(
      supabase,
      user.id,
      validatedQuery.deck_id,
      validatedQuery.limit
    );

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "INVALID_REQUEST",
          message: "Invalid query parameters",
          details: error.flatten().fieldErrors
        }
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Handle deck not found
    if (error instanceof Error && error.message === "DECK_NOT_FOUND") {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "DECK_NOT_FOUND",
          message: "Deck not found"
        }
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Handle internal errors
    console.error("Error fetching study cards:", error);
    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred"
      }
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
```

### Step 3: Add Database Indexes (if not exist)

**File**: Create new migration file in `supabase/migrations/`

**Tasks**:
1. Create migration file with timestamp: `YYYYMMDDHHmmss_add_study_indexes.sql`
2. Add index for `next_review` on flashcards table
3. Add composite index for `deck_id` and `next_review`
4. Verify indexes don't already exist before creating

**Example Migration**:
```sql
-- Migration: Add indexes for study session queries
-- Purpose: Optimize GET /api/study/cards performance
-- Affected tables: flashcards
-- Created: 2026-01-01

-- Add index on next_review for efficient filtering and sorting
create index if not exists idx_flashcards_next_review
on flashcards(next_review);

-- Add composite index for deck-specific study queries
create index if not exists idx_flashcards_deck_next_review
on flashcards(deck_id, next_review);

-- Add comment explaining the indexes
comment on index idx_flashcards_next_review is
'Optimizes study session queries filtering by next_review <= NOW()';

comment on index idx_flashcards_deck_next_review is
'Optimizes deck-specific study queries with both deck_id filter and next_review sorting';
```

### Step 4: Test the Endpoint

**Manual Testing**:
1. Start dev server: `npm run dev`
2. Authenticate a user
3. Test basic request: `GET /api/study/cards`
4. Test with deck filter: `GET /api/study/cards?deck_id={valid_uuid}`
5. Test with limit: `GET /api/study/cards?limit=20`
6. Test error cases:
   - Invalid UUID: `GET /api/study/cards?deck_id=invalid`
   - Limit out of range: `GET /api/study/cards?limit=300`
   - Non-existent deck: `GET /api/study/cards?deck_id={non_existent_uuid}`
   - Unauthenticated request
7. Verify response structure matches `StudyCardsResponseDTO`

**Edge Case Testing**:
1. User with no due cards (should return empty array)
2. User with fewer cards than limit
3. User with more cards than limit (verify limit works)
4. Deck filter with no due cards in that deck

### Step 5: Documentation

**Tasks**:
1. Add JSDoc comments to service function
2. Add inline comments explaining complex logic
3. Update API documentation (if separate docs exist)
4. Add example requests/responses to docs

### Step 6: Code Review Checklist

**Before Submitting**:
- [ ] Input validation with Zod schema implemented
- [ ] Authentication check implemented
- [ ] Authorization (deck ownership) verified
- [ ] All error scenarios handled (400, 401, 404, 500)
- [ ] Service layer properly extracts business logic
- [ ] Database indexes created/verified
- [ ] Response matches `StudyCardsResponseDTO` type
- [ ] Error responses match `ErrorResponseDTO` type
- [ ] No SQL injection vulnerabilities
- [ ] RLS policies enforced
- [ ] Code follows project conventions (CLAUDE.md)
- [ ] ESLint passes: `npm run lint`
- [ ] Manual testing completed
- [ ] Edge cases tested

### Step 7: Performance Verification

**Tasks**:
1. Use `EXPLAIN ANALYZE` on database queries to verify index usage
2. Test with large datasets (100+ due cards)
3. Measure response times (should be < 200ms for typical queries)
4. Verify no N+1 query issues (should be 2 queries total: main + count)

### Step 8: Deploy and Monitor

**Tasks**:
1. Run migrations on production database
2. Deploy code to production
3. Monitor error logs for unexpected issues
4. Track endpoint performance metrics
5. Gather user feedback on study session experience
