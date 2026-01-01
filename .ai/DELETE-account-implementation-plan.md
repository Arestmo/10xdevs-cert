# API Endpoint Implementation Plan: DELETE /api/account

## 1. Endpoint Overview

The `DELETE /api/account` endpoint provides GDPR-compliant account deletion functionality. It allows authenticated users to permanently delete their account and all associated data after providing explicit confirmation. The deletion cascades through all related data: profiles → decks → flashcards → generation_events.

**Key Features:**

- GDPR compliance with complete data deletion
- Safety mechanism with explicit confirmation string
- Cascade deletion via database constraints
- Session invalidation after successful deletion
- Prevents accidental account deletion

## 2. Request Details

- **HTTP Method**: DELETE
- **URL Structure**: `/api/account`
- **Authentication**: Required (authenticated user session)
- **Content-Type**: `application/json`

### Request Parameters:

**Required:**

- None (no URL parameters)

**Optional:**

- None

### Request Body:

```json
{
  "confirmation": "DELETE"
}
```

**Field Validation:**

- `confirmation` (string, required): Must exactly match the string `"DELETE"`
  - Case-sensitive validation
  - No whitespace trimming
  - Exact match required

## 3. Utilized Types

All necessary types are already defined in [src/types.ts](src/types.ts):

### DTOs:

- `DeleteAccountRequestDTO` (lines 313-315) - Request body validation

  ```typescript
  interface DeleteAccountRequestDTO {
    confirmation: string;
  }
  ```

- `DeleteAccountResponseDTO` (lines 320-322) - Success response
  ```typescript
  interface DeleteAccountResponseDTO {
    message: string;
  }
  ```

### Database Types:

- Use `SupabaseClient` type from `src/db/supabase.client.ts`
- No custom command models needed (direct Supabase Auth API usage)

## 4. Response Details

### Success Response (200 OK):

```json
{
  "message": "Account successfully deleted"
}
```

**Response Headers:**

- `Content-Type: application/json`

### Error Responses:

| Status Code | Error Code         | Description                      | Example                                                                                                                                           |
| ----------- | ------------------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 400         | `VALIDATION_ERROR` | Invalid JSON body                | `{"error": {"code": "VALIDATION_ERROR", "message": "Invalid JSON in request body"}}`                                                              |
| 400         | `VALIDATION_ERROR` | Confirmation string mismatch     | `{"error": {"code": "VALIDATION_ERROR", "message": "Invalid request data", "details": {"confirmation": ["Confirmation string must be 'USUŃ'"]}}}` |
| 401         | `UNAUTHORIZED`     | User not authenticated           | `{"error": {"code": "UNAUTHORIZED", "message": "Authentication required"}}`                                                                       |
| 500         | `INTERNAL_ERROR`   | Unexpected error during deletion | `{"error": {"code": "INTERNAL_ERROR", "message": "An unexpected error occurred"}}`                                                                |

