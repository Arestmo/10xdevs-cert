# API Endpoint Implementation Plan: GET /api/study/summary

## 1. Endpoint Overview

The `GET /api/study/summary` endpoint provides a comprehensive study dashboard overview for authenticated users. It aggregates data across all user's decks to show:

- Total number of flashcards currently due for review
- The next scheduled review date (earliest upcoming review across all decks)
- Per-deck breakdown showing which decks have due cards and their counts

This endpoint enables the frontend to display a study dashboard with prioritized deck information, helping users focus on decks that need immediate attention.

**Key Characteristics:**

- Read-only operation (GET method)
- Requires authentication (Supabase session)
- No request parameters (fetches all data for authenticated user)
- Returns aggregated statistics across all user's decks
- Optimized for dashboard display with minimal data transfer

## 2. Request Details

### HTTP Method

`GET`

### URL Structure

```
/api/study/summary
```

### Authentication

- **Required**: Yes
- **Method**: Supabase session authentication via cookie
- **Validation**: Extract user from `context.locals.supabase.auth.getUser()`

### Request Parameters

**Path Parameters:** None

**Query Parameters:** None

**Request Headers:**

- Standard Supabase auth headers (managed by Supabase client)

**Request Body:** None (GET request)

## 3. Utilized Types

All required types already exist in [`src/types.ts`](src/types.ts):

### Response DTOs

**`StudySummaryResponseDTO`** (lines 281-285)

```typescript
export interface StudySummaryResponseDTO {
  total_due: number; // Total due cards across all decks
  next_review_date: string | null; // ISO 8601 timestamp or null
  decks: DeckSummaryDTO[]; // Array of deck summaries
}
```

**`DeckSummaryDTO`** (lines 272-276)

```typescript
export interface DeckSummaryDTO {
  id: string; // Deck UUID
  name: string; // Deck name (1-100 chars)
  due_count: number; // Number of due cards in this deck
}
```

### Error DTOs

**`ErrorResponseDTO`** (lines 83-89)

```typescript
export interface ErrorResponseDTO {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
```

### Database Types

- `Database` type from `src/db/database.types.ts`
- `SupabaseClient<Database>` for type-safe database operations

**No new types need to be created** - all necessary types are already defined.

## 4. Response Details

### Success Response (200 OK)

**Content-Type:** `application/json`

**Body Structure:**

```json
{
  "total_due": 25,
  "next_review_date": "2024-12-11T10:00:00Z",
  "decks": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Biology 101",
      "due_count": 12
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Chemistry",
      "due_count": 13
    }
  ]
}
```

**Field Descriptions:**

- `total_due`: Sum of all due cards across all user's decks (cards where `next_review <= NOW()`)
- `next_review_date`:
  - ISO 8601 formatted timestamp of the earliest upcoming review (cards where `next_review > NOW()`)
  - `null` if no future reviews scheduled
- `decks`:
  - Array of decks that have at least one due card
  - Sorted alphabetically by deck name for consistent UI
  - Empty array `[]` if no cards are due

**Edge Cases:**

- User has no decks → `total_due: 0`, `next_review_date: null`, `decks: []`
- User has decks but no flashcards → same as above
- All cards are due → `next_review_date: null` (no future reviews)
- No cards are due → `total_due: 0`, `decks: []`, `next_review_date: <earliest future date>`

### Error Responses

#### 401 Unauthorized

Returned when user is not authenticated or session is invalid.

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**Triggers:**

- No session cookie present
- Invalid/expired session token
- Session token doesn't match any user in database

#### 500 Internal Server Error

Returned when server encounters unexpected error.

```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

**Triggers:**

- Database connection failure
- Query execution failure
- Service layer throws unexpected error

## 5. Data Flow

### High-Level Flow

```
1. Client → GET /api/study/summary
2. Astro Middleware → Attach Supabase client to context.locals
3. API Route Handler → Extract user from session
4. Guard Clause → If no user, return 401
5. Service Layer → Call studyService.getStudySummary(userId)
6. Database Queries → Execute queries (see detailed flow below)
7. Data Transformation → Format results as StudySummaryResponseDTO
8. Response → Return 200 with JSON
```

### Detailed Service Layer Flow

The `getStudySummary` function in `study.service.ts` will execute the following steps:

#### Query 1: Get Decks with Due Card Counts

```sql
SELECT
  d.id,
  d.name,
  COUNT(f.id)::int as due_count
