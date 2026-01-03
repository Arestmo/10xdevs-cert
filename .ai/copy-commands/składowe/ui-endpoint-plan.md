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