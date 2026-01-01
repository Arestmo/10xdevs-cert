# Manual Testing Guide: POST /api/flashcards

## Prerequisites

1. Start the dev server: `npm run dev`
2. Have an authenticated user session
3. Have at least one deck created for the user
4. Have a valid generation_id from a previous AI generation (for AI tests)

## Test Scenarios

### ✅ Scenario 1: Manual Flashcard Creation (Happy Path)

**Request:**
```bash
curl -X POST http://localhost:3000/api/flashcards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{
    "deck_id": "YOUR_DECK_UUID",
    "front": "What is mitochondria?",
    "back": "The powerhouse of the cell",
    "source": "manual",
    "generation_id": null
  }'
```

**Expected Response:** `201 Created`
```json
{
  "id": "uuid",
  "deck_id": "YOUR_DECK_UUID",
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

**Verify:**
- Flashcard created in database
- No generation_event logged
- `next_review` is approximately now (within 1 second)
- All FSRS parameters are 0 or null

---

### ✅ Scenario 2: AI Flashcard Acceptance (Not Edited)

**Request:**
```bash
curl -X POST http://localhost:3000/api/flashcards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{
    "deck_id": "YOUR_DECK_UUID",
    "front": "What is photosynthesis?",
    "back": "Process by which plants convert light into energy",
    "source": "ai",
    "generation_id": "VALID_GENERATION_UUID",
    "was_edited": false
  }'
```

**Expected Response:** `201 Created`
(Same structure as Scenario 1)

**Verify:**
- Flashcard created in database
- Generation event logged with:
  - `event_type`: "ACCEPTED"
  - `generation_id`: matches request
  - `flashcard_id`: matches created flashcard
  - `user_id`: matches authenticated user

---

### ✅ Scenario 3: AI Flashcard Acceptance (Edited)

**Request:**
```bash
curl -X POST http://localhost:3000/api/flashcards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{
    "deck_id": "YOUR_DECK_UUID",
    "front": "What is photosynthesis?",
    "back": "Process by which plants convert light energy into chemical energy (ATP and glucose)",
    "source": "ai",
    "generation_id": "VALID_GENERATION_UUID",
    "was_edited": true
  }'
```

**Expected Response:** `201 Created`

**Verify:**
- Flashcard created in database
- Generation event logged with:
  - `event_type`: "EDITED"
  - Other fields same as Scenario 2

---

### ❌ Scenario 4: Unauthenticated Request

**Request:**
```bash
curl -X POST http://localhost:3000/api/flashcards \
  -H "Content-Type: application/json" \
  -d '{
    "deck_id": "YOUR_DECK_UUID",
    "front": "Test",
    "back": "Test",
    "source": "manual"
  }'
```

**Expected Response:** `401 Unauthorized`
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

---

### ❌ Scenario 5: Invalid Deck ID (Non-existent)

**Request:**
```bash
curl -X POST http://localhost:3000/api/flashcards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{
    "deck_id": "00000000-0000-0000-0000-000000000000",
    "front": "Test",
    "back": "Test",
    "source": "manual"
  }'
```

**Expected Response:** `404 Not Found`
```json
{
  "error": {
    "code": "DECK_NOT_FOUND",
    "message": "Deck not found or access denied"
  }
}
```

---

### ❌ Scenario 6: Deck Owned by Different User

**Request:**
```bash
curl -X POST http://localhost:3000/api/flashcards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_A_TOKEN" \
  -d '{
    "deck_id": "USER_B_DECK_UUID",
    "front": "Test",
    "back": "Test",
    "source": "manual"
  }'
```

**Expected Response:** `404 Not Found`
(Same as Scenario 5 - we don't reveal if deck exists but belongs to another user)

---

### ❌ Scenario 7: Missing generation_id for AI Source

**Request:**
```bash
curl -X POST http://localhost:3000/api/flashcards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{
    "deck_id": "YOUR_DECK_UUID",
    "front": "Test",
    "back": "Test",
    "source": "ai"
  }'
```

**Expected Response:** `400 Bad Request`
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "generation_id",
      "issue": "generation_id is required when source is 'ai'"
    }
  }
}
```

---

### ❌ Scenario 8: Front Content Too Long (>200 chars)

**Request:**
```bash
curl -X POST http://localhost:3000/api/flashcards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{
    "deck_id": "YOUR_DECK_UUID",
    "front": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    "back": "Test",
    "source": "manual"
  }'
```

