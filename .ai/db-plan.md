# Schemat bazy danych - Flashcards AI

## Przegląd architektury

Schemat bazy danych PostgreSQL zaprojektowany dla aplikacji Flashcards AI obsługuje:
- Wieloużytkownikowy system z izolacją danych (RLS)
- Fiszki edukacyjne z algorytmem powtórek FSRS
- Generowanie AI z miesięcznym limitem 200 fiszek
- Organizację fiszek w talie tematyczne
- Logowanie eventów dla metryk biznesowych
- Zgodność z RODO (kaskadowe usuwanie danych)

## 1. Tabele

### 1.1 profiles

Przechowuje dane aplikacyjne użytkowników (relacja 1:1 z `auth.users` z Supabase Auth).

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| user_id | UUID | PRIMARY KEY, FOREIGN KEY → auth.users(id) ON DELETE CASCADE | ID użytkownika z Supabase Auth |
| monthly_ai_flashcards_count | INTEGER | NOT NULL, DEFAULT 0, CHECK (monthly_ai_flashcards_count >= 0) | Licznik wygenerowanych fiszek AI w bieżącym miesiącu |
| ai_limit_reset_date | DATE | NOT NULL, DEFAULT CURRENT_DATE | Data ostatniego resetu limitu AI |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data utworzenia profilu |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data ostatniej aktualizacji profilu |

**Uwagi:**
- Profil jest automatycznie tworzony przez trigger przy rejestracji nowego użytkownika
- Limit 200 fiszek AI jest hardkodowany w aplikacji
- Reset limitu następuje pierwszego dnia miesiąca (logika w aplikacji - lazy reset)

---

### 1.2 decks

Przechowuje talie fiszek tematycznych.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unikalny identyfikator talii |
| user_id | UUID | NOT NULL, FOREIGN KEY → profiles(user_id) ON DELETE CASCADE | Właściciel talii |
| name | TEXT | NOT NULL, CHECK (char_length(name) BETWEEN 1 AND 100) | Nazwa talii (1-100 znaków) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data utworzenia talii |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data ostatniej aktualizacji |

**Ograniczenia unikalne:**
- `UNIQUE(user_id, name)` - użytkownik nie może mieć dwóch talii o tej samej nazwie

**Uwagi:**
- Użytkownik może mieć nieograniczoną liczbę talii
- Usunięcie talii powoduje kaskadowe usunięcie wszystkich jej fiszek
- Metadane talii (liczba fiszek, fiszki do powtórki) obliczane dynamicznie

---

### 1.3 flashcards

Przechowuje fiszki edukacyjne z parametrami algorytmu FSRS.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unikalny identyfikator fiszki |
| deck_id | UUID | NOT NULL, FOREIGN KEY → decks(id) ON DELETE CASCADE | Talia, do której należy fiszka |
| front | TEXT | NOT NULL, CHECK (char_length(front) <= 200) | Przód fiszki (max 200 znaków) |
| back | TEXT | NOT NULL, CHECK (char_length(back) <= 500) | Tył fiszki (max 500 znaków) |
| source | source_type | NOT NULL | Źródło powstania fiszki ('ai' lub 'manual') |
| stability | REAL | DEFAULT 0.0 | Parametr FSRS: stabilność pamięci |
| difficulty | REAL | DEFAULT 0.0 | Parametr FSRS: trudność |
| elapsed_days | INTEGER | DEFAULT 0 | Parametr FSRS: dni od ostatniej powtórki |
| scheduled_days | INTEGER | DEFAULT 0 | Parametr FSRS: zaplanowane dni do następnej powtórki |
| reps | INTEGER | DEFAULT 0 | Parametr FSRS: liczba powtórzeń |
| lapses | INTEGER | DEFAULT 0 | Parametr FSRS: liczba błędów |
| state | SMALLINT | DEFAULT 0, CHECK (state BETWEEN 0 AND 3) | Parametr FSRS: stan karty (0=new, 1=learning, 2=review, 3=relearning) |
| last_review | TIMESTAMPTZ | NULL | Data ostatniej powtórki |
| next_review | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data następnej powtórki |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data utworzenia fiszki |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data ostatniej aktualizacji |

