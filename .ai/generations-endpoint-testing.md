# POST /api/generations - Testing Guide

This document provides comprehensive testing instructions for the AI flashcard generation endpoint.

## Prerequisites

Before testing, ensure:
- [ ] Supabase migrations have been applied (`supabase db push` or equivalent)
- [ ] `.env` file contains valid `OPENROUTER_API_KEY`
- [ ] Development server is running (`npm run dev`)
- [ ] You have a valid Supabase JWT token for authentication
- [ ] At least one deck exists in the database for the test user

## Getting a Test JWT Token

### Option 1: Using Supabase Dashboard
1. Go to Supabase Dashboard → Authentication → Users
2. Find your test user
3. Copy the JWT token from the user details

### Option 2: Using Browser DevTools
1. Log in to your application
2. Open DevTools → Application/Storage → Cookies
3. Copy the `sb-access-token` cookie value

### Option 3: Programmatically
```bash
# Using Supabase CLI
supabase auth login --email test@example.com --password yourpassword
```

## Manual Testing Checklist

### 1. Authentication Tests

#### Test 1.1: Missing Authorization Header
```bash
curl -X POST http://localhost:3000/api/generations \
  -H "Content-Type: application/json" \
  -d '{
    "source_text": "Test content",
    "deck_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
```
**Expected**: 401 Unauthorized
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required. Please log in."
  }
}
```

#### Test 1.2: Invalid JWT Token
```bash
curl -X POST http://localhost:3000/api/generations \
  -H "Authorization: Bearer invalid_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "source_text": "Test content",
    "deck_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
```
**Expected**: 401 Unauthorized

#### Test 1.3: Expired JWT Token
Use an expired token (you can generate one with very short expiry)
**Expected**: 401 Unauthorized

---

### 2. Validation Tests

Set up environment variable for valid token:
```bash
export ACCESS_TOKEN="your_valid_jwt_token_here"
```

#### Test 2.1: Missing source_text
```bash
curl -X POST http://localhost:3000/api/generations \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deck_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
```
**Expected**: 400 Bad Request
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "errors": {
        "source_text": ["Required"]
      }
    }
  }
}
```

#### Test 2.2: Empty source_text
```bash
curl -X POST http://localhost:3000/api/generations \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "source_text": "",
    "deck_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
```
**Expected**: 400 Bad Request - "source_text cannot be empty"

#### Test 2.3: source_text Too Long (5001+ characters)
```bash
# Generate 5001 character string
LONG_TEXT=$(python3 -c "print('a' * 5001)")

curl -X POST http://localhost:3000/api/generations \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"source_text\": \"$LONG_TEXT\",
    \"deck_id\": \"550e8400-e29b-41d4-a716-446655440000\"
  }"
```
**Expected**: 400 Bad Request - "source_text must be at most 5000 characters"

#### Test 2.4: Missing deck_id
```bash
curl -X POST http://localhost:3000/api/generations \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "source_text": "Test content"
  }'
```
**Expected**: 400 Bad Request - "deck_id" is required

#### Test 2.5: Invalid UUID Format
```bash
curl -X POST http://localhost:3000/api/generations \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "source_text": "Test content",
    "deck_id": "not-a-uuid"
  }'
```
**Expected**: 400 Bad Request
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "errors": {
        "deck_id": ["deck_id must be a valid UUID"]
      }
    }
  }
}
```

---

### 3. Authorization Tests

#### Test 3.1: Deck Belongs to Different User
```bash
# Use a deck_id that exists but belongs to another user
export OTHER_USER_DECK_ID="another_users_deck_uuid"

curl -X POST http://localhost:3000/api/generations \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"source_text\": \"Test content\",
    \"deck_id\": \"$OTHER_USER_DECK_ID\"
  }"
```
**Expected**: 404 Not Found
```json
{
  "error": {
    "code": "DECK_NOT_FOUND",
    "message": "Deck not found or access denied"
  }
}
```

#### Test 3.2: Non-existent Deck
```bash
curl -X POST http://localhost:3000/api/generations \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "source_text": "Test content",
    "deck_id": "00000000-0000-0000-0000-000000000000"
  }'
