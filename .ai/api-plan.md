# REST API Plan - Flashcards AI

## 1. Resources

| Resource | Database Table | Description |
|----------|---------------|-------------|
| Profile | `profiles` | User profile with AI generation limits |
| Deck | `decks` | Flashcard deck/collection |
| Flashcard | `flashcards` | Individual flashcard with FSRS parameters |
| Generation | `generation_events` | AI generation session and events |

## 2. Endpoints

### 2.1 Profile

#### GET /api/profile

Get current user's profile with AI limit information.

**Response (200):**
```json
{
  "user_id": "uuid",
  "monthly_ai_flashcards_count": 45,
  "ai_limit_reset_date": "2024-12-01",
  "remaining_ai_limit": 155,
  "created_at": "2024-11-15T10:30:00Z",
  "updated_at": "2024-12-05T14:20:00Z"
}
```

**Errors:**
- `401 Unauthorized` - User not authenticated
- `404 Not Found` - Profile not found

---

### 2.2 Decks

#### GET /api/decks

List all decks for the authenticated user with metadata.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | integer | 20 | Max items per page (1-100) |
| offset | integer | 0 | Number of items to skip |
| sort | string | "created_at" | Sort field: `created_at`, `name`, `updated_at` |
| order | string | "desc" | Sort order: `asc`, `desc` |

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Biology 101",
      "created_at": "2024-12-01T10:00:00Z",
      "updated_at": "2024-12-05T14:00:00Z",
      "total_flashcards": 50,
      "due_flashcards": 12
    }
  ],
  "pagination": {
    "total": 5,
    "limit": 20,
    "offset": 0,
    "has_more": false
  }
}
```

**Errors:**
- `401 Unauthorized` - User not authenticated
- `400 Bad Request` - Invalid query parameters

---

#### POST /api/decks

Create a new deck.

**Request:**
```json
{
  "name": "Biology 101"
}
```

**Validation:**
- `name`: required, string, 1-100 characters

**Response (201):**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "name": "Biology 101",
  "created_at": "2024-12-10T10:00:00Z",
  "updated_at": "2024-12-10T10:00:00Z"
}
```

**Errors:**
- `401 Unauthorized` - User not authenticated
- `400 Bad Request` - Validation error (name empty, too long)
- `409 Conflict` - Deck with this name already exists for user

---

#### GET /api/decks/{deckId}

Get a specific deck with metadata.

**Response (200):**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "name": "Biology 101",
  "created_at": "2024-12-01T10:00:00Z",
  "updated_at": "2024-12-05T14:00:00Z",
  "total_flashcards": 50,
  "due_flashcards": 12
}
```

**Errors:**
- `401 Unauthorized` - User not authenticated
- `404 Not Found` - Deck not found or not owned by user

---

#### PATCH /api/decks/{deckId}

Update a deck's name.

**Request:**
```json
{
  "name": "Advanced Biology"
}
```

**Validation:**
- `name`: required, string, 1-100 characters

**Response (200):**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "name": "Advanced Biology",
  "created_at": "2024-12-01T10:00:00Z",
  "updated_at": "2024-12-10T15:00:00Z"
}
```

**Errors:**
- `401 Unauthorized` - User not authenticated
- `400 Bad Request` - Validation error
- `404 Not Found` - Deck not found or not owned by user
- `409 Conflict` - Deck with this name already exists for user

---

#### DELETE /api/decks/{deckId}

Delete a deck and all its flashcards (cascade delete).

**Response (204):** No content

**Errors:**
- `400 Bad Request` - Invalid deck ID format (not a valid UUID)
- `401 Unauthorized` - User not authenticated
- `404 Not Found` - Deck not found or not owned by user
- `500 Internal Server Error` - Unexpected server error

**Security Notes:**
- Returns 404 for both non-existent decks AND decks not owned by user (IDOR protection)
- Never returns 403 Forbidden to avoid information disclosure

