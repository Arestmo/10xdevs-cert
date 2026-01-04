# API Endpoint Implementation Plan: POST /api/flashcards

## 1. Endpoint Overview

This endpoint creates a new flashcard in the system. It supports two creation modes:

- **Manual creation**: User creates a flashcard from scratch
- **AI-generated acceptance**: User accepts (with optional edits) a flashcard draft from AI generation

When accepting an AI-generated flashcard, the endpoint automatically logs a generation event (`ACCEPTED` or `EDITED`) to track AI usage analytics.

## 2. Request Details

- **HTTP Method**: POST
- **URL Structure**: `/api/flashcards`
- **Authentication**: Required (user must be authenticated)
- **Content-Type**: `application/json`

### Parameters

**Request Body** (all fields use snake_case):

**Required fields:**

- `deck_id` (string): UUID of the target deck
- `front` (string): Front side content (1-200 characters)
- `back` (string): Back side content (1-500 characters)
- `source` (enum): Either `"ai"` or `"manual"`

**Conditionally required:**

- `generation_id` (string | null): UUID of AI generation session - REQUIRED when `source` is `"ai"`, otherwise optional/null

**Optional fields:**

- `was_edited` (boolean): Whether AI-generated content was edited before acceptance (default: false, only relevant when source is "ai")

### Request Body Examples

**Manual flashcard:**

```json
{
  "deck_id": "123e4567-e89b-12d3-a456-426614174000",
  "front": "What is mitochondria?",
  "back": "The powerhouse of the cell",
  "source": "manual",
  "generation_id": null
}
```

**AI-generated flashcard (not edited):**

```json
{
  "deck_id": "123e4567-e89b-12d3-a456-426614174000",
  "front": "What is mitochondria?",
  "back": "The powerhouse of the cell",
  "source": "ai",
  "generation_id": "987fcdeb-51a2-43d7-b123-987654321000",
  "was_edited": false
}
```

**AI-generated flashcard (edited):**

```json
{
  "deck_id": "123e4567-e89b-12d3-a456-426614174000",
  "front": "What is mitochondria?",
  "back": "The powerhouse of the cell - organelle responsible for cellular respiration",
  "source": "ai",
  "generation_id": "987fcdeb-51a2-43d7-b123-987654321000",
  "was_edited": true
}
```

## 3. Types Used

### Request DTO

```typescript
CreateFlashcardRequestDTO; // from src/types.ts
```

### Response DTO

```typescript
FlashcardDTO; // from src/types.ts (alias for Flashcard entity)
```

### Command Models

```typescript
TablesInsert<"flashcards">; // for database insertion
CreateGenerationEventCommand; // for logging generation events
```

### Enums

```typescript
SourceType; // 'ai' | 'manual'
EventType; // 'ACCEPTED' | 'EDITED' | 'REJECTED'
```

## 4. Response Details

### Success Response (201 Created)

**Status Code**: 201

**Response Body**:

```json
{
  "id": "uuid",
  "deck_id": "uuid",
  "front": "What is mitochondria?",
  "back": "The powerhouse of the cell",
  "source": "manual",
  "stability": 0.0,
  "difficulty": 0.0,
  "elapsed_days": 0,
  "scheduled_days": 0,
  "reps": 0,
  "lapses": 0,
  "state": 0,
  "last_review": null,
  "next_review": "2024-12-10T10:00:00Z",
  "created_at": "2024-12-10T10:00:00Z",
  "updated_at": "2024-12-10T10:00:00Z"
}
```

**Notes**:

- New flashcards initialize with default FSRS parameters (state=0 means "new")
- `next_review` is set to current timestamp (immediately available for study)
- All FSRS parameters start at 0 or null

### Error Responses

**400 Bad Request** - Validation errors:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "front",
      "issue": "String must contain at least 1 character(s)"
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

**404 Not Found** - Deck not found or not owned by user:

```json
{
  "error": {
    "code": "DECK_NOT_FOUND",
    "message": "Deck not found or access denied"
  }
}
```

**500 Internal Server Error**:

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

## 5. Data Flow

### High-Level Flow

1. **Request Reception**: Astro API route receives POST request
2. **Authentication Check**: Middleware ensures user is authenticated
3. **Input Validation**: Zod schema validates request body
4. **Authorization Check**: Verify deck belongs to authenticated user
5. **Database Transaction**:
   - Insert new flashcard with default FSRS parameters
   - If source is "ai", create generation event record
