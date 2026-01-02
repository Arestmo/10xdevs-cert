# API Endpoint Implementation Plan: GET /api/profile

## 1. Endpoint Overview

The `GET /api/profile` endpoint retrieves the authenticated user's profile information, including their monthly AI flashcard generation usage and remaining limit. This endpoint is critical for the user dashboard to display AI usage statistics.

**Key Responsibilities:**

- Authenticate the requesting user via JWT
- Retrieve user profile from database
- Perform lazy reset of monthly AI limit if needed
- Calculate remaining AI generation limit
- Return profile data with computed fields

## 2. Request Details

- **HTTP Method**: GET
- **URL Structure**: `/api/profile`
- **Authentication**: Required (JWT token from Supabase Auth)
- **Parameters**:
  - **Required**: None (user ID extracted from JWT token)
  - **Optional**: None
- **Request Body**: None (GET request)
- **Query Parameters**: None

## 3. Utilized Types

All types are defined in `src/types.ts`:

### Response Types

```typescript
// Primary response type (lines 104-106)
interface ProfileResponseDTO extends Profile {
  remaining_ai_limit: number; // Computed field: 200 - monthly_ai_flashcards_count
}

// Base entity (line 35)
type Profile = Tables<"profiles">; // From database.types.ts
```

### Error Types

```typescript
// Standard error response (lines 83-89)
interface ErrorResponseDTO {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
```

### Constants

```typescript
const MONTHLY_LIMIT = 200; // Hardcoded AI generation limit per month
```

## 4. Response Details

### Success Response (200 OK)

```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "monthly_ai_flashcards_count": 45,
  "ai_limit_reset_date": "2024-12-01",
  "remaining_ai_limit": 155,
  "created_at": "2024-11-15T10:30:00Z",
  "updated_at": "2024-12-05T14:20:00Z"
}
```

**Field Descriptions:**

- `user_id` - UUID from Supabase Auth
- `monthly_ai_flashcards_count` - Number of AI-generated flashcards this month
- `ai_limit_reset_date` - Date when the limit was last reset (or will reset)
- `remaining_ai_limit` - Computed: `200 - monthly_ai_flashcards_count` (after lazy reset)
- `created_at` - Profile creation timestamp
- `updated_at` - Last profile update timestamp

### Error Responses

#### 401 Unauthorized

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required. Please log in."
  }
}
```

#### 404 Not Found

```json
{
  "error": {
    "code": "PROFILE_NOT_FOUND",
    "message": "User profile not found"
  }
}
```

#### 500 Internal Server Error

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred. Please try again later."
  }
}
```

## 5. Data Flow

### Sequence Diagram

```
Client → API Route → ProfileService → Supabase Database
  ↓         ↓              ↓                 ↓
  ←────────←──────────────←─────────────────←
```

### Detailed Flow

1. **API Route Handler** (`src/pages/api/profile/index.ts`)
   - Receive GET request
   - Authenticate user via `context.locals.supabase.auth.getUser()`
   - Extract `user.id` from JWT token
   - Call `ProfileService.getProfile(user.id)`
   - Return success response with `ProfileResponseDTO`

2. **ProfileService** (`src/lib/services/profile.service.ts`)
   - Query `profiles` table filtered by `user_id`
   - Check if profile exists (guard clause)
   - Perform lazy reset logic:
     - Compare `ai_limit_reset_date` with start of current month
     - If reset date < start of month → reset counter to 0 and update date
   - Calculate `remaining_ai_limit = 200 - monthly_ai_flashcards_count`
   - Return `ProfileResponseDTO`

3. **Database Interaction** (via Supabase)
   - RLS policies ensure user can only access their own profile
   - Query: `SELECT * FROM profiles WHERE user_id = $1`
   - Optional update for lazy reset

### Lazy Reset Logic

The lazy reset is performed "just-in-time" when the profile is accessed:

```typescript
const now = new Date();
const resetDate = new Date(profile.ai_limit_reset_date);
const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

if (resetDate < startOfMonth) {
  // Reset counter to 0
  // Update ai_limit_reset_date to start of current month
  // Update local profile object
}
```

This approach:

- Avoids scheduled cron jobs
- Ensures reset happens seamlessly
- Maintains consistency with GenerationService

## 6. Security Considerations

### Authentication

- **JWT Verification**: Use `context.locals.supabase.auth.getUser()` to validate JWT token
- **Token Expiry**: Supabase automatically handles token expiration
- **No Token**: Return 401 immediately if authentication fails

### Authorization

- **Implicit Authorization**: User can only access their own profile
- **RLS Enforcement**: Database RLS policies filter by `user_id`
- **No User ID in Request**: User ID comes from authenticated JWT, not from request parameters (prevents privilege escalation)

### Data Protection

- **No Sensitive Data Exposure**: Profile contains only application-level data (not auth credentials)
- **No PII Beyond User ID**: Minimal personal data exposure
- **Read-Only Operation**: GET request doesn't modify data (except lazy reset)

### Input Validation

- **No User Input**: No request body or query parameters to validate
- **Type Safety**: TypeScript ensures type correctness

### SQL Injection Prevention

- **Parameterized Queries**: Supabase client uses prepared statements
- **No Raw SQL**: All queries use Supabase query builder

## 7. Error Handling

### Error Handling Strategy

Follow the guard clause pattern (early returns for errors, happy path last):

```typescript
// Guard clause: authentication failed
if (authError || !user) {
  return errorResponse("UNAUTHORIZED", "Authentication required. Please log in.", 401);
}

// Guard clause: profile not found
if (error || !profile) {
  throw new ProfileNotFoundError();
}

// Happy path: return profile with computed fields
return successResponse(profileResponse, 200);
```

### Error Scenarios

| Scenario                  | Error Type           | Status Code | Error Code        | User Message                                          |
| ------------------------- | -------------------- | ----------- | ----------------- | ----------------------------------------------------- |
| Missing JWT token         | Auth error           | 401         | UNAUTHORIZED      | Authentication required. Please log in.               |
| Invalid/expired token     | Auth error           | 401         | UNAUTHORIZED      | Authentication required. Please log in.               |
| Profile not found         | ProfileNotFoundError | 404         | PROFILE_NOT_FOUND | User profile not found                                |
| Database connection error | Database error       | 500         | INTERNAL_ERROR    | An unexpected error occurred. Please try again later. |
| Unexpected error          | Unknown              | 500         | INTERNAL_ERROR    | An unexpected error occurred. Please try again later. |

### Custom Error Classes

```typescript
/**
 * Custom error: Profile not found
 *
 * Thrown when the user's profile doesn't exist in the database.
 * This should be rare since profiles are auto-created on signup.
 */
export class ProfileNotFoundError extends Error {
  constructor() {
    super("User profile not found");
    this.name = "ProfileNotFoundError";
  }
}
```

### Error Logging

- **Console Errors**: Log unexpected errors with `console.error()`
- **No User Data in Logs**: Avoid logging sensitive user information
- **Stack Traces**: Include stack traces for debugging

```typescript
console.error("Unexpected error in GET /api/profile:", error);
```

## 8. Performance Considerations

### Database Optimization

- **Single Query**: Fetch profile with single database query
- **Indexed Lookup**: `user_id` is primary key (indexed by default)
- **No Joins**: Profile table is standalone (no complex joins needed)
- **RLS Performance**: Ensure RLS policies are optimized with proper indexes

### Caching Opportunities

- **Client-Side Caching**: Frontend can cache profile data
- **Short TTL**: Cache for ~5 minutes (balance freshness vs performance)
- **Invalidation**: Invalidate cache after AI generation or profile updates

### Lazy Reset Performance

- **In-Memory Calculation**: Date comparison is fast
- **Conditional Update**: Only update database if reset needed
- **Transaction Safety**: Use atomic update if implementing concurrent access protection

### Response Time Targets