---

### 2.3 Flashcards

#### GET /api/flashcards

List flashcards with optional filtering.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| deck_id | uuid | - | Filter by deck (optional) |
| limit | integer | 20 | Max items per page (1-100) |
| offset | integer | 0 | Number of items to skip |
| sort | string | "created_at" | Sort field: `created_at`, `next_review`, `updated_at` |
| order | string | "desc" | Sort order: `asc`, `desc` |

**Response (200):**
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

**Errors:**
- `401 Unauthorized` - User not authenticated
- `400 Bad Request` - Invalid query parameters
- `404 Not Found` - Deck not found (if deck_id provided)

---

#### POST /api/flashcards

Create a new flashcard (manual or from AI generation).

**Request:**
```json
{
  "deck_id": "uuid",
  "front": "What is mitochondria?",
  "back": "The powerhouse of the cell",
  "source": "manual",
  "generation_id": null
}
```

**For AI-generated flashcards:**
```json
{
  "deck_id": "uuid",
  "front": "What is mitochondria?",
  "back": "The powerhouse of the cell",
  "source": "ai",
  "generation_id": "uuid",
  "was_edited": false
}
```

**Validation:**
- `deck_id`: required, valid UUID, must belong to user
- `front`: required, string, 1-200 characters
- `back`: required, string, 1-500 characters
- `source`: required, enum: `ai`, `manual`
- `generation_id`: required if source is `ai`, valid UUID
- `was_edited`: optional, boolean (default: false)

**Response (201):**
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

**Side Effects:**
- If `source` is `ai`: Creates `ACCEPTED` or `EDITED` event in `generation_events`

**Errors:**
- `401 Unauthorized` - User not authenticated
- `400 Bad Request` - Validation error
- `404 Not Found` - Deck not found or not owned by user

---

#### GET /api/flashcards/{flashcardId}

Get a specific flashcard.

**Response (200):**
```json
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
```

**Errors:**
- `401 Unauthorized` - User not authenticated
- `404 Not Found` - Flashcard not found or not owned by user

---

#### PATCH /api/flashcards/{flashcardId}

Update a flashcard's content.

**Request:**
```json
{
  "front": "Updated question",
  "back": "Updated answer"
}
```

**Validation:**
- `front`: optional, string, 1-200 characters
- `back`: optional, string, 1-500 characters
- At least one field must be provided

**Response (200):**
```json
{
  "id": "uuid",
  "deck_id": "uuid",
  "front": "Updated question",
  "back": "Updated answer",
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
  "updated_at": "2024-12-10T15:00:00Z"
}
```

**Note:** Editing flashcard content does NOT reset FSRS parameters.

**Errors:**
- `401 Unauthorized` - User not authenticated
- `400 Bad Request` - Validation error
- `404 Not Found` - Flashcard not found or not owned by user

---

#### DELETE /api/flashcards/{flashcardId}

Delete a flashcard.

**Response (204):** No content

**Side Effects:**
- Related `generation_events.flashcard_id` set to NULL (preserves analytics)

**Errors:**
- `401 Unauthorized` - User not authenticated
- `404 Not Found` - Flashcard not found or not owned by user

---

### 2.4 AI Generation

#### POST /api/generations

Generate flashcard drafts from source text using AI.

**Request:**
```json
{
  "source_text": "Long text content to generate flashcards from...",
  "deck_id": "uuid"
}
```

**Validation:**
- `source_text`: required, string, 1-5000 characters
- `deck_id`: required, valid UUID, must belong to user

**Response (200):**
```json
{
  "generation_id": "uuid",
  "drafts": [
    {
      "index": 0,
      "front": "What is the main topic?",
      "back": "The main topic is..."
    },
    {
      "index": 1,
      "front": "Define term X",
      "back": "Term X means..."
    }
  ],
  "generated_count": 15,
  "remaining_ai_limit": 140
}
```