6. **Response**: Return created flashcard with 201 status

### Detailed Flow Diagram

```
Client Request
    ↓
[POST /api/flashcards] ← Astro API Route
    ↓
[Middleware: Authentication Check]
    ↓ (context.locals.supabase)
[Zod Validation]
    ↓
[Service Layer: FlashcardService.createFlashcard()]
    ↓
[Validate deck ownership via Supabase query]
    ↓
[BEGIN Transaction]
    ↓
[Insert flashcard into flashcards table]
    ↓
[IF source === 'ai': Insert generation event]
    ↓
[COMMIT Transaction]
    ↓
[Return FlashcardDTO with 201 status]
```

### Database Interactions

1. **Deck Ownership Validation**:

```sql
SELECT id FROM decks
WHERE id = $deck_id AND user_id = $authenticated_user_id
```

2. **Flashcard Insertion**:

```sql
INSERT INTO flashcards (
  deck_id, front, back, source,
  stability, difficulty, elapsed_days, scheduled_days,
  reps, lapses, state, last_review, next_review
) VALUES (
  $deck_id, $front, $back, $source,
  0.0, 0.0, 0, 0,
  0, 0, 0, NULL, NOW()
) RETURNING *
```

3. **Generation Event Logging** (if source is "ai"):

```sql
INSERT INTO generation_events (
  generation_id, event_type, draft_index, created_at
) VALUES (
  $generation_id,
  CASE WHEN $was_edited THEN 'EDITED' ELSE 'ACCEPTED' END,
  NULL,
  NOW()
)
```

## 6. Security Considerations

### Authentication

- User must be authenticated via Supabase session
- Session validated through `context.locals.supabase.auth.getUser()`
- Return 401 if no valid session exists

### Authorization

- **Deck Ownership**: Verify authenticated user owns the target deck before allowing flashcard creation
- Query: `SELECT id FROM decks WHERE id = $deck_id AND user_id = $user_id`
- Return 404 if deck doesn't exist or doesn't belong to user (don't reveal which)

### Input Validation & Sanitization

- **UUID Validation**: Ensure `deck_id` and `generation_id` are valid UUIDs
- **Length Constraints**:
  - `front`: 1-200 characters (enforced by database CHECK constraint)
  - `back`: 1-500 characters (enforced by database CHECK constraint)
- **Enum Validation**: `source` must be exactly "ai" or "manual"
- **Conditional Validation**: If `source === "ai"`, `generation_id` must be provided and valid
- **XSS Prevention**: Although content is user-generated, ensure proper escaping when rendering in UI (frontend responsibility, but API should not accept HTML tags unless explicitly designed to)

### Data Integrity

- Use database foreign key constraints to ensure `deck_id` references valid deck
- Use database CHECK constraints for content length
- Use database enum type for `source` field
- Leverage database CASCADE delete to handle cleanup when deck is deleted

### Rate Limiting

- Consider implementing rate limiting to prevent abuse (e.g., max 100 flashcards per minute per user)
- Not specified in current requirements but recommended for production

### SQL Injection Prevention

- Use parameterized queries through Supabase SDK (built-in protection)
- Never concatenate user input into SQL strings

## 7. Error Handling

### Validation Errors (400)

**Scenario**: Invalid input data

- Missing required fields (`deck_id`, `front`, `back`, `source`)
- Invalid UUID format for `deck_id` or `generation_id`
- `front` or `back` exceeds length limits or is empty
- `source` is not "ai" or "manual"
- `source` is "ai" but `generation_id` is missing/null
- `was_edited` is not a boolean

**Response**:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "generation_id",
      "issue": "generation_id is required when source is 'ai'"
    }
  }
}
```

### Authentication Errors (401)

**Scenario**: User not authenticated

- No session token provided
- Invalid or expired session token

**Response**:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

### Authorization Errors (404)

**Scenario**: Deck not found or access denied

- `deck_id` doesn't exist in database
- Deck exists but belongs to different user
- Note: Use 404 instead of 403 to avoid information leakage about deck existence

**Response**:

```json
{
  "error": {
    "code": "DECK_NOT_FOUND",
    "message": "Deck not found or access denied"
  }
}
```

### Server Errors (500)

**Scenario**: Unexpected database or server errors

- Database connection failures
- Transaction rollback failures
- Unexpected exceptions

**Response**:

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

**Logging**: Log full error details server-side for debugging, but don't expose to client

### Error Handling Pattern

```typescript
// Early return pattern for errors
if (!session) {
  return new Response(
    JSON.stringify({
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
    }),
    { status: 401 }
  );
}

