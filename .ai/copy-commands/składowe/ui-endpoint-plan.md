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