**Business Logic:**
1. Check monthly AI limit (200 flashcards/month)
2. Reset limit if `ai_limit_reset_date < start_of_current_month`
3. Generate up to 20 flashcard drafts via OpenRouter API
4. Increment `monthly_ai_flashcards_count` by generated count
5. Create `GENERATED` events for each draft (flashcard_id = NULL)
6. Return drafts with generation_id for subsequent accept/reject

**Note:** Drafts are NOT saved to database. Only accepted drafts become flashcards.

**Errors:**
- `401 Unauthorized` - User not authenticated
- `400 Bad Request` - Validation error (text too long, deck not found)
- `403 Forbidden` - Monthly AI limit exceeded
- `404 Not Found` - Deck not found or not owned by user
- `503 Service Unavailable` - AI service error (failed generation does not decrement limit)

---

#### POST /api/generations/{generationId}/reject

Log rejection of an AI-generated draft.

**Request:**
```json
{
  "draft_index": 0
}
```

**Validation:**
- `draft_index`: required, integer >= 0

**Response (201):**
```json
{
  "id": "uuid",
  "generation_id": "uuid",
  "event_type": "REJECTED",
  "created_at": "2024-12-10T10:05:00Z"
}
```

**Side Effects:**
- Creates `REJECTED` event in `generation_events` (flashcard_id = NULL)

**Errors:**
- `401 Unauthorized` - User not authenticated
- `400 Bad Request` - Invalid draft_index
- `404 Not Found` - Generation not found or not owned by user

---

### 2.5 Study Session

#### GET /api/study/cards

