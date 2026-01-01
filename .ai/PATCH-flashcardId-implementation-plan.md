# API Endpoint Implementation Plan: PATCH /api/flashcards/{flashcardId}

## 1. Endpoint Overview

**Purpose:** Update the content (front and/or back) of an existing flashcard without affecting FSRS spaced repetition parameters.

**Key Characteristics:**
- Allows partial updates (either front, back, or both)
- Preserves all FSRS algorithm state (stability, difficulty, review schedule, etc.)
- Enforces strict ownership validation through deck relationship
- Returns complete flashcard data after successful update

**Business Context:**
Users may need to correct typos, improve clarity, or update flashcard content based on learning progress. This operation intentionally does NOT reset the spaced repetition algorithm state, allowing users to refine content while maintaining their learning progress.

## 2. Request Details

### HTTP Method
`PATCH`

### URL Structure
```
/api/flashcards/{flashcardId}
```

### URL Parameters

| Parameter | Type | Required | Validation | Description |
|-----------|------|----------|------------|-------------|
| `flashcardId` | string | Yes | Must be valid UUID | Unique identifier of flashcard to update |

### Request Headers
```
Content-Type: application/json
Authorization: Bearer <supabase-session-token>
```

### Request Body

```typescript
{
  "front"?: string,  // Optional, 1-200 characters
  "back"?: string    // Optional, 1-500 characters
}
```

**Constraints:**
- At least one field (`front` or `back`) MUST be provided
- If provided, `front` must be 1-200 characters
- If provided, `back` must be 1-500 characters

**Example Request:**
```json
{
  "front": "What is the capital of France?",
  "back": "Paris, located on the River Seine"
}
```

## 3. Response Details

### Success Response (200 OK)

Returns complete `FlashcardDTO` with updated content and preserved FSRS parameters.

```json
{
  "id": "uuid",
  "deck_id": "uuid",
  "front": "What is the capital of France?",
  "back": "Paris, located on the River Seine",
  "source": "manual",
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
  "updated_at": "2024-12-15T14:30:00Z"
}
```

**Note:** Only `front`, `back`, and `updated_at` fields change. All FSRS parameters remain unchanged.

### Error Responses

#### 400 Bad Request - Invalid UUID Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid flashcard ID format",
    "details": {
      "fieldErrors": {
        "flashcardId": ["Invalid UUID format"]
      }
    }
  }
}
```

#### 400 Bad Request - No Fields Provided
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "At least one field (front or back) must be provided",
    "details": {
      "formErrors": ["At least one field must be provided"]
    }
  }
}
```

#### 400 Bad Request - Field Length Validation
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation error",
    "details": {
      "fieldErrors": {
        "front": ["String must contain at most 200 character(s)"]
      }
    }
  }
}
```

#### 401 Unauthorized
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

#### 404 Not Found
```json
{
  "error": {
    "code": "FLASHCARD_NOT_FOUND",
    "message": "Flashcard not found or not owned by user"
  }
}
```

**Security Note:** Returns same error for both "not found" and "not owned by user" to prevent information disclosure.

#### 500 Internal Server Error
```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

## 4. Utilized Types

### Request Types
- `UpdateFlashcardRequestDTO` (src/types.ts:174)
  ```typescript
  type UpdateFlashcardRequestDTO = Partial<Pick<TablesUpdate<"flashcards">, "front" | "back">>
  ```

### Response Types
- `FlashcardDTO` (src/types.ts:155)
  ```typescript
  type FlashcardDTO = Flashcard
  ```

### Error Types
- `ErrorResponseDTO` (src/types.ts:82-89)
  ```typescript
  interface ErrorResponseDTO {
    error: {
      code: string;
      message: string;
      details?: Record<string, unknown>;
    };
  }
  ```

### Database Types
- `TablesUpdate<"flashcards">` from `src/db/database.types.ts`

**No new types need to be created** - all necessary types already exist.

## 5. Data Flow

### High-Level Flow
```
1. Client sends PATCH request with flashcardId and update data
2. Astro API route validates request
3. Service layer verifies ownership and performs update
4. Database updates only content fields, preserves FSRS data
5. Updated flashcard returned to client
```

