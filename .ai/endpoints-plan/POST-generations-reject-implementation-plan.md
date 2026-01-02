# API Endpoint Implementation Plan: POST /api/generations/{generationId}/reject

## 1. Endpoint Overview

This endpoint allows authenticated users to log rejection of an AI-generated flashcard draft. When a user dismisses or rejects a draft from the AI generation UI, this endpoint creates a `REJECTED` event in the `generation_events` table for analytics and business metrics tracking.

**Purpose**: Track which AI-generated drafts users reject (don't save) to analyze AI generation quality and user preferences.

**Key Characteristics**:

- Creates analytics event only (no flashcard is created)
- Non-destructive operation (only inserts, never deletes)
- Requires user authentication and ownership verification
- `draft_index` is for client-side tracking only (not persisted in database)

## 2. Request Details

### HTTP Method and URL Structure

```
POST /api/generations/{generationId}/reject
```

### Path Parameters

| Parameter      | Type | Required | Constraints       | Description                          |
| -------------- | ---- | -------- | ----------------- | ------------------------------------ |
| `generationId` | UUID | Yes      | Valid UUID format | Identifies the AI generation session |

### Request Headers

```
Authorization: Bearer <supabase_access_token>
Content-Type: application/json
```

### Request Body

```json
{
  "draft_index": 0
}
```

**Schema**:

| Field         | Type    | Required | Constraints | Description                                                  |
| ------------- | ------- | -------- | ----------- | ------------------------------------------------------------ |
| `draft_index` | integer | Yes      | >= 0        | Zero-based index of the rejected draft (for client tracking) |

**Validation Rules**:

- `draft_index` must be a non-negative integer
- Request body must be valid JSON

**Example Valid Requests**:

```json
// Rejecting the first draft (index 0)
{ "draft_index": 0 }

// Rejecting the third draft (index 2)
{ "draft_index": 2 }
```

## 3. Utilized Types

All required types already exist in [src/types.ts](src/types.ts).

### Request DTO

```typescript
// src/types.ts:217-220
export interface RejectDraftRequestDTO {
  draft_index: number;
}
```

### Response DTO

```typescript
// src/types.ts:223-230
export interface GenerationEventResponseDTO {
  id: string;
  generation_id: string;
  event_type: EventType;
  created_at: string;
}
```

### Command Models

```typescript
// src/types.ts:365
export type CreateGenerationEventCommand = TablesInsert<"generation_events">;

// src/types.ts:63-64
export type EventType = Enums<"event_type">; // 'GENERATED' | 'ACCEPTED' | 'REJECTED' | 'EDITED'
```

### Database Table Structure

```typescript
// generation_events table schema
{
  id: UUID (PK, auto-generated)
  user_id: UUID (FK → profiles.user_id, NOT NULL)
  flashcard_id: UUID (FK → flashcards.id, NULL for REJECTED events)
  generation_id: UUID (NULL, groups events from same session)
  event_type: EventType (NOT NULL)
  created_at: TIMESTAMPTZ (auto-generated)
}
```

## 4. Response Details

### Success Response (201 Created)

**Status Code**: `201 Created`

**Body**:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "generation_id": "123e4567-e89b-12d3-a456-426614174000",
  "event_type": "REJECTED",
  "created_at": "2024-12-10T10:05:00Z"
}
```

**Response Type**: `GenerationEventResponseDTO`

### Error Responses

#### 400 Bad Request - Invalid Draft Index

```json
{
  "error": {
    "code": "INVALID_DRAFT_INDEX",
    "message": "Draft index must be a non-negative integer"
  }
}
```

#### 400 Bad Request - Invalid Generation ID

```json
{
  "error": {
    "code": "INVALID_GENERATION_ID",
    "message": "Invalid generation ID format"
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

#### 404 Not Found - Generation Not Found or Not Owned

```json
{
  "error": {
    "code": "GENERATION_NOT_FOUND",
    "message": "Generation not found"
  }
}
```

**Note**: Returns 404 for both non-existent generations and generations owned by other users to prevent information leakage.

#### 500 Internal Server Error

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Failed to log rejection event"
  }
}
```

## 5. Data Flow

### High-Level Flow Diagram

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ POST /api/generations/{generationId}/reject
       │ { "draft_index": 0 }
       ▼
┌──────────────────────────────────────────────────┐
│  API Endpoint                                    │
│  /src/pages/api/generations/[generationId]/      │
│  reject.ts                                       │
├──────────────────────────────────────────────────┤
│  1. Validate generationId UUID format            │
│  2. Parse & validate request body (Zod)          │
│  3. Authenticate user (getUser)                  │
│  4. Call GenerationService.rejectDraft()         │
└──────┬───────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────┐
│  GenerationService                               │
│  /src/lib/services/generation.service.ts         │
├──────────────────────────────────────────────────┤
│  5. Verify generation ownership                  │
│     - Query generation_events for any event      │
│       WHERE generation_id = X AND user_id = Y    │
│     - Throw GenerationNotFoundError if none      │
│  6. Insert REJECTED event                        │
│     - user_id: authenticated user                │
│     - generation_id: from path param             │
│     - flashcard_id: NULL                         │
│     - event_type: 'REJECTED'                     │
│  7. Return event details                         │
└──────┬───────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────┐
│  Supabase (PostgreSQL)                           │
│  generation_events table                         │
├──────────────────────────────────────────────────┤
│  INSERT INTO generation_events (...)             │
│  RETURNING *                                     │
└──────┬───────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────┐
│  Response to Client                              │
├──────────────────────────────────────────────────┤
│  201 Created                                     │
│  {                                               │
│    "id": "...",                                  │
│    "generation_id": "...",                       │
│    "event_type": "REJECTED",                     │
│    "created_at": "..."                           │
│  }                                               │
└──────────────────────────────────────────────────┘
```

