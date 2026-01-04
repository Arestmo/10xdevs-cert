# POST /api/decks - Przewodnik testowania manualnego

## Wymagania wstępne

1. Lokalny Supabase musi działać:

```bash
npx supabase status
```

2. Serwer dev musi być uruchomiony:

```bash
npm run dev
# Serwer będzie dostępny pod http://localhost:3000 (lub innym portem jeśli zajęty)
```

3. Musisz posiadać prawidłowy JWT token autoryzacyjny:
   - Zaloguj się do aplikacji poprzez UI
   - Lub użyj Supabase Studio (http://127.0.0.1:54323) do zarządzania użytkownikami
   - Token JWT będzie przechowywany w cookies lub localStorage

## Jak uzyskać token autoryzacyjny

### Opcja 1: Użyj narzędzi deweloperskich przeglądarki

1. Zaloguj się do aplikacji
2. Otwórz DevTools (F12)
3. Przejdź do zakładki Application → Storage → Cookies
4. Skopiuj wartość cookie z tokenem JWT

### Opcja 2: Utwórz użytkownika testowego przez Supabase Studio

1. Otwórz http://127.0.0.1:54323
2. Przejdź do Authentication → Users
3. Kliknij "Add User" i utwórz użytkownika testowego
4. Użyj Supabase CLI lub API do wygenerowania access token

## Test Cases

### ✅ Test Case 1: Sukces (201 Created)

**Opis:** Utworzenie nowej talii z prawidłowymi danymi.

**Request:**

```bash
curl -X POST http://localhost:3000/api/decks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{"name": "Biology 101"}' \
  -s | jq .
```

**Oczekiwana odpowiedź:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
  "name": "Biology 101",
  "created_at": "2024-12-30T10:00:00Z",
  "updated_at": "2024-12-30T10:00:00Z"
}
```

**Status HTTP:** 201 Created

**Weryfikacja:**

- Response zawiera wszystkie pola: `id`, `user_id`, `name`, `created_at`, `updated_at`
- `id` jest UUID
- `user_id` odpowiada zalogowanemu użytkownikowi
- `name` pasuje do wysłanego
- `created_at` i `updated_at` są prawidłowe timestamps

---

### ✅ Test Case 2: Brak autentykacji (401)

**Opis:** Próba utworzenia talii bez tokena JWT.

**Request:**

```bash
curl -X POST http://localhost:3000/api/decks \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Deck"}' \
  -s | jq .
```

**Oczekiwana odpowiedź:**

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**Status HTTP:** 401 Unauthorized

**Weryfikacja:**

- ✅ Zweryfikowano - endpoint zwraca 401 bez tokena

---

### ⚠️ Test Case 3: Walidacja - name za długi (400)

**Opis:** Nazwa talii przekracza maksymalną długość 100 znaków.

**Request:**

```bash
curl -X POST http://localhost:3000/api/decks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{"name": "'"$(printf 'a%.0s' {1..101})"'"}' \
  -s | jq .
```

**Oczekiwana odpowiedź:**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": {
      "name": ["Name must not exceed 100 characters"]
    }
  }
}
```

**Status HTTP:** 400 Bad Request

---

### ⚠️ Test Case 4: Walidacja - name pusty (400)

**Opis:** Nazwa talii jest pustym stringiem.

**Request:**

```bash
curl -X POST http://localhost:3000/api/decks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{"name": ""}' \
  -s | jq .
```

**Oczekiwana odpowiedź:**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": {
      "name": ["Name must not be empty"]
    }
  }
}
```

**Status HTTP:** 400 Bad Request

---

### ⚠️ Test Case 5: Duplikat nazwy (409)

**Opis:** Próba utworzenia talii z nazwą, która już istnieje dla tego użytkownika.

**Request 1 (tworzenie pierwszej talii):**

```bash
curl -X POST http://localhost:3000/api/decks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{"name": "Unique Deck Name"}' \
  -s | jq .
```

**Request 2 (duplikat - powinien zwrócić 409):**

```bash
curl -X POST http://localhost:3000/api/decks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{"name": "Unique Deck Name"}' \
  -s | jq .