FROM decks d
INNER JOIN flashcards f
  ON f.deck_id = d.id
  AND f.next_review <= NOW()
WHERE d.user_id = $userId
GROUP BY d.id, d.name
HAVING COUNT(f.id) > 0
ORDER BY d.name ASC
```

**Purpose:** Get list of decks with at least one due card, including the count per deck.

**Translation to Supabase Client:**

```typescript
const { data: deckSummaries, error } = await supabase
  .from("decks")
  .select("id, name, flashcards!inner(id)")
  .eq("user_id", userId)
  .lte("flashcards.next_review", new Date().toISOString());
```

**Post-Processing Required:**

- Group by deck_id and count flashcards
- Filter out decks with 0 due cards
- Sort by name

#### Query 2: Get Next Review Date

```sql
SELECT MIN(next_review) as next_review_date
FROM flashcards f
INNER JOIN decks d ON f.deck_id = d.id
WHERE d.user_id = $userId
  AND f.next_review > NOW()
```

**Purpose:** Find the earliest upcoming review date across all user's flashcards.

**Translation to Supabase Client:**

```typescript
const { data, error } = await supabase
  .from("flashcards")
  .select("next_review, decks!inner(user_id)")
  .eq("decks.user_id", userId)
  .gt("next_review", new Date().toISOString())
  .order("next_review", { ascending: true })
  .limit(1)
  .single();
```

**Post-Processing:**

- Extract `next_review` from result
- Return `null` if no results

#### Data Aggregation

1. Calculate `total_due` by summing all `due_count` values from Query 1
2. Extract `next_review_date` from Query 2 result
3. Map deck summaries to `DeckSummaryDTO[]` format
4. Return `StudySummaryResponseDTO` object

### Security Enforcement via RLS

All queries **MUST** join with `decks` table and filter by `user_id` to ensure:

- User can only see their own decks
- User can only access flashcards from their own decks
- RLS policies on tables provide defense-in-depth

## 6. Security Considerations

### Authentication

**Requirement:** User must be authenticated via Supabase session.

**Implementation:**

```typescript
const {
  data: { user },
  error,
} = await context.locals.supabase.auth.getUser();

