# Test Cases for GET /api/study/summary

## Overview

Manual testing documentation for the `GET /api/study/summary` endpoint implementation.

## Prerequisites

- Dev server running on `http://localhost:3000`
- Valid Supabase authentication session
- Test user with decks and flashcards in database

## Test Cases

### ✅ Test 1: Unauthenticated Request (401)

**Purpose**: Verify endpoint requires authentication

```bash
curl -X GET http://localhost:3000/api/study/summary \
  -w "\nHTTP Status: %{http_code}\n"
```

**Expected Response:**

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**Expected Status:** `401`

---

### Test 2: User with No Decks (200)

**Purpose**: Verify endpoint handles user with no decks gracefully

**Prerequisites:**

- User account with no decks created

```bash
curl -X GET http://localhost:3000/api/study/summary \
  -H "Cookie: sb-access-token=<VALID_TOKEN>" \
  -w "\nHTTP Status: %{http_code}\n"
```

**Expected Response:**

```json
{
  "total_due": 0,
  "next_review_date": null,
  "decks": []
}
```

**Expected Status:** `200`

---

### Test 3: User with Decks but No Due Cards (200)

**Purpose**: Verify endpoint when all flashcards have future review dates

**Prerequisites:**

- User with 2+ decks
- All flashcards have `next_review > NOW()`

```bash
curl -X GET http://localhost:3000/api/study/summary \
  -H "Cookie: sb-access-token=<VALID_TOKEN>" \
  -w "\nHTTP Status: %{http_code}\n"
```

**Expected Response:**

```json
{
  "total_due": 0,
  "next_review_date": "2026-01-05T10:00:00.000Z",
  "decks": []
}
```

**Expected Status:** `200`
**Notes:** `next_review_date` should be earliest future review date

---

### Test 4: User with Due Cards (200)

**Purpose**: Verify endpoint returns due cards summary correctly

**Prerequisites:**

- User with 3 decks: "Biology", "Chemistry", "Physics"
- Biology: 12 due cards, 5 future cards
- Chemistry: 8 due cards, 3 future cards
- Physics: 0 due cards, 10 future cards

```bash
curl -X GET http://localhost:3000/api/study/summary \
  -H "Cookie: sb-access-token=<VALID_TOKEN>" \
  -w "\nHTTP Status: %{http_code}\n"
```

**Expected Response:**

```json
{
  "total_due": 20,
  "next_review_date": "2026-01-03T08:30:00.000Z",
  "decks": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Biology",
      "due_count": 12
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Chemistry",
      "due_count": 8
    }
  ]
}
```

**Expected Status:** `200`
**Notes:**

- `total_due` = 12 + 8 = 20
- `decks` array should NOT include "Physics" (no due cards)
- `decks` sorted alphabetically by name
- `next_review_date` is earliest future review across all decks

---

### Test 5: All Cards Due (200)

**Purpose**: Verify when no future reviews exist

**Prerequisites:**

- User with 2 decks
- All flashcards have `next_review <= NOW()`

```bash
curl -X GET http://localhost:3000/api/study/summary \
  -H "Cookie: sb-access-token=<VALID_TOKEN>" \
  -w "\nHTTP Status: %{http_code}\n"
```

**Expected Response:**

```json
{
  "total_due": 25,
  "next_review_date": null,
  "decks": [
    {
      "id": "...",
      "name": "Deck A",
      "due_count": 15
    },
    {
      "id": "...",
      "name": "Deck B",
      "due_count": 10
    }
  ]
}
```

**Expected Status:** `200`
**Notes:** `next_review_date` is `null` when no future reviews

---

### Test 6: Alphabetical Deck Sorting (200)

**Purpose**: Verify decks are sorted alphabetically by name

**Prerequisites:**

- User with 4 decks with names: "Zebra", "Apple", "Mango", "Banana"
- All have due cards

```bash
curl -X GET http://localhost:3000/api/study/summary \
  -H "Cookie: sb-access-token=<VALID_TOKEN>" \
  -w "\nHTTP Status: %{http_code}\n"
```

**Expected Response:**

```json
{
  "total_due": 40,
  "next_review_date": "...",
  "decks": [
    { "id": "...", "name": "Apple", "due_count": 10 },
    { "id": "...", "name": "Banana", "due_count": 10 },
    { "id": "...", "name": "Mango", "due_count": 10 },
    { "id": "...", "name": "Zebra", "due_count": 10 }
  ]
}
```

**Expected Status:** `200`
**Notes:** Decks ordered: Apple, Banana, Mango, Zebra

---

### Test 7: Invalid Session Token (401)

**Purpose**: Verify endpoint rejects expired/invalid tokens

```bash
curl -X GET http://localhost:3000/api/study/summary \
  -H "Cookie: sb-access-token=invalid-token-12345" \
  -w "\nHTTP Status: %{http_code}\n"
```

**Expected Response:**

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**Expected Status:** `401`

---

### Test 8: Content-Type Header Verification

**Purpose**: Verify proper Content-Type header