```

**Oczekiwana odpowiedź (Request 2):**

```json
{
  "error": {
    "code": "DUPLICATE_DECK",
    "message": "A deck with this name already exists"
  }
}
```

**Status HTTP:** 409 Conflict

---

### ⚠️ Test Case 6: Nieprawidłowy JSON (400)

**Opis:** Request body zawiera nieprawidłowy JSON.

**Request:**

```bash
curl -X POST http://localhost:3000/api/decks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{invalid json}' \
  -s | jq .
```

**Oczekiwana odpowiedź:**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid JSON in request body"
  }
}
```

**Status HTTP:** 400 Bad Request

---

## Weryfikacja w bazie danych

### Sprawdzenie utworzonej talii

Jeśli masz dostęp do `psql`:

```bash
psql postgres://postgres:postgres@localhost:54322/postgres
```

Query:

```sql
SELECT id, user_id, name, created_at, updated_at
FROM decks
ORDER BY created_at DESC
LIMIT 5;
```

**Weryfikacja:**

- ✅ `id` jest UUID
- ✅ `user_id` odpowiada autentykowanemu użytkownikowi
- ✅ `name` pasuje do wysłanego
- ✅ `created_at` i `updated_at` są prawidłowe timestamps
- ✅ `created_at` i `updated_at` mają identyczne wartości przy utworzeniu

### Sprawdzenie ograniczenia UNIQUE

Query testujący constraint:

```sql
SELECT user_id, name, COUNT(*) as count
FROM decks
GROUP BY user_id, name
HAVING COUNT(*) > 1;
```

**Oczekiwany rezultat:** Pusty zestaw wyników (brak duplikatów)

---

## Automatyczne testy (TODO)

**Uwaga:** Obecnie testowanie odbywa się manualnie. W przyszłości zaleca się utworzenie:

1. **Integration tests** używając Vitest lub Jest
2. **E2E tests** używając Playwright
3. **API tests** używając Supertest lub podobnego narzędzia

Przykładowa struktura testów:

```
tests/
├── integration/
│   └── api/
│       └── decks.test.ts
└── e2e/
    └── decks-creation.spec.ts
```

---

## Automated Testing Script

Dodano skrypt `test-post-decks.mjs` który automatyzuje wszystkie 6 test cases:

```bash
node test-post-decks.mjs
```

**Wymagania:**

- Lokalny Supabase musi działać (`npx supabase start`)
- Serwer dev musi działać (`npm run dev`)
- Plik `.env` z `SUPABASE_URL` i `SUPABASE_KEY`

Skrypt automatycznie:

1. Tworzy użytkownika testowego
2. Uzyskuje JWT token
3. Wykonuje wszystkie 6 test cases
4. Wyświetla wyniki

---

## Status testowania

| Test Case                | Status       | Data       | Tester    |
| ------------------------ | ------------ | ---------- | --------- |
| TC1: Sukces (201)        | ✅ Przeszedł | 2025-12-30 | Automated |
| TC2: Brak auth (401)     | ✅ Przeszedł | 2025-12-30 | Automated |
| TC3: Name za długi (400) | ✅ Przeszedł | 2025-12-30 | Automated |
| TC4: Name pusty (400)    | ✅ Przeszedł | 2025-12-30 | Automated |
| TC5: Duplikat (409)      | ✅ Przeszedł | 2025-12-30 | Automated |
| TC6: Zły JSON (400)      | ✅ Przeszedł | 2025-12-30 | Automated |

**Wszystkie testy przeszły pomyślnie! ✅**

---

## Checklist przed merge

- [x] Metoda `createDeck()` dodana do `DeckService`
- [x] Custom error `DuplicateDeckError` zdefiniowany i eksportowany
- [x] Handler `POST` dodany do `/api/decks`
- [x] Walidacja Zod dla request body zaimplementowana
- [x] Obsługa wszystkich błędów (401, 400, 409, 500) działa poprawnie
- [x] Wszystkie 6 test cases przechodzą pomyślnie ✅
- [x] `npm run lint` nie zgłasza błędów
- [x] Deck pojawia się w bazie danych z poprawnymi wartościami ✅
- [x] Dokumentacja zaktualizowana
- [x] Kod przestrzega wzorców z CLAUDE.md (early returns, error handling)
- [x] Response headers zawierają `X-Content-Type-Options: nosniff`
- [x] Middleware zaktualizowany do obsługi JWT z Authorization header
