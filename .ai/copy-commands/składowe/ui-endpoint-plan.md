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