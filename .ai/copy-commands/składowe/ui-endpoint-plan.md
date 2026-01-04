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