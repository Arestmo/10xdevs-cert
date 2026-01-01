# API Endpoint Implementation Plan: DELETE /api/flashcards/{flashcardId}

## 1. Endpoint Overview

The DELETE endpoint removes a flashcard from the system while preserving analytics data. This endpoint is critical for user data management and GDPR compliance.

**Purpose:**
- Allow users to delete flashcards they no longer need
- Maintain data integrity by preserving analytics even after flashcard deletion
- Enforce strict ownership validation to prevent unauthorized deletions

**Key Characteristics:**
- Returns 204 No Content on success (no response body)
- Requires authentication (user must be logged in)
- Requires authorization (user must own the flashcard via deck ownership)
- Automatically handles cascade behavior for related data

## 2. Request Details

### HTTP Method
`DELETE`

### URL Structure
```
DELETE /api/flashcards/{flashcardId}
```

### URL Parameters

**Required:**
- `flashcardId` (string, UUID format)
  - The unique identifier of the flashcard to delete
  - Must be a valid UUID format
  - Example: `123e4567-e89b-12d3-a456-426614174000`

**Optional:**
- None

### Request Headers
```
Authorization: Bearer {access_token}  // Handled by Supabase auth
Content-Type: application/json
```

### Request Body
None (DELETE operations do not have a request body)

## 3. Utilized Types

### From `src/types.ts`

**Error Response:**
```typescript
ErrorResponseDTO - Used for all error responses (400, 401, 404, 500)
```

**Note:** No request or response DTOs are needed for this endpoint:
- No request body (DELETE operation)
- No response body (204 No Content on success)

### Zod Validation Schema (to be created in endpoint file)

```typescript
const DeleteFlashcardParamsSchema = z.object({
  flashcardId: z.string().uuid({
    message: "Invalid flashcard ID format",
  }),
});
```

## 4. Response Details

### Success Response (204 No Content)
```http
HTTP/1.1 204 No Content
```

**Characteristics:**
- No response body
- Indicates successful deletion
- Client should remove flashcard from UI

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

#### 401 Unauthorized - Not Authenticated
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

#### 404 Not Found - Flashcard Not Found or Not Owned
```json
{
  "error": {
    "code": "FLASHCARD_NOT_FOUND",
    "message": "Flashcard not found or not owned by user"
  }
}
```

**Security Note:** Returns same 404 response for both non-existent flashcards and unauthorized access to prevent information disclosure about flashcard existence.

#### 500 Internal Server Error - Unexpected Error
```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

## 5. Data Flow

### High-Level Flow Diagram
```
1. Client sends DELETE request
   ↓
2. Validate flashcardId (UUID format)
   ↓
3. Authenticate user (Supabase auth.getUser())
   ↓
4. Verify ownership (flashcard → deck → user_id)
   ↓
5. Delete flashcard from database
   ↓
6. Database CASCADE: generation_events.flashcard_id → NULL
   ↓
7. Return 204 No Content
```

### Detailed Step-by-Step Flow

#### Step 1: Input Validation
- Extract `flashcardId` from URL params
- Validate UUID format using Zod schema
- Return 400 if validation fails

#### Step 2: Authentication
- Call `locals.supabase.auth.getUser()`
- Verify user session is valid
- Return 401 if authentication fails

#### Step 3: Ownership Verification + Deletion
- Call service method `deleteFlashcard(flashcardId, userId)`
- Service verifies ownership through deck relationship:
  ```sql
  SELECT flashcards.id
  FROM flashcards
  INNER JOIN decks ON flashcards.deck_id = decks.id
  WHERE flashcards.id = ? AND decks.user_id = ?
  ```
- If not found or not owned, return null
- If found and owned, delete flashcard

#### Step 4: Database CASCADE Behavior
- When flashcard is deleted, database automatically:
  - Sets `generation_events.flashcard_id = NULL` for all related events
  - This preserves analytics data (acceptance rates, AI usage stats)
  - Defined by: `flashcard_id uuid references flashcards(id) on delete set null`

#### Step 5: Return Response
- If service returns success → 204 No Content
- If service returns null → 404 Not Found
- If service throws error → 500 Internal Server Error

### Database Interactions

**Tables Affected:**
1. `flashcards` - Row deleted
2. `generation_events` - Related rows have `flashcard_id` set to NULL (automatic)

**SQL Operations:**
```sql
-- Service verification query (INNER JOIN ensures ownership)
SELECT flashcards.id
FROM flashcards
INNER JOIN decks ON flashcards.deck_id = decks.id
WHERE flashcards.id = $1 AND decks.user_id = $2;

