# API Endpoint Implementation Plan: POST /api/study/review

## 1. Endpoint Overview

The POST /api/study/review endpoint allows authenticated users to submit a review rating for a flashcard during a study session. The endpoint implements the FSRS (Free Spaced Repetition Scheduler) algorithm to calculate updated spaced repetition parameters based on the user's rating.

**Purpose:**

- Accept user's review rating (1=Again, 2=Hard, 3=Good, 4=Easy) for a flashcard
- Calculate new FSRS parameters using the ts-fsrs algorithm
- Update flashcard with new scheduling parameters (next_review, stability, difficulty, etc.)
- Return updated flashcard and preview of next review intervals for all rating options

**Key Features:**

- Implements FSRS v4+ algorithm for optimal spaced repetition
- Updates last_review to current timestamp
- Calculates next_review date based on rating
- Provides interval previews to help users make informed decisions
- Enforces ownership validation to prevent unauthorized access

## 2. Request Details

- **HTTP Method**: POST
- **URL Structure**: `/api/study/review`
- **Content-Type**: `application/json`

### Parameters

**Required Body Parameters:**

- `flashcard_id` (string, UUID):
  - Must be a valid UUID format
  - Must reference an existing flashcard
  - Flashcard must belong to the authenticated user (via deck ownership)

- `rating` (integer, 1-4):
  - 1 = Again (forgot the card, needs relearning)
  - 2 = Hard (remembered with difficulty)
  - 3 = Good (remembered correctly)
  - 4 = Easy (remembered effortlessly)

**Optional Parameters:**

- None

### Request Body Example

```json
{
  "flashcard_id": "550e8400-e29b-41d4-a716-446655440000",
  "rating": 3
}
```

### Validation Schema (Zod)

```typescript
const submitReviewSchema = z.object({
  flashcard_id: z.string().uuid({ message: "flashcard_id must be a valid UUID" }),
  rating: z
    .number()
    .int()
    .min(1)
    .max(4)
    .refine((val) => [1, 2, 3, 4].includes(val), {
      message: "rating must be 1 (Again), 2 (Hard), 3 (Good), or 4 (Easy)",
    }),
});
```

## 3. Utilized Types

### Existing Types from [src/types.ts](src/types.ts)

**Request DTO** (lines 291-294):

```typescript
export interface SubmitReviewRequestDTO {
  flashcard_id: string;
  rating: 1 | 2 | 3 | 4;
}
```

**Response DTO** (lines 311-314):

```typescript
export interface ReviewResponseDTO {
  flashcard: FlashcardDTO;
  next_intervals: NextIntervalsDTO;
}
```

**Next Intervals DTO** (lines 300-305):

```typescript
export interface NextIntervalsDTO {
  again: string; // e.g., "10m", "1d"
  hard: string;
  good: string;
  easy: string;
}
```

**Flashcard DTO** (line 155):

```typescript
export type FlashcardDTO = Flashcard; // From Tables<"flashcards">
```

**FSRS Command Model** (lines 359-370):

```typescript
export type UpdateFlashcardFSRSCommand = Pick<
  TablesUpdate<"flashcards">,
  | "stability"
  | "difficulty"
  | "elapsed_days"
  | "scheduled_days"
  | "reps"
  | "lapses"
  | "state"
  | "last_review"
  | "next_review"
>;
```

**Error Response DTO** (lines 83-89):

```typescript
export interface ErrorResponseDTO {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
```

All necessary types already exist - no new type definitions required.

## 4. Response Details

### Success Response (200 OK)

**Structure:**

```json
{
  "flashcard": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "deck_id": "660e8400-e29b-41d4-a716-446655440000",
    "front": "What is FSRS?",
    "back": "Free Spaced Repetition Scheduler",
    "source": "manual",
    "stability": 5.2,
    "difficulty": 0.28,
    "elapsed_days": 0,
    "scheduled_days": 14,
    "reps": 4,
    "lapses": 0,
    "state": 2,
    "last_review": "2024-12-10T10:00:00Z",
    "next_review": "2024-12-24T10:00:00Z",
    "created_at": "2024-11-01T10:00:00Z",
    "updated_at": "2024-12-10T10:00:00Z"
  },
  "next_intervals": {
    "again": "10m",
    "hard": "1d",
    "good": "14d",
    "easy": "30d"
  }
}
```

**Fields Explanation:**