## 5. Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Client sends DELETE /api/account                             │
│    Body: { "confirmation": "USUŃ" }                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. API Route Handler (/src/pages/api/account.ts)                │
│    - Parse and validate JSON body                               │
│    - Validate with Zod schema                                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Authentication Check                                          │
│    - Extract session via context.locals.supabase.auth.getUser() │
│    - Return 401 if not authenticated                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Account Service (NEW: /src/lib/services/account.service.ts)  │
│    - Call Supabase Admin API to delete user                     │
│    - Method: supabase.auth.admin.deleteUser(userId)             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. Database CASCADE DELETE (automatic)                          │
│    ┌──────────────────────────────────────────────────────────┐ │
│    │ Auth User Deleted                                        │ │
│    │   ↓                                                      │ │
│    │ profiles (ON DELETE CASCADE from auth.users)             │ │
│    │   ↓                                                      │ │
│    │ decks (ON DELETE CASCADE from profiles.user_id)          │ │
│    │   ↓                                                      │ │
│    │ flashcards (ON DELETE CASCADE from decks.id)             │ │
│    │   ↓                                                      │ │
│    │ generation_events (ON DELETE CASCADE from profiles)      │ │
│    └──────────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. Session Invalidation                                         │
│    - Call supabase.auth.signOut()                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. Return Success Response                                      │
│    - Status: 200 OK                                             │
│    - Body: { "message": "Account successfully deleted" }        │
└─────────────────────────────────────────────────────────────────┘
```

### Service Layer Interaction:

**NEW Service Required**: `AccountService` in `/src/lib/services/account.service.ts`

```typescript
class AccountService {
  async deleteAccount(userId: string): Promise<void>;
}
```

This service will:

1. Call Supabase Admin API: `supabase.auth.admin.deleteUser(userId)`
2. Handle errors from Supabase Auth
3. Throw appropriate errors for the route handler to catch

## 6. Security Considerations

### Authentication & Authorization:

1. **Session Validation**: Verify user is authenticated via `context.locals.supabase.auth.getUser()`
2. **Self-Service Only**: Users can only delete their own account (implicit - userId from session)
3. **No Authorization Check**: No need for ownership validation since users can only access their own account

### Input Validation:

1. **Strict Confirmation**: Require exact match of `"USUŃ"` string
   - Case-sensitive: `"usuń"` should be rejected
   - No partial matches: `"USUŃ "` (with space) should be rejected
   - Prevents accidental deletion via UI bugs or typos

2. **JSON Parsing**: Validate request body is valid JSON
3. **Zod Schema**: Enforce schema validation with detailed error messages

### Data Protection:

1. **GDPR Compliance**: Complete data deletion via cascade constraints
2. **No Soft Delete**: Hard delete from database (irreversible)
3. **Session Invalidation**: Prevent further API access after deletion
4. **Audit Trail**: Consider logging deletion events (optional, not in spec)

### IDOR Prevention:

- Not applicable - users can only delete their own account
- No resource ID in URL to manipulate

## 7. Error Handling

### Error Scenarios:

| Scenario                     | Detection                      | HTTP Status | Error Code         | Handler Location         |
| ---------------------------- | ------------------------------ | ----------- | ------------------ | ------------------------ |
| Invalid JSON                 | `JSON.parse()` throws          | 400         | `VALIDATION_ERROR` | API Route (try/catch)    |
| Missing confirmation         | Zod validation fails           | 400         | `VALIDATION_ERROR` | API Route (Zod error)    |
| Wrong confirmation string    | Zod `.refine()` fails          | 400         | `VALIDATION_ERROR` | API Route (Zod error)    |
| Not authenticated            | `getUser()` returns error/null | 401         | `UNAUTHORIZED`     | API Route (guard clause) |
| Supabase Auth deletion fails | Service throws error           | 500         | `INTERNAL_ERROR`   | API Route (catch block)  |
| Session invalidation fails   | `signOut()` throws             | 500         | `INTERNAL_ERROR`   | API Route (catch block)  |

### Error Response Format:

All errors follow the `ErrorResponseDTO` structure from [src/types.ts:82-89](src/types.ts#L82-L89):

```typescript
{
  error: {
    code: string,
    message: string,
    details?: Record<string, unknown>
  }
}
```

### Logging Strategy:

- **Successful Deletions**: Log user ID and timestamp (for audit trail)
- **Failed Deletions**: Log error details with context (use `console.error`)
- **Authentication Failures**: Log attempt (potential security monitoring)

Example logging:

```typescript
console.error("Error in DELETE /api/account:", {
  error: error instanceof Error ? error.message : "Unknown error",
  userId: user?.id,
  timestamp: new Date().toISOString(),
});
```

## 8. Performance Considerations

### Database Operations:

1. **Cascade Delete Performance**:
   - Database handles cascade deletion automatically
   - Single `deleteUser()` call triggers all cascades
   - Expected tables affected: auth.users, profiles, decks, flashcards, generation_events
   - For users with large amounts of data (1000+ flashcards), deletion may take 1-2 seconds

2. **Transaction Safety**:
   - Supabase Auth API handles deletion in a transaction
   - Either all data is deleted, or none (atomic operation)
   - No partial deletions possible

### API Response Time:

- **Expected latency**: 500ms - 2s depending on data volume
- **Timeout consideration**: Set reasonable timeout (5-10s) for large accounts
- **No pagination needed**: Single operation, not a list endpoint

### Optimization Strategies:

1. **Pre-flight Validation**: Validate confirmation string before hitting database
2. **Parallel Operations**: Session invalidation can happen in parallel with success response
3. **Database Indexes**: Ensure CASCADE DELETE paths have proper indexes (already handled by foreign keys)

### Potential Bottlenecks:

- Large number of flashcards (10,000+) could slow cascade deletion
- Multiple foreign key constraints to check during cascade
- No immediate mitigation needed - this is a rare operation (account deletion)

## 9. Implementation Steps

### Step 1: Create Account Service

**File**: `/src/lib/services/account.service.ts`

```typescript
/**
 * Account Service
 *
 * Handles account deletion operations.
 * Interacts with Supabase Auth Admin API for user deletion.
 *
 * @module AccountService
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";

/**
 * Custom error for account deletion failures
 */