### Detailed Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. CLIENT REQUEST                                               │
│    PATCH /api/flashcards/{flashcardId}                          │
│    Body: { "front": "Updated question" }                        │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. API ROUTE HANDLER                                            │
│    src/pages/api/flashcards/[flashcardId].ts                    │
│                                                                  │
│    a. Validate flashcardId parameter (UUID format)              │
│       └─ 400 if invalid                                         │
│                                                                  │
│    b. Validate request body schema                              │
│       ├─ At least one field required                            │
│       ├─ front: 1-200 chars (if provided)                       │
│       ├─ back: 1-500 chars (if provided)                        │
│       └─ 400 if validation fails                                │
│                                                                  │
│    c. Authenticate user                                         │
│       └─ 401 if not authenticated                               │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. SERVICE LAYER                                                │
│    FlashcardService.updateFlashcard()                           │
│                                                                  │
│    a. Verify flashcard exists and belongs to user               │
│       Query: flashcards -> decks!inner(user_id)                 │
│       Filter: flashcard.id = {flashcardId}                      │
│              AND decks.user_id = {userId}                       │
│       └─ Return null if not found/not owned                     │
│                                                                  │
│    b. Update flashcard content                                  │
│       UPDATE flashcards                                         │
│       SET front = ?, back = ?, updated_at = NOW()               │
│       WHERE id = ?                                              │
│                                                                  │
│    c. Return updated flashcard                                  │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. DATABASE (Supabase PostgreSQL)                               │
│                                                                  │
│    Tables involved:                                             │
│    - flashcards (UPDATE)                                        │
│    - decks (JOIN for ownership verification)                    │
│                                                                  │
│    RLS Policies enforced:                                       │
│    - User can only update flashcards in their decks             │
│                                                                  │
│    Fields updated:                                              │
│    - front (if provided)                                        │
│    - back (if provided)                                         │
│    - updated_at (auto-set to NOW())                             │
│                                                                  │
│    Fields NEVER updated:                                        │
│    - FSRS parameters (stability, difficulty, etc.)              │
│    - source, created_at, deck_id                                │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. RESPONSE TO CLIENT                                           │
│                                                                  │
│    Success (200):                                               │
│    - Complete FlashcardDTO with updated content                 │
│                                                                  │
│    Error (400/401/404/500):                                     │
│    - ErrorResponseDTO with appropriate code and message         │
└─────────────────────────────────────────────────────────────────┘
```

## 6. Security Considerations

### Authentication

**Mechanism:** Supabase session-based authentication

**Implementation:**
```typescript
const { data: { user }, error: authError } = await locals.supabase.auth.getUser();

if (authError || !user) {
  return 401 Unauthorized
}
```

**Requirements:**
- Valid Supabase session token in request
- Token not expired or revoked
- User account active

### Authorization

**Ownership Verification:**

Flashcards don't have a direct `user_id` foreign key. Ownership is verified through the `deck_id` relationship:

```
flashcard.deck_id -> deck.id (WHERE deck.user_id = authenticated_user.id)
```

**Implementation Pattern (CRITICAL):**
```typescript
// Use INNER JOIN with decks table to enforce ownership
const { data } = await supabase
  .from("flashcards")
  .select("*, decks!inner(user_id)")
  .eq("id", flashcardId)
  .eq("decks.user_id", userId)
  .single();