- `flashcard`: Complete updated flashcard with new FSRS parameters
- `next_intervals`: Preview of what the next review date would be for each rating option
  - Helps users understand the impact of their choice
  - Format: Human-readable intervals ("10m" = 10 minutes, "1d" = 1 day, "14d" = 14 days)

### Error Responses

**401 Unauthorized:**

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**400 Bad Request:**

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid request data",
    "details": {
      "flashcard_id": ["flashcard_id must be a valid UUID"],
      "rating": ["rating must be 1, 2, 3, or 4"]
    }
  }
}
```

**404 Not Found:**

```json
{
  "error": {
    "code": "FLASHCARD_NOT_FOUND",
    "message": "Flashcard not found"
  }
}
```

Note: Returns same response for both non-existent flashcards and unauthorized access to prevent information disclosure.

**500 Internal Server Error:**

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

```
User Request (rating)
    ↓
Authentication Check
    ↓
Request Validation (Zod)
    ↓
Fetch Current Flashcard
    ↓
Verify Ownership (via deck)
    ↓
Calculate FSRS Parameters
    ↓
Update Flashcard in DB
    ↓
Calculate Preview Intervals
    ↓
Return Response
```

### Detailed Step-by-Step Flow

1. **Authentication** (`context.locals.supabase.auth.getUser()`)
   - Verify user session exists
   - Extract user ID from session
   - If not authenticated → 401 Unauthorized

2. **Request Validation** (Zod schema)
   - Parse request body JSON
   - Validate flashcard_id is valid UUID
   - Validate rating is integer 1-4
   - If validation fails → 400 Bad Request with field errors

3. **Fetch Flashcard with Ownership Check** (Supabase query)

   ```typescript
   SELECT flashcards.*, decks.user_id
   FROM flashcards
   INNER JOIN decks ON flashcards.deck_id = decks.id
   WHERE flashcards.id = :flashcard_id
     AND decks.user_id = :user_id
   ```

   - Inner join ensures ownership validation
   - If not found or not owned → 404 Not Found

4. **FSRS Calculation** (ts-fsrs library)
   - Initialize FSRS instance with current card parameters
   - Create Card object from current FSRS state
   - Call `fsrs.repeat()` with card and rating
   - Extract new parameters (stability, difficulty, state, etc.)
   - Calculate next_review date based on scheduled_days
   - Calculate preview intervals for all 4 rating options

5. **Database Update** (Supabase update)

   ```typescript
   UPDATE flashcards
   SET stability = :new_stability,
       difficulty = :new_difficulty,
       elapsed_days = :new_elapsed_days,
       scheduled_days = :new_scheduled_days,
       reps = :new_reps,
       lapses = :new_lapses,
       state = :new_state,
       last_review = NOW(),
       next_review = :new_next_review
   WHERE id = :flashcard_id
   RETURNING *
   ```

   - Update all FSRS parameters in single atomic operation
   - `updated_at` automatically updated by database trigger
   - If update fails → 500 Internal Server Error

6. **Format Response**
   - Construct ReviewResponseDTO with updated flashcard
   - Add next_intervals with human-readable format
   - Return 200 OK with JSON response

### Database Interactions

**Tables Accessed:**

- `flashcards` (read + update): Main table for flashcard data and FSRS parameters
- `decks` (read only): Used for ownership validation via inner join

**Transaction Requirements:**

- Single UPDATE operation is atomic by default
- No need for explicit transaction wrapping
- Database constraints ensure data integrity

### External Dependencies

**ts-fsrs Library:**

- NPM package: `ts-fsrs` (needs to be installed)
- Official TypeScript implementation of FSRS algorithm
- Handles all spaced repetition calculations
- Methods used:
  - `new FSRS()` - Initialize scheduler
  - `createEmptyCard()` or construct Card from existing parameters
  - `repeat(card, now, rating)` - Calculate new scheduling
  - Returns `RecordLog` with updated card state and scheduling info

## 6. Security Considerations

### Authentication

- **Requirement**: User must be authenticated via Supabase Auth
- **Implementation**: Call `context.locals.supabase.auth.getUser()`
- **Failure**: Return 401 Unauthorized if no valid session

### Authorization

- **CRITICAL**: Flashcard ownership validation
- **Implementation**:
  - ALWAYS join flashcards with decks table
  - Filter by `decks.user_id = authenticated_user_id`
  - Use INNER JOIN to ensure both flashcard and deck exist
- **Security Impact**: Prevents users from reviewing other users' flashcards
- **Information Disclosure Prevention**:
  - Return 404 for both non-existent and unauthorized flashcards
  - Never reveal whether flashcard exists if user doesn't own it

### Input Validation

- **UUID Validation**: Prevent malformed IDs and SQL injection attempts
- **Rating Range**: Strictly enforce 1-4 to prevent algorithm manipulation
- **Type Safety**: Use Zod schema to ensure correct types
- **Sanitization**: Zod handles basic sanitization automatically

### Data Integrity

- **FSRS Parameter Consistency**: Use ts-fsrs library to ensure valid states
- **Database Constraints**: Rely on database CHECK constraints for bounds
- **Atomic Updates**: Single UPDATE ensures no partial state changes

### Potential Vulnerabilities

1. **Unauthorized Access** - MITIGATED
   - Risk: User submits review for another user's flashcard
   - Mitigation: Inner join with decks table + user_id filter

2. **Rating Manipulation** - MITIGATED
   - Risk: User sends invalid rating values (e.g., 5, 0, -1)
   - Mitigation: Zod schema with strict 1-4 validation

3. **FSRS Parameter Tampering** - MITIGATED
   - Risk: User directly manipulates FSRS parameters
   - Mitigation: All parameters calculated server-side, never accepted from client

4. **Replay Attacks** - LOW RISK
   - Risk: User re-submits same review multiple times
   - Note: Not critical for this endpoint - each review updates state progressively
   - Could add rate limiting if needed in future

5. **Concurrent Updates** - LOW RISK
   - Risk: Two simultaneous reviews for same flashcard
   - Note: Last write wins, acceptable for study sessions
   - User unlikely to review same card twice simultaneously

## 7. Error Handling

### Error Categories and Responses

#### 1. Authentication Errors (401)

**Scenario**: User not authenticated or session expired
**Detection**: `authError` from `getUser()` or `!user`
**Response**:

```typescript
{
  status: 401,
  body: {
    error: {
      code: "UNAUTHORIZED",
      message: "Authentication required"
    }
  }
}
```

**User Action**: Redirect to login page

#### 2. Validation Errors (400)

**Scenarios**:

- Invalid UUID format for flashcard_id
- Rating not in range 1-4
- Missing required fields
- Wrong data types

**Detection**: Zod validation throws `ZodError`
**Response**:

```typescript
{
  status: 400,
  body: {
    error: {
      code: "INVALID_REQUEST",
      message: "Invalid request data",
      details: error.flatten().fieldErrors
    }
  }
}
```

**User Action**: Fix validation errors and retry

#### 3. Resource Not Found (404)

**Scenarios**:

- Flashcard does not exist
- Flashcard exists but belongs to different user

**Detection**: Query returns no results or error
**Response**:

```typescript
{
  status: 404,
  body: {
    error: {
      code: "FLASHCARD_NOT_FOUND",
      message: "Flashcard not found"
    }
  }
}
```

**Security Note**: Same response for both cases to prevent information disclosure
**User Action**: Return to study session or refresh card list

#### 4. Database Errors (500)

**Scenarios**:

- Connection to Supabase fails
- Query execution error
- Update operation fails

**Detection**: Supabase returns error object
**Handling**:

```typescript
if (error) {
  console.error("Database error:", error);
  return {
    status: 500,
    body: {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    },
  };
}
```

**User Action**: Retry request, contact support if persists

#### 5. FSRS Calculation Errors (500)

**Scenarios**:

- ts-fsrs library throws error
- Invalid FSRS state in database

**Detection**: Try-catch around FSRS calculations
**Handling**:

```typescript
try {
  const result = fsrs.repeat(card, now, rating);
  // ...
} catch (error) {
  console.error("FSRS calculation error:", error);
  return {
    status: 500,
    body: {
      error: {
        code: "CALCULATION_ERROR",
        message: "Failed to calculate review schedule",
      },
    },
  };
}
```

**User Action**: Report issue with flashcard ID for investigation

### Error Handling Pattern (Guard Clauses)

Following project conventions from [CLAUDE.md](CLAUDE.md#L176-182):

```typescript
// 1. Check authentication first
if (authError || !user) {
  return errorResponse(401, "UNAUTHORIZED", "Authentication required");
}