if (validationResult.error) {
  return new Response(
    JSON.stringify({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input data",
        details: validationResult.error.issues[0],
      },
    }),
    { status: 400 }
  );
}

// Happy path last
return new Response(JSON.stringify(flashcard), { status: 201 });
```

## 8. Performance Considerations

### Database Optimization

- **Indexes**: Ensure `flashcards.deck_id` has an index (likely already exists via foreign key)
- **Single Query for Validation**: Use Supabase RLS policies to automatically enforce deck ownership instead of separate validation query
- **Connection Pooling**: Supabase handles this automatically

### Potential Bottlenecks

- **Generation Event Logging**: This is a secondary operation; consider making it non-blocking or using a background job for high-volume scenarios
- **Transaction Overhead**: Two INSERT operations in transaction adds slight overhead but ensures data consistency

### Optimization Strategies

1. **Leverage RLS Policies**: Instead of manual ownership check, configure RLS policy on `flashcards` table to automatically filter by user
2. **Batch Operations**: If client needs to create multiple flashcards, consider implementing POST /api/flashcards/batch endpoint
3. **Caching**: No caching needed for POST operations (they modify state)

### Scalability Notes

- Flashcard creation is a write operation - ensure database can handle expected write throughput
- Consider partitioning `flashcards` table by `deck_id` if single users accumulate massive flashcard counts (unlikely in typical use)

## 9. Implementation Steps

### Step 1: Create Zod Validation Schema

**File**: `src/pages/api/flashcards/index.ts` (or separate schema file)

```typescript
import { z } from "zod";

const createFlashcardSchema = z
  .object({
    deck_id: z.string().uuid(),
    front: z.string().min(1).max(200),
    back: z.string().min(1).max(500),
    source: z.enum(["ai", "manual"]),
    generation_id: z.string().uuid().nullable().optional(),
    was_edited: z.boolean().optional().default(false),
  })
  .refine(
    (data) => {
      if (data.source === "ai" && !data.generation_id) {
        return false;
      }
      return true;
    },
    {
      message: "generation_id is required when source is 'ai'",
      path: ["generation_id"],
    }
  );
```

### Step 2: Create or Update Flashcard Service

**File**: `src/lib/services/flashcard.service.ts` (create if doesn't exist)

```typescript
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import type { CreateFlashcardRequestDTO, FlashcardDTO } from "@/types";

export class FlashcardService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async createFlashcard(userId: string, data: CreateFlashcardRequestDTO): Promise<FlashcardDTO> {
    // Step 2a: Validate deck ownership
    const { data: deck, error: deckError } = await this.supabase
      .from("decks")
      .select("id")
      .eq("id", data.deck_id)
      .eq("user_id", userId)
      .single();

    if (deckError || !deck) {
      throw new Error("DECK_NOT_FOUND");
    }

    // Step 2b: Insert flashcard
    const { data: flashcard, error: flashcardError } = await this.supabase
      .from("flashcards")
      .insert({
        deck_id: data.deck_id,
        front: data.front,
        back: data.back,
        source: data.source,
        stability: 0.0,
        difficulty: 0.0,
        elapsed_days: 0,
        scheduled_days: 0,
        reps: 0,
        lapses: 0,
        state: 0,
        last_review: null,
        next_review: new Date().toISOString(),
      })
      .select()
      .single();

    if (flashcardError || !flashcard) {
      throw new Error("FLASHCARD_INSERT_FAILED");
    }

    // Step 2c: Log generation event if AI-sourced
    if (data.source === "ai" && data.generation_id) {
      await this.logGenerationEvent(data.generation_id, data.was_edited ? "EDITED" : "ACCEPTED");
    }