```

**Why This Pattern:**
- INNER JOIN ensures flashcard exists AND belongs to user's deck
- Prevents users from updating flashcards in other users' decks
- Single query for both existence and ownership check
- Leverages Supabase RLS policies for additional security layer

### Input Validation

**Defense Against:**
- SQL Injection: Supabase client uses parameterized queries
- XSS: Content stored as-is, sanitization at render time on client
- Oversized inputs: Zod schema enforces length limits

**Validation Layers:**
1. **Zod schema validation** (application layer)
2. **Database CHECK constraints** (database layer)
3. **Supabase RLS policies** (security layer)

### Information Disclosure Prevention

**Threat:** Attackers probing for valid flashcard IDs

**Mitigation:**
- Return 404 for both "not found" and "not owned"
- Use identical error message: "Flashcard not found or not owned by user"
- Prevents attackers from enumerating valid flashcard IDs

### Rate Limiting

**Consideration:** Not implemented at endpoint level

**Recommendation:**
- Implement rate limiting at infrastructure level (API Gateway, CDN)
- Supabase connection pooling provides some protection
- Monitor for abuse patterns in production

## 7. Error Handling

### Error Classification

| Category | HTTP Status | Error Code | Retry Strategy |
|----------|-------------|------------|----------------|
| Client Input Error | 400 | VALIDATION_ERROR | Fix input, don't retry |
| Authentication Error | 401 | UNAUTHORIZED | Re-authenticate, then retry |
| Authorization Error | 404 | FLASHCARD_NOT_FOUND | Don't retry |
| Server Error | 500 | INTERNAL_SERVER_ERROR | Retry with exponential backoff |

### Error Handling Flow

```typescript
try {
  // Step 1: Validate input
  // Step 2: Authenticate user
  // Step 3: Update flashcard via service
  // Step 4: Return success response
} catch (error) {
  // Log error with context
  console.error("Error updating flashcard:", error);

  // Return generic 500 error
  return {
    status: 500,
    body: {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred"
      }
    }
  };
}
```

### Logging Strategy

**What to Log:**
- Error type and message
- User ID (if authenticated)
- Flashcard ID
- Request body (sanitized)
- Stack trace

**What NOT to Log:**
- Sensitive user data
- Authentication tokens
- Full database error messages (may contain schema info)

**Log Level Guidelines:**
- Validation errors: INFO
- Authentication errors: WARN
- Database errors: ERROR
- Unexpected errors: ERROR

### Edge Cases

| Scenario | Handling | Status Code |
|----------|----------|-------------|
| Update with empty strings | Validation rejects (min length 1) | 400 |
| Update with only whitespace | Allowed (database stores as-is) | 200 |
| Update front to exact same value | Allowed (idempotent operation) | 200 |
| Concurrent updates | Last write wins (no optimistic locking) | 200 |
| Flashcard deleted during request | Returns 404 | 404 |
| User deleted during request | Returns 401 | 401 |

## 8. Performance Considerations

### Database Query Optimization

**Query Pattern:**
```sql
-- Ownership verification + retrieval (1 query)
SELECT flashcards.*, decks.user_id
FROM flashcards
INNER JOIN decks ON flashcards.deck_id = decks.id
WHERE flashcards.id = $1 AND decks.user_id = $2
```

**Performance Characteristics:**
- Uses primary key index on `flashcards.id` (O(log n))
- Uses index on `decks.user_id` (assume exists for RLS)
- INNER JOIN efficient due to 1:1 relationship (flashcard -> deck)
- Query plan: Index Scan -> Nested Loop Join

**Recommended Indexes:**
```sql
-- Already exists (primary key)
CREATE INDEX ON flashcards (id);

-- Recommended for RLS and ownership checks
CREATE INDEX ON decks (user_id);

-- Recommended for JOIN performance
CREATE INDEX ON flashcards (deck_id);
```

### Caching Strategy

**Not Recommended for This Endpoint:**
- Updates invalidate cache immediately
- Low read-to-write ratio for individual flashcard updates
- Cache complexity outweighs benefits

**Alternative:** Cache at higher level (list of flashcards per deck)

### Expected Response Times

| Percentile | Target | Notes |
|------------|--------|-------|
| p50 | < 50ms | Happy path, warm database |
| p95 | < 150ms | Includes cold start scenarios |
| p99 | < 300ms | Network latency, DB query variance |

**Factors Affecting Latency:**
- Database connection pool availability
- Geographic distance to Supabase instance
- Network conditions
- Database load

### Scalability Considerations

**Bottlenecks:**
- Database connections (Supabase pooling limit)
- Database I/O (write operations)

**Scaling Strategy:**
- Horizontal: Supabase handles automatically
- Vertical: Upgrade Supabase tier if needed
- Connection pooling: Use Supabase transaction mode

**Load Characteristics:**
- Low write frequency (users update flashcards infrequently)
- No batch operations (updates are individual)
- Predictable load pattern (study sessions drive updates)

## 9. Implementation Steps

### Step 1: Add Service Method

**File:** `src/lib/services/flashcard.service.ts`

**Task:** Add `updateFlashcard` method to `FlashcardService` class

**Implementation:**
```typescript
/**
 * Updates flashcard content (front and/or back) without affecting FSRS parameters.
 *
 * Flow:
 * 1. Verify flashcard exists and belongs to user's deck
 * 2. Update only front/back fields
 * 3. Return updated flashcard
 *
 * Security:
 * - CRITICAL: Verify ownership through deck relationship
 * - Returns null for both non-existent and unauthorized flashcards
 *
 * @param flashcardId - UUID of flashcard to update
 * @param userId - UUID of authenticated user
 * @param updates - Partial updates (front and/or back)
 * @returns Updated flashcard or null if not found/unauthorized
 * @throws {Error} If database operation fails
 */
