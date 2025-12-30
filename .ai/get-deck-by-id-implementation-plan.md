# API Endpoint Implementation Plan: GET /api/decks/{deckId}

## 1. Endpoint Overview

This endpoint retrieves a specific deck by its ID with computed metadata, including total flashcard count and due flashcard count. The endpoint requires authentication and enforces ownership validation to ensure users can only access their own decks.

**Key Characteristics:**
- Read-only operation (no data modification)
- Requires user authentication via Supabase JWT
- Enforces resource ownership (users can only view their own decks)
- Returns computed metadata calculated from related flashcards table
- Uses dynamic route parameter `[deckId]` in Astro file-based routing

## 2. Request Details

### HTTP Method
`GET`

### URL Structure
```
GET /api/decks/{deckId}
```

### Path Parameters

| Parameter | Type | Required | Validation | Description |
|-----------|------|----------|------------|-------------|
| `deckId` | UUID string | Yes | Valid UUID v4 format | Unique identifier of the deck to retrieve |

### Query Parameters
None

### Request Headers
```
Authorization: Bearer <JWT_TOKEN>
```

### Request Body
None (GET request)

### Example Request
```http
GET /api/decks/550e8400-e29b-41d4-a716-446655440000 HTTP/1.1
Host: example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 3. Utilized Types

### Response Types

**DeckWithMetadataDTO** (from `src/types.ts:121-124`)
```typescript
interface DeckWithMetadataDTO extends Omit<Deck, "user_id"> {
  total_flashcards: number;
  due_flashcards: number;
}
```

This type includes all base `Deck` fields except `user_id` (omitted for security):
- `id`: UUID
- `name`: string (1-100 characters)
- `created_at`: ISO timestamp
- `updated_at`: ISO timestamp
- `total_flashcards`: number (computed)
- `due_flashcards`: number (computed)

**ErrorResponseDTO** (from `src/types.ts:83-89`)
```typescript
interface ErrorResponseDTO {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
```

### Service Layer Types

No new types needed. The existing `DeckService` will be extended with a new method.

## 4. Response Details

### Success Response (200 OK)

**Status Code:** `200`

**Headers:**
```
Content-Type: application/json
X-Content-Type-Options: nosniff
```

**Body Structure:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Biology 101",
  "created_at": "2024-12-01T10:00:00Z",
  "updated_at": "2024-12-05T14:00:00Z",
  "total_flashcards": 50,
  "due_flashcards": 12
}
```

**Field Descriptions:**
- `id`: Unique deck identifier (UUID)
- `name`: User-defined deck name
- `created_at`: ISO 8601 timestamp when deck was created
- `updated_at`: ISO 8601 timestamp of last deck modification
- `total_flashcards`: Total number of flashcards in this deck
- `due_flashcards`: Number of flashcards due for review (where `next_review <= NOW()`)

**Note:** The `user_id` field is intentionally omitted from the response for security reasons, even though the user is authenticated and owns the deck.

### Error Responses

#### 400 Bad Request - Invalid UUID Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid deck ID format",
    "details": {
      "deckId": ["Invalid UUID format"]
    }
  }
}
```

#### 401 Unauthorized - Not Authenticated
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

#### 404 Not Found - Deck Not Found or Not Owned
```json
{
  "error": {
    "code": "DECK_NOT_FOUND",
    "message": "Deck not found"
  }
}
```

**Important:** The same 404 response is returned whether the deck doesn't exist or exists but is owned by another user. This prevents information leakage about the existence of other users' decks.

#### 500 Internal Server Error - Unexpected Error
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

## 5. Data Flow

### Request Flow Diagram

```
1. Client Request
   ↓
2. Astro API Route Handler (src/pages/api/decks/[deckId].ts)
   ├─→ Extract deckId from context.params
   ├─→ Validate UUID format with Zod
   └─→ Authenticate user via Supabase
   ↓
3. DeckService.getDeckById(userId, deckId)
   ├─→ Query decks table (SELECT with user_id + id filter)
   ├─→ Check if deck exists and is owned by user
   ├─→ Count total flashcards (SELECT COUNT WHERE deck_id = deckId)
   ├─→ Count due flashcards (SELECT COUNT WHERE deck_id = deckId AND next_review <= NOW())
   └─→ Return DeckWithMetadataDTO
   ↓
4. API Route Handler
   ├─→ Format response
   └─→ Return 200 with JSON body
   ↓
5. Client receives DeckWithMetadataDTO
```

### Database Interactions

**Query 1: Fetch Deck with Ownership Validation**
```typescript
const { data: deck } = await supabase
  .from("decks")
  .select("id, name, created_at, updated_at")
  .eq("id", deckId)
  .eq("user_id", userId)
  .single();