```
**Expected**: 404 Not Found

---

### 4. AI Limit Tests

#### Test 4.1: User Under Limit (Normal Case)
```bash
# Ensure user has < 200 flashcards this month
# Check current count in database:
# SELECT monthly_ai_flashcards_count FROM profiles WHERE user_id = 'your_user_id';

export VALID_DECK_ID="your_deck_uuid"

curl -X POST http://localhost:3000/api/generations \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"source_text\": \"Photosynthesis is the process by which plants convert light energy into chemical energy. It occurs in chloroplasts and produces glucose and oxygen from carbon dioxide and water.\",
    \"deck_id\": \"$VALID_DECK_ID\"
  }"
```
**Expected**: 200 OK with drafts

#### Test 4.2: User at Limit (200/200)
```bash
# Manually set user's monthly_ai_flashcards_count to 200:
# UPDATE profiles SET monthly_ai_flashcards_count = 200 WHERE user_id = 'your_user_id';

curl -X POST http://localhost:3000/api/generations \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"source_text\": \"Test content\",
    \"deck_id\": \"$VALID_DECK_ID\"
  }"
```
**Expected**: 403 Forbidden
```json
{
  "error": {
    "code": "AI_LIMIT_EXCEEDED",
    "message": "Monthly AI generation limit exceeded (200 flashcards/month). Limit resets on the 1st of next month.",
    "details": {
      "current_count": 200,
      "limit": 200,
      "reset_date": "2025-01-01"
    }
  }
}
```

#### Test 4.3: Lazy Reset on New Month
```bash
# Manually set ai_limit_reset_date to last month:
# UPDATE profiles
# SET monthly_ai_flashcards_count = 150,
#     ai_limit_reset_date = '2024-11-01'
# WHERE user_id = 'your_user_id';

curl -X POST http://localhost:3000/api/generations \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"source_text\": \"Test lazy reset\",
    \"deck_id\": \"$VALID_DECK_ID\"
  }"
```
**Expected**: 200 OK (limit should reset to 0 before generation)

Verify in database:
```sql
SELECT monthly_ai_flashcards_count, ai_limit_reset_date
FROM profiles
WHERE user_id = 'your_user_id';
```
Count should be equal to generated_count, reset_date should be start of current month.

---

### 5. Success Tests

#### Test 5.1: Valid Request - Short Text
```bash
curl -X POST http://localhost:3000/api/generations \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"source_text\": \"The mitochondria is the powerhouse of the cell.\",
    \"deck_id\": \"$VALID_DECK_ID\"
  }"
```
**Expected**: 200 OK
```json
{
  "generation_id": "uuid-here",
  "drafts": [
    {
      "index": 0,
      "front": "What is the mitochondria?",
      "back": "The powerhouse of the cell"
    }
  ],
  "generated_count": 1,
  "remaining_ai_limit": 199
}
```

#### Test 5.2: Valid Request - Longer Educational Text
```bash
curl -X POST http://localhost:3000/api/generations \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"source_text\": \"The French Revolution was a period of radical political and societal change in France that began with the Estates General of 1789 and ended with the formation of the French Consulate in November 1799. Many of its ideas are considered fundamental principles of liberal democracy, while phrases like Liberté, égalité, fraternité reappeared in other revolts, such as the 1917 Russian Revolution. The values and institutions it created dominate French politics to this day.\",
    \"deck_id\": \"$VALID_DECK_ID\"
  }"
```
**Expected**: 200 OK with multiple drafts (likely 3-5 flashcards)

#### Test 5.3: Verify Database Changes
After a successful generation, check database:

```sql
-- Check AI usage count was incremented
SELECT monthly_ai_flashcards_count
FROM profiles
WHERE user_id = 'your_user_id';

-- Check generation events were logged
SELECT COUNT(*)
FROM generation_events
WHERE generation_id = 'the_generation_id_from_response'
  AND event_type = 'GENERATED';
-- Should match generated_count
```

---

### 6. OpenRouter API Error Simulation

#### Test 6.1: Invalid API Key
```bash
# Temporarily set invalid OPENROUTER_API_KEY in .env
# Restart server