**Uwagi:**
- Fiszka zawsze należy do dokładnie jednej talii (`deck_id NOT NULL`)
- Domyślne wartości FSRS sprawiają, że nowa fiszka jest natychmiast dostępna do nauki
- Parametry FSRS są aktualizowane przy każdej ocenie w sesji nauki
- Edycja treści fiszki nie resetuje parametrów FSRS
- Brak osobnej tabeli sesji nauki - parametry aktualizowane bezpośrednio

---

### 1.4 generation_events

Przechowuje logi zdarzeń związanych z generowaniem fiszek AI (do metryk biznesowych).

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unikalny identyfikator eventu |
| user_id | UUID | NOT NULL, FOREIGN KEY → profiles(user_id) ON DELETE CASCADE | Użytkownik, który wygenerował event |
| flashcard_id | UUID | NULL, FOREIGN KEY → flashcards(id) ON DELETE SET NULL | Powiązana fiszka (nullable - SET NULL przy usunięciu) |
| generation_id | UUID | NULL | ID sesji generowania (grupowanie draftów z jednej sesji) |
| event_type | event_type | NOT NULL | Typ eventu (GENERATED, ACCEPTED, REJECTED, EDITED) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data wystąpienia eventu |

**Uwagi:**
- `flashcard_id` jest NULL dla eventów GENERATED i REJECTED (draft nie jest zapisany w bazie)
- `flashcard_id` jest wypełnione dla ACCEPTED i EDITED (odnosi się do zapisanej fiszki)
- `generation_id` grupuje wszystkie eventy z jednej sesji generowania
- Tabela służy tylko do analityki, nie przechowuje treści draftów
- ON DELETE SET NULL zachowuje historię eventów przy usunięciu fiszki
- Polityki RLS ograniczają dostęp tylko dla roli `authenticated`

---

## 2. Typy wyliczeniowe (ENUMs)

### 2.1 source_type
```sql
CREATE TYPE source_type AS ENUM ('ai', 'manual');
```
Określa źródło powstania fiszki.

### 2.2 event_type
```sql
CREATE TYPE event_type AS ENUM ('GENERATED', 'ACCEPTED', 'REJECTED', 'EDITED');
```
Określa typ eventu w generation_events:
- `GENERATED` - fiszka wygenerowana przez AI (draft)
- `ACCEPTED` - draft zaakceptowany bez zmian
- `REJECTED` - draft odrzucony
- `EDITED` - draft edytowany przed akceptacją

---

## 3. Relacje między tabelami

```
auth.users (Supabase Auth)
    │
    ├── 1:1 ──► profiles
    │           │
    │           ├── 1:N ──► decks
    │           │           │
    │           │           └── 1:N ──► flashcards
    │           │                       │
    │           │                       └── 1:N ◄── generation_events (nullable FK)
    │           │
    │           └── 1:N ──► generation_events
```

### Szczegóły relacji:

| Relacja | Kardynalność | Foreign Key | ON DELETE |
|---------|--------------|-------------|-----------|
| auth.users → profiles | 1:1 | profiles.user_id | CASCADE |
| profiles → decks | 1:N | decks.user_id | CASCADE |
| decks → flashcards | 1:N | flashcards.deck_id | CASCADE |
| profiles → generation_events | 1:N | generation_events.user_id | CASCADE |
| flashcards → generation_events | 1:N | generation_events.flashcard_id | SET NULL |

**Kaskadowe usuwanie (RODO):**
Usunięcie użytkownika (`auth.users`) automatycznie usuwa:
1. Profil (`profiles`)
2. Wszystkie talie (`decks`)
3. Wszystkie fiszki (`flashcards`)
4. Wszystkie eventy generowania (`generation_events`)

---

## 4. Indeksy

Indeksy zoptymalizowane pod najczęstsze przypadki użycia:

| Indeks | Tabela | Kolumny | Cel |
|--------|--------|---------|-----|
| idx_flashcards_review_queue | flashcards | (deck_id, next_review) | Pobieranie fiszek do powtórki z konkretnej talii |
| idx_flashcards_user_review | flashcards | (user_id, next_review) | Pobieranie wszystkich fiszek użytkownika do powtórki (przez JOIN z decks) |
| idx_decks_user | decks | (user_id, created_at DESC) | Lista talii użytkownika sortowana chronologicznie |
| idx_generation_events_analytics | generation_events | (user_id, event_type, created_at DESC) | Zapytania analityczne (wskaźniki akceptacji, użycie AI) |
| idx_generation_events_session | generation_events | (generation_id) | Grupowanie eventów z jednej sesji generowania |

**Uwagi:**
- Indeksy composite dla najczęstszych filtrów
- `created_at DESC` dla chronologicznego sortowania
- Brak indeksu na `flashcards.user_id` - będzie pobierane przez JOIN z `decks`
- PostgreSQL automatycznie tworzy indeksy dla PRIMARY KEY i UNIQUE constraints

---

## 5. Row Level Security (RLS)

RLS włączone na wszystkich tabelach z granularnymi politykami per operacja i per rola.

### 5.1 profiles

**Polityki dla roli `authenticated`:**

```sql
-- SELECT: Użytkownik widzi tylko własny profil
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- INSERT: Brak polityki - profile tworzone tylko przez trigger
-- (INSERT będzie blokowany przez brak polityki)

-- UPDATE: Użytkownik może aktualizować tylko własny profil
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- DELETE: Brak polityki - usuwanie tylko przez CASCADE przy usunięciu konta
```

**Polityki dla roli `anon`:**
- Brak dostępu (niezalogowani użytkownicy nie mają dostępu do aplikacji)

---

### 5.2 decks

**Polityki dla roli `authenticated`:**

```sql
-- SELECT: Użytkownik widzi tylko własne talie
CREATE POLICY "Users can view own decks"
ON decks FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- INSERT: Użytkownik może tworzyć talie tylko dla siebie
CREATE POLICY "Users can create own decks"
ON decks FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- UPDATE: Użytkownik może edytować tylko własne talie
CREATE POLICY "Users can update own decks"
ON decks FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- DELETE: Użytkownik może usuwać tylko własne talie
CREATE POLICY "Users can delete own decks"
ON decks FOR DELETE
TO authenticated
USING (user_id = auth.uid());
```

**Polityki dla roli `anon`:**
- Brak dostępu

---

### 5.3 flashcards

**Polityki dla roli `authenticated`:**

```sql
-- SELECT: Użytkownik widzi fiszki ze swoich talii
CREATE POLICY "Users can view flashcards from own decks"
ON flashcards FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM decks
    WHERE decks.id = flashcards.deck_id
    AND decks.user_id = auth.uid()
  )
);

-- INSERT: Użytkownik może dodawać fiszki tylko do swoich talii
CREATE POLICY "Users can create flashcards in own decks"
ON flashcards FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM decks
    WHERE decks.id = flashcards.deck_id
    AND decks.user_id = auth.uid()
  )
);

-- UPDATE: Użytkownik może edytować fiszki ze swoich talii
CREATE POLICY "Users can update flashcards in own decks"
ON flashcards FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM decks
    WHERE decks.id = flashcards.deck_id
    AND decks.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM decks
    WHERE decks.id = flashcards.deck_id
    AND decks.user_id = auth.uid()
  )
);

-- DELETE: Użytkownik może usuwać fiszki ze swoich talii
CREATE POLICY "Users can delete flashcards from own decks"
ON flashcards FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM decks
    WHERE decks.id = flashcards.deck_id
    AND decks.user_id = auth.uid()
  )
);
```

**Polityki dla roli `anon`:**
- Brak dostępu

**Uwagi:**
- Polityki używają subquery do weryfikacji własności przez tabelę `decks`
- Taka konstrukcja wymaga, aby PostgreSQL wykonał JOIN podczas sprawdzania RLS

---

### 5.4 generation_events

**Polityki dla roli `authenticated`:**