```

**Query 2: Count Total Flashcards**
```typescript
const { count: totalFlashcards } = await supabase
  .from("flashcards")
  .select("*", { count: "exact", head: true })
  .eq("deck_id", deckId);
```

**Query 3: Count Due Flashcards**
```typescript
const now = new Date().toISOString();
const { count: dueFlashcards } = await supabase
  .from("flashcards")
  .select("*", { count: "exact", head: true })
  .eq("deck_id", deckId)
  .lte("next_review", now);
```

### Service Layer Responsibilities

The `DeckService` class (located in `src/lib/services/deck.service.ts`) will be extended with:

```typescript
async getDeckById(userId: string, deckId: string): Promise<DeckWithMetadataDTO>
```

**Responsibilities:**
1. Fetch deck from database filtering by both `id` AND `user_id`
2. Throw `DeckNotFoundError` if deck doesn't exist or doesn't belong to user
3. Execute parallel queries for flashcard counts (total and due)
4. Construct and return `DeckWithMetadataDTO` object
5. Let database errors propagate to route handler

## 6. Security Considerations

### Authentication
- **Method:** Supabase JWT-based authentication
- **Implementation:** Call `context.locals.supabase.auth.getUser()` to verify token
- **Failure handling:** Return 401 if authentication fails or user is null

### Authorization (Ownership Validation)
- **Strategy:** Database query filters by both `deck_id` AND `user_id`
- **Implementation:** `.eq("user_id", userId)` in the Supabase query
- **Benefit:** Prevents unauthorized access at the database level
- **Information Leakage Prevention:** Return same 404 error whether deck doesn't exist or user doesn't own it

### Input Validation
- **UUID Validation:** Use Zod schema to validate UUID v4 format
  ```typescript
  const deckIdSchema = z.string().uuid("Invalid deck ID format");
  ```
- **Prevention:** Blocks potential SQL injection attempts or invalid IDs
- **Response:** Return 400 Bad Request for invalid UUID formats

### Data Exposure
- **User ID Omission:** The `user_id` field is explicitly omitted from `DeckWithMetadataDTO`
- **Rationale:** Prevents exposure of internal user identifiers to clients
- **Implementation:** TypeScript type enforces this at compile time

### Response Headers
```typescript
{
  "Content-Type": "application/json",
  "X-Content-Type-Options": "nosniff"
}
```
- `X-Content-Type-Options: nosniff` prevents MIME type sniffing attacks

### Row Level Security (RLS)
- Assumes RLS policies are enabled on the `decks` table in Supabase
- RLS provides defense-in-depth alongside application-level checks
- Service uses authenticated Supabase client via middleware

## 7. Error Handling

### Error Handling Strategy
Follow the guard clause pattern with early returns for error conditions, placing the happy path last in the function.

### Error Scenarios and Responses

| Scenario | HTTP Status | Error Code | Error Message | Handling Location |
|----------|-------------|------------|---------------|-------------------|
| Invalid UUID format | 400 | `VALIDATION_ERROR` | "Invalid deck ID format" | API Route (Zod validation) |
| Missing/invalid JWT | 401 | `UNAUTHORIZED` | "Authentication required" | API Route (auth check) |
| Deck not found | 404 | `DECK_NOT_FOUND` | "Deck not found" | Service Layer (custom error) |
| Deck owned by other user | 404 | `DECK_NOT_FOUND` | "Deck not found" | Service Layer (custom error) |
| Database connection error | 500 | `INTERNAL_ERROR` | "An unexpected error occurred" | API Route (catch block) |
| Unexpected service error | 500 | `INTERNAL_ERROR` | "An unexpected error occurred" | API Route (catch block) |

### Custom Error Class

Create a new custom error in `src/lib/services/deck.service.ts`:

```typescript
export class DeckNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DeckNotFoundError";
  }
}
```

### Error Handling Flow in Route Handler

```typescript
export const GET: APIRoute = async (context) => {
  try {
    // 1. Validate UUID format
    // 2. Authenticate user
    // 3. Call service
    // 4. Return success response
  } catch (error) {
    // Handle DeckNotFoundError → 404
    if (error instanceof DeckNotFoundError) {
      return errorResponse("DECK_NOT_FOUND", "Deck not found", 404);
    }

    // Log and handle unexpected errors → 500
    console.error("Error in GET /api/decks/[deckId]:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
};
```

### Error Logging
- Use `console.error()` for development (as per existing codebase patterns)
- Include endpoint path and error object in log messages
- Production systems should replace with proper logging service (e.g., Sentry, DataDog)

## 8. Performance Considerations

### Database Query Optimization

**Current Approach (3 sequential queries):**
1. Fetch deck with ownership validation
2. Count total flashcards
3. Count due flashcards

**Potential Bottleneck:**
- Three round-trips to database for a single request
- Sequential execution blocks the response

**Optimization Strategy:**
- Execute flashcard count queries in parallel using `Promise.all()`
- Only execute counts if deck is found and owned
- Leverage database indexes on `deck_id` and `next_review` columns

**Optimized Implementation:**
```typescript
// Execute count queries in parallel
const [totalResult, dueResult] = await Promise.all([
  supabase.from("flashcards").select("*", { count: "exact", head: true }).eq("deck_id", deckId),
  supabase
    .from("flashcards")
    .select("*", { count: "exact", head: true })
    .eq("deck_id", deckId)
    .lte("next_review", now),
]);
```

### Database Indexing Requirements

Ensure the following indexes exist in Supabase:

**decks table:**
- Primary key index on `id` (auto-created)
- Composite index on `(user_id, id)` for ownership queries

**flashcards table:**
- Index on `deck_id` (foreign key, likely auto-indexed)
- Composite index on `(deck_id, next_review)` for due card queries

### Caching Considerations

**Not Recommended for Initial Implementation:**
- Deck metadata changes frequently as flashcards are reviewed
- Due flashcard count is time-dependent (based on current timestamp)
- Cache invalidation would be complex

**Future Optimization:**
- Consider short-lived cache (5-10 seconds) for deck metadata if usage patterns show repeated requests
- Use ETags for conditional requests if clients frequently re-fetch unchanged decks

### Response Size
- Response is minimal (single deck object, ~200-300 bytes)
- No pagination needed
- No compression needed for single resource responses

### Expected Performance Targets
- Response time: < 200ms (with database indexes)
- Database queries: 3 (1 sequential + 2 parallel)
- Scalability: Linear with number of concurrent users (stateless endpoint)

## 9. Implementation Steps

### Step 1: Create Custom Error Class
**File:** `src/lib/services/deck.service.ts`

Add the `DeckNotFoundError` class after the existing `DuplicateDeckError`:

```typescript
/**
 * Custom error for deck not found or not owned by user
 */
export class DeckNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DeckNotFoundError";
  }
}
```

### Step 2: Extend DeckService with getDeckById Method
**File:** `src/lib/services/deck.service.ts`

Add the following method to the `DeckService` class:

```typescript
/**
 * Retrieves a specific deck by ID with metadata.
 *
 * Flow:
 * 1. Fetch deck from database filtering by id AND user_id (ownership validation)
 * 2. Throw DeckNotFoundError if deck not found or not owned
 * 3. Execute parallel queries to count total and due flashcards
 * 4. Return DeckWithMetadataDTO
 *
 * @param userId - UUID of the authenticated user
 * @param deckId - UUID of the deck to retrieve
 * @returns Deck with computed metadata (flashcard counts)
 * @throws {DeckNotFoundError} If deck not found or not owned by user
 * @throws {Error} If database operation fails
 */