export class AccountDeletionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AccountDeletionError";
  }
}

/**
 * Service for managing account operations.
 *
 * Responsibilities:
 * - Delete user accounts via Supabase Auth Admin API
 * - Handle cascade deletion of all user data
 */
export class AccountService {
  /**
   * Creates a new AccountService instance
   *
   * @param supabase - Authenticated Supabase client instance
   */
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Deletes a user account and all associated data.
   *
   * Flow:
   * 1. Call Supabase Auth Admin API to delete user
   * 2. Database cascades deletion to all related tables
   * 3. Throw AccountDeletionError if deletion fails
   *
   * Cascade order (automatic via database constraints):
   * - auth.users (Supabase Auth)
   * - profiles (ON DELETE CASCADE)
   * - decks (ON DELETE CASCADE from profiles)
   * - flashcards (ON DELETE CASCADE from decks)
   * - generation_events (ON DELETE CASCADE from profiles)
   *
   * @param userId - UUID of the user to delete
   * @returns Promise that resolves when deletion is complete
   * @throws {AccountDeletionError} If user deletion fails
   */
  async deleteAccount(userId: string): Promise<void> {
    const { error } = await this.supabase.auth.admin.deleteUser(userId);

    if (error) {
      throw new AccountDeletionError(`Failed to delete user account: ${error.message}`);
    }
  }
}
```

**Rationale:**

- Follows existing service pattern (see `DeckService`, `ProfileService`)
- Encapsulates Supabase Auth Admin API interaction
- Custom error class for specific error handling in route
- Well-documented with cascade deletion flow

---

### Step 2: Create API Route Handler

**File**: `/src/pages/api/account.ts`

```typescript
import type { APIRoute } from "astro";
import { z } from "zod";
import { AccountService, AccountDeletionError } from "@/lib/services/account.service";
import { errorResponse, successResponse } from "@/lib/utils/api-response";
import type { DeleteAccountRequestDTO, DeleteAccountResponseDTO } from "@/types";

// Disable static prerendering (SSR only)
export const prerender = false;

// Zod schema for request body validation
const deleteAccountSchema = z.object({
  confirmation: z.string().refine((val) => val === "USUŃ", {
    message: "Confirmation string must be 'USUŃ'",
  }),
});

/**
 * DELETE /api/account
 *
 * Deletes user account and all associated data (GDPR compliance).
 * Requires explicit confirmation string to prevent accidental deletion.
 *
 * Flow:
 * 1. Parse and validate request body
 * 2. Authenticate user
 * 3. Delete user via AccountService (triggers cascade deletion)
 * 4. Invalidate session
 * 5. Return success response
 *
 * Cascade deletion order (automatic via database constraints):
 * - auth.users → profiles → decks → flashcards
 * - auth.users → profiles → generation_events
 *
 * @returns 200 OK with success message
 * @throws 400 if confirmation string invalid or missing
 * @throws 401 if user not authenticated
 * @throws 500 if deletion or session invalidation fails
 */