Get flashcards due for review.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| deck_id | uuid | - | Filter by specific deck (optional) |
| limit | integer | 50 | Max cards to return (1-200) |

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "deck_id": "uuid",
      "deck_name": "Biology 101",
      "front": "What is mitochondria?",
      "back": "The powerhouse of the cell",
      "stability": 2.5,
      "difficulty": 0.3,
      "elapsed_days": 5,
      "scheduled_days": 7,
      "reps": 3,
      "lapses": 0,
      "state": 2,
      "last_review": "2024-12-05T10:00:00Z",
      "next_review": "2024-12-10T08:00:00Z"
    }
  ],
  "total_due": 25,
  "returned_count": 25
}
```

**Business Logic:**
- Returns flashcards where `next_review <= NOW()`
- Sorted by `next_review ASC` (oldest due first)
- If `deck_id` provided, filters to that deck only

**Errors:**
- `401 Unauthorized` - User not authenticated
- `400 Bad Request` - Invalid query parameters
- `404 Not Found` - Deck not found (if deck_id provided)

---

#### GET /api/study/summary

Get study summary for dashboard.

**Response (200):**
```json
{
  "total_due": 25,
  "next_review_date": "2024-12-11T10:00:00Z",
  "decks": [
    {
      "id": "uuid",
      "name": "Biology 101",
      "due_count": 12
    },
    {
      "id": "uuid",
      "name": "Chemistry",
      "due_count": 13
    }
  ]
}
```

**Errors:**
- `401 Unauthorized` - User not authenticated

---

#### POST /api/study/review

Submit a review rating for a flashcard.

**Request:**
```json
{
  "flashcard_id": "uuid",
  "rating": 3
}
```

**Validation:**
- `flashcard_id`: required, valid UUID, must belong to user
- `rating`: required, integer 1-4 (1=Again, 2=Hard, 3=Good, 4=Easy)

**Response (200):**
```json
{
  "flashcard": {
    "id": "uuid",
    "stability": 5.2,
    "difficulty": 0.28,
    "elapsed_days": 0,
    "scheduled_days": 14,
    "reps": 4,
    "lapses": 0,
    "state": 2,
    "last_review": "2024-12-10T10:00:00Z",
    "next_review": "2024-12-24T10:00:00Z"
  },
  "next_intervals": {
    "again": "10m",
    "hard": "1d",
    "good": "14d",
    "easy": "30d"
  }
}
```

**Business Logic:**
1. Fetch current FSRS parameters
2. Calculate new parameters based on rating using FSRS algorithm
3. Update `last_review` to NOW()
4. Calculate and set `next_review` date
5. Return updated flashcard and preview intervals for UI

**Errors:**
- `401 Unauthorized` - User not authenticated
- `400 Bad Request` - Invalid rating value
- `404 Not Found` - Flashcard not found or not owned by user

---

### 2.6 Account Management

#### DELETE /api/account

Delete user account and all associated data (GDPR compliance).

**Request:**
```json
{
  "confirmation": "USUŃ"
}
```

**Validation:**
- `confirmation`: required, must equal "USUŃ" (Polish for "DELETE")

**Response (200):**
```json
{
  "message": "Account successfully deleted"
}
```

**Business Logic:**
1. Verify confirmation string matches
2. Delete user from Supabase Auth (triggers cascade delete via database)
3. Cascade deletes: profiles → decks → flashcards → generation_events
4. Invalidate session

**Errors:**
- `401 Unauthorized` - User not authenticated
- `400 Bad Request` - Confirmation string doesn't match

---

## 3. Authentication and Authorization

### 3.1 Authentication Mechanism

The API uses **Supabase Auth** with two authentication methods:

1. **Google OAuth** (primary)
   - Handled by Supabase Auth UI/SDK on frontend
   - Returns JWT access token

2. **Magic Link** (alternative)
   - Email-based passwordless authentication
   - Handled by Supabase Auth

### 3.2 Request Authentication

All API endpoints require authentication via Bearer token:

```
Authorization: Bearer <supabase_access_token>
```

The middleware (`src/middleware/index.ts`) validates the token and injects the authenticated Supabase client into `context.locals.supabase`.

### 3.3 Authorization via RLS

Row Level Security (RLS) is enabled on all tables:

| Table | Policy |
|-------|--------|
| profiles | Users can only view/update their own profile |
| decks | Users can only CRUD their own decks |
| flashcards | Users can only CRUD flashcards in their own decks |
| generation_events | Users can only view/create their own events |

RLS policies are enforced at database level, ensuring data isolation without explicit checks in application code.

### 3.4 Session Management

- Sessions managed by Supabase Auth
- JWT tokens expire after 1 hour (configurable)
- Refresh tokens handled by Supabase SDK

---

## 4. Validation and Business Logic

### 4.1 Validation Rules

#### Profile
- `monthly_ai_flashcards_count`: >= 0
- Monthly AI limit: 200 flashcards (hardcoded)

#### Deck
| Field | Rules |
|-------|-------|
| name | Required, 1-100 characters, unique per user |

#### Flashcard
| Field | Rules |
|-------|-------|
| front | Required, 1-200 characters |
| back | Required, 1-500 characters |
| source | Required, enum: `ai`, `manual` |
| state | 0-3 (0=new, 1=learning, 2=review, 3=relearning) |

#### AI Generation
| Field | Rules |
|-------|-------|
| source_text | Required, 1-5000 characters |
| deck_id | Required, valid UUID, belongs to user |
| Max drafts per generation | 20 |
| Monthly limit | 200 AI flashcards |

#### Study Review
| Field | Rules |
|-------|-------|
| rating | Required, integer 1-4 |

### 4.2 Business Logic Implementation

#### AI Limit Management (Lazy Reset)
```
On each generation request:
1. Fetch user profile
2. If ai_limit_reset_date < start_of_current_month:
   - Reset monthly_ai_flashcards_count to 0
   - Update ai_limit_reset_date to start_of_current_month