-- Service deletion query (if ownership verified)
DELETE FROM flashcards WHERE id = $1;

-- Automatic CASCADE (handled by database):
UPDATE generation_events
SET flashcard_id = NULL
WHERE flashcard_id = $1;
```

## 6. Security Considerations

### Authentication
- **Requirement:** User must have valid Supabase session
- **Implementation:** `locals.supabase.auth.getUser()`
- **Error:** Return 401 if session invalid or missing

### Authorization
- **Requirement:** User must own the flashcard (via deck ownership)
- **Implementation:** INNER JOIN with decks table filtered by user_id
- **Security Pattern:** Ownership verification through relationship chain
  ```
  flashcards.deck_id → decks.id (where decks.user_id = authenticated_user_id)
  ```

### Information Disclosure Prevention
- **Issue:** Returning different errors for "not found" vs "not owned" reveals flashcard existence
- **Solution:** Return same 404 error for both cases
- **Message:** "Flashcard not found or not owned by user"

### SQL Injection Protection
- **Protection:** Supabase client uses parameterized queries
- **Additional:** Zod validation ensures UUID format
- **Result:** No raw SQL string concatenation

### Row Level Security (RLS)
- **Database Level:** RLS policies already enforce user isolation
- **Application Level:** Additional checks via INNER JOIN for defense-in-depth
- **Result:** Multiple security layers

### CSRF Protection
- **Not Required:** DELETE in stateless API
- **Reason:** Bearer token authentication, no cookies

## 7. Error Handling

### Error Handling Strategy
Use guard clauses with early returns to handle errors at the beginning of the function, placing the happy path last.

### Error Scenarios

#### 1. Invalid UUID Format (400)
**Trigger:** flashcardId is not a valid UUID
**Detection:** Zod validation fails
**Response:** 400 with VALIDATION_ERROR
**Example:** `/api/flashcards/invalid-id`

#### 2. Missing or Invalid Authentication (401)
**Trigger:** No session or expired session
**Detection:** `auth.getUser()` returns error or null
**Response:** 401 with UNAUTHORIZED
**Example:** Request without Authorization header

#### 3. Flashcard Not Found (404)
**Trigger:** Flashcard doesn't exist in database
**Detection:** Service query returns null
**Response:** 404 with FLASHCARD_NOT_FOUND
**Example:** `/api/flashcards/123e4567-e89b-12d3-a456-426614174000` (non-existent)

#### 4. Unauthorized Access (404)
**Trigger:** Flashcard exists but belongs to another user
**Detection:** Service INNER JOIN filtered by user_id returns null
**Response:** 404 with FLASHCARD_NOT_FOUND (same as not found)
**Security:** Prevents revealing flashcard existence to unauthorized users

#### 5. Database Connection Error (500)
**Trigger:** Supabase connection fails
**Detection:** Database query throws exception
**Response:** 500 with INTERNAL_SERVER_ERROR
**Logging:** Log error details to console

#### 6. Unexpected Server Error (500)
**Trigger:** Any unhandled exception
**Detection:** Catch block in endpoint handler
**Response:** 500 with INTERNAL_SERVER_ERROR
**Logging:** Log full error stack to console

### Error Response Format
All errors follow the `ErrorResponseDTO` format:
```typescript
{
  error: {
    code: string;           // Machine-readable error code
    message: string;        // Human-readable message
    details?: Record<string, unknown>;  // Optional validation details
  }
}
```

### Logging Strategy
- **Console Errors:** Use `console.error()` with ESLint disable comment
- **Logged Information:**
  - Error message and stack trace
  - Operation context (e.g., "Error deleting flashcard")
  - User ID (for debugging, not in response)
- **Not Logged:** Sensitive data (passwords, tokens)

## 8. Performance Considerations

### Query Optimization
- **Single Query Approach:** Combine ownership verification and deletion
- **Index Usage:**
  - Primary key index on `flashcards.id` (automatic)
  - Foreign key index on `flashcards.deck_id` (automatic)
  - Index on `decks.user_id` (existing: `idx_decks_user`)

### Database Load
- **Minimal Impact:** Single DELETE operation
- **Cascade Efficiency:** Database handles generation_events update automatically
- **No N+1 Queries:** All operations in single service method

### Response Time Expectations
- **Typical:** < 100ms for simple deletion
- **Worst Case:** < 500ms if cascade affects many generation_events
- **Network:** Response time depends on database location

### Scalability
- **Horizontal Scaling:** Stateless endpoint scales linearly
- **Database Bottleneck:** Unlikely for DELETE operations (low frequency)
- **Monitoring:** Track slow queries if deletions exceed 1 second

### Caching Considerations
- **Not Applicable:** DELETE operations shouldn't be cached
- **Cache Invalidation:** If flashcards are cached elsewhere, implement cache invalidation strategy

## 9. Implementation Steps

### Step 1: Add Service Method to FlashcardService
**File:** `src/lib/services/flashcard.service.ts`

**Method Signature:**
```typescript
async deleteFlashcard(flashcardId: string, userId: string): Promise<boolean>
```

**Implementation:**
1. Verify ownership with INNER JOIN to decks table
2. If not found or not owned, return false
3. If owned, delete flashcard
4. Return true on success
5. Throw error on database failure

**Code Structure:**
```typescript
/**
 * Deletes a flashcard with ownership verification.
 *
 * Flow:
 * 1. Verify flashcard exists and belongs to user's deck
 * 2. Delete flashcard (cascade to generation_events handled by DB)
 * 3. Return success/failure status
 *
 * Security:
 * - CRITICAL: Verify ownership through deck relationship
 * - Returns false for both non-existent and unauthorized flashcards
 *
 * @param flashcardId - UUID of flashcard to delete
 * @param userId - UUID of authenticated user
 * @returns true if deleted, false if not found or unauthorized
 * @throws {Error} If database operation fails
 */