- **Target**: < 200ms for authenticated request
- **Database Query**: < 50ms (indexed primary key lookup)
- **Authentication**: < 100ms (JWT verification)
- **Computation**: < 10ms (date math + subtraction)

## 9. Implementation Steps

### Step 1: Create ProfileService

**File**: `src/lib/services/profile.service.ts`

Tasks:

1. Import dependencies:
   - `SupabaseClient` type from `@supabase/supabase-js`
   - `Database` type from `@/db/database.types`
   - `Profile`, `ProfileResponseDTO` from `@/types`
2. Define `MONTHLY_LIMIT = 200` constant
3. Create `ProfileService` class:
   - Constructor accepting `SupabaseClient<Database>`
   - Method: `getProfile(userId: string): Promise<ProfileResponseDTO>`
4. Implement lazy reset logic (similar to GenerationService):
   - Compare `ai_limit_reset_date` with start of current month
   - Update profile if reset needed
5. Calculate `remaining_ai_limit = 200 - monthly_ai_flashcards_count`
6. Return `ProfileResponseDTO` with all fields
7. Create `ProfileNotFoundError` custom error class

**Example Structure**:

```typescript
export class ProfileService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async getProfile(userId: string): Promise<ProfileResponseDTO> {
    // 1. Fetch profile from database
    // 2. Guard clause: profile not found
    // 3. Perform lazy reset if needed
    // 4. Calculate remaining limit
    // 5. Return ProfileResponseDTO
  }

  private async performLazyReset(profile: Profile): Promise<Profile> {
    // Date comparison and conditional update
  }
}

export class ProfileNotFoundError extends Error {
  constructor() {
    super("User profile not found");
    this.name = "ProfileNotFoundError";
  }
}
```

### Step 2: Create API Route Handler

**File**: `src/pages/api/profile/index.ts`

Tasks:

1. Add `export const prerender = false` directive
2. Import dependencies:
   - `APIContext` from `astro`
   - `ProfileService`, `ProfileNotFoundError` from service
   - `errorResponse`, `successResponse` from utils
   - `ProfileResponseDTO` from types
3. Export `GET` function (uppercase, following Astro conventions)
4. Implement GET handler:

   ```typescript
   export async function GET(context: APIContext): Promise<Response> {
     try {
       // Step 1: Authenticate user
       const {
         data: { user },
         error: authError,
       } = await context.locals.supabase.auth.getUser();

       // Guard clause: authentication failed
       if (authError || !user) {
         return errorResponse("UNAUTHORIZED", "Authentication required. Please log in.", 401);
       }

       // Step 2: Call service layer
       const service = new ProfileService(context.locals.supabase);
       const profile = await service.getProfile(user.id);

       // Step 3: Return success response
       return successResponse(profile, 200);
     } catch (error) {
       // Handle ProfileNotFoundError
       // Handle unexpected errors
     }
   }
   ```

### Step 3: Add JSDoc Comments

Add comprehensive documentation to both service and route handler:

1. **Service method documentation**:
   - Method purpose
   - Flow description
   - Parameters and return type
   - Throws clauses

2. **Route handler documentation**:
   - Endpoint description
   - Response codes
   - Example responses

Follow the pattern from `generation.service.ts` and `generations/index.ts`.

### Step 4: Test Authentication Flow

Manual testing checklist:

1. **Authenticated Request**:
   - Send GET request with valid JWT token
   - Verify 200 response with correct ProfileResponseDTO structure
   - Verify `remaining_ai_limit` calculation is correct

2. **Unauthenticated Request**:
   - Send GET request without JWT token
   - Verify 401 response with appropriate error message

3. **Profile Not Found**:
   - Manually test with user that has no profile (rare scenario)
   - Verify 404 response

### Step 5: Test Lazy Reset Logic

Test scenarios:

1. **No Reset Needed**:
   - Profile with `ai_limit_reset_date` = start of current month
   - Verify counter is NOT reset
   - Verify `remaining_ai_limit` reflects current count

