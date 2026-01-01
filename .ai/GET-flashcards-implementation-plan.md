# API Endpoint Implementation Plan: GET /api/flashcards

## 1. Endpoint Overview

The GET /api/flashcards endpoint retrieves a paginated list of flashcards for the authenticated user. It supports optional filtering by deck, flexible sorting options, and pagination controls. This endpoint is essential for displaying flashcard collections in the UI and allowing users to browse their learning materials.

**Key Features**:
- Optional filtering by deck_id
- Configurable pagination (limit: 1-100, offset-based)
- Flexible sorting (by created_at, next_review, or updated_at)
- Ascending or descending sort order
- Returns metadata for pagination UI

## 2. Request Details

- **HTTP Method**: GET
- **URL Structure**: `/api/flashcards`
- **Authentication**: Required (authenticated user session)
- **Query Parameters**:

| Parameter | Type | Required | Default | Validation | Description |
|-----------|------|----------|---------|------------|-------------|
| deck_id | uuid | No | - | Valid UUID format | Filter flashcards by specific deck |
| limit | integer | No | 20 | 1-100 | Maximum number of items per page |
| offset | integer | No | 0 | >= 0 | Number of items to skip |
| sort | string | No | "created_at" | Enum: created_at, next_review, updated_at | Field to sort by |
| order | string | No | "desc" | Enum: asc, desc | Sort direction |

**Example Requests**:
```
GET /api/flashcards
GET /api/flashcards?deck_id=550e8400-e29b-41d4-a716-446655440000
GET /api/flashcards?limit=50&offset=100&sort=next_review&order=asc
GET /api/flashcards?deck_id=550e8400-e29b-41d4-a716-446655440000&limit=10&sort=updated_at
```

## 3. Types Used

### Existing Types (from src/types.ts)

**Response DTO**:
```typescript
export interface FlashcardsListResponseDTO {
  data: FlashcardDTO[];
  pagination: PaginationDTO;
}

export type FlashcardDTO = Flashcard;

export interface PaginationDTO {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}
```

### New Types Required

**Request Query DTO** (to be added to src/types.ts):
```typescript
/**
 * Query parameters for listing flashcards
 */
export interface GetFlashcardsQueryDTO {
  deck_id?: string;
  limit: number;
  offset: number;
  sort: 'created_at' | 'next_review' | 'updated_at';
  order: 'asc' | 'desc';
}
```

**Zod Validation Schema** (for API route):
```typescript
const GetFlashcardsQuerySchema = z.object({
  deck_id: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  sort: z.enum(['created_at', 'next_review', 'updated_at']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc')
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
  ],
  "pagination": {
    "total": 50,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```

### Error Responses

**401 Unauthorized**:
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "User not authenticated"
  }
}
```

**400 Bad Request**:
```json
{
  "error": {
    "code": "INVALID_QUERY_PARAMETERS",
    "message": "Invalid query parameters",
    "details": {
      "limit": "Must be between 1 and 100",
      "deck_id": "Invalid UUID format"
    }
  }
}
```

**404 Not Found** (when deck_id provided but deck doesn't exist or doesn't belong to user):
```json
{
  "error": {
    "code": "DECK_NOT_FOUND",
    "message": "Deck not found"
  }
}
```

**500 Internal Server Error**:
```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

## 5. Data Flow

```
1. Client sends GET request with optional query parameters
   ↓
2. API Route (/src/pages/api/flashcards/index.ts)
   - Extract query parameters from URL
   - Validate with Zod schema
   - Get authenticated user from context.locals.supabase
   ↓
3. Authentication Check
   - Verify user session exists
   - If not authenticated → return 401
   ↓
4. Service Layer (flashcard.service.ts)
   - If deck_id provided:
     • Verify deck exists and belongs to user
     • If not found → return 404
   - Build Supabase query:
     • Filter by user_id (via deck join)
     • Filter by deck_id (if provided)
     • Apply sorting (sort field + order)
     • Apply pagination (range: offset to offset+limit-1)
   - Execute count query for total items
   - Execute data query for flashcards
   ↓
5. Response Construction
   - Build FlashcardsListResponseDTO
   - Calculate has_more: (offset + limit) < total
   - Return 200 with JSON response
   ↓
6. Error Handling
   - Catch validation errors → 400
   - Catch not found errors → 404
   - Catch database errors → 500
```