3. Check if remaining_limit >= requested_count
4. Proceed with generation or return 403
```

#### FSRS Algorithm Integration
```
On review submission:
1. Get current flashcard FSRS state
2. Apply FSRS algorithm with rating
3. Calculate new parameters:
   - stability: memory stability
   - difficulty: item difficulty
   - elapsed_days: days since last review
   - scheduled_days: days until next review
   - reps: total review count
   - lapses: failed review count (rating=1)
   - state: card state (new/learning/review/relearning)
4. Set last_review = NOW()
5. Set next_review = NOW() + scheduled_days
6. Save updated flashcard
```

#### Generation Event Logging
```
Event flow:
1. POST /api/generations:
   - Log GENERATED event for each draft (flashcard_id = NULL)

2. POST /api/flashcards with source='ai':
   - Create flashcard
   - Log ACCEPTED or EDITED event (flashcard_id = new flashcard)

3. POST /api/generations/{id}/reject:
   - Log REJECTED event (flashcard_id = NULL)
```

### 4.3 Error Response Format

All errors follow consistent format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable error message",
    "details": {
      "field": "front",
      "constraint": "max_length",
      "value": 200
    }
  }
}
```

**Error Codes:**

*Generic Codes (used across all endpoints):*
| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | Missing or invalid authentication |
| VALIDATION_ERROR | 400 | Request validation failed |
| CONFLICT | 409 | Resource conflict (e.g., duplicate deck name) |
| INTERNAL_ERROR | 500 | Unexpected server error |

*Resource-specific Not Found Codes (404):*
| Code | Description |
|------|-------------|
| PROFILE_NOT_FOUND | User profile not found |
| DECK_NOT_FOUND | Deck not found or access denied |
| FLASHCARD_NOT_FOUND | Flashcard not found or access denied |
| GENERATION_NOT_FOUND | Generation session not found |

*AI Generation Codes:*
| Code | HTTP Status | Description |
|------|-------------|-------------|
| AI_LIMIT_EXCEEDED | 403 | Monthly AI generation limit exceeded |
| AI_SERVICE_ERROR | 503 | AI service (OpenRouter) temporarily unavailable |

**Note:** Resource-specific 404 codes (e.g., `DECK_NOT_FOUND`) are preferred over generic `NOT_FOUND` to help frontend display contextual error messages.

---

## 5. Implementation Notes

### 5.1 File Structure

```
src/
├── pages/api/
│   ├── profile.ts              # GET /api/profile
│   ├── account.ts              # DELETE /api/account
│   ├── decks/
│   │   ├── index.ts            # GET, POST /api/decks
│   │   └── [deckId].ts         # GET, PATCH, DELETE /api/decks/{deckId}
│   ├── flashcards/
│   │   ├── index.ts            # GET, POST /api/flashcards
│   │   └── [flashcardId].ts    # GET, PATCH, DELETE /api/flashcards/{id}
│   ├── generations/
│   │   ├── index.ts            # POST /api/generations
│   │   └── [generationId]/
│   │       └── reject.ts       # POST /api/generations/{id}/reject
│   └── study/
│       ├── cards.ts            # GET /api/study/cards
│       ├── summary.ts          # GET /api/study/summary
│       └── review.ts           # POST /api/study/review
└── lib/services/
    ├── deck.service.ts
    ├── flashcard.service.ts
    ├── generation.service.ts
    ├── study.service.ts
    └── fsrs.service.ts
```

### 5.2 Technology Considerations

- **Astro 5 SSR**: All endpoints use `export const prerender = false`
- **Supabase**: Access via `Astro.locals.supabase` (typed client)
- **Zod**: Request validation schemas in each endpoint
- **OpenRouter**: AI generation via `OPENROUTER_API_KEY` env variable
- **FSRS**: Use ts-fsrs library for spaced repetition calculations

### 5.3 Rate Limiting (Future)

Consider implementing rate limiting for:
- AI generation endpoint: 10 requests/minute per user
- General API: 100 requests/minute per user

---

**Version:** 1.0
**Date:** 2024-12-10
**Status:** Ready for implementation