async getDeckById(userId: string, deckId: string): Promise<DeckWithMetadataDTO> {
  // Step 1: Fetch deck with ownership validation
  const { data: deck, error: deckError } = await this.supabase
    .from("decks")
    .select("id, name, created_at, updated_at")
    .eq("id", deckId)
    .eq("user_id", userId)
    .single();

  // Guard clause: deck not found or not owned
  if (deckError || !deck) {
    throw new DeckNotFoundError("Deck not found");
  }

  // Step 2: Fetch flashcard counts in parallel
  const now = new Date().toISOString();

  const [totalResult, dueResult] = await Promise.all([
    this.supabase
      .from("flashcards")
      .select("*", { count: "exact", head: true })
      .eq("deck_id", deckId),
    this.supabase
      .from("flashcards")
      .select("*", { count: "exact", head: true })
      .eq("deck_id", deckId)
      .lte("next_review", now),
  ]);

  // Step 3: Construct and return response
  return {
    id: deck.id,
    name: deck.name,
    created_at: deck.created_at,
    updated_at: deck.updated_at,
    total_flashcards: totalResult.count ?? 0,
    due_flashcards: dueResult.count ?? 0,
  };
}
```

### Step 3: Create Dynamic Route File
**File:** `src/pages/api/decks/[deckId].ts`

Create a new file for the dynamic route with the following structure:

```typescript
import type { APIRoute } from "astro";
import { z } from "zod";
import { DeckService, DeckNotFoundError } from "@/lib/services/deck.service";
import { errorResponse, successResponse } from "@/lib/utils/api-response";

// Disable static prerendering (SSR only)
export const prerender = false;