### Database Interaction Details

**Tables Involved**:
- `flashcards` (main table)
- `decks` (for user ownership verification)

**Query Structure** (Supabase):
```typescript
// Base query
let query = supabase
  .from('flashcards')
  .select('*, decks!inner(user_id)', { count: 'exact' })
  .eq('decks.user_id', userId);

// Apply deck filter if provided
if (deck_id) {
  query = query.eq('deck_id', deck_id);
}

// Apply sorting
query = query.order(sort, { ascending: order === 'asc' });

// Apply pagination
query = query.range(offset, offset + limit - 1);
```

## 6. Security Considerations

### Authentication
- **Requirement**: User must be authenticated via Supabase session
- **Implementation**: Check `context.locals.supabase.auth.getUser()`
- **Failure Response**: 401 Unauthorized

### Authorization
- **Data Filtering**: Only return flashcards belonging to the authenticated user's decks
- **Implementation**: Join with `decks` table and filter by `decks.user_id = authenticated_user_id`
- **Deck Ownership**: When `deck_id` is provided, verify the deck belongs to the user before querying flashcards

### Input Validation
- **Zod Schema**: Validate all query parameters before processing
- **UUID Validation**: Ensure deck_id is a valid UUID format
- **Range Validation**: Enforce limit (1-100) and offset (>= 0) constraints
- **Enum Validation**: Restrict sort and order to allowed values

### Data Exposure Prevention
- **No Sensitive Data**: FlashcardDTO includes all FSRS parameters, which is acceptable for authenticated users viewing their own data
- **User ID Filtering**: Never expose flashcards from other users

### SQL Injection Prevention
- **Supabase**: Uses parameterized queries automatically
- **No Raw SQL**: Avoid `.rpc()` calls with user input

## 7. Error Handling

### Error Scenarios and Responses

| Scenario | Status Code | Error Code | Message | Details |
|----------|-------------|------------|---------|---------|
| User not authenticated | 401 | UNAUTHORIZED | "User not authenticated" | - |
| Invalid UUID for deck_id | 400 | INVALID_QUERY_PARAMETERS | "Invalid query parameters" | { deck_id: "Invalid UUID format" } |
| Limit out of range | 400 | INVALID_QUERY_PARAMETERS | "Invalid query parameters" | { limit: "Must be between 1 and 100" } |
| Offset negative | 400 | INVALID_QUERY_PARAMETERS | "Invalid query parameters" | { offset: "Must be >= 0" } |
| Invalid sort field | 400 | INVALID_QUERY_PARAMETERS | "Invalid query parameters" | { sort: "Must be one of: created_at, next_review, updated_at" } |
| Invalid order value | 400 | INVALID_QUERY_PARAMETERS | "Invalid query parameters" | { order: "Must be asc or desc" } |
| Deck not found (when deck_id provided) | 404 | DECK_NOT_FOUND | "Deck not found" | - |
| Database connection error | 500 | INTERNAL_SERVER_ERROR | "An unexpected error occurred" | - |
| Unexpected exception | 500 | INTERNAL_SERVER_ERROR | "An unexpected error occurred" | - |

### Error Handling Pattern

```typescript
// Guard clause pattern (early returns)

// 1. Authentication check
if (!user) {
  return new Response(JSON.stringify({
    error: {
      code: 'UNAUTHORIZED',
      message: 'User not authenticated'
    }
  }), { status: 401 });
}

// 2. Validation check
const validationResult = GetFlashcardsQuerySchema.safeParse(queryParams);
if (!validationResult.success) {
  return new Response(JSON.stringify({
    error: {
      code: 'INVALID_QUERY_PARAMETERS',
      message: 'Invalid query parameters',
      details: validationResult.error.flatten().fieldErrors
    }
  }), { status: 400 });
}

// 3. Deck ownership check (if deck_id provided)
if (deck_id && !deckExists) {
  return new Response(JSON.stringify({
    error: {
      code: 'DECK_NOT_FOUND',
      message: 'Deck not found'
    }
  }), { status: 404 });
}

// 4. Database error handling
try {
  // database operations
} catch (error) {
  return new Response(JSON.stringify({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred'
    }
  }), { status: 500 });
}

// Happy path
return new Response(JSON.stringify(result), { status: 200 });
```