### Detailed Step-by-Step Flow

1. **Request Arrives**: Client sends POST with `generationId` in URL path and `draft_index` in body

2. **Path Parameter Validation**: Endpoint validates `generationId` is valid UUID format

3. **Request Body Parsing**: Parse JSON body with Zod schema validation

4. **Authentication**:
   - Call `context.locals.supabase.auth.getUser()`
   - Return 401 if user not authenticated

5. **Service Layer Call**: Pass `userId`, `generationId`, and `draftIndex` to `GenerationService.rejectDraft()`

6. **Ownership Verification** (in service):

   ```typescript
   const { data, error } = await supabase
     .from("generation_events")
     .select("id")
     .eq("generation_id", generationId)
     .eq("user_id", userId)
     .limit(1)
     .single();

   if (error || !data) {
     throw new GenerationNotFoundError();
   }
   ```

7. **Event Insertion** (in service):

   ```typescript
   const { data, error } = await supabase
     .from("generation_events")
     .insert({
       user_id: userId,
       generation_id: generationId,
       flashcard_id: null,
       event_type: "REJECTED",
     })
     .select()
     .single();
   ```

8. **Response Formatting**: Transform database row to `GenerationEventResponseDTO`

9. **Return Success**: Return 201 with event details

### External Service Interactions

- **Supabase Auth**: Verify user authentication token
- **Supabase Database**:
  - Query `generation_events` for ownership verification
  - Insert new event into `generation_events` table

### No AI Service Interaction

Unlike the `/api/generations` endpoint, this endpoint does NOT interact with OpenRouter or any AI service. It's purely a database operation for analytics tracking.

## 6. Security Considerations

### Authentication

**Requirement**: User MUST be authenticated with valid Supabase session.

**Implementation**:

```typescript
const {
  data: { user },
  error: authError,
} = await context.locals.supabase.auth.getUser();

if (authError || !user) {
  return errorResponse("UNAUTHORIZED", "Authentication required", 401);
}
```

**Attack Vector**: Unauthenticated requests → Mitigated by early auth check

### Authorization

**Requirement**: User can only reject drafts from their own generation sessions.

**Implementation**: Query `generation_events` table to verify at least one event exists with both:

- `generation_id = {generationId}` (from URL)
- `user_id = {authenticated user's id}`

**Why this works**:

- Every generation session creates at least one `GENERATED` event when drafts are created
- If no event exists with this generation_id + user_id combination, either:
  - Generation doesn't exist, OR
  - Generation belongs to another user
- We return 404 in both cases to prevent information leakage (don't reveal if generation exists)

**Attack Vector**: User tries to reject another user's generation → Mitigated by ownership check

### Input Validation

**Path Parameter**:

- `generationId` must be valid UUID format
- Prevents SQL injection (Supabase uses parameterized queries anyway)
- Prevents malformed requests that could cause unexpected behavior

**Request Body**:

```typescript
const rejectDraftRequestSchema = z.object({
  draft_index: z.number().int().min(0),
});
```

**Validation protects against**:

- Non-integer values (e.g., `1.5`, `"abc"`)
- Negative values (e.g., `-1`)
- Missing field
- Type confusion attacks

**Note**: `draft_index` is NOT persisted in database, so there's no risk of database corruption. It's validated for API contract compliance and client-side tracking consistency.

### SQL Injection Prevention

**Mitigation**: Supabase client uses parameterized queries automatically. All inputs are safely escaped.

**Example safe query**:

```typescript
.eq("generation_id", generationId) // Automatically parameterized
```

### Rate Limiting

**Current Implementation**: None

**Future Consideration**: Could implement rate limiting at API gateway level (e.g., 100 rejections per minute per user) to prevent abuse.

**Risk Assessment**: Low priority - rejecting drafts is not a resource-intensive operation and there's no financial cost per rejection.

### Information Leakage Prevention

**Strategy**: Return 404 for both non-existent and unauthorized generations.

**Why**: Prevents attackers from enumerating valid generation IDs by observing different error messages.

**Example**:

```typescript
// Good: Same error for both cases
if (!generationExists || !userOwnsGeneration) {
  throw new GenerationNotFoundError(); // Returns 404
}

// Bad: Reveals information
if (!generationExists) {
  return 404; // "Generation doesn't exist"
}
if (!userOwnsGeneration) {
  return 403; // "You don't own this" ← Reveals generation exists!
}
```

### Row Level Security (RLS)

**Database Level**: The `generation_events` table has RLS policies that ensure:

- Users can only insert events for themselves (`user_id = auth.uid()`)
- Users can only read their own events

**Application Level**: We still verify ownership in application code for:

- Better error messages
- Consistency with API contract
- Defense in depth

## 7. Error Handling

### Error Handling Strategy

Follow the **guard clause pattern** from CLAUDE.md:

1. Handle errors first with early returns
2. Place happy path last
3. Avoid nested if statements

### Custom Error Classes

**New error class to add in `generation.service.ts`**:

```typescript
export class GenerationNotFoundError extends Error {
  constructor() {
    super("Generation not found or not owned by user");
    this.name = "GenerationNotFoundError";
  }
}
```

### Error Scenarios and Handling

| Error Scenario                 | Detection Point                  | Handler Location                       | Response                  |
| ------------------------------ | -------------------------------- | -------------------------------------- | ------------------------- |
| Invalid generationId format    | Endpoint (path param validation) | Endpoint try/catch                     | 400 INVALID_GENERATION_ID |
| Invalid request body           | Endpoint (Zod validation)        | Endpoint try/catch (ZodError)          | 400 INVALID_DRAFT_INDEX   |
| User not authenticated         | Endpoint (auth check)            | Endpoint guard clause                  | 401 UNAUTHORIZED          |
| Generation not found           | Service (ownership query)        | Service throws GenerationNotFoundError | 404 GENERATION_NOT_FOUND  |
| Generation owned by other user | Service (ownership query)        | Service throws GenerationNotFoundError | 404 GENERATION_NOT_FOUND  |
| Database error on insert       | Service (insert operation)       | Endpoint try/catch                     | 500 INTERNAL_ERROR        |
| Unexpected error               | Any                              | Endpoint try/catch (fallback)          | 500 INTERNAL_ERROR        |

### Endpoint Error Handling Structure

```typescript
export const POST: APIRoute = async (context) => {
  try {
    // Step 1: Validate generationId UUID format
    const { generationId } = context.params;
    if (!generationId || !isValidUUID(generationId)) {
      return errorResponse("INVALID_GENERATION_ID", "Invalid generation ID format", 400);
    }

    // Step 2: Parse and validate request body
    const body = await context.request.json();
    const validatedData = rejectDraftRequestSchema.parse(body);

    // Step 3: Authenticate user
    const {
      data: { user },
      error: authError,
    } = await context.locals.supabase.auth.getUser();
    if (authError || !user) {
      return errorResponse("UNAUTHORIZED", "Authentication required", 401);
    }

    // Step 4: Call service
    const service = new GenerationService(context.locals.supabase);
    const event = await service.rejectDraft(user.id, generationId, validatedData.draft_index);

    // Step 5: Return success
    return successResponse(event, 201);
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return errorResponse("INVALID_DRAFT_INDEX", "Draft index must be a non-negative integer", 400);
    }

    // Handle generation not found
    if (error instanceof GenerationNotFoundError) {
      return errorResponse("GENERATION_NOT_FOUND", "Generation not found", 404);
    }

    // Log and handle unexpected errors
    console.error("Failed to reject draft:", error);
    return errorResponse("INTERNAL_ERROR", "Failed to log rejection event", 500);
  }
};
```

### Service Error Handling Structure

```typescript
async rejectDraft(userId: string, generationId: string, draftIndex: number): Promise<GenerationEventResponseDTO> {
  // Step 1: Verify generation exists and belongs to user
  const { data: existingEvent, error: queryError } = await this.supabase
    .from("generation_events")
    .select("id")
    .eq("generation_id", generationId)
    .eq("user_id", userId)
    .limit(1)
    .single();

  if (queryError || !existingEvent) {
    throw new GenerationNotFoundError();
  }

  // Step 2: Insert REJECTED event
  const { data: event, error: insertError } = await this.supabase
    .from("generation_events")
    .insert({
      user_id: userId,
      generation_id: generationId,
      flashcard_id: null,
      event_type: "REJECTED",
    })
    .select()
    .single();

  if (insertError || !event) {
    throw new Error("Failed to insert rejection event");
  }

  // Step 3: Return event details
  return {
    id: event.id,
    generation_id: event.generation_id,
    event_type: event.event_type,
    created_at: event.created_at,
  };
}
```

### Logging Strategy

**Console Logging**:

- Log unexpected errors with `console.error()` before returning 500
- Include error object for debugging
- No logging for expected errors (400, 401, 404) - these are normal API usage

**Example**:

```typescript
catch (error) {
  if (error instanceof GenerationNotFoundError) {
    return errorResponse(...); // No log - expected error
  }

  console.error("Failed to reject draft:", error); // Log unexpected
  return errorResponse("INTERNAL_ERROR", ..., 500);
}
```

**Future Enhancement**: Consider structured logging service for production monitoring.

## 8. Performance Considerations

### Database Query Optimization

**Ownership Verification Query**:

```typescript
.select("id")           // Select minimal columns (just need existence check)
.eq("generation_id", generationId)
.eq("user_id", userId)
.limit(1)               // Stop after finding first match
.single()               // Expect exactly one row
```

**Optimizations**:

- **Composite index**: Ensure index exists on `(generation_id, user_id)` in `generation_events` table
- **Minimal projection**: Select only `id` column (not `*`)
- **Early termination**: `.limit(1)` stops scan after first match

**Index Recommendation** (to add in migration):

```sql
-- Optimize ownership verification queries
create index idx_generation_events_generation_user
  on generation_events(generation_id, user_id);
```

### Insert Performance

**Single Row Insert**:

- Fast operation (< 10ms typical)
- No complex joins or aggregations
- Returns inserted row with `.select().single()`

**No Bottlenecks**:

- No external API calls (unlike `/api/generations` which calls OpenRouter)
- No complex business logic
- Simple database insert

### Expected Response Times

| Operation       | Expected Time | Notes                       |
| --------------- | ------------- | --------------------------- |
| Path validation | < 1ms         | In-memory UUID format check |
| JSON parsing    | < 5ms         | Small payload (~20 bytes)   |
| Zod validation  | < 1ms         | Simple schema, one field    |
| Auth check      | 10-50ms       | Supabase JWT verification   |
| Ownership query | 5-20ms        | Indexed query, single row   |
| Event insert    | 5-20ms        | Single row insert           |
| **Total**       | **25-100ms**  | Typical end-to-end          |

### Scalability Analysis

**Concurrent Requests**:

- No locks required (each insert is independent)
- Supports high concurrency (limited by database connection pool)
- No race conditions (events are append-only)

**Database Growth**:

- `generation_events` table grows with user activity
- Each rejection adds one row
- Recommended: Archive events older than 1 year to separate table for analytics

**Potential Bottlenecks**:

1. **Database connections**: Supabase connection pool (mitigated by connection pooling)
2. **Table size**: Large `generation_events` table (mitigated by indexing and archiving)

### Caching Considerations

**No Caching Needed**:

- Each request inserts a new event (write operation)
- No repeated reads of same data
- Ownership verification query is fast with index

**Future Enhancement**: If ownership verification becomes a bottleneck, could cache generation ownership in Redis with short TTL (1 minute).

### Monitoring Recommendations

**Metrics to Track**:

- Request rate (rejections/minute)
- Response time (p50, p95, p99)
- Error rate by type (400, 401, 404, 500)
- Database query performance
- `generation_events` table growth rate

**Alert Conditions**:

- p95 response time > 200ms
- Error rate > 5%
- Database connection pool exhaustion

## 9. Implementation Steps

### Step 1: Add Validation Schema

**File**: `src/lib/validations/generation.validation.ts`

**Action**: Add new Zod schema for reject endpoint request body

```typescript
export const rejectDraftRequestSchema = z.object({
  draft_index: z.number().int().min(0, "Draft index must be a non-negative integer"),
});
```

**Why First**: Validation schemas are dependencies for both endpoint and tests

---

### Step 2: Add Custom Error Class to Service

**File**: `src/lib/services/generation.service.ts`

**Action**: Add `GenerationNotFoundError` class at the bottom of the file (after other error classes)

```typescript
export class GenerationNotFoundError extends Error {
  constructor() {
    super("Generation not found or not owned by user");
    this.name = "GenerationNotFoundError";
  }
}
```

**Why Now**: Service method will need to throw this error

---

### Step 3: Add Service Method

**File**: `src/lib/services/generation.service.ts`

**Action**: Add `rejectDraft` method to `GenerationService` class

```typescript
/**
 * Log rejection of an AI-generated draft
 *
 * Steps:
 * 1. Verify generation exists and belongs to user
 * 2. Insert REJECTED event into generation_events
 * 3. Return event details
 *
 * @param userId - Authenticated user's ID
 * @param generationId - Generation session ID from URL path
 * @param draftIndex - Zero-based index of rejected draft (for client tracking only)
 * @returns Created event details
 * @throws GenerationNotFoundError if generation doesn't exist or user doesn't own it
 */
async rejectDraft(
  userId: string,
  generationId: string,
  draftIndex: number
): Promise<GenerationEventResponseDTO> {
  // Step 1: Verify generation exists and belongs to user
  const { data: existingEvent, error: queryError } = await this.supabase
    .from("generation_events")
    .select("id")
    .eq("generation_id", generationId)
    .eq("user_id", userId)
    .limit(1)
    .single();

  if (queryError || !existingEvent) {
    throw new GenerationNotFoundError();
  }

  // Step 2: Insert REJECTED event
  const { data: event, error: insertError } = await this.supabase
    .from("generation_events")
    .insert({
      user_id: userId,
      generation_id: generationId,
      flashcard_id: null,
      event_type: "REJECTED",
    })
    .select()
    .single();

  if (insertError || !event) {
    console.error("Failed to insert rejection event:", insertError);
    throw new Error("Failed to insert rejection event");
  }

  // Step 3: Return event details
  return {
    id: event.id,
    generation_id: event.generation_id,
    event_type: event.event_type,
    created_at: event.created_at,
  };
}
```

**Note**: `draftIndex` parameter is included for API signature completeness but not used in database operations. It's validated in the endpoint but only for client-side tracking purposes.

**Testing**: After this step, you can test the service method in isolation before creating the endpoint.

---

### Step 4: Create API Endpoint Directory Structure

**Action**: Create nested directory structure for dynamic route

```bash
mkdir -p src/pages/api/generations/[generationId]
```

**Why**: Astro uses file-based routing, `[generationId]` creates dynamic path parameter

---

### Step 5: Create API Endpoint File

**File**: `src/pages/api/generations/[generationId]/reject.ts`

**Action**: Implement POST endpoint handler

```typescript
import type { APIRoute } from "astro";
import { z } from "zod";
import { GenerationService, GenerationNotFoundError } from "@/lib/services/generation.service";
import { rejectDraftRequestSchema } from "@/lib/validations/generation.validation";
import { errorResponse, successResponse } from "@/lib/utils/api-response";

export const prerender = false;

/**
 * POST /api/generations/{generationId}/reject
 *
 * Log rejection of an AI-generated draft
 *
 * @returns 201 Created with event details
 * @returns 400 Bad Request if validation fails
 * @returns 401 Unauthorized if user not authenticated
 * @returns 404 Not Found if generation doesn't exist or isn't owned by user
 * @returns 500 Internal Server Error on unexpected failure
 */
export const POST: APIRoute = async (context) => {
  try {
    // Step 1: Validate generationId UUID format
    const { generationId } = context.params;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!generationId || !uuidRegex.test(generationId)) {
      return errorResponse("INVALID_GENERATION_ID", "Invalid generation ID format", 400);
    }

    // Step 2: Parse and validate request body
    const body = await context.request.json();
    const validatedData = rejectDraftRequestSchema.parse(body);

    // Step 3: Authenticate user
    const {
      data: { user },
      error: authError,
    } = await context.locals.supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse("UNAUTHORIZED", "Authentication required", 401);
    }

    // Step 4: Call service layer
    const service = new GenerationService(context.locals.supabase);
    const event = await service.rejectDraft(user.id, generationId, validatedData.draft_index);

    // Step 5: Return success response
    return successResponse(event, 201);
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return errorResponse("INVALID_DRAFT_INDEX", "Draft index must be a non-negative integer", 400);
    }

    // Handle generation not found
    if (error instanceof GenerationNotFoundError) {
      return errorResponse("GENERATION_NOT_FOUND", "Generation not found", 404);
    }

    // Log and handle unexpected errors
    console.error("Failed to reject draft:", error);
    return errorResponse("INTERNAL_ERROR", "Failed to log rejection event", 500);
  }
};
```

**Key Points**:

- `export const prerender = false` - Required for SSR API routes in Astro
- UUID validation using regex (matches PostgreSQL UUID format)
- Guard clauses for early error returns
- Proper error handling with specific error codes
- Follows existing API response utility pattern

---

### Step 6: Add Database Index (Optional but Recommended)

**File**: Create new migration `supabase/migrations/YYYYMMDDHHMMSS_add_generation_events_index.sql`

**Action**: Add composite index for ownership verification queries

```sql
-- Migration: Add index for generation ownership verification
-- Purpose: Optimize queries that check if a generation belongs to a user
-- Affected table: generation_events
-- Performance: Reduces ownership check from O(n) to O(log n)

-- Add composite index on (generation_id, user_id)
-- This index optimizes the ownership verification query in rejectDraft
create index if not exists idx_generation_events_generation_user
  on generation_events(generation_id, user_id);

-- Add comment explaining index purpose
comment on index idx_generation_events_generation_user is
  'Optimizes ownership verification queries for generation rejection endpoint';
```

**Why**: Dramatically improves query performance for ownership checks, especially as `generation_events` table grows.

**When**: Can be added now or later, but recommended before production deployment.

---

### Step 7: Test the Endpoint

**Manual Testing Steps**:

1. **Start dev server**: `npm run dev`

2. **Authenticate**: Get Supabase access token (from browser DevTools or auth flow)

3. **Test valid rejection**:

   ```bash
   curl -X POST http://localhost:3000/api/generations/{valid-generation-id}/reject \
     -H "Authorization: Bearer {access-token}" \
     -H "Content-Type: application/json" \
     -d '{"draft_index": 0}'
   ```

   Expected: 201 with event details

4. **Test invalid UUID**:

   ```bash
   curl -X POST http://localhost:3000/api/generations/invalid-uuid/reject \
     -H "Authorization: Bearer {access-token}" \
     -H "Content-Type: application/json" \
     -d '{"draft_index": 0}'
   ```

   Expected: 400 INVALID_GENERATION_ID

5. **Test invalid draft_index**:

   ```bash
   curl -X POST http://localhost:3000/api/generations/{valid-generation-id}/reject \
     -H "Authorization: Bearer {access-token}" \
     -H "Content-Type: application/json" \
     -d '{"draft_index": -1}'
   ```

   Expected: 400 INVALID_DRAFT_INDEX

6. **Test unauthorized**:

   ```bash
   curl -X POST http://localhost:3000/api/generations/{valid-generation-id}/reject \
     -H "Content-Type: application/json" \
     -d '{"draft_index": 0}'
   ```

   Expected: 401 UNAUTHORIZED

7. **Test generation not found**:

   ```bash
   curl -X POST http://localhost:3000/api/generations/00000000-0000-0000-0000-000000000000/reject \
     -H "Authorization: Bearer {access-token}" \
     -H "Content-Type: application/json" \
     -d '{"draft_index": 0}'
   ```

   Expected: 404 GENERATION_NOT_FOUND

8. **Verify database**:
   ```sql
   SELECT * FROM generation_events
   WHERE event_type = 'REJECTED'
   ORDER BY created_at DESC
   LIMIT 5;
   ```
   Should show newly created REJECTED events

**Automated Testing** (Future):

- Add unit tests for `GenerationService.rejectDraft()`
- Add integration tests for endpoint
- Add tests for error scenarios

---

### Step 8: Update API Documentation

**Action**: Update API documentation (if exists) or create endpoint documentation

**Add to documentation**:

- Endpoint URL and method
- Request/response examples
- Error codes and meanings
- Authentication requirements

**Example documentation section**:

````markdown
### POST /api/generations/{generationId}/reject

Log rejection of an AI-generated flashcard draft.

**Authentication**: Required

**Path Parameters**:

- `generationId` (UUID) - Generation session ID

**Request Body**:

```json
{
  "draft_index": 0
}
```
````

**Success Response** (201 Created):

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "generation_id": "123e4567-e89b-12d3-a456-426614174000",
  "event_type": "REJECTED",
  "created_at": "2024-12-10T10:05:00Z"
}
```

**Error Responses**:

- `400 INVALID_GENERATION_ID` - Invalid UUID format
- `400 INVALID_DRAFT_INDEX` - Negative or non-integer draft index
- `401 UNAUTHORIZED` - Not authenticated
- `404 GENERATION_NOT_FOUND` - Generation doesn't exist or not owned by user
- `500 INTERNAL_ERROR` - Server error

````

---

### Step 9: Code Quality Checks

**Action**: Run linting and formatting before commit

```bash
# Run linter
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code
npm run format
````