export const DELETE: APIRoute = async (context) => {
  try {
    // Step 1: Parse and validate request body
    let requestBody: unknown;
    try {
      requestBody = await context.request.json();
    } catch {
      return errorResponse("VALIDATION_ERROR", "Invalid JSON in request body", 400);
    }

    let validatedData: DeleteAccountRequestDTO;
    try {
      validatedData = deleteAccountSchema.parse(requestBody);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return errorResponse("VALIDATION_ERROR", "Invalid request data", 400, error.flatten().fieldErrors);
      }
      throw error;
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

    // Step 3: Delete user account via service
    const accountService = new AccountService(context.locals.supabase);
    await accountService.deleteAccount(user.id);

    // Step 4: Invalidate session
    await context.locals.supabase.auth.signOut();

    // Step 5: Return success response
    const response: DeleteAccountResponseDTO = {
      message: "Account successfully deleted",
    };
    return successResponse(response, 200);
  } catch (error) {
    // Handle AccountDeletionError
    if (error instanceof AccountDeletionError) {
      // eslint-disable-next-line no-console
      console.error("Account deletion failed:", {
        error: error.message,
        timestamp: new Date().toISOString(),
      });
      return errorResponse("INTERNAL_ERROR", "Failed to delete account", 500);
    }

    // Log and handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("Error in DELETE /api/account:", {
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
};
```

**Rationale:**

- Follows existing API route pattern from `src/pages/api/decks/[deckId].ts`
- Guard clauses for early error returns
- Proper Zod validation with detailed error messages
- Session invalidation after successful deletion
- Comprehensive error handling and logging
- Follows clean code principles from CLAUDE.md

---

### Step 3: Verify Database Cascade Constraints

**Action**: Confirm that the database has proper CASCADE DELETE constraints.

**Expected Database Schema** (should already exist):

```sql
-- profiles table
ALTER TABLE profiles
  ADD CONSTRAINT profiles_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- decks table
ALTER TABLE decks
  ADD CONSTRAINT decks_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES profiles(user_id)
  ON DELETE CASCADE;

-- flashcards table
ALTER TABLE flashcards
  ADD CONSTRAINT flashcards_deck_id_fkey
  FOREIGN KEY (deck_id)
  REFERENCES decks(id)
  ON DELETE CASCADE;

-- generation_events table
ALTER TABLE generation_events
  ADD CONSTRAINT generation_events_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES profiles(user_id)
  ON DELETE CASCADE;
```

**Verification Steps**:

1. Check existing migrations in `supabase/migrations/`
2. Verify constraints exist with:
   ```sql
   SELECT
     tc.table_name,
     tc.constraint_name,
     rc.delete_rule
   FROM information_schema.table_constraints tc
   JOIN information_schema.referential_constraints rc
     ON tc.constraint_name = rc.constraint_name
   WHERE tc.constraint_type = 'FOREIGN KEY'
     AND rc.delete_rule = 'CASCADE';
   ```
3. If constraints missing, create migration to add them

---

### Step 4: Add Types (Already Complete)

**Status**: ✅ Types already exist in `/src/types.ts`

No action needed - `DeleteAccountRequestDTO` and `DeleteAccountResponseDTO` are already defined.

---

### Step 5: Test the Implementation

**Manual Testing Checklist**:

1. **Valid Deletion**:

   ```bash
   curl -X DELETE http://localhost:3000/api/account \
     -H "Content-Type: application/json" \
     -H "Cookie: sb-access-token=<token>" \
     -d '{"confirmation": "USUŃ"}'

   # Expected: 200 OK with success message
   # Verify: User deleted from auth.users, all related data deleted
   ```

2. **Invalid Confirmation String**:

   ```bash
   curl -X DELETE http://localhost:3000/api/account \
     -H "Content-Type: application/json" \
     -H "Cookie: sb-access-token=<token>" \
     -d '{"confirmation": "DELETE"}'

   # Expected: 400 Bad Request with validation error
   ```

3. **Missing Confirmation**:

   ```bash
   curl -X DELETE http://localhost:3000/api/account \
     -H "Content-Type: application/json" \
     -H "Cookie: sb-access-token=<token>" \
     -d '{}'

   # Expected: 400 Bad Request with validation error
   ```

4. **Unauthenticated Request**:

   ```bash
   curl -X DELETE http://localhost:3000/api/account \
     -H "Content-Type: application/json" \
     -d '{"confirmation": "USUŃ"}'

   # Expected: 401 Unauthorized
   ```

5. **Invalid JSON**:

   ```bash
   curl -X DELETE http://localhost:3000/api/account \
     -H "Content-Type: application/json" \
     -H "Cookie: sb-access-token=<token>" \
     -d 'invalid json'

   # Expected: 400 Bad Request with JSON parse error
   ```

6. **Case Sensitivity**:

   ```bash
   curl -X DELETE http://localhost:3000/api/account \
     -H "Content-Type: application/json" \
     -H "Cookie: sb-access-token=<token>" \
     -d '{"confirmation": "usuń"}'

   # Expected: 400 Bad Request (case mismatch)
   ```

**Database Verification**:
After successful deletion, verify cascade:

```sql
-- All should return 0 rows for deleted user
SELECT COUNT(*) FROM profiles WHERE user_id = '<deleted-user-id>';
SELECT COUNT(*) FROM decks WHERE user_id = '<deleted-user-id>';
SELECT COUNT(*) FROM flashcards WHERE deck_id IN (
  SELECT id FROM decks WHERE user_id = '<deleted-user-id>'
);
SELECT COUNT(*) FROM generation_events WHERE user_id = '<deleted-user-id>';
```

---

### Step 6: Code Quality Checks

1. **Linting**:

   ```bash
   npm run lint
   ```

   - Ensure no ESLint errors
   - Fix any auto-fixable issues with `npm run lint:fix`

2. **Type Checking**:

   ```bash
   npx tsc --noEmit
   ```

   - Verify no TypeScript errors

3. **Format Code**:

   ```bash
   npm run format
   ```

   - Apply Prettier formatting

4. **Pre-commit Hook**:
   - Husky will run lint-staged on commit
   - Ensure all checks pass before committing

---

### Step 7: Documentation

1. **API Documentation**: Update API docs (if exists) with:
   - Endpoint description
   - Request/response examples
   - Error scenarios
   - GDPR compliance note

2. **Code Comments**: Ensure all code is well-documented:
   - JSDoc comments for service methods
   - Inline comments for complex logic
   - Error handling rationale

3. **CHANGELOG**: Add entry (if applicable):
   ```markdown
   ### Added

   - DELETE /api/account endpoint for GDPR-compliant account deletion
   ```

---

### Step 8: Security Review

**Checklist**:

- ✅ Authentication required for all requests
- ✅ Authorization implicit (users only delete own account)
- ✅ Input validation with Zod schema
- ✅ Confirmation string prevents accidental deletion
- ✅ Session invalidation after deletion
- ✅ No sensitive data in error messages
- ✅ Cascade deletion handles all user data
- ✅ No IDOR vulnerability (no resource IDs in URL)

---

### Step 9: Deployment Preparation

1. **Environment Variables**: Verify required vars are set:
   - `SUPABASE_URL`
   - `SUPABASE_KEY` (must have admin privileges for `auth.admin.deleteUser()`)

2. **Database Migrations**: Ensure all migrations applied in production

3. **Build Test**:

   ```bash
   npm run build
   ```

   - Verify build succeeds

4. **Preview Production Build**:
   ```bash
   npm run preview
   ```

   - Test endpoint in production-like environment

---

## Summary

This implementation plan provides a comprehensive guide for implementing the `DELETE /api/account` endpoint with:

- **GDPR Compliance**: Complete data deletion via cascade constraints
- **Security**: Authentication, strict validation, confirmation requirement
- **Error Handling**: Comprehensive error scenarios with proper status codes
- **Code Quality**: Follows existing patterns, well-documented, linted
- **Testing**: Manual test cases and database verification
- **Performance**: Efficient cascade deletion, atomic operations

The implementation follows the project's architecture guidelines from CLAUDE.md and maintains consistency with existing endpoints like `DELETE /api/decks/[deckId]`.