## 8. Performance Considerations

### Potential Bottlenecks

1. **Large Result Sets**: Users with thousands of flashcards
   - **Mitigation**: Enforce maximum limit of 100 items per page
   - **Mitigation**: Use offset-based pagination (Supabase handles efficiently)

2. **Count Query Performance**: Counting total flashcards can be expensive
   - **Mitigation**: Supabase `count: 'exact'` is optimized with indexes
   - **Consider**: If performance becomes an issue, could cache counts or use estimated counts

3. **Multiple Database Queries**: Separate count and data queries
   - **Mitigation**: Supabase can combine these in a single request with `{ count: 'exact' }`

4. **Deck Ownership Verification**: Additional query when deck_id provided
   - **Mitigation**: Use inner join with decks table in single query instead of separate lookup

### Optimization Strategies

1. **Database Indexes** (should already exist from migration):
   - Index on `flashcards.deck_id` for filtering
   - Index on `flashcards.created_at`, `flashcards.next_review`, `flashcards.updated_at` for sorting
   - Index on `decks.user_id` for user filtering

2. **Query Optimization**:
   - Use inner join with decks table to filter by user_id and deck_id in single query
   - Leverage Supabase's automatic query optimization
   - Use `.select()` with specific columns if full FlashcardDTO becomes too large (currently acceptable)

3. **Response Size**:
   - Current default limit of 20 is reasonable
   - Maximum limit of 100 prevents excessive data transfer
   - Consider compression at server level if needed

4. **Caching** (future consideration):
   - Could cache results for common queries (e.g., first page, no filters)
   - Cache invalidation needed when flashcards are updated
   - Not necessary for MVP but could improve performance at scale

### Expected Performance

- **Target Response Time**: < 200ms for typical queries (20-50 items)
- **Database Query Time**: < 100ms with proper indexes
- **Network Transfer**: ~2-10KB for typical response (20 flashcards)

## 9. Implementation Steps

### Step 1: Add Type Definitions
**File**: `src/types.ts`

Add the new query DTO type:
```typescript
/**
 * Query parameters for listing flashcards
 */
export interface GetFlashcardsQueryDTO {
  deck_id?: string;
  limit: number;
  offset: number;
  sort: 'created_at' | 'next_review' | 'updated_at';
  order: 'asc' | 'desc';
}
```

### Step 2: Create Flashcard Service
**File**: `src/lib/services/flashcard.service.ts`

Create a new service file with the following function:
```typescript
import type { SupabaseClient } from '@/db/supabase.client';
import type { FlashcardsListResponseDTO, GetFlashcardsQueryDTO } from '@/types';

export async function listFlashcards(
  supabase: SupabaseClient,
  userId: string,
  filters: GetFlashcardsQueryDTO
): Promise<FlashcardsListResponseDTO> {
  // Implementation details in Step 3
}
```

### Step 3: Implement Service Logic
**File**: `src/lib/services/flashcard.service.ts`

Implement the `listFlashcards` function:
1. Build base query with user filtering (join with decks table)
2. Apply deck_id filter if provided
3. Apply sorting (sort field and order)
4. Apply pagination (range)
5. Execute query with count
6. Handle errors (deck not found, database errors)
7. Build and return FlashcardsListResponseDTO

**Key Implementation Details**:
- Use inner join with decks table: `.select('*, decks!inner(user_id)', { count: 'exact' })`
- Filter by user: `.eq('decks.user_id', userId)`
- Filter by deck (if provided): `.eq('deck_id', filters.deck_id)`
- Sort: `.order(filters.sort, { ascending: filters.order === 'asc' })`
- Paginate: `.range(filters.offset, filters.offset + filters.limit - 1)`
- Calculate has_more: `(offset + limit) < total`

### Step 4: Create API Route
**File**: `src/pages/api/flashcards/index.ts`

Create the API endpoint file:
1. Add `export const prerender = false`
2. Define Zod validation schema
3. Implement GET handler function
4. Extract query parameters from URL
5. Validate with Zod schema
6. Get authenticated user
7. Call service layer
8. Return response

