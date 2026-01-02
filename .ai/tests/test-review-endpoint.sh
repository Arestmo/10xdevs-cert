#!/bin/bash

# Test script for POST /api/study/review endpoint
#
# This script tests various scenarios for the review endpoint
# You need to set the AUTH_TOKEN and FLASHCARD_ID before running

BASE_URL="http://localhost:3000"
ENDPOINT="${BASE_URL}/api/study/review"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

echo "========================================="
echo "Testing POST /api/study/review endpoint"
echo "========================================="
echo ""

# Function to run a test
run_test() {
    local test_name="$1"
    local expected_status="$2"
    local curl_args="$3"

    echo -e "${YELLOW}Test: ${test_name}${NC}"

    response=$(eval "curl -s -w '\n%{http_code}' ${curl_args} ${ENDPOINT}")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSED${NC} - HTTP $http_code"
        echo "Response: $(echo "$body" | jq -C 2>/dev/null || echo "$body")"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC} - Expected HTTP $expected_status, got $http_code"
        echo "Response: $(echo "$body" | jq -C 2>/dev/null || echo "$body")"
        ((TESTS_FAILED++))
    fi
    echo ""
}

# =============================================================================
# Test 1: Missing Authentication
# =============================================================================
run_test "Missing authentication token" "401" \
    "-X POST \
     -H 'Content-Type: application/json' \
     -d '{\"flashcard_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"rating\":3}'"

# =============================================================================
# Test 2: Invalid JSON
# =============================================================================
run_test "Invalid JSON in request body" "400" \
    "-X POST \
     -H 'Content-Type: application/json' \
     -H 'Authorization: Bearer fake-token-for-testing' \
     -d 'invalid-json'"

# =============================================================================
# Test 3: Invalid UUID format
# =============================================================================
run_test "Invalid flashcard_id (not a UUID)" "400" \
    "-X POST \
     -H 'Content-Type: application/json' \
     -H 'Authorization: Bearer fake-token-for-testing' \
     -d '{\"flashcard_id\":\"not-a-uuid\",\"rating\":3}'"

# =============================================================================
# Test 4: Rating out of range (too low)
# =============================================================================
run_test "Rating too low (0)" "400" \
    "-X POST \
     -H 'Content-Type: application/json' \
     -H 'Authorization: Bearer fake-token-for-testing' \
     -d '{\"flashcard_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"rating\":0}'"

# =============================================================================
# Test 5: Rating out of range (too high)
# =============================================================================
run_test "Rating too high (5)" "400" \
    "-X POST \
     -H 'Content-Type: application/json' \
     -H 'Authorization: Bearer fake-token-for-testing' \
     -d '{\"flashcard_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"rating\":5}'"

# =============================================================================
# Test 6: Missing required fields
# =============================================================================
run_test "Missing flashcard_id field" "400" \
    "-X POST \
     -H 'Content-Type: application/json' \
     -H 'Authorization: Bearer fake-token-for-testing' \
     -d '{\"rating\":3}'"

run_test "Missing rating field" "400" \
    "-X POST \
     -H 'Content-Type: application/json' \
     -H 'Authorization: Bearer fake-token-for-testing' \
     -d '{\"flashcard_id\":\"550e8400-e29b-41d4-a716-446655440000\"}'"

# =============================================================================
# MANUAL TESTS (require valid AUTH_TOKEN and FLASHCARD_ID)
# =============================================================================
echo "========================================="
echo "MANUAL TESTS"
echo "========================================="
echo ""
echo "To test with valid authentication and flashcard:"
echo ""
echo "1. Get your auth token from browser (after logging in):"
echo "   - Open DevTools → Application → Local Storage"
echo "   - Look for Supabase session data"
echo ""
echo "2. Get a valid flashcard_id from your database:"
echo "   - Query: SELECT id FROM flashcards LIMIT 1;"
echo ""
echo "3. Run the following command:"
echo ""
echo "AUTH_TOKEN='your-token-here' FLASHCARD_ID='your-flashcard-id-here' bash $0 manual"
echo ""

if [ "$1" = "manual" ] && [ -n "$AUTH_TOKEN" ] && [ -n "$FLASHCARD_ID" ]; then
    echo "Running manual tests with provided credentials..."
    echo ""

    # Test with rating 1 (Again)
    run_test "Valid request - Rating 1 (Again)" "200" \
        "-X POST \
         -H 'Content-Type: application/json' \
         -H 'Authorization: Bearer ${AUTH_TOKEN}' \
         -d '{\"flashcard_id\":\"${FLASHCARD_ID}\",\"rating\":1}'"

    # Test with rating 2 (Hard)
    run_test "Valid request - Rating 2 (Hard)" "200" \
        "-X POST \
         -H 'Content-Type: application/json' \
         -H 'Authorization: Bearer ${AUTH_TOKEN}' \
         -d '{\"flashcard_id\":\"${FLASHCARD_ID}\",\"rating\":2}'"

    # Test with rating 3 (Good)
    run_test "Valid request - Rating 3 (Good)" "200" \
        "-X POST \
         -H 'Content-Type: application/json' \
         -H 'Authorization: Bearer ${AUTH_TOKEN}' \
         -d '{\"flashcard_id\":\"${FLASHCARD_ID}\",\"rating\":3}'"

    # Test with rating 4 (Easy)
    run_test "Valid request - Rating 4 (Easy)" "200" \
        "-X POST \
         -H 'Content-Type: application/json' \
         -H 'Authorization: Bearer ${AUTH_TOKEN}' \
         -d '{\"flashcard_id\":\"${FLASHCARD_ID}\",\"rating\":4}'"

    # Test with non-existent flashcard ID
    run_test "Non-existent flashcard ID" "404" \
        "-X POST \
         -H 'Content-Type: application/json' \
         -H 'Authorization: Bearer ${AUTH_TOKEN}' \
         -d '{\"flashcard_id\":\"00000000-0000-0000-0000-000000000000\",\"rating\":3}'"
fi

# =============================================================================
# Summary
# =============================================================================
echo "========================================="
echo "Test Summary"
echo "========================================="
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed.${NC}"
    exit 1
fi
