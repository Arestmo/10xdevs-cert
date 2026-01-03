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