// 2. Validate input
try {
  validatedData = schema.parse(requestBody);
} catch (error) {
  return errorResponse(400, "INVALID_REQUEST", "Invalid request data", details);
}

// 3. Fetch and verify ownership
const flashcard = await getFlashcardWithOwnership(flashcard_id, user.id);
if (!flashcard) {
  return errorResponse(404, "FLASHCARD_NOT_FOUND", "Flashcard not found");
}

// 4. Calculate FSRS parameters
let newParameters;
try {
  newParameters = calculateFSRS(flashcard, rating);
} catch (error) {
  console.error("FSRS error:", error);
  return errorResponse(500, "CALCULATION_ERROR", "Failed to calculate schedule");
}

// 5. Update database
const { data: updated, error: updateError } = await updateFlashcard(newParameters);
if (updateError || !updated) {
  console.error("Update error:", updateError);
  return errorResponse(500, "INTERNAL_ERROR", "Failed to update flashcard");
}

// 6. Happy path - return success
return successResponse(200, { flashcard: updated, next_intervals });
```

### Logging Strategy

**Development**:

- Log all errors to console with full details
- Include error stack traces
- Log FSRS calculation inputs/outputs for debugging

**Production** (future):

- Log errors to external service (e.g., Sentry)
- Include request ID for tracing
- Sanitize sensitive data from logs
- Track error rates and patterns

**Current Implementation**:

```typescript
console.error("Error submitting review:", {
  flashcard_id,
  user_id: user.id,
  error: error.message,
  stack: error.stack,
});
```

## 8. Performance Considerations

### Potential Bottlenecks

1. **Database Query Performance**
   - Flashcard lookup with JOIN requires indexed columns
   - Update operation on single row is fast
   - **Mitigation**: Ensure indexes exist on `flashcards.id` and `decks.user_id`

2. **FSRS Calculation Overhead**
   - ts-fsrs library calculations are CPU-bound
   - Multiple calculations for preview intervals (4 ratings)
   - **Impact**: Minimal (<10ms for typical calculations)
   - **Mitigation**: Algorithm is optimized, no action needed

3. **Network Latency**
   - Supabase hosted database adds network round trip
   - Two queries: fetch + update
   - **Mitigation**: Use single UPDATE with RETURNING to reduce round trips

### Optimization Strategies

#### Current Implementation (Sufficient for MVP)

1. **Single Database Round Trip for Update**

   ```sql
   UPDATE flashcards
   SET ...
   WHERE id = ?
   RETURNING *;
   ```

   - Eliminates need for separate SELECT after UPDATE
   - Reduces latency by ~50ms

2. **Efficient Ownership Check**
   - Combined in flashcard fetch query
   - No separate deck lookup needed
   - Uses INNER JOIN which is optimized by Postgres

3. **Minimal Response Payload**
   - Only return necessary fields
   - No nested objects or unnecessary joins
   - Keep response under 2KB

#### Future Optimizations (If Needed)

1. **Database Indexes** (likely already exist)

   ```sql
   CREATE INDEX idx_flashcards_id ON flashcards(id);
   CREATE INDEX idx_decks_user_id ON decks(user_id);
   CREATE INDEX idx_flashcards_deck_id ON flashcards(deck_id);
   ```

2. **Response Caching** (not applicable)
   - POST requests should not be cached
   - Each review changes state, no cacheable data

3. **Connection Pooling**
   - Supabase handles this automatically
   - No action needed in application code

4. **Batch Reviews** (future feature)
   - Allow submitting multiple reviews in one request
   - Would require transaction handling
   - Not in current scope

### Expected Performance Metrics

**Target Response Times** (95th percentile):

- Authentication check: <50ms
- Database query (fetch): <100ms
- FSRS calculation: <10ms
- Database update: <100ms
- **Total response time**: <300ms

**Acceptable Limits**:

- <500ms for 95th percentile
- <1000ms for 99th percentile
- <2000ms maximum timeout

**Scalability**:

- Endpoint scales horizontally (stateless)
- No shared state between requests
- Database is bottleneck (Supabase handles this)
- Can handle 100+ req/sec with standard Supabase plan

### Monitoring Recommendations (Future)

1. **Response Time Tracking**
   - P50, P95, P99 latencies
   - Breakdown by operation (auth, query, calculate, update)

2. **Error Rate Monitoring**
   - Track 4xx vs 5xx errors
   - Alert on sudden spikes

3. **Database Performance**
   - Query execution times
   - Connection pool usage
   - Index hit rates

## 9. Implementation Steps

### Prerequisites

1. **Install FSRS Library**

   ```bash
   npm install ts-fsrs
   ```

   - Official TypeScript FSRS implementation
   - Handles all spaced repetition algorithm calculations
   - Version: Latest stable (check npm for current version)

2. **Verify Type Definitions**
   - All required types already exist in [src/types.ts](src/types.ts)
   - No changes needed to type definitions

3. **Review Database Schema**
   - Confirm flashcards table has all FSRS fields (from [temp-endpoind-db.txt](temp-endpoind-db.txt))
   - Verify indexes exist on id and deck_id columns

### Step 1: Create Service Layer Function

**File**: [src/lib/services/study.service.ts](src/lib/services/study.service.ts)

**Add the following function** (append to existing file):

```typescript
/**
 * Submits a review rating for a flashcard and updates FSRS parameters.
 *
 * This function implements the core spaced repetition algorithm by:
 * 1. Fetching the current flashcard with ownership validation
 * 2. Calculating new FSRS parameters based on user's rating
 * 3. Updating flashcard with new scheduling parameters
 * 4. Calculating preview intervals for all rating options
 *
 * Flow:
 * 1. Fetch flashcard with INNER JOIN to verify ownership
 * 2. Create FSRS Card object from current parameters
 * 3. Call FSRS algorithm to calculate new state
 * 4. Update database with new parameters
 * 5. Calculate preview intervals for UI
 * 6. Return updated flashcard and intervals
 *
 * Security:
 * - CRITICAL: Always join with decks table and filter by user_id
 * - Prevents users from reviewing other users' flashcards
 * - Returns null if flashcard not found or not owned
 *
 * @param supabase - Authenticated Supabase client instance
 * @param userId - UUID of the authenticated user
 * @param flashcardId - UUID of the flashcard being reviewed
 * @param rating - Review rating (1=Again, 2=Hard, 3=Good, 4=Easy)
 * @returns Review response with updated flashcard and interval previews, or null if not found
 * @throws {Error} If database operation or FSRS calculation fails
 */
export async function submitReview(
  supabase: SupabaseClient<Database>,
  userId: string,
  flashcardId: string,
  rating: 1 | 2 | 3 | 4
): Promise<ReviewResponseDTO | null>;
```

**Implementation Details**:

- Import ts-fsrs library: `import { FSRS, Rating, Card, RecordLog, State } from "ts-fsrs"`
- Fetch flashcard with ownership check (INNER JOIN with decks)
- Convert database FSRS parameters to ts-fsrs Card object
- Map rating (1-4) to ts-fsrs Rating enum (Again, Hard, Good, Easy)
- Call `fsrs.repeat(card, now, rating)` to get new parameters
- Extract new state and scheduling info from RecordLog
- Update flashcard in database with new parameters
- Calculate preview intervals using `fsrs.repeat()` for all 4 ratings
- Format intervals as human-readable strings ("10m", "1d", "14d")
- Return ReviewResponseDTO with flashcard and intervals

**Helper Functions to Add**:

```typescript
/**
 * Converts database flashcard FSRS parameters to ts-fsrs Card object
 */
function createCardFromFlashcard(flashcard: FlashcardDTO): Card;

/**
 * Converts ts-fsrs rating (1-4) to library Rating enum
 */
function mapRatingToEnum(rating: 1 | 2 | 3 | 4): Rating;