**Expected Response:** `400 Bad Request`
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "front",
      "issue": "front must not exceed 200 characters"
    }
  }
}
```

---

### ❌ Scenario 9: Back Content Too Long (>500 chars)

**Request:**
```bash
curl -X POST http://localhost:3000/api/flashcards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{
    "deck_id": "YOUR_DECK_UUID",
    "front": "Test",
    "back": "Lorem ipsum dolor sit amet... [insert 501+ character string]",
    "source": "manual"
  }'
```

**Expected Response:** `400 Bad Request`
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "back",
      "issue": "back must not exceed 500 characters"
    }
  }
}
```

---

### ❌ Scenario 10: Invalid Source Enum

**Request:**
```bash
curl -X POST http://localhost:3000/api/flashcards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{
    "deck_id": "YOUR_DECK_UUID",
    "front": "Test",
    "back": "Test",
    "source": "invalid"
  }'
```

**Expected Response:** `400 Bad Request`
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "source",
      "issue": "source must be either 'ai' or 'manual'"
    }
  }
}
```

---

### ❌ Scenario 11: Invalid UUID Format

**Request:**
```bash
curl -X POST http://localhost:3000/api/flashcards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{
    "deck_id": "not-a-uuid",
    "front": "Test",
    "back": "Test",
    "source": "manual"
  }'
```

**Expected Response:** `400 Bad Request`
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "deck_id",
      "issue": "deck_id must be a valid UUID"
    }
  }
}
```

---

### ❌ Scenario 12: Empty Front Field

**Request:**
```bash
curl -X POST http://localhost:3000/api/flashcards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{
    "deck_id": "YOUR_DECK_UUID",
    "front": "",
    "back": "Test",
    "source": "manual"
  }'
```

**Expected Response:** `400 Bad Request`
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "front",
      "issue": "front must contain at least 1 character"
    }
  }
}
```

---

### ❌ Scenario 13: Invalid JSON Body

**Request:**
```bash
curl -X POST http://localhost:3000/api/flashcards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d 'invalid json'
```

**Expected Response:** `400 Bad Request`
```json
{
  "error": {
    "code": "INVALID_JSON",
    "message": "Request body must be valid JSON"
  }
}
```

---

## Database Verification Queries

After running tests, verify database state:

### Check flashcard created:
```sql
SELECT * FROM flashcards
WHERE id = 'CREATED_FLASHCARD_UUID';
```

### Check generation event logged (for AI scenarios):
```sql
SELECT * FROM generation_events
WHERE flashcard_id = 'CREATED_FLASHCARD_UUID';
```

### Verify FSRS parameters initialized correctly:
```sql
SELECT
  id,
  stability, difficulty, elapsed_days, scheduled_days,
  reps, lapses, state, last_review, next_review
FROM flashcards
WHERE id = 'CREATED_FLASHCARD_UUID';
```

Expected for new flashcard:
- `stability`: 0.0
- `difficulty`: 0.0
- `elapsed_days`: 0
- `scheduled_days`: 0
- `reps`: 0
- `lapses`: 0
- `state`: 0
- `last_review`: NULL
- `next_review`: ~NOW()

---

## Test Checklist

- [ ] ✅ Scenario 1: Manual flashcard creation
- [ ] ✅ Scenario 2: AI flashcard (not edited)
- [ ] ✅ Scenario 3: AI flashcard (edited)
- [ ] ❌ Scenario 4: Unauthenticated
- [ ] ❌ Scenario 5: Invalid deck ID
- [ ] ❌ Scenario 6: Deck owned by different user
- [ ] ❌ Scenario 7: Missing generation_id for AI
- [ ] ❌ Scenario 8: Front too long
- [ ] ❌ Scenario 9: Back too long
- [ ] ❌ Scenario 10: Invalid source enum
- [ ] ❌ Scenario 11: Invalid UUID format
- [ ] ❌ Scenario 12: Empty front field
- [ ] ❌ Scenario 13: Invalid JSON

## Notes

- All timestamps should be in ISO 8601 format with timezone
- UUID fields must match the database UUID format
- Remember to replace placeholders:
  - `YOUR_SESSION_TOKEN`: actual auth token
  - `YOUR_DECK_UUID`: valid deck UUID owned by user
  - `VALID_GENERATION_UUID`: actual generation session UUID