// Zod schema for UUID validation
const deckIdSchema = z.string().uuid("Invalid deck ID format");
```

### Step 4: Implement GET Handler
**File:** `src/pages/api/decks/[deckId].ts`

Add the GET export with complete error handling:

```typescript
/**
 * GET /api/decks/{deckId}
 *
 * Retrieves a specific deck by ID with metadata (flashcard counts).
 * Requires authentication and ownership validation.
 *
 * @param deckId - UUID path parameter
 * @returns DeckWithMetadataDTO (200 OK)
 * @throws 400 if deckId is not a valid UUID
 * @throws 401 if user not authenticated
 * @throws 404 if deck not found or not owned by user
 * @throws 500 if unexpected error occurs
 */
export const GET: APIRoute = async (context) => {
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
      throw error; // Re-throw unexpected errors
    }

    // Step 2: Authenticate user
    const {
      data: { user },
      error: authError,
    } = await context.locals.supabase.auth.getUser();

    // Guard clause: authentication failed
    if (authError || !user) {
      return errorResponse("UNAUTHORIZED", "Authentication required", 401);
    }

    // Step 3: Call service layer
    const deckService = new DeckService(context.locals.supabase);
    const deck = await deckService.getDeckById(user.id, validatedDeckId);

    // Step 4: Return success response
    return successResponse(deck, 200);
  } catch (error) {
    // Handle DeckNotFoundError
    if (error instanceof DeckNotFoundError) {
      return errorResponse("DECK_NOT_FOUND", "Deck not found", 404);
    }

    // Log and handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("Error in GET /api/decks/[deckId]:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
};
```

### Step 5: Test Implementation

**Manual Testing Checklist:**

1. **Valid Request Test:**
   ```bash
   curl -X GET \
     'http://localhost:3000/api/decks/550e8400-e29b-41d4-a716-446655440000' \
     -H 'Authorization: Bearer <valid_token>'
   ```
   Expected: 200 OK with DeckWithMetadataDTO

2. **Invalid UUID Test:**
   ```bash
   curl -X GET \
     'http://localhost:3000/api/decks/invalid-uuid' \
     -H 'Authorization: Bearer <valid_token>'
   ```
   Expected: 400 Bad Request with VALIDATION_ERROR

3. **Unauthenticated Test:**
   ```bash
   curl -X GET \
     'http://localhost:3000/api/decks/550e8400-e29b-41d4-a716-446655440000'
   ```
   Expected: 401 Unauthorized

4. **Deck Not Found Test:**
   ```bash
   curl -X GET \
     'http://localhost:3000/api/decks/00000000-0000-0000-0000-000000000000' \
     -H 'Authorization: Bearer <valid_token>'
   ```
   Expected: 404 Not Found

5. **Ownership Violation Test:**
   - Create a deck with User A
   - Try to access it with User B's token
   - Expected: 404 Not Found (same as not found)

### Step 6: Verify Type Safety

Run TypeScript type checking:
```bash
npm run build
```

Ensure no type errors are reported for the new files.

### Step 7: Run Linter

Execute linting to ensure code quality:
```bash
npm run lint
```

Fix any linting issues that are reported.

### Step 8: Update API Documentation (Optional)

If the project maintains API documentation (e.g., OpenAPI/Swagger), update it to include the new endpoint with:
- Path parameter specification
- Response schemas
- Error response examples
- Authentication requirements

---

## Implementation Checklist

- [ ] Add `DeckNotFoundError` class to `deck.service.ts`
- [ ] Implement `getDeckById` method in `DeckService` class
- [ ] Create `src/pages/api/decks/[deckId].ts` file
- [ ] Implement GET handler with validation and error handling
- [ ] Test with valid deck ID and authenticated user
- [ ] Test with invalid UUID format
- [ ] Test with missing authentication
- [ ] Test with non-existent deck ID
- [ ] Test with deck owned by different user
- [ ] Verify TypeScript compilation succeeds
- [ ] Run linter and fix any issues
- [ ] Update API documentation (if applicable)

---

## Notes and Considerations

### Discrepancy in API Specification
The endpoint specification shows `user_id` in the response example, but the existing `DeckWithMetadataDTO` type explicitly omits it. This implementation follows the type definition and omits `user_id` for security reasons. If `user_id` is required in the response, the type definition should be updated first.

### Future Enhancements
1. **Caching:** Implement short-lived cache for frequently accessed decks
2. **ETags:** Support conditional requests with If-None-Match headers
3. **Expanded Metadata:** Add additional computed fields like completion percentage or average review interval
4. **Batch Retrieval:** Consider a separate endpoint for retrieving multiple decks by IDs

### Alignment with Existing Code
This implementation follows established patterns from:
- `src/pages/api/profile/index.ts` for authentication and error handling
- `src/pages/api/decks.ts` for service instantiation and response formatting
- `src/lib/services/deck.service.ts` for service method structure and database queries