```bash
curl -X GET http://localhost:3000/api/study/summary \
  -I | grep -i content-type
```

**Expected Output:**

```
content-type: application/json
```

---

### Test 9: CORS Preflight (OPTIONS)

**Purpose**: Verify OPTIONS request handling

```bash
curl -X OPTIONS http://localhost:3000/api/study/summary \
  -w "\nHTTP Status: %{http_code}\n" \
  -I
```

**Expected Status:** `204` or `200`
**Expected Headers:** Appropriate CORS headers

---

## Security Tests

### Test 10: User Isolation

**Purpose**: Verify User A cannot see User B's data

**Prerequisites:**

- User A has 3 decks with due cards
- User B has 2 decks with due cards

**Steps:**

1. Authenticate as User A, call endpoint
2. Authenticate as User B, call endpoint
3. Verify each user sees only their own decks

**Expected:** Each user receives only their own data

---

### Test 11: RLS Policy Enforcement

**Purpose**: Verify Row Level Security prevents data leakage

**Prerequisites:**

- Direct database access
- Two users with different data

**Steps:**

1. Verify RLS is enabled on `decks` and `flashcards` tables
2. Attempt to query other user's data via SQL (should fail)
3. Verify API respects RLS policies

**Expected:** Queries filtered by `user_id` automatically

---

## Performance Tests

### Test 12: Large Dataset Performance

**Purpose**: Verify performance with many decks

**Prerequisites:**

- User with 50 decks
- Each deck has 100 flashcards
- 25% of flashcards are due

**Expected:** Response time < 500ms

---

### Test 13: Empty Database Performance

**Purpose**: Verify performance when user has no data

**Expected:** Response time < 100ms

---

## Edge Cases

### Test 14: Deck Names with Special Characters

**Purpose**: Verify alphabetical sorting with Unicode

**Prerequisites:**

- Decks named: "Über", "Apple", "Zürich", "Banana"

**Expected Order:** Apple, Banana, Über, Zürich

---

### Test 15: Exactly at Review Time

**Purpose**: Verify cards due exactly NOW()

**Prerequisites:**

- Set flashcard `next_review = NOW()`

**Expected:** Card should be included in `total_due`

---

## Automated Test Script

```bash
#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "Running GET /api/study/summary tests..."

# Test 1: Unauthorized
echo -n "Test 1 (Unauthorized): "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/study/summary)
if [ "$STATUS" -eq 401 ]; then
  echo -e "${GREEN}PASS${NC}"
else
  echo -e "${RED}FAIL${NC} (Expected 401, got $STATUS)"
fi

# Test 8: Content-Type
echo -n "Test 8 (Content-Type): "
CONTENT_TYPE=$(curl -s -I http://localhost:3000/api/study/summary | grep -i content-type | grep application/json)
if [ ! -z "$CONTENT_TYPE" ]; then
  echo -e "${GREEN}PASS${NC}"
else
  echo -e "${RED}FAIL${NC}"
fi

echo "Tests complete!"
```

---

## Manual Testing Checklist

- [ ] Test 1: Unauthenticated Request (401)
- [ ] Test 2: User with No Decks (200)
- [ ] Test 3: No Due Cards (200)
- [ ] Test 4: User with Due Cards (200)
- [ ] Test 5: All Cards Due (200)
- [ ] Test 6: Alphabetical Deck Sorting (200)
- [ ] Test 7: Invalid Session Token (401)
- [ ] Test 8: Content-Type Header
- [ ] Test 9: CORS Preflight
- [ ] Test 10: User Isolation
- [ ] Test 11: RLS Policy Enforcement
- [ ] Test 12: Large Dataset Performance
- [ ] Test 13: Empty Database Performance
- [ ] Test 14: Special Characters in Names
- [ ] Test 15: Exactly at Review Time

---

## Notes

- Replace `<VALID_TOKEN>` with actual Supabase session token
- Session tokens can be obtained from browser dev tools after login
- All timestamps should be in ISO 8601 format
- UUIDs should follow RFC 4122 format
- Test with both empty and populated databases

## Test Data Setup (SQL)

```sql
-- Create test user decks
INSERT INTO decks (user_id, name) VALUES
  (auth.uid(), 'Biology'),
  (auth.uid(), 'Chemistry'),
  (auth.uid(), 'Physics');

-- Create test flashcards with various review dates
INSERT INTO flashcards (deck_id, front, back, next_review) VALUES
  -- Biology: 12 due, 5 future
  ((SELECT id FROM decks WHERE name = 'Biology'), 'Question 1', 'Answer 1', NOW() - INTERVAL '1 day'),
  -- ... (add more as needed)

  -- Chemistry: 8 due, 3 future
  ((SELECT id FROM decks WHERE name = 'Chemistry'), 'Question 1', 'Answer 1', NOW() - INTERVAL '2 days'),
  -- ...

  -- Physics: 0 due, 10 future
  ((SELECT id FROM decks WHERE name = 'Physics'), 'Question 1', 'Answer 1', NOW() + INTERVAL '5 days');
  -- ...
```