    return flashcard;
  }

  private async logGenerationEvent(generationId: string, eventType: "ACCEPTED" | "EDITED"): Promise<void> {
    const { error } = await this.supabase.from("generation_events").insert({
      generation_id: generationId,
      event_type: eventType,
      draft_index: null,
    });

    if (error) {
      // Log error but don't fail the request
      console.error("Failed to log generation event:", error);
    }
  }
}
```

### Step 3: Implement API Route

**File**: `src/pages/api/flashcards/index.ts`

```typescript
import type { APIRoute } from "astro";
import { FlashcardService } from "@/lib/services/flashcard.service";
import { createFlashcardSchema } from "./schemas"; // from Step 1

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    // Step 3a: Authentication check
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

    // Step 3b: Parse and validate request body
    const body = await context.request.json();
    const validationResult = createFlashcardSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input data",
            details: validationResult.error.issues[0],
          },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Step 3c: Create flashcard via service
    const flashcardService = new FlashcardService(context.locals.supabase);
    const flashcard = await flashcardService.createFlashcard(user.id, validationResult.data);

    // Step 3d: Return success response
    return new Response(JSON.stringify(flashcard), { status: 201, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    // Step 3e: Error handling
    if (error instanceof Error) {
      if (error.message === "DECK_NOT_FOUND") {
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
    }

    // Log unexpected errors
    console.error("Error creating flashcard:", error);

    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
```

### Step 4: Verify Database Schema

**Check**: Ensure `flashcards` table has proper constraints and RLS policies

- Verify foreign key constraint on `deck_id → decks(id)` with CASCADE delete
- Verify CHECK constraints on `front` (≤200 chars) and `back` (≤500 chars)
- Verify CHECK constraint on `state` (0-3)
- Verify RLS policies exist for INSERT operations

### Step 5: Test the Endpoint

**Test Cases**:

1. **Manual Flashcard Creation** (Happy Path)
   - Authenticated user
   - Valid deck_id owned by user
   - Valid content within limits
   - Expected: 201 with flashcard data

2. **AI Flashcard Acceptance** (Happy Path)
   - Authenticated user
   - source="ai" with valid generation_id
   - was_edited=false
   - Expected: 201 with flashcard data + generation event logged

3. **AI Flashcard Acceptance with Edits**
   - source="ai" with valid generation_id
   - was_edited=true
   - Expected: 201 with flashcard data + EDITED event logged

4. **Unauthenticated Request**
   - No session token
   - Expected: 401 Unauthorized

5. **Invalid Deck ID**
   - deck_id doesn't exist
   - Expected: 404 Deck Not Found

6. **Deck Owned by Different User**
   - Valid deck_id but belongs to another user
   - Expected: 404 Deck Not Found

7. **Missing generation_id for AI Source**
   - source="ai" but no generation_id
   - Expected: 400 Validation Error

8. **Content Too Long**
   - front > 200 characters or back > 500 characters
   - Expected: 400 Validation Error

9. **Invalid Source Enum**
   - source="invalid"
   - Expected: 400 Validation Error

10. **Invalid UUID Format**
    - deck_id="not-a-uuid"
    - Expected: 400 Validation Error

### Step 6: Integration Testing

- Test with frontend integration
- Verify FSRS parameters initialize correctly
- Verify flashcard appears in study queue immediately (next_review = NOW())
- Verify generation events are logged correctly in database

### Step 7: Documentation

- Update API documentation with endpoint details
- Add request/response examples
- Document error codes and their meanings
- Add to OpenAPI/Swagger spec if available

### Step 8: Deployment Checklist

- [ ] Run linter: `npm run lint`
- [ ] Run tests (when available)
- [ ] Verify environment variables are set (SUPABASE_URL, SUPABASE_KEY)
- [ ] Test in staging environment
- [ ] Monitor error logs after deployment
- [ ] Set up alerts for high error rates

## 10. Additional Notes

### Future Enhancements

- **Batch Creation**: Endpoint to create multiple flashcards in one request
- **Content Validation**: Check for duplicate flashcards in same deck
- **Rich Content**: Support markdown or HTML in front/back fields
- **Media Attachments**: Support images in flashcard content
- **AI Generation Integration**: Directly generate and create flashcards in one step

### Dependencies

- Requires `zod` package for validation (should already be installed)
- Requires Supabase client properly configured in middleware
- Requires proper TypeScript types from `database.types.ts`

### Related Endpoints

- GET /api/flashcards - List flashcards (should implement filtering by deck_id)
- PUT /api/flashcards/:id - Update flashcard content
- DELETE /api/flashcards/:id - Delete flashcard
- POST /api/generations - Generate AI flashcard drafts
- POST /api/generations/:id/reject - Reject AI draft