if (error || !user) {
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
```

**Security Notes:**

- Use `getUser()` not `getSession()` - validates JWT signature
- Always check both `error` and `user` (defense in depth)
- Don't expose detailed authentication errors to client

### Authorization

**Requirement:** User can only access their own data.

**Implementation:**

- All database queries filter by `user_id` from authenticated session
- Join with `decks` table ensures user ownership
- RLS policies on `decks` and `flashcards` tables enforce row-level access

**Query Pattern:**

```typescript
// CORRECT - Always filter by user_id
.eq("decks.user_id", user.id)

// WRONG - Never query without user filter
.from("flashcards").select("*") // Exposes all users' data!
```

### Data Exposure Prevention

**Protected Data:**

- Never expose `user_id` in response (already omitted from DTOs)
- Only return decks owned by authenticated user
- Deck IDs in response are user's own decks (safe to expose)

**UUID Validation:**

- Supabase client handles UUID format validation
- PostgreSQL enforces UUID type constraints
- No manual UUID validation required

### SQL Injection Prevention

**Protection Mechanisms:**

- Use Supabase client's parameterized queries (NOT raw SQL)
- All user input is automatically escaped by Supabase SDK
- No string concatenation in queries

**Safe Practice:**

```typescript
// SAFE - Parameterized
.eq("user_id", userId)

// UNSAFE - Never use raw SQL with user input
.rpc("raw_query", { sql: `WHERE user_id = '${userId}'` })
```

### Row Level Security (RLS)

**Prerequisites (must be verified):**

- RLS enabled on `decks` table
- RLS enabled on `flashcards` table
- Policies allow authenticated users to read their own data

**Verification:** Check `supabase/migrations/` for RLS policies

### Rate Limiting Considerations

**Current Implementation:** None specified

**Recommendations for Future:**

- Dashboard endpoint may be called frequently
- Consider implementing rate limiting at nginx/API gateway level
- Suggested limit: 60 requests/minute per user

### Timing Attacks

**Risk Level:** Minimal

**Reasoning:**

- No password comparison or sensitive data lookup
- Response times vary based on data volume (expected)
- No security-critical timing-sensitive operations

## 7. Error Handling

### Error Handling Pattern

Follow the established pattern from CLAUDE.md:

1. Handle errors first with guard clauses
2. Use early returns for error conditions
3. Place happy path last
4. Avoid nested if statements

### Service Layer Errors

#### Database Connection Failure

**Cause:** Supabase client cannot connect to database

**Detection:**

```typescript
if (error) {
  throw new Error(`Failed to fetch deck summaries: ${error.message}`);
}
```

**Response:** 500 Internal Server Error

#### Query Execution Failure

**Cause:** Invalid query, constraint violation, timeout

**Detection:**

```typescript
if (deckSummariesError) {
  throw new Error(`Failed to fetch deck summaries: ${deckSummariesError.message}`);
}

if (nextReviewError) {
  throw new Error(`Failed to fetch next review date: ${nextReviewError.message}`);
}
```

**Response:** 500 Internal Server Error

### API Route Error Handling

**Pattern:**

```typescript
export const GET: APIRoute = async (context) => {
  try {
    // 1. Authentication guard clause
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

    // 2. Service call (may throw)
    const summary = await getStudySummary(context.locals.supabase, user.id);

    // 3. Happy path - return success
    return new Response(JSON.stringify(summary), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    // 4. Catch-all error handler
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred",
        },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
```

### Error Scenarios Summary

| Scenario                    | Status | Error Code            | Message                      |
| --------------------------- | ------ | --------------------- | ---------------------------- |
| No session token            | 401    | UNAUTHORIZED          | Authentication required      |
| Invalid session token       | 401    | UNAUTHORIZED          | Authentication required      |
| Expired session             | 401    | UNAUTHORIZED          | Authentication required      |
| Database connection failure | 500    | INTERNAL_SERVER_ERROR | An unexpected error occurred |
| Query execution error       | 500    | INTERNAL_SERVER_ERROR | An unexpected error occurred |
| Unexpected exception        | 500    | INTERNAL_SERVER_ERROR | An unexpected error occurred |

**Note:** Error messages to client are intentionally generic to prevent information leakage. Detailed errors should be logged server-side (future improvement).

## 8. Performance Considerations

### Query Optimization

#### Current Approach: Two Separate Queries

**Query 1 (Deck Summaries):**

- Join `decks` with `flashcards`
- Filter by user_id and due date
- Group by deck
- **Estimated Cost:** O(n) where n = number of user's flashcards

**Query 2 (Next Review Date):**

- Join `flashcards` with `decks`
- Filter by user_id and future dates
- Sort by next_review
- Limit 1
- **Estimated Cost:** O(n log n) due to sort, but with LIMIT 1 and early termination

#### Potential Optimization: Single Query with Window Functions

Could combine into one query using PostgreSQL window functions, but adds complexity. Recommendation: **Start with two queries** for clarity, optimize later if needed.

### Database Indexes

**Required Indexes (verify in migrations):**

1. **`flashcards.next_review`** - Critical for filtering due cards

   ```sql
   CREATE INDEX idx_flashcards_next_review ON flashcards(next_review);
   ```

2. **`flashcards(deck_id, next_review)`** - Composite for JOIN + filter

   ```sql
   CREATE INDEX idx_flashcards_deck_next_review
   ON flashcards(deck_id, next_review);
   ```

3. **`decks.user_id`** - For user ownership filtering
   ```sql
   CREATE INDEX idx_decks_user_id ON decks(user_id);
   ```

**Impact Without Indexes:**

- Full table scan on flashcards (slow with many cards)
- Response time increases linearly with database size

### Expected Performance

**Assumptions:**

- Average user: 10 decks, 500 flashcards total
- Properly indexed database

**Expected Response Times:**

- Query execution: < 50ms
- Data transformation: < 5ms
- Total API response: < 100ms

**Scalability:**

- Scales linearly with user's flashcard count
- No cross-user queries (excellent multi-tenancy performance)
- Response size: ~1-5KB JSON (minimal network overhead)

### Caching Considerations

**Current Implementation:** No caching

**Future Optimization Opportunities:**

1. **Client-Side Caching:**
   - Cache response for 30-60 seconds
   - Invalidate on study session completion

2. **Server-Side Caching:**
   - Redis cache keyed by user_id
   - TTL: 30 seconds
   - Invalidate on flashcard review submission

**Recommendation:** Implement client-side caching first (simpler, effective).

### Potential Bottlenecks

1. **Database Query Time**
   - Mitigation: Ensure proper indexes exist
   - Monitor: Add query timing logs

2. **Network Latency**
   - Mitigation: Deploy close to database region
   - Monitor: Add response time tracking

3. **Large Deck Counts**
   - Edge case: User with 100+ decks
   - Mitigation: Response size still manageable (only decks with due cards)

## 9. Implementation Steps

### Step 1: Create Service Function

**File:** `src/lib/services/study.service.ts`

**Action:** Add `getStudySummary` function to existing service file

**Implementation:**

```typescript
/**
 * Retrieves study summary for dashboard overview.
 *
 * Aggregates data across all user's decks to provide:
 * - Total count of due flashcards
 * - Next scheduled review date
 * - Per-deck breakdown of due counts
 *
 * Flow:
 * 1. Query decks with JOIN to flashcards to get due counts
 * 2. Group results by deck and filter decks with due_count > 0
 * 3. Query for earliest next_review date in the future
 * 4. Calculate total_due by summing deck counts
 * 5. Format and return StudySummaryResponseDTO
 *
 * Security:
 * - All queries filter by user_id to ensure data isolation
 * - RLS policies provide additional protection
 *
 * @param supabase - Authenticated Supabase client
 * @param userId - UUID of authenticated user
 * @returns Study summary with due counts and next review date
 * @throws {Error} If database queries fail
 */
export async function getStudySummary(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<StudySummaryResponseDTO> {
  // Implementation here (see detailed code in step)
}
```

**Key Implementation Details:**

1. **Query 1: Get decks with due flashcards**

   ```typescript
   const { data: decksWithFlashcards, error: decksError } = await supabase
     .from("decks")
     .select(
       `
       id,
       name,
       flashcards!inner(id)
     `
     )
     .eq("user_id", userId)
     .lte("flashcards.next_review", new Date().toISOString());
   ```

2. **Transform to DeckSummaryDTO with counts**

   ```typescript
   // Group flashcards by deck_id and count
   const deckMap = new Map<string, { id: string; name: string; due_count: number }>();

   decksWithFlashcards?.forEach((deck) => {
     if (!deckMap.has(deck.id)) {
       deckMap.set(deck.id, {
         id: deck.id,
         name: deck.name,
         due_count: 0,
       });
     }
     deckMap.get(deck.id)!.due_count++;
   });

   const deckSummaries = Array.from(deckMap.values()).sort((a, b) => a.name.localeCompare(b.name));
   ```

3. **Query 2: Get next review date**

   ```typescript
   const { data: nextReviewData, error: nextReviewError } = await supabase
     .from("flashcards")
     .select("next_review, decks!inner(user_id)")
     .eq("decks.user_id", userId)
     .gt("next_review", new Date().toISOString())
     .order("next_review", { ascending: true })
     .limit(1)
     .maybeSingle();
   ```

4. **Calculate total and return**

   ```typescript
   const total_due = deckSummaries.reduce((sum, deck) => sum + deck.due_count, 0);

   return {
     total_due,
     next_review_date: nextReviewData?.next_review ?? null,
     decks: deckSummaries,
   };
   ```

**Error Handling:**

```typescript
if (decksError) {
  throw new Error(`Failed to fetch deck summaries: ${decksError.message}`);
}

if (nextReviewError) {
  throw new Error(`Failed to fetch next review date: ${nextReviewError.message}`);
}
```

### Step 2: Create API Route Handler

**File:** `src/pages/api/study/summary.ts`

**Create Directory:** `src/pages/api/study/` (if not exists)

**Implementation:**

```typescript
/**
 * GET /api/study/summary
 *
 * Returns study summary for dashboard including total due cards,
 * next review date, and per-deck breakdown.
 *
 * @auth Required - User must be authenticated
 * @returns {StudySummaryResponseDTO} Study summary data
 * @throws {401} If user not authenticated
 * @throws {500} If server error occurs
 */

import type { APIRoute } from "astro";
import { getStudySummary } from "@/lib/services/study.service";
import type { ErrorResponseDTO } from "@/types";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  try {
    // Guard clause: Verify authentication
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

    // Fetch study summary from service layer
    const summary = await getStudySummary(context.locals.supabase, user.id);

    // Happy path: Return success response
    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Catch-all error handler
    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "INTERNAL_SERVER_ERROR",
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

**Key Points:**

- Export `prerender = false` for SSR
- Use uppercase `GET` export (Astro convention)
- Extract service logic to service layer
- Follow error-first guard clause pattern
- Return proper Content-Type headers

### Step 3: Verify Database Indexes

**Action:** Check that required indexes exist in migration files

**Files to Check:** `supabase/migrations/*.sql`

**Required Indexes:**

1. `idx_flashcards_next_review` on `flashcards(next_review)`
2. `idx_flashcards_deck_next_review` on `flashcards(deck_id, next_review)`
3. `idx_decks_user_id` on `decks(user_id)`

**If Missing:** Create new migration file following naming convention:

```
YYYYMMDDHHmmss_add_study_summary_indexes.sql
```

**Migration Content:**

```sql
-- Migration: Add indexes for study summary endpoint performance
-- Purpose: Optimize queries for GET /api/study/summary
-- Tables affected: flashcards, decks

-- Index for filtering flashcards by next_review date
create index if not exists idx_flashcards_next_review
on flashcards(next_review);

-- Composite index for deck-based filtering with next_review
create index if not exists idx_flashcards_deck_next_review
on flashcards(deck_id, next_review);

-- Index for filtering decks by user_id
create index if not exists idx_decks_user_id
on decks(user_id);
```

### Step 4: Verify RLS Policies

**Action:** Ensure Row Level Security policies allow authenticated users to read their data

**Tables to Verify:**

1. `decks` table - users can read their own decks
2. `flashcards` table - users can read flashcards from their decks

**Check Migration Files:** Look for RLS policy definitions

**Expected Policies:**

**Decks Table:**

```sql
-- Policy: authenticated users can select their own decks
create policy "Users can select own decks"
on decks for select
to authenticated
using (auth.uid() = user_id);
```

**Flashcards Table:**

```sql
-- Policy: authenticated users can select flashcards from their decks
create policy "Users can select flashcards from own decks"
on flashcards for select
to authenticated
using (
  exists (
    select 1 from decks
    where decks.id = flashcards.deck_id
    and decks.user_id = auth.uid()
  )
);
```

**If Missing:** Create migration to add policies (critical for security)

### Step 5: Add Type Exports (if needed)

**Action:** Verify types are exported from `src/types.ts`

**Required Exports (already exist):**

- `StudySummaryResponseDTO` ✓
- `DeckSummaryDTO` ✓
- `ErrorResponseDTO` ✓

**No action needed** - types already properly exported

### Step 6: Manual Testing

**Test Cases:**

1. **Happy Path - User with due cards**

   ```bash
   # Prerequisite: Create test user with decks and flashcards
   # Set some flashcards with next_review in the past

   curl -X GET http://localhost:3000/api/study/summary \
     -H "Cookie: sb-access-token=<valid-token>"

   # Expected: 200 with summary data
   ```

2. **No due cards**

   ```bash
   # Prerequisite: User with no cards due (all next_review in future)

   curl -X GET http://localhost:3000/api/study/summary \
     -H "Cookie: sb-access-token=<valid-token>"

   # Expected: 200 with total_due: 0, empty decks array
   ```

3. **No decks**

   ```bash
   # Prerequisite: User with no decks created

   curl -X GET http://localhost:3000/api/study/summary \
     -H "Cookie: sb-access-token=<valid-token>"

   # Expected: 200 with total_due: 0, next_review_date: null, decks: []
   ```

4. **Unauthenticated**

   ```bash
   curl -X GET http://localhost:3000/api/study/summary

   # Expected: 401 with UNAUTHORIZED error
   ```

5. **Invalid token**

   ```bash
   curl -X GET http://localhost:3000/api/study/summary \
     -H "Cookie: sb-access-token=invalid-token"

   # Expected: 401 with UNAUTHORIZED error
   ```

6. **Multiple decks with varying due counts**

   ```bash
   # Prerequisite: User with 3+ decks, some with due cards, some without

   curl -X GET http://localhost:3000/api/study/summary \
     -H "Cookie: sb-access-token=<valid-token>"

   # Expected: 200 with only decks that have due_count > 0
   # Verify decks are sorted alphabetically by name
   ```

### Step 7: Integration Testing

**Create Test File:** `src/lib/services/study.service.test.ts` (optional but recommended)

**Test Coverage:**

1. `getStudySummary` with various data scenarios
2. Verify user isolation (User A cannot see User B's data)
3. Edge cases (empty database, large datasets)
4. Error handling (database errors)

**Testing Framework:** Use Vitest (if configured) or manual Postman tests

### Step 8: Code Review Checklist

Before marking as complete, verify:

- [ ] Service function added to `study.service.ts`
- [ ] API route created at `src/pages/api/study/summary.ts`
- [ ] `prerender = false` set in API route
- [ ] Authentication guard clause implemented
- [ ] Error handling follows guard clause pattern
- [ ] All database queries filter by `user_id`
- [ ] Response matches `StudySummaryResponseDTO` type
- [ ] HTTP status codes are correct (200, 401, 500)
- [ ] Content-Type headers set to `application/json`
- [ ] Required database indexes exist
- [ ] RLS policies verified on `decks` and `flashcards`
- [ ] Manual testing completed for all test cases
- [ ] Code follows ESLint rules (run `npm run lint`)
- [ ] Code formatted with Prettier (run `npm run format`)
- [ ] No console.log statements in production code
- [ ] Error messages don't leak sensitive information
- [ ] TypeScript types are properly used (no `any` types)

### Step 9: Documentation

**Update API Documentation:** Document the new endpoint in project docs (if applicable)

**Add JSDoc Comments:** Ensure all functions have proper JSDoc comments

**Update CHANGELOG:** Add entry for new endpoint (if project uses changelog)

### Step 10: Deployment Preparation

**Pre-deployment Checklist:**

1. **Run Build:** `npm run build` - ensure no TypeScript errors
2. **Run Linter:** `npm run lint` - fix any issues
3. **Test in Preview:** `npm run preview` - test production build locally
4. **Verify Environment Variables:** Ensure `SUPABASE_URL` and `SUPABASE_KEY` set in production
5. **Database Migrations:** Apply migrations to production database
6. **Monitor Logs:** Set up logging/monitoring for errors
7. **Performance Baseline:** Measure initial response times

**Deployment Steps:**

1. Merge feature branch to develop/main
2. Run CI/CD pipeline (GitHub Actions)
3. Deploy to staging environment first
4. Run smoke tests on staging
5. Deploy to production
6. Monitor error rates and response times

---

## Summary

This implementation plan provides a comprehensive guide for implementing the `GET /api/study/summary` endpoint. The endpoint aggregates flashcard data across all user's decks to provide a dashboard overview with total due counts, next review date, and per-deck breakdown.

**Key Implementation Points:**

- Add `getStudySummary` function to existing `study.service.ts`
- Create API route at `src/pages/api/study/summary.ts`
- All necessary types already exist in `src/types.ts`
- Requires two database queries (decks with due counts + next review date)
- Enforce security via user_id filtering and RLS policies
- Follow error-first guard clause pattern
- Return proper HTTP status codes and error responses

**Files to Modify:**

1. `src/lib/services/study.service.ts` - Add `getStudySummary` function
2. `src/pages/api/study/summary.ts` - Create new API route

**Files to Verify:**

1. `supabase/migrations/*.sql` - Check indexes and RLS policies exist
2. `src/types.ts` - Verify exports (already complete)

**No New Files Required:**

- All types already defined
- Service file already exists
- Middleware already configured

The implementation should take approximately 2-3 hours including testing and verification.