```sql
-- SELECT: Użytkownik widzi tylko własne eventy
CREATE POLICY "Users can view own generation events"
ON generation_events FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- INSERT: Użytkownik może tworzyć eventy tylko dla siebie
CREATE POLICY "Users can create own generation events"
ON generation_events FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- UPDATE: Brak polityki - eventy są immutable (tylko INSERT)

-- DELETE: Brak polityki - eventy usuwane tylko przez CASCADE
```

**Polityki dla roli `anon`:**
- Brak dostępu (tabela analityczna tylko dla zalogowanych)

---

## 6. Triggery i funkcje

### 6.1 Automatyczne tworzenie profilu przy rejestracji

```sql
-- Funkcja tworząca profil
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, created_at, updated_at)
  VALUES (
    NEW.id,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger na auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_for_user();
```

**Uwagi:**
- `SECURITY DEFINER` pozwala funkcji na INSERT do `profiles` mimo RLS
- Domyślne wartości: `monthly_ai_flashcards_count = 0`, `ai_limit_reset_date = CURRENT_DATE`

---

### 6.2 Automatyczna aktualizacja updated_at

```sql
-- Uniwersalna funkcja aktualizująca updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger dla profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger dla decks
CREATE TRIGGER update_decks_updated_at
  BEFORE UPDATE ON decks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger dla flashcards
CREATE TRIGGER update_flashcards_updated_at
  BEFORE UPDATE ON flashcards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Uwagi:**
- Jedna funkcja obsługuje wszystkie tabele z kolumną `updated_at`
- `BEFORE UPDATE` zapewnia aktualizację przed zapisem do bazy

---

## 7. Zapytania pomocnicze dla aplikacji

### 7.1 Pobieranie fiszek do powtórki (wszystkie talie)

```sql
SELECT f.*
FROM flashcards f
INNER JOIN decks d ON f.deck_id = d.id
WHERE d.user_id = auth.uid()
  AND f.next_review <= NOW()
ORDER BY f.next_review ASC;
```

---

### 7.2 Pobieranie fiszek do powtórki (konkretna talia)

```sql
SELECT f.*
FROM flashcards f
WHERE f.deck_id = $1
  AND f.next_review <= NOW()
ORDER BY f.next_review ASC;
```
(RLS automatycznie sprawdzi, czy talia należy do użytkownika)

---

### 7.3 Liczba fiszek do powtórki na dziś (dashboard)

```sql
SELECT COUNT(*)
FROM flashcards f
INNER JOIN decks d ON f.deck_id = d.id
WHERE d.user_id = auth.uid()
  AND f.next_review <= NOW();
```

---

### 7.4 Metadane talii (liczba fiszek, fiszki do powtórki)

```sql
SELECT
  d.id,
  d.name,
  COUNT(f.id) AS total_flashcards,
  COUNT(CASE WHEN f.next_review <= NOW() THEN 1 END) AS due_flashcards
FROM decks d
LEFT JOIN flashcards f ON d.id = f.deck_id
WHERE d.user_id = auth.uid()
GROUP BY d.id, d.name
ORDER BY d.created_at DESC;
```

---

### 7.5 Wskaźnik akceptacji fiszek AI (KPI)

```sql
SELECT
  COUNT(CASE WHEN event_type IN ('ACCEPTED', 'EDITED') THEN 1 END) * 100.0 /
  NULLIF(COUNT(CASE WHEN event_type = 'GENERATED' THEN 1 END), 0) AS acceptance_rate
FROM generation_events
WHERE user_id = $1
  AND created_at >= $2  -- np. początek tygodnia
  AND created_at < $3;  -- koniec tygodnia
```

---

### 7.6 Udział AI w tworzeniu fiszek (KPI)

```sql
SELECT
  COUNT(CASE WHEN source = 'ai' THEN 1 END) * 100.0 /
  NULLIF(COUNT(*), 0) AS ai_share