async deleteFlashcard(flashcardId: string, userId: string): Promise<boolean> {
  // Step 1: Verify ownership through deck relationship
  const { data: flashcard, error: fetchError } = await this.supabase
    .from("flashcards")
    .select("id, decks!inner(user_id)")
    .eq("id", flashcardId)
    .eq("decks.user_id", userId)
    .single();

  // Guard clause: not found or not owned
  if (fetchError || !flashcard) {
    return false;
  }

  // Step 2: Delete flashcard (cascade handled by database)
  const { error: deleteError } = await this.supabase
    .from("flashcards")
    .delete()
    .eq("id", flashcardId);

  // Guard clause: deletion failed
  if (deleteError) {
    throw new Error(`Failed to delete flashcard: ${deleteError.message}`);
  }

  // Step 3: Return success (happy path)
  return true;
}
```

### Step 2: Add DELETE Handler to API Route
**File:** `src/pages/api/flashcards/[flashcardId].ts`

**Implementation:**
1. Create Zod validation schema for flashcardId
2. Implement DELETE export with APIRoute type
3. Follow guard clause pattern for error handling
4. Return 204 No Content on success

**Code Structure:**
```typescript
/**
 * Validation schema for flashcard ID parameter (DELETE)
 */
const DeleteFlashcardParamsSchema = z.object({
  flashcardId: z.string().uuid({
    message: "Invalid flashcard ID format",
  }),
});

/**
 * DELETE handler - Deletes a flashcard
 *
 * Flow:
 * 1. Validate flashcardId parameter
 * 2. Authenticate user
 * 3. Delete flashcard via service (with ownership verification)
 * 4. Return 204 No Content or error
 *
 * @param params - URL parameters containing flashcardId
 * @param locals - Astro locals with Supabase client
 * @returns Response with 204 on success or error
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // Step 1: Validate flashcardId parameter
    const validation = DeleteFlashcardParamsSchema.safeParse({
      flashcardId: params.flashcardId,
    });

    if (!validation.success) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid flashcard ID format",
          details: validation.error.flatten(),
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { flashcardId } = validation.data;

    // Step 2: Authenticate user
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

    // Step 3: Delete flashcard via service
    const flashcardService = new FlashcardService(locals.supabase);
    const deleted = await flashcardService.deleteFlashcard(flashcardId, user.id);

    if (!deleted) {
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

    // Step 4: Return 204 No Content (happy path)
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    // Step 5: Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("Error deleting flashcard:", error);

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

### Step 3: Testing Checklist

#### Manual Testing
- [ ] **Success Case:** Delete owned flashcard returns 204
- [ ] **Invalid UUID:** Malformed flashcardId returns 400
- [ ] **Unauthenticated:** No auth header returns 401
- [ ] **Not Found:** Non-existent flashcard returns 404
- [ ] **Unauthorized:** Other user's flashcard returns 404 (not 403)
- [ ] **Idempotency:** Deleting same flashcard twice returns 404 second time
- [ ] **Analytics Preserved:** Verify generation_events.flashcard_id set to NULL

#### Database Verification
- [ ] Flashcard removed from `flashcards` table
- [ ] Related `generation_events` rows have `flashcard_id = NULL`
- [ ] No orphaned records or broken foreign keys
- [ ] Deck still exists (no cascade to parent)

#### Security Testing
- [ ] Cannot delete another user's flashcard
- [ ] Cannot bypass authentication with invalid token
- [ ] Cannot determine flashcard existence through error messages
- [ ] RLS policies enforce isolation (database level)

#### Edge Cases
- [ ] Flashcard with no generation_events (manual creation)
- [ ] Flashcard with multiple generation_events (accepted, edited)
- [ ] Concurrent deletion attempts (database handles)
- [ ] Large flashcard content (should not affect deletion speed)

### Step 4: Documentation Updates

#### Update API Documentation
- Add DELETE endpoint to API documentation
- Document request/response formats
- Include example curl commands
- Document error codes and scenarios

#### Example Curl Command
```bash
# Success case
curl -X DELETE \
  https://api.example.com/api/flashcards/123e4567-e89b-12d3-a456-426614174000 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Expected: 204 No Content
```

#### Update OpenAPI/Swagger (if applicable)
```yaml
/api/flashcards/{flashcardId}:
  delete:
    summary: Delete a flashcard
    parameters:
      - name: flashcardId
        in: path
        required: true
        schema:
          type: string
          format: uuid
    responses:
      '204':
        description: Flashcard successfully deleted
      '400':
        description: Invalid flashcard ID format
      '401':
        description: Authentication required
      '404':
        description: Flashcard not found or not owned by user
      '500':
        description: Internal server error
```

### Step 5: Code Review Checklist

#### Code Quality
- [ ] Follows CLAUDE.md guidelines
- [ ] Uses guard clause pattern for error handling
- [ ] Happy path is last in function
- [ ] No unnecessary else statements
- [ ] Proper TypeScript types used

#### Security
- [ ] Authentication required
- [ ] Authorization enforced via INNER JOIN
- [ ] No information disclosure (same 404 for not found/unauthorized)
- [ ] SQL injection protected (parameterized queries)
- [ ] Input validation with Zod

#### Error Handling
- [ ] All error scenarios covered
- [ ] Proper HTTP status codes
- [ ] Consistent ErrorResponseDTO format
- [ ] Errors logged but not exposed to client
- [ ] Unexpected errors caught and handled

#### Performance
- [ ] Minimal database queries
- [ ] Proper index usage
- [ ] No N+1 query problems
- [ ] Efficient ownership verification

#### Documentation
- [ ] JSDoc comments on service method
- [ ] JSDoc comments on endpoint handler
- [ ] Inline comments for complex logic
- [ ] Clear error messages

---

## Summary

This implementation plan provides a complete guide for implementing the DELETE /api/flashcards/{flashcardId} endpoint. The implementation:

1. **Validates** input using Zod schemas
2. **Authenticates** users via Supabase auth
3. **Authorizes** through ownership verification with INNER JOIN
4. **Deletes** flashcards while preserving analytics (CASCADE behavior)
5. **Returns** 204 No Content on success with appropriate errors
6. **Follows** all project conventions and security best practices

The endpoint is designed to be secure, performant, and maintainable while following the established patterns in the codebase.