/**
 * Formats millisecond duration to human-readable interval string
 */
function formatInterval(milliseconds: number): string;

/**
 * Calculates preview intervals for all 4 rating options
 */
function calculatePreviewIntervals(card: Card, fsrs: FSRS, now: Date): NextIntervalsDTO;
```

### Step 2: Create API Route Handler

**File**: [src/pages/api/study/review.ts](src/pages/api/study/review.ts) (new file)

**Structure** (following pattern from [src/pages/api/study/cards.ts](src/pages/api/study/cards.ts)):

```typescript
import type { APIRoute } from "astro";
import { z } from "zod";
import { submitReview } from "@/lib/services/study.service";
import type { ErrorResponseDTO, ReviewResponseDTO, SubmitReviewRequestDTO } from "@/types";

export const prerender = false;

/**
 * Validation schema for POST /api/study/review
 */
const submitReviewSchema = z.object({
  flashcard_id: z.string().uuid({ message: "flashcard_id must be a valid UUID" }),
  rating: z
    .number()
    .int()
    .min(1)
    .max(4)
    .refine((val) => [1, 2, 3, 4].includes(val), {
      message: "rating must be 1 (Again), 2 (Hard), 3 (Good), or 4 (Easy)",
    }),
});

export const POST: APIRoute = async (context) => {
  // Step 1: Authentication check
  // Step 2: Parse and validate request body
  // Step 3: Call submitReview service
  // Step 4: Handle errors with appropriate status codes
  // Step 5: Return success response
};
```

**Implementation Steps**:

1. **Authentication** (lines ~45-63 in pattern)
   - Get user from `context.locals.supabase.auth.getUser()`
   - Return 401 if not authenticated

2. **Request Body Parsing** (lines ~65-100 in pattern)
   - Parse JSON from `context.request`
   - Validate with Zod schema
   - Return 400 with field errors if invalid

3. **Service Call** (lines ~103-110 in pattern)
   - Call `submitReview()` with validated data
   - Wrap in try-catch for error handling

4. **Error Handling** (lines ~119-149 in pattern)
   - 404 if flashcard not found/not owned
   - 500 for unexpected errors
   - Log errors to console

5. **Success Response** (lines ~111-118 in pattern)
   - Return 200 with ReviewResponseDTO
   - Set appropriate headers

### Step 3: Implement FSRS Algorithm Integration

**In study.service.ts**, implement FSRS integration:

1. **Initialize FSRS Instance**

   ```typescript
   const fsrs = new FSRS();
   ```

2. **Create Card from Flashcard**

   ```typescript
   const card: Card = {
     due: new Date(flashcard.next_review),
     stability: flashcard.stability,
     difficulty: flashcard.difficulty,
     elapsed_days: flashcard.elapsed_days,
     scheduled_days: flashcard.scheduled_days,
     reps: flashcard.reps,
     lapses: flashcard.lapses,
     state: flashcard.state as State,
     last_review: flashcard.last_review ? new Date(flashcard.last_review) : undefined,
   };
   ```

3. **Calculate New State**

   ```typescript
   const now = new Date();
   const schedulingInfo = fsrs.repeat(card, now, rating);
   const { card: newCard, log } = schedulingInfo[rating];
   ```

4. **Extract Update Parameters**

   ```typescript
   const updateCommand: UpdateFlashcardFSRSCommand = {
     stability: newCard.stability,
     difficulty: newCard.difficulty,
     elapsed_days: newCard.elapsed_days,
     scheduled_days: newCard.scheduled_days,
     reps: newCard.reps,
     lapses: newCard.lapses,
     state: newCard.state,
     last_review: now.toISOString(),
     next_review: newCard.due.toISOString(),
   };
   ```

5. **Calculate Preview Intervals**
   ```typescript
   const intervals = {
     again: formatInterval(schedulingInfo[Rating.Again].card.due.getTime() - now.getTime()),
     hard: formatInterval(schedulingInfo[Rating.Hard].card.due.getTime() - now.getTime()),
     good: formatInterval(schedulingInfo[Rating.Good].card.due.getTime() - now.getTime()),
     easy: formatInterval(schedulingInfo[Rating.Easy].card.due.getTime() - now.getTime()),
   };
   ```

### Step 4: Implement Database Update

**In study.service.ts**, update flashcard:

```typescript
const { data: updatedFlashcard, error: updateError } = await supabase
  .from("flashcards")
  .update(updateCommand)
  .eq("id", flashcardId)
  .select()
  .single();