FROM flashcards f
INNER JOIN decks d ON f.deck_id = d.id
WHERE d.user_id = $1;
```

---

### 7.7 Sprawdzanie i reset limitu AI (lazy reset w aplikacji)

```sql
-- Sprawdzenie limitu
SELECT
  monthly_ai_flashcards_count,
  ai_limit_reset_date
FROM profiles
WHERE user_id = auth.uid();

-- Reset limitu (jeśli minął miesiąc)
UPDATE profiles
SET
  monthly_ai_flashcards_count = 0,
  ai_limit_reset_date = CURRENT_DATE
WHERE user_id = auth.uid()
  AND ai_limit_reset_date < DATE_TRUNC('month', CURRENT_DATE);
```

**Uwaga:** Logika resetu implementowana w aplikacji (lazy reset przy każdym generowaniu).

---

## 8. Notatki implementacyjne

### 8.1 UUID v7 vs UUID v4

**Decyzja:** Użycie standardowego `gen_random_uuid()` (UUID v4)

**Uzasadnienie:**
- PostgreSQL natywnie nie wspiera UUID v7 (wymaga rozszerzenia lub własnej funkcji)
- Supabase może nie mieć zainstalowanego rozszerzenia UUID v7
- Kolumna `created_at` zapewnia sortowalność czasową
- Dla MVP różnica w wydajności jest marginalna

**Alternatywa dla przyszłości:**
Jeśli wydajność wymaga UUID v7, można użyć rozszerzenia `pg_uuidv7`:
```sql
CREATE EXTENSION IF NOT EXISTS pg_uuidv7;
ALTER TABLE decks ALTER COLUMN id SET DEFAULT uuid_generate_v7();
```

---

### 8.2 Reset limitu AI

**Implementacja:** Lazy reset w aplikacji

**Algorytm:**
```typescript
// Przed każdym generowaniem sprawdzaj:
if (profile.ai_limit_reset_date < startOfMonth(new Date())) {
  // Reset limitu
  await supabase
    .from('profiles')
    .update({
      monthly_ai_flashcards_count: 0,
      ai_limit_reset_date: startOfMonth(new Date())
    })
    .eq('user_id', userId);
}
```

**Alternatywy:**
- Cron job w Supabase (pg_cron) - wymaga Edge Functions lub Database Webhooks
- Zewnętrzny scheduler (np. GitHub Actions cron) - dodatkowa infrastruktura

---

### 8.3 Walidacja danych

**Podwójne zabezpieczenie:**
1. **CHECK constraints w bazie** - ostateczna linia obrony
2. **Zod schemas w aplikacji** - walidacja przed wysłaniem do bazy

**Przykład (front fiszki):**
```typescript
// W aplikacji (Zod)
const flashcardSchema = z.object({
  front: z.string().min(1).max(200),
  back: z.string().min(1).max(500)
});

// W bazie (CHECK constraint)
-- CHECK (char_length(front) <= 200 AND char_length(front) >= 1)
```

---

### 8.4 Wydajność zapytań o powtórki

**Problem:** Filtrowanie fiszek przez JOIN z `decks` może być kosztowne.

**Rozwiązanie:** Indeks composite `idx_flashcards_review_queue` na `(deck_id, next_review)`

**Query plan (oczekiwany):**
```
Index Scan using idx_flashcards_review_queue on flashcards
  Index Cond: (next_review <= NOW())
  -> Nested Loop
       -> Index Scan using idx_decks_user on decks
            Index Cond: (user_id = auth.uid())
```

**Monitorowanie:**
```sql
EXPLAIN ANALYZE
SELECT f.* FROM flashcards f
INNER JOIN decks d ON f.deck_id = d.id
WHERE d.user_id = 'xxx'
  AND f.next_review <= NOW();
