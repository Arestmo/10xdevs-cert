# API Documentation: GET /api/profile

## Overview

Retrieves the authenticated user's profile information, including their monthly AI flashcard generation usage and remaining limit. This endpoint implements a "lazy reset" mechanism that automatically resets the monthly AI usage counter when accessed in a new month.

**Base URL**: `/api/profile`
**Method**: `GET`
**Authentication**: Required (JWT token via Supabase Auth)

---

## Request

### Headers

| Header | Type | Required | Description |
|--------|------|----------|-------------|
| `Authorization` | string | Yes | JWT token from Supabase Auth (or session cookies) |

### Query Parameters

None

### Request Body

None (GET request)

---

## Response

### Success Response (200 OK)

Returns the user's profile with computed `remaining_ai_limit` field.

**Content-Type**: `application/json`

**Response Structure**:

```typescript
{
  user_id: string;                    // UUID from Supabase Auth
  monthly_ai_flashcards_count: number; // Number of AI-generated flashcards this month
  ai_limit_reset_date: string;        // ISO date (YYYY-MM-DD) when limit was last reset
  remaining_ai_limit: number;         // Computed: 200 - monthly_ai_flashcards_count
  created_at: string;                 // ISO timestamp of profile creation
  updated_at: string;                 // ISO timestamp of last profile update
}
```

**Example Response**:

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

**Field Descriptions**:

- `user_id`: UUID that matches the authenticated user's ID in Supabase Auth
- `monthly_ai_flashcards_count`: Count of AI-generated flashcards in the current month (resets on 1st of each month)
- `ai_limit_reset_date`: The date when the monthly counter was last reset (automatically updated by lazy reset)
- `remaining_ai_limit`: Calculated field showing how many more AI generations are allowed this month (max 200/month)
- `created_at`: Timestamp when the profile was created (auto-generated on user signup)
- `updated_at`: Timestamp of the last profile modification

---

### Error Responses

All error responses follow the standardized `ErrorResponseDTO` format:

```typescript
{
  error: {
    code: string;           // Machine-readable error code
    message: string;        // Human-readable error message
    details?: object;       // Optional additional context
  }
}
```

#### 401 Unauthorized

**When**: Missing, invalid, or expired JWT token

**Example**:
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required. Please log in."
  }
}
```

**Common Causes**:
- No `Authorization` header or session cookies provided
- JWT token has expired
- Invalid JWT signature
- User session has been revoked

**Resolution**: Re-authenticate the user via Supabase Auth

---

#### 404 Not Found

**When**: User profile doesn't exist in the database

**Example**:
```json
{
  "error": {
    "code": "PROFILE_NOT_FOUND",
    "message": "User profile not found"
  }
}
```

**Common Causes**:
- Profile creation failed during user signup (rare)
- Profile was manually deleted from database
- Database trigger `on_auth_user_created` didn't execute

**Resolution**: This should be extremely rare since profiles are auto-created via database trigger. Contact support if this occurs.

---

#### 500 Internal Server Error

**When**: Unexpected server error occurred

**Example**:
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred. Please try again later."
  }
}
```

**Common Causes**:
- Database connection failure
- Unexpected exception in service layer
- Infrastructure issues

**Resolution**: Retry the request. If the issue persists, check server logs and contact support.

---

## Implementation Details

### Lazy Reset Logic

The endpoint implements a "lazy reset" mechanism for the monthly AI usage counter:

1. **When reset occurs**: When `ai_limit_reset_date` is before the start of the current month
2. **What happens**:
   - `monthly_ai_flashcards_count` is reset to `0`
   - `ai_limit_reset_date` is updated to the 1st of the current month
3. **Why lazy**: Avoids scheduled cron jobs; reset happens automatically when user accesses their profile in a new month

**Example**:
- User last accessed profile on November 25, 2024
- User accesses profile on December 3, 2024
- Endpoint detects `ai_limit_reset_date` (2024-11-01) < December 1, 2024
- Counter resets to 0, date updates to 2024-12-01
- Response shows `remaining_ai_limit: 200`

### Performance Characteristics

- **Database queries**: Single query (primary key lookup by `user_id`)
- **Indexed lookup**: Uses primary key index on `profiles.user_id`
- **Conditional update**: Database UPDATE only occurs when reset is needed
- **Target response time**: < 200ms for authenticated requests

### Security