curl -X POST http://localhost:3000/api/generations \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"source_text\": \"Test content\",
    \"deck_id\": \"$VALID_DECK_ID\"
  }"
```
**Expected**: 503 Service Unavailable
```json
{
  "error": {
    "code": "AI_SERVICE_ERROR",
    "message": "AI service temporarily unavailable. Please try again later.",
    "details": {
      "provider": "OpenRouter"
    }
  }
}
```

**Important**: Verify that monthly_ai_flashcards_count was NOT incremented when API fails.

---

## Edge Cases & Race Conditions

### Test 7.1: Concurrent Requests (Race Condition)
```bash
# Send 2 requests simultaneously when user is at 195/200 limit
# Each request generates ~10 flashcards

# Terminal 1:
curl -X POST http://localhost:3000/api/generations \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"source_text\": \"Long educational text here...\",
    \"deck_id\": \"$VALID_DECK_ID\"
  }" &

# Terminal 2 (immediately after):
curl -X POST http://localhost:3000/api/generations \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"source_text\": \"Another long educational text...\",
    \"deck_id\": \"$VALID_DECK_ID\"
  }" &
```

**Expected Behavior**:
- One request succeeds (brings count to ~205)
- Second request fails with 403 (limit exceeded)
- OR: Database constraint prevents count from exceeding 200

**Note**: The `increment_ai_usage` function provides atomic increment, but there's still a race window between the limit check and increment. Consider adding a database constraint:
```sql
ALTER TABLE profiles
ADD CONSTRAINT check_ai_limit
CHECK (monthly_ai_flashcards_count <= 200);
```

---

## Performance Tests

### Test 8.1: Response Time
```bash
# Measure response time
time curl -X POST http://localhost:3000/api/generations \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"source_text\": \"Medium length educational content here...\",
    \"deck_id\": \"$VALID_DECK_ID\"
  }"
```
**Expected**:
- Total time: 3-12 seconds (mostly OpenRouter API latency)
- Database operations: < 200ms combined

---

## Cleanup After Testing

```sql
-- Reset test user's AI count
UPDATE profiles
SET monthly_ai_flashcards_count = 0,
    ai_limit_reset_date = CURRENT_DATE
WHERE user_id = 'your_test_user_id';

-- Delete test generation events (optional)
DELETE FROM generation_events
WHERE user_id = 'your_test_user_id';
```

---

## Automated Testing Script

Save as `test-generations-endpoint.sh`:

```bash
#!/bin/bash

# Configuration
API_URL="http://localhost:3000/api/generations"
ACCESS_TOKEN="your_jwt_token_here"
DECK_ID="your_deck_id_here"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Test function
test_endpoint() {
  local test_name=$1
  local expected_status=$2
  local data=$3

  echo -n "Testing: $test_name... "

  response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$data")

  status_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)

  if [ "$status_code" == "$expected_status" ]; then
    echo -e "${GREEN}PASSED${NC} ($status_code)"
    ((PASSED++))
  else
    echo -e "${RED}FAILED${NC} (expected $expected_status, got $status_code)"
    echo "Response: $body"
    ((FAILED++))
  fi
}

# Run tests
echo "Starting API endpoint tests..."
echo ""

test_endpoint "Missing auth header" "401" '{"source_text":"test","deck_id":"'$DECK_ID'"}'

test_endpoint "Missing source_text" "400" '{"deck_id":"'$DECK_ID'"}'

test_endpoint "Empty source_text" "400" '{"source_text":"","deck_id":"'$DECK_ID'"}'

test_endpoint "Invalid deck_id format" "400" '{"source_text":"test","deck_id":"not-a-uuid"}'

test_endpoint "Valid request" "200" '{"source_text":"The mitochondria is the powerhouse of the cell.","deck_id":"'$DECK_ID'"}'

# Summary
echo ""
echo "=========================================="
echo "Test Results:"
echo "Passed: $PASSED"
echo "Failed: $FAILED"
echo "=========================================="
```

Usage:
```bash
chmod +x test-generations-endpoint.sh
./test-generations-endpoint.sh
```