async updateFlashcard(
  flashcardId: string,
  userId: string,
  updates: UpdateFlashcardRequestDTO
): Promise<FlashcardDTO | null> {
  // Step 1: Verify ownership through deck relationship
  const { data: existingFlashcard, error: fetchError } = await this.supabase
    .from("flashcards")
    .select("*, decks!inner(user_id)")
    .eq("id", flashcardId)
    .eq("decks.user_id", userId)
    .single();

  // Guard clause: not found or not owned
  if (fetchError || !existingFlashcard) {
    return null;
  }

  // Step 2: Update only content fields
  const { data: updatedFlashcard, error: updateError } = await this.supabase
    .from("flashcards")
    .update({
      ...(updates.front !== undefined && { front: updates.front }),
      ...(updates.back !== undefined && { back: updates.back }),
      // updated_at is automatically set by database trigger
    })
    .eq("id", flashcardId)
    .select()
    .single();

  // Guard clause: update failed
  if (updateError || !updatedFlashcard) {
    throw new Error(`Failed to update flashcard: ${updateError?.message ?? "Unknown error"}`);
  }

  // Step 3: Return updated flashcard (happy path)
  return updatedFlashcard;
}
```

**Testing Checklist:**
- [ ] Updates front only
- [ ] Updates back only
- [ ] Updates both front and back
- [ ] Returns null for non-existent flashcard
- [ ] Returns null for flashcard owned by different user
- [ ] Preserves FSRS parameters
- [ ] Updates updated_at timestamp
- [ ] Throws error on database failure

### Step 2: Create Validation Schema

**File:** `src/pages/api/flashcards/[flashcardId].ts`

**Task:** Define Zod schemas for URL params and request body

**Implementation:**
```typescript
import { z } from "zod";

/**
 * Validation schema for flashcard ID parameter
 */
const PatchFlashcardParamsSchema = z.object({
  flashcardId: z.string().uuid({
    message: "Invalid flashcard ID format",
  }),
});

/**
 * Validation schema for request body
 *
 * Constraints:
 * - At least one field (front or back) must be provided
 * - front: 1-200 characters (if provided)
 * - back: 1-500 characters (if provided)
 */
const PatchFlashcardBodySchema = z
  .object({
    front: z
      .string()
      .min(1, "Front cannot be empty")
      .max(200, "Front must be at most 200 characters")
      .optional(),
    back: z
      .string()
      .min(1, "Back cannot be empty")
      .max(500, "Back must be at most 500 characters")
      .optional(),
  })
  .refine((data) => data.front !== undefined || data.back !== undefined, {
    message: "At least one field (front or back) must be provided",
  });
```

**Testing Checklist:**
- [ ] Rejects invalid UUID format
- [ ] Accepts valid UUID
- [ ] Rejects empty request body
- [ ] Rejects front with 0 characters
- [ ] Rejects front with 201 characters
- [ ] Accepts front with 200 characters
- [ ] Rejects back with 0 characters
- [ ] Rejects back with 501 characters
- [ ] Accepts back with 500 characters
- [ ] Accepts front only
- [ ] Accepts back only
- [ ] Accepts both front and back

### Step 3: Implement PATCH Handler

**File:** `src/pages/api/flashcards/[flashcardId].ts`

**Task:** Add PATCH export to existing file (GET handler already exists)

**Implementation:**
```typescript
export const prerender = false;