**Key Implementation Details**:
- Extract query params: `const url = new URL(request.url); const params = Object.fromEntries(url.searchParams);`
- Validate: `const validationResult = GetFlashcardsQuerySchema.safeParse(params);`
- Get user: `const { data: { user }, error } = await context.locals.supabase.auth.getUser();`
- Call service: `const result = await listFlashcards(context.locals.supabase, user.id, validatedParams);`
- Return JSON: `return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } });`

### Step 5: Implement Error Handling
**File**: `src/pages/api/flashcards/index.ts`

Add comprehensive error handling:
1. Handle authentication errors (401)
2. Handle validation errors (400) with detailed field errors
3. Handle deck not found errors (404)
4. Handle database errors (500)
5. Use guard clauses for early returns

**Error Response Format**:
```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
```

### Step 6: Test the Endpoint

**Manual Testing**:
1. Test without authentication → expect 401
2. Test with valid parameters → expect 200 with data
3. Test with deck_id filter → expect filtered results
4. Test with invalid UUID → expect 400
5. Test with limit out of range → expect 400
6. Test with invalid sort field → expect 400
7. Test with non-existent deck_id → expect 404
8. Test pagination (different offsets) → verify correct data
9. Test sorting (different fields and orders) → verify correct order

**Test Cases**:
```bash
# No auth
curl -X GET http://localhost:3000/api/flashcards

# Valid request
curl -X GET http://localhost:3000/api/flashcards?limit=10 \
  -H "Authorization: Bearer <token>"

# With deck filter
curl -X GET "http://localhost:3000/api/flashcards?deck_id=<valid-uuid>&limit=20" \
  -H "Authorization: Bearer <token>"

# Invalid limit
curl -X GET "http://localhost:3000/api/flashcards?limit=150" \
  -H "Authorization: Bearer <token>"

# Invalid UUID
curl -X GET "http://localhost:3000/api/flashcards?deck_id=invalid-uuid" \
  -H "Authorization: Bearer <token>"

# Sorting
curl -X GET "http://localhost:3000/api/flashcards?sort=next_review&order=asc" \
  -H "Authorization: Bearer <token>"

# Pagination
curl -X GET "http://localhost:3000/api/flashcards?limit=10&offset=20" \
  -H "Authorization: Bearer <token>"
```

### Step 7: Verify Database Indexes

**Check existing indexes** in Supabase:
- Verify index on `flashcards.deck_id`
- Verify index on `flashcards.created_at`
- Verify index on `flashcards.next_review`
- Verify index on `flashcards.updated_at`
- Verify index on `decks.user_id`

If missing, create indexes via migration.

### Step 8: Code Review and Cleanup

1. Review code for adherence to project standards (CLAUDE.md)
2. Ensure proper TypeScript types throughout
3. Verify error handling covers all scenarios
4. Check for any console.log statements (should be removed or replaced with proper logging)
5. Ensure code follows early return pattern
6. Verify Zod schemas are comprehensive
7. Run linter: `npm run lint:fix`
8. Format code: `npm run format`

### Step 9: Documentation

1. Add JSDoc comments to service functions
2. Document query parameters in API route comments
3. Update API documentation if separate docs exist
4. Add examples of usage in code comments

### Step 10: Integration Testing

1. Test with real Supabase instance
2. Verify RLS policies allow authenticated users to read their flashcards
3. Test with multiple users to ensure data isolation
4. Verify performance with larger datasets
5. Test edge cases (empty results, single result, max limit)

---

## Summary

This implementation plan provides a comprehensive guide for implementing the GET /api/flashcards endpoint. The plan follows all project conventions (Astro 5, TypeScript, Supabase, Zod validation) and implements proper error handling, security measures, and performance optimizations.

**Key Success Criteria**:
- ✅ Authenticated users can list their flashcards
- ✅ Filtering by deck_id works correctly
- ✅ Pagination works with configurable limits and offsets
- ✅ Sorting by multiple fields in both directions
- ✅ Proper error responses for all scenarios
- ✅ User data isolation (users can't see others' flashcards)
- ✅ Performance optimized with database indexes
- ✅ Input validation prevents invalid requests