if (updateError || !updatedFlashcard) {
  throw new Error(`Failed to update flashcard: ${updateError?.message ?? "Unknown error"}`);
}

return {
  flashcard: updatedFlashcard,
  next_intervals: intervals,
};
```

### Step 5: Implement Helper Functions

**formatInterval()** - Convert milliseconds to human-readable format:

```typescript
function formatInterval(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(ms / 3600000);
  const days = Math.floor(ms / 86400000);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) return `${years}y`;
  if (months > 0) return `${months}mo`;
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}
```

### Step 6: Add Error Handling

1. **Create Custom Error Class** (if needed)

   ```typescript
   export class FlashcardNotFoundError extends Error {
     constructor(message: string) {
       super(message);
       this.name = "FlashcardNotFoundError";
     }
   }
   ```

2. **Add Try-Catch in Service**
   - Wrap FSRS calculations in try-catch
   - Throw descriptive errors for debugging

3. **Handle Errors in API Route**
   - Map service errors to appropriate HTTP status codes
   - Log errors with context information

### Step 7: Testing Checklist

**Manual Testing**:

- [ ] Test with valid flashcard_id and rating 1-4
- [ ] Test with invalid UUID format
- [ ] Test with rating outside 1-4 range
- [ ] Test with non-existent flashcard_id
- [ ] Test with flashcard_id from different user (should return 404)
- [ ] Test without authentication
- [ ] Test with expired session token
- [ ] Verify FSRS parameters are updated correctly
- [ ] Verify next_intervals are calculated correctly
- [ ] Verify response format matches ReviewResponseDTO

**Database Verification**:

- [ ] Confirm flashcard updated in database
- [ ] Verify all FSRS fields are updated
- [ ] Verify last_review is set to current timestamp
- [ ] Verify next_review matches calculated date
- [ ] Verify updated_at is automatically updated

**Edge Cases**:

- [ ] Review newly created flashcard (state=0)
- [ ] Review flashcard with state=1 (learning)
- [ ] Review flashcard with state=2 (review)
- [ ] Review flashcard with state=3 (relearning)
- [ ] Multiple consecutive reviews of same flashcard
- [ ] Review flashcard with extreme FSRS values

### Step 8: Code Quality Checks

1. **Run Linter**

   ```bash
   npm run lint
   ```

   - Fix any ESLint errors
   - Ensure no TypeScript errors

2. **Format Code**

   ```bash
   npm run format
   ```

   - Ensure consistent code style
   - Format follows Prettier configuration

3. **Type Safety**
   - Verify all functions have proper type annotations
   - No `any` types used
   - All DTOs match interface definitions

4. **Documentation**
   - Add JSDoc comments to all public functions
   - Document FSRS algorithm approach
   - Include security notes in critical sections

### Step 9: Integration Testing

1. **Test with Frontend** (if available)
   - Integrate endpoint with study session UI
   - Verify interval previews display correctly
   - Test loading states and error messages

2. **API Testing Tools**
   - Test with Postman or similar
   - Verify request/response format
   - Check error responses

3. **Performance Testing**
   - Measure response times
   - Verify under 300ms for typical requests
   - Test with database under load

### Step 10: Documentation and Deployment

1. **Update API Documentation**
   - Document endpoint in API spec
   - Include example requests/responses
   - Note authentication requirements

2. **Deployment Checklist**
   - [ ] ts-fsrs package in package.json
   - [ ] No hardcoded values or secrets
   - [ ] Environment variables configured
   - [ ] Database migrations applied (if any)
   - [ ] Error logging configured

3. **Monitoring Setup** (future)
   - Add endpoint to monitoring dashboard
   - Set up error alerts
   - Track response time metrics

### Success Criteria

**Endpoint is complete when**:

- ✅ All authentication and authorization checks pass
- ✅ Input validation works for all edge cases
- ✅ FSRS calculations produce correct results
- ✅ Database updates are atomic and consistent
- ✅ Error responses match specification
- ✅ Response times meet performance targets
- ✅ No linter or type errors
- ✅ Code follows project conventions
- ✅ Manual testing checklist completed
- ✅ Documentation is complete

### Estimated Effort

- **Step 1-2** (Service + API Route): 2-3 hours
- **Step 3-4** (FSRS Integration): 2-3 hours
- **Step 5-6** (Helpers + Error Handling): 1-2 hours
- **Step 7-9** (Testing): 2-3 hours
- **Step 10** (Documentation): 1 hour
- **Total**: 8-12 hours

### Dependencies and Blockers

**Dependencies**:

- ts-fsrs npm package must be installed
- Supabase connection must be working
- Database schema must have all FSRS fields
- Authentication middleware must be configured

**Potential Blockers**:

- FSRS library API changes (mitigate: pin version)
- Database performance issues (mitigate: verify indexes)
- Authentication issues (mitigate: test auth flow first)

**Risk Mitigation**:

- Start with service layer (can be tested independently)
- Mock FSRS calculations for initial testing
- Test ownership validation thoroughly
- Add comprehensive error handling early