**Fix any issues** reported by linters, especially:

- Unused imports
- Type errors
- Accessibility issues (if any)
- Code style violations

**Why**: Ensures code meets project quality standards before committing.

---

### Step 10: Commit Changes

**Action**: Commit with conventional commit message

```bash
git add src/lib/validations/generation.validation.ts
git add src/lib/services/generation.service.ts
git add src/pages/api/generations/[generationId]/reject.ts
git add supabase/migrations/*_add_generation_events_index.sql  # if created

git commit -m "$(cat <<'EOF'
feat(api): implement POST /api/generations/{generationId}/reject endpoint

Add endpoint to log rejection of AI-generated flashcard drafts for analytics tracking.

- Add rejectDraftRequestSchema validation
- Add GenerationNotFoundError custom error class
- Add GenerationService.rejectDraft() method with ownership verification
- Create POST /api/generations/{generationId}/reject endpoint
- Add database index for generation ownership queries

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

**Why**: Follows project's conventional commits standard from CLAUDE.md.

---

### Step 11: Deploy and Monitor

**Action**: After merging to main branch:

1. **Deploy to staging**: Test in staging environment
2. **Smoke test**: Verify endpoint works in staging
3. **Deploy to production**: Promote to production
4. **Monitor metrics**:
   - Check error rates in logs
   - Monitor response times
   - Verify events are being created in database

**Success Criteria**:

- p95 response time < 200ms
- Error rate < 1%
- No 500 errors in first 24 hours

---

## Implementation Checklist

- [ ] **Step 1**: Add `rejectDraftRequestSchema` to validations
- [ ] **Step 2**: Add `GenerationNotFoundError` to generation.service.ts
- [ ] **Step 3**: Add `rejectDraft()` method to GenerationService
- [ ] **Step 4**: Create directory structure for dynamic route
- [ ] **Step 5**: Create endpoint file with POST handler
- [ ] **Step 6**: Add database index migration (optional)
- [ ] **Step 7**: Manual testing (all scenarios pass)
- [ ] **Step 8**: Update API documentation
- [ ] **Step 9**: Run linting and formatting
- [ ] **Step 10**: Commit with conventional commit message
- [ ] **Step 11**: Deploy and monitor

---

## Estimated Implementation Time

| Task                                 | Time Estimate     |
| ------------------------------------ | ----------------- |
| Steps 1-5 (Core implementation)      | 30-45 minutes     |
| Step 6 (Database index)              | 5-10 minutes      |
| Step 7 (Testing)                     | 15-20 minutes     |
| Steps 8-10 (Documentation & cleanup) | 10-15 minutes     |
| **Total**                            | **60-90 minutes** |

---

## Notes and Considerations

### Why draft_index is in the Request

The `draft_index` field is included in the request body for **client-side tracking and analytics** purposes, even though it's not persisted in the database. This allows:

1. **Client correlation**: Frontend can track which specific draft was rejected
2. **Future analytics**: Could be logged to analytics service (e.g., Mixpanel, PostHog)
3. **Debugging**: Helps debug if certain draft positions are rejected more often
4. **API contract**: Provides structured data instead of ignoring the context

However, the **database doesn't need it** because:

- `generation_events` table tracks aggregated metrics (how many rejections total)
- Individual draft content is ephemeral (not stored in database)
- Draft position doesn't affect business logic

### Alternative Approaches Considered

**1. Store draft_index in database**:

- Pros: More complete analytics
- Cons: Adds unnecessary column, draft content not stored anyway
- Decision: Not implemented (YAGNI principle)

**2. Skip draft_index validation**:

- Pros: Simpler endpoint
- Cons: Weaker API contract, potential client bugs
- Decision: Keep validation for API consistency

**3. Verify generation in database before inserting event**:

- Current: Check if ANY event exists with generation_id + user_id
- Alternative: Create a separate `generations` table
- Decision: Current approach is simpler and sufficient

### Future Enhancements

1. **Batch rejection**: Allow rejecting multiple drafts in one request

   ```json
   { "draft_indices": [0, 2, 4] }
   ```

2. **Rejection reason**: Add optional reason field for richer analytics

   ```json
   {
     "draft_index": 0,
     "reason": "incorrect_answer"
   }
   ```

3. **Rate limiting**: Prevent abuse (e.g., 100 rejections/minute per user)

4. **Analytics integration**: Send events to analytics service (PostHog, Mixpanel)

5. **Soft delete generations**: Instead of just logging events, mark generation session as "closed" after all drafts are rejected/accepted