/**
 * PATCH handler - Updates flashcard content
 *
 * Flow:
 * 1. Validate flashcardId parameter
 * 2. Parse and validate request body
 * 3. Authenticate user
 * 4. Update flashcard via service
 * 5. Return updated flashcard or error
 *
 * @param params - URL parameters containing flashcardId
 * @param request - Request object with JSON body
 * @param locals - Astro locals with Supabase client
 * @returns Response with updated flashcard or error
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    // Step 1: Validate flashcardId parameter
    const paramsValidation = PatchFlashcardParamsSchema.safeParse({
      flashcardId: params.flashcardId,
    });

    if (!paramsValidation.success) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid flashcard ID format",
          details: paramsValidation.error.flatten(),
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { flashcardId } = paramsValidation.data;

    // Step 2: Parse and validate request body
    const body = await request.json();
    const bodyValidation = PatchFlashcardBodySchema.safeParse(body);

    if (!bodyValidation.success) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation error",
          details: bodyValidation.error.flatten(),
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const updates = bodyValidation.data;

    // Step 3: Authenticate user
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser();

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

    // Step 4: Update flashcard via service
    const flashcardService = new FlashcardService(locals.supabase);
    const updatedFlashcard = await flashcardService.updateFlashcard(
      flashcardId,
      user.id,
      updates
    );

    if (!updatedFlashcard) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "FLASHCARD_NOT_FOUND",
          message: "Flashcard not found or not owned by user",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 5: Return updated flashcard (happy path)
    const response: FlashcardDTO = updatedFlashcard;
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Step 6: Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("Error updating flashcard:", error);

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

**Testing Checklist:**
- [ ] Returns 400 for invalid UUID
- [ ] Returns 400 for invalid request body
- [ ] Returns 401 for unauthenticated request
- [ ] Returns 404 for non-existent flashcard
- [ ] Returns 404 for flashcard owned by other user
- [ ] Returns 200 with updated flashcard for valid request
- [ ] Returns 500 for unexpected errors
- [ ] Preserves FSRS parameters
- [ ] Updates updated_at timestamp

### Step 4: Integration Testing

**Test Scenarios:**

**Scenario 1: Successful Update (Front Only)**
```bash
PATCH /api/flashcards/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <valid-token>
Content-Type: application/json

{
  "front": "Updated question text"
}

Expected: 200 OK with full FlashcardDTO
```

**Scenario 2: Successful Update (Back Only)**
```bash
PATCH /api/flashcards/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <valid-token>
Content-Type: application/json

{
  "back": "Updated answer text"
}

Expected: 200 OK with full FlashcardDTO
```

**Scenario 3: Successful Update (Both Fields)**
```bash
PATCH /api/flashcards/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <valid-token>
Content-Type: application/json

{
  "front": "Updated question",
  "back": "Updated answer"
}

Expected: 200 OK with full FlashcardDTO
```

**Scenario 4: Validation Error - No Fields**
```bash
PATCH /api/flashcards/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <valid-token>
Content-Type: application/json

{}

Expected: 400 Bad Request
```

**Scenario 5: Validation Error - Field Too Long**
```bash
PATCH /api/flashcards/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <valid-token>
Content-Type: application/json

{
  "front": "<string with 201 characters>"
}

Expected: 400 Bad Request
```

**Scenario 6: Authentication Error**
```bash
PATCH /api/flashcards/550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{
  "front": "Updated question"
}

Expected: 401 Unauthorized
```

**Scenario 7: Authorization Error - Other User's Flashcard**
```bash
PATCH /api/flashcards/<flashcard-owned-by-other-user>
Authorization: Bearer <valid-token>
Content-Type: application/json

{
  "front": "Updated question"
}

Expected: 404 Not Found
```

**Scenario 8: Not Found - Non-Existent Flashcard**
```bash
PATCH /api/flashcards/00000000-0000-0000-0000-000000000000
Authorization: Bearer <valid-token>
Content-Type: application/json

{
  "front": "Updated question"
}

Expected: 404 Not Found
```

### Step 5: Documentation

**Tasks:**
- [ ] Add JSDoc comments to service method
- [ ] Add JSDoc comments to API route handler
- [ ] Update API documentation (if separate docs exist)
- [ ] Add examples to CLAUDE.md if needed

### Step 6: Code Review Checklist

**Security:**
- [ ] Ownership verification through deck relationship
- [ ] Authentication enforced
- [ ] Input validation with Zod
- [ ] No information disclosure in error messages
- [ ] SQL injection prevented (Supabase client)

**Code Quality:**
- [ ] Guard clauses for error conditions
- [ ] Early returns pattern
- [ ] Happy path last
- [ ] Consistent error handling
- [ ] Proper TypeScript types
- [ ] ESLint passes
- [ ] No console.log (only console.error for errors)

**Testing:**
- [ ] All test scenarios pass
- [ ] Edge cases covered
- [ ] Error handling verified
- [ ] FSRS parameters preserved
- [ ] updated_at timestamp updated

**Performance:**
- [ ] Single query for ownership verification
- [ ] No N+1 queries
- [ ] Efficient database indexes used
- [ ] Response time within target (< 50ms p50)

**Documentation:**
- [ ] JSDoc comments complete
- [ ] Implementation plan followed
- [ ] Code matches specification
- [ ] Error codes documented

---

## Summary

This endpoint provides a secure, validated way to update flashcard content while preserving FSRS algorithm state. The implementation follows established patterns from existing endpoints (GET /api/flashcards/{flashcardId}), uses existing types and validation schemas, and maintains strict security controls through ownership verification.

**Key Implementation Points:**
1. Reuse existing `FlashcardService` class pattern
2. Add new `updateFlashcard` method with ownership verification
3. Use Zod for comprehensive input validation
4. Return 404 for both not found and not owned (security)
5. Preserve all FSRS parameters during update
6. Follow error-first, guard clause pattern
7. Comprehensive error handling with appropriate status codes

**Files to Modify:**
- `src/lib/services/flashcard.service.ts` - Add `updateFlashcard` method
- `src/pages/api/flashcards/[flashcardId].ts` - Add `PATCH` handler and validation schemas

**No New Files Required** - All necessary types, utilities, and patterns already exist in the codebase.