2. **Reset Needed**:
   - Profile with `ai_limit_reset_date` in previous month
   - Verify counter is reset to 0
   - Verify `ai_limit_reset_date` is updated to current month
   - Verify `remaining_ai_limit = 200`

3. **Edge Cases**:
   - Test on first day of month
   - Test on last day of month
   - Test with different timezones (use UTC consistently)

### Step 6: Verify RLS Policies

Database security checklist:

1. Ensure RLS policy exists on `profiles` table:

   ```sql
   -- User can only read their own profile
   CREATE POLICY "Users can view own profile"
     ON profiles FOR SELECT
     USING (auth.uid() = user_id);

   -- Service can update for lazy reset
   CREATE POLICY "Users can update own profile"
     ON profiles FOR UPDATE
     USING (auth.uid() = user_id);
   ```

2. Test RLS enforcement:
   - Verify users cannot access other users' profiles
   - Verify unauthenticated requests are blocked

### Step 7: Integration Testing

End-to-end testing:

1. **Normal Flow**:
   - Authenticate user
   - Call GET /api/profile
   - Verify response structure matches ProfileResponseDTO
   - Verify all fields are present and correctly typed

2. **With AI Usage**:
   - Generate flashcards via POST /api/generations
   - Call GET /api/profile
   - Verify `monthly_ai_flashcards_count` increased
   - Verify `remaining_ai_limit` decreased

3. **Cross-Month Boundary**:
   - Set `ai_limit_reset_date` to previous month (via database)
   - Call GET /api/profile
   - Verify counter reset to 0
   - Verify date updated to current month

### Step 8: Error Handling Testing

Error scenario testing:

1. **401 Unauthorized**:
   - Missing Authorization header
   - Invalid JWT token
   - Expired JWT token

2. **404 Not Found**:
   - User with no profile (edge case)

3. **500 Internal Server Error**:
   - Database connection failure (simulate)
   - Unexpected service errors

### Step 9: Performance Testing

Performance validation:

1. **Response Time**:
   - Measure average response time
   - Target: < 200ms for authenticated requests
   - Test with multiple concurrent requests

2. **Database Query Performance**:
   - Verify single query execution
   - Check query plan (should use primary key index)

3. **Load Testing**:
   - Test with 100+ concurrent requests
   - Verify no performance degradation

### Step 10: Documentation

Documentation tasks:

1. **API Documentation**:
   - Add endpoint to API documentation
   - Include request/response examples
   - Document error codes

2. **Code Comments**:
   - Ensure all JSDoc comments are complete
   - Add inline comments for complex logic

3. **README Updates**:
   - Add endpoint to API reference (if applicable)
   - Update architecture documentation

## 10. Acceptance Criteria

The implementation is complete when:

- ✅ `ProfileService` is created with proper error handling
- ✅ Lazy reset logic is implemented and tested
- ✅ API route handler returns correct status codes
- ✅ Authentication is properly enforced
- ✅ RLS policies protect profile data
- ✅ `remaining_ai_limit` is calculated correctly
- ✅ All error scenarios return appropriate responses
- ✅ Response matches `ProfileResponseDTO` type
- ✅ Response time is < 200ms
- ✅ Code follows project conventions (guard clauses, early returns)
- ✅ JSDoc comments are comprehensive
- ✅ Integration tests pass
- ✅ No TypeScript errors or warnings

## 11. Future Enhancements

Potential improvements (out of scope for initial implementation):

1. **Caching Layer**:
   - Implement Redis cache for profile data
   - Cache invalidation on profile updates

2. **Rate Limiting**:
   - Add rate limiting to prevent abuse
   - Use Supabase Edge Functions or middleware

3. **Monitoring**:
   - Add metrics for endpoint performance
   - Track error rates and response times

4. **Extended Profile Data**:
   - Add user preferences
   - Add study statistics
   - Add learning goals

5. **Batch Updates**:
   - Optimize lazy reset with scheduled batch job
   - Reduce per-request database writes