```

---

### 8.5 Denormalizacja (przyszłość)

**Dla MVP:** Brak denormalizacji (prostota > wydajność)

**Jeśli wydajność będzie problemem:**
- Dodać `user_id` do `flashcards` (denormalizacja z `decks`)
- Usunąć JOIN z zapytań o powtórki
- Dodać trigger sync na `decks` UPDATE

**Trade-off:**
- ✅ Szybsze zapytania (bez JOIN)
- ❌ Więcej miejsca w bazie
- ❌ Trigger sync (złożoność)

---

## 9. Migracja startowa (checklist)

### 9.1 Kolejność wykonania

1. **Typy wyliczeniowe** (`source_type`, `event_type`)
2. **Tabela `profiles`**
3. **Tabela `decks`**
4. **Tabela `flashcards`**
5. **Tabela `generation_events`**
6. **Indeksy**
7. **Triggery i funkcje**
8. **RLS policies**

### 9.2 Weryfikacja po migracji

```sql
-- 1. Sprawdzenie tabel
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Sprawdzenie RLS
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public';

-- 3. Sprawdzenie polityk
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- 4. Sprawdzenie indeksów
SELECT tablename, indexname FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename;

-- 5. Sprawdzenie triggerów
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;
```

---

## 10. Podsumowanie decyzji architektonicznych

| Decyzja | Uzasadnienie |
|---------|--------------|
| Jedna tabela `flashcards` z kolumną `source` | Prostota schematu, uniknięcie duplikacji logiki FSRS |
| Parametry FSRS w `flashcards` (bez osobnej tabeli) | Zawsze pobierane razem z fiszką, brak potrzeby JOIN |
| Limit AI w `profiles` (nie osobna tabela) | Jedna wartość per użytkownik, brak historii limitów |
| Brak tabeli sesji nauki | Parametry aktualizowane bezpośrednio, brak potrzeby historii sesji |
| Nullable FK `flashcard_id` z SET NULL | Zachowanie historii eventów przy usunięciu fiszki |
| UUID v4 zamiast UUID v7 | Brak natywnego wsparcia w PostgreSQL, `created_at` dla sortowalności |
| Lazy reset limitu AI | Prostota implementacji, brak dodatkowej infrastruktury (cron) |
| Granularne polityki RLS | Bezpieczeństwo i zgodność z best practices Supabase |
| TEXT z CHECK constraints zamiast VARCHAR(n) | Elastyczność PostgreSQL, CHECK zapewnia walidację |
| Brak denormalizacji | Prostota dla MVP, możliwość optymalizacji w przyszłości |
| Composite indexes | Zoptymalizowane pod konkretne query patterns |
| Trigger tworzenia profilu | Automatyzacja, spójność danych |
| UNIQUE(user_id, name) na `decks` | Zapobieganie duplikatom nazw talii u użytkownika |

---

## 11. Zgodność z PRD

| Wymaganie PRD | Implementacja w schemacie |
|---------------|---------------------------|
| FR-001 do FR-006: Autentykacja | Supabase Auth + tabela `profiles` z triggerem |
| FR-007 do FR-020: Generowanie AI | Tabela `generation_events`, limit w `profiles`, CHECK constraints |
| FR-021 do FR-025: Manualne fiszki | Kolumna `source` w `flashcards`, brak limitu |
| FR-026 do FR-033: Zarządzanie taliami | Tabela `decks`, CASCADE delete, UNIQUE constraint |
| FR-034 do FR-036: Zarządzanie fiszkami | Operacje CRUD w `flashcards`, CHECK constraints |
| FR-037 do FR-047: FSRS | Parametry FSRS w `flashcards`, indeksy na `next_review` |
| FR-054 do FR-058: Logowanie | Tabela `generation_events` |
| FR-059 do FR-062: RODO | CASCADE delete na wszystkich relacjach |

---

## 12. Następne kroki

1. **Implementacja migracji:** Utworzenie pliku SQL z całym schematem
2. **Generowanie typów TypeScript:** `supabase gen types typescript` dla `database.types.ts`
3. **Testy RLS:** Weryfikacja polityk z różnymi użytkownikami
4. **Seeding danych testowych:** Utworzenie przykładowych talii i fiszek
5. **Monitorowanie wydajności:** `EXPLAIN ANALYZE` dla krytycznych zapytań
6. **Dokumentacja API:** Opis endpointów korzystających ze schematu

---

**Wersja:** 1.0
**Data:** 2024-12-10
**Status:** Gotowy do implementacji