- **Row Level Security (RLS)**: Enabled on `profiles` table
- **RLS Policies**:
  - SELECT: Users can only view their own profile (`user_id = auth.uid()`)
  - UPDATE: Users can only update their own profile (needed for lazy reset)
- **Authentication**: Enforced via guard clause before any database operations
- **Authorization**: Implicit via RLS - users cannot access other users' profiles

---

## Usage Examples

### Example 1: Successful Request (curl)

```bash
# With Authorization header (Bearer token)
curl -X GET https://your-domain.com/api/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Response:
# {
#   "user_id": "abc123...",
#   "monthly_ai_flashcards_count": 45,
#   "ai_limit_reset_date": "2024-12-01",
#   "remaining_ai_limit": 155,
#   "created_at": "2024-11-15T10:30:00Z",
#   "updated_at": "2024-12-05T14:20:00Z"
# }
```

### Example 2: Unauthenticated Request

```bash
# No Authorization header
curl -X GET https://your-domain.com/api/profile

# Response (401):
# {
#   "error": {
#     "code": "UNAUTHORIZED",
#     "message": "Authentication required. Please log in."
#   }
# }
```

### Example 3: JavaScript/TypeScript (fetch)

```typescript
import { createClient } from '@supabase/supabase-js';
import type { ProfileResponseDTO } from '@/types';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function getProfile(): Promise<ProfileResponseDTO> {
  // Get the current session
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await fetch('/api/profile', {
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message);
  }

  return await response.json();
}

// Usage
getProfile()
  .then(profile => {
    console.log('Remaining AI limit:', profile.remaining_ai_limit);
  })
  .catch(error => {
    console.error('Failed to fetch profile:', error);
  });
```

### Example 4: React Component

```tsx
import { useEffect, useState } from 'react';
import type { ProfileResponseDTO } from '@/types';

export function ProfileDisplay() {
  const [profile, setProfile] = useState<ProfileResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/profile')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch profile');
        return res.json();
      })
      .then(setProfile)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading profile...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!profile) return null;

  return (
    <div>
      <h2>AI Generation Limit</h2>
      <p>Used: {profile.monthly_ai_flashcards_count} / 200</p>
      <p>Remaining: {profile.remaining_ai_limit}</p>
      <p>Resets on: {new Date(profile.ai_limit_reset_date).toLocaleDateString()}</p>
    </div>
  );
}
```

---

## Related Endpoints

- **POST /api/generations**: Generate AI flashcards (increments `monthly_ai_flashcards_count`)
- **GET /api/decks**: List user's flashcard decks
- **POST /api/flashcards**: Create flashcards manually

---

## Changelog

### Version 1.0.0 (2024-12-30)
- Initial implementation
- Lazy reset mechanism for monthly AI limits
- RLS policies for profile security
- Standardized error responses using shared utilities

---

## Technical Notes

### Database Schema

The `profiles` table structure:

```sql
CREATE TABLE profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_ai_flashcards_count integer NOT NULL DEFAULT 0 CHECK (monthly_ai_flashcards_count >= 0),
  ai_limit_reset_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);
```

### Type Definitions

From `src/types.ts`:

```typescript
// Base entity
export type Profile = Tables<"profiles">;

// Response DTO with computed field
export interface ProfileResponseDTO extends Profile {
  remaining_ai_limit: number;
}

// Error response
export interface ErrorResponseDTO {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
```

### Service Layer

Implementation: `src/lib/services/profile.service.ts`

```typescript
export class ProfileService {
  async getProfile(userId: string): Promise<ProfileResponseDTO> {
    // 1. Fetch profile from database
    // 2. Perform lazy reset if needed
    // 3. Calculate remaining_ai_limit
    // 4. Return ProfileResponseDTO
  }
}
```

### Testing Considerations

When testing this endpoint:

1. **Test lazy reset**: Set `ai_limit_reset_date` to previous month and verify counter resets to 0
2. **Test no reset**: Verify counter stays unchanged when `ai_limit_reset_date` is current month
3. **Test authentication**: Verify 401 response for unauthenticated requests
4. **Test authorization**: Verify users can only access their own profile (RLS enforcement)
5. **Test edge cases**: First day of month, last day of month, leap years

---

## Support

For issues or questions:
- **GitHub Issues**: [Repository Issues](https://github.com/your-org/your-repo/issues)
- **Documentation**: See implementation plan at `.ai/profile-endpoint-implementation-plan.md`
- **Type Definitions**: See `src/types.ts` for all DTOs
