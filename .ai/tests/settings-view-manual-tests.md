# Testy manualne - Widok Ustawień (`/settings`)

## Informacje ogólne

- **Widok:** `/settings`
- **Wymagania:** Zalogowany użytkownik
- **Data utworzenia:** 2026-01-04
- **Status:** Do wykonania

---

## 1. Test nawigacji i autentykacji

### TC-001: Dostęp do strony ustawień (zalogowany użytkownik)

**Warunki wstępne:**

- Użytkownik jest zalogowany

**Kroki:**

1. Otwórz stronę `/dashboard`
2. Kliknij na menu użytkownika (avatar/email w prawym górnym rogu)
3. Wybierz opcję "Ustawienia" z dropdown menu

**Oczekiwany rezultat:**

- ✅ Strona `/settings` została załadowana
- ✅ Wyświetla się nagłówek "Ustawienia"
- ✅ Widoczny jest przycisk "Wróć do dashboardu" (strzałka w lewo)
- ✅ Wyświetlają się 3 sekcje: Informacje o koncie, Limit fiszek AI, Strefa niebezpieczna

---

### TC-002: Dostęp do strony ustawień (niezalogowany użytkownik)

**Warunki wstępne:**

- Użytkownik NIE jest zalogowany

**Kroki:**

1. Wyloguj się (jeśli zalogowany)
2. Wpisz w przeglądarce URL: `http://localhost:3000/settings`

**Oczekiwany rezultat:**

- ✅ Nastąpiło przekierowanie do `/login?redirect=/settings`
- ✅ Strona logowania wyświetla formularz logowania
- ✅ Po zalogowaniu użytkownik zostanie przekierowany z powrotem do `/settings`

---

### TC-003: Przycisk "Wróć do dashboardu"

**Kroki:**

1. Będąc na stronie `/settings`
2. Kliknij przycisk ze strzałką w lewo (obok nagłówka "Ustawienia")

**Oczekiwany rezultat:**

- ✅ Nastąpiła nawigacja do `/dashboard`

---

## 2. Test sekcji "Informacje o koncie"

### TC-004: Wyświetlanie adresu email

**Kroki:**

1. Zaloguj się na konto z emailem `test@example.com`
2. Przejdź do `/settings`
3. Sprawdź sekcję "Informacje o koncie"

**Oczekiwany rezultat:**

- ✅ Wyświetla się karta z tytułem "Informacje o koncie"
- ✅ Etykieta "Email" jest widoczna
- ✅ Adres email użytkownika (`test@example.com`) jest wyświetlony w czcionce monospace
- ✅ Layout jest responsywny (na mobile etykieta i wartość w kolumnie, na desktop w wierszu)

---

## 3. Test sekcji "Limit fiszek AI"

### TC-005: Wyświetlanie statusu limitu (0 fiszek wygenerowanych)

**Warunki wstępne:**

- Użytkownik nie wygenerował jeszcze żadnych fiszek AI w tym miesiącu

**Kroki:**

1. Przejdź do `/settings`
2. Sprawdź sekcję "Limit fiszek AI"

**Oczekiwany rezultat:**

- ✅ Tytuł "Limit fiszek AI" jest widoczny
- ✅ Opis "Możesz wygenerować do 200 fiszek miesięcznie..." jest widoczny
- ✅ Licznik pokazuje: "0 / 200 fiszek w tym miesiącu"
- ✅ Pasek postępu jest pusty (0%)
- ✅ Data resetu jest w formacie DD.MM.YYYY (np. "01.02.2026")

---

### TC-006: Wyświetlanie statusu limitu (50 fiszek wygenerowanych)

**Warunki wstępne:**

- Użytkownik wygenerował 50 fiszek AI w tym miesiącu

**Kroki:**

1. Wygeneruj 50 fiszek AI (lub użyj konta testowego z 50 fiszkami)
2. Przejdź do `/settings`
3. Sprawdź sekcję "Limit fiszek AI"

**Oczekiwany rezultat:**

- ✅ Licznik pokazuje: "50 / 200 fiszek w tym miesiącu"
- ✅ Pasek postępu jest wypełniony w 25%
- ✅ Kolor paska postępu jest niebieski (primary)

---

### TC-007: Wyświetlanie statusu limitu (200 fiszek - limit wyczerpany)

**Warunki wstępne:**

- Użytkownik wygenerował 200 fiszek AI (limit wyczerpany)

**Kroki:**

1. Wygeneruj 200 fiszek AI (lub użyj konta testowego)
2. Przejdź do `/settings`
3. Sprawdź sekcję "Limit fiszek AI"

**Oczekiwany rezultat:**

- ✅ Licznik pokazuje: "200 / 200 fiszek w tym miesiącu"
- ✅ Pasek postępu jest wypełniony w 100%

---

### TC-008: Formatowanie daty resetu

**Kroki:**

1. Sprawdź sekcję "Limit fiszek AI"
2. Zweryfikuj format daty resetu

**Oczekiwany rezultat:**

- ✅ Data jest w formacie DD.MM.YYYY (np. "01.02.2026")
- ✅ Tekst brzmi: "Limit odnowi się: DD.MM.YYYY"

---

## 4. Test sekcji "Strefa niebezpieczna" - Usuwanie konta

### TC-009: Wyświetlanie sekcji "Strefa niebezpieczna"

**Kroki:**

1. Przejdź do `/settings`
2. Przewiń do sekcji "Strefa niebezpieczna"

**Oczekiwany rezultat:**

- ✅ Karta ma czerwonawy/pomarańczowy border (destructive)
- ✅ Tło karty jest lekko czerwonawe (destructive/5)
- ✅ Tytuł "Strefa niebezpieczna" jest w kolorze czerwonym
- ✅ Opis ostrzega o nieodwracalności operacji
- ✅ Przycisk "Usuń konto" ma wariant destructive (czerwony)

---

### TC-010: Otwieranie dialogu usuwania konta (Krok 1 - Warning)

**Kroki:**

1. Kliknij przycisk "Usuń konto"

**Oczekiwany rezultat:**

- ✅ Dialog się otworzył
- ✅ Tytuł dialogu: "Czy na pewno chcesz usunąć konto?"
- ✅ Wyświetla się lista konsekwencji:
  - Wszystkie Twoje talie
  - Wszystkie fiszki
  - Historia nauki i logi powtórek
  - Parametry algorytmu FSRS
  - Konto użytkownika
- ✅ Widoczne są dwa przyciski: "Anuluj" i "Kontynuuj"
- ✅ Przycisk "Kontynuuj" ma wariant destructive (czerwony)

---

### TC-011: Anulowanie w kroku 1 (Warning)

**Kroki:**

1. Otwórz dialog usuwania konta
2. Kliknij przycisk "Anuluj"

**Oczekiwany rezultat:**

- ✅ Dialog się zamknął
- ✅ Użytkownik wrócił do strony ustawień
- ✅ Stan dialogu został zresetowany

---

### TC-012: Zamykanie dialogu przez ESC

**Kroki:**

1. Otwórz dialog usuwania konta
2. Naciśnij klawisz ESC

**Oczekiwany rezultat:**

- ✅ Dialog się zamknął
- ✅ Stan dialogu został zresetowany

---

### TC-013: Zamykanie dialogu przez kliknięcie overlay

**Kroki:**

1. Otwórz dialog usuwania konta
2. Kliknij w ciemny obszar poza dialogiem (overlay)

**Oczekiwany rezultat:**

- ✅ Dialog się zamknął
- ✅ Stan dialogu został zresetowany

---

### TC-014: Przejście do kroku 2 (Confirmation)

**Kroki:**

1. Otwórz dialog usuwania konta
2. Kliknij przycisk "Kontynuuj"

**Oczekiwany rezultat:**

- ✅ Dialog zmienił zawartość na krok 2
- ✅ Tytuł dialogu: "Potwierdź usunięcie"
- ✅ Instrukcja: "Aby potwierdzić usunięcie konta, wpisz dokładnie: DELETE"
- ✅ Widoczne jest pole input z placeholderem "Wpisz DELETE"
- ✅ Pole input ma czcionkę monospace
- ✅ Widoczne są dwa przyciski: "Anuluj" i "Potwierdź usunięcie"
- ✅ Przycisk "Potwierdź usunięcie" jest DISABLED (nieaktywny)

---

### TC-015: Walidacja tekstu potwierdzenia - pusty input

**Warunki wstępne:**

- Jesteś w kroku 2 dialogu

**Kroki:**

1. Pozostaw pole input puste
2. Sprawdź stan przycisku "Potwierdź usunięcie"

**Oczekiwany rezultat:**

- ✅ Przycisk "Potwierdź usunięcie" jest DISABLED
- ✅ Brak komunikatu o błędzie (pole puste)

---

### TC-016: Walidacja tekstu potwierdzenia - nieprawidłowy tekst

**Warunki wstępne:**

- Jesteś w kroku 2 dialogu

**Kroki:**

1. Wpisz w pole input tekst: `delete` (małe litery)
2. Sprawdź komunikaty

**Oczekiwany rezultat:**

- ✅ Pojawił się komunikat walidacji: "Tekst musi być dokładnie: DELETE"
- ✅ Komunikat jest w kolorze czerwonym (destructive)
- ✅ Przycisk "Potwierdź usunięcie" jest DISABLED

---

### TC-017: Walidacja tekstu potwierdzenia - inne warianty

**Kroki:**
Wypróbuj następujące warianty tekstu:

- `Delete` (wielka litera na początku)
- `DELETE ` (spacja na końcu)
- ` DELETE` (spacja na początku)
- `usuń`
- `USUŃ`

**Oczekiwany rezultat dla KAŻDEGO wariantu:**

- ✅ Pojawił się komunikat walidacji: "Tekst musi być dokładnie: DELETE"
- ✅ Przycisk "Potwierdź usunięcie" jest DISABLED

---

### TC-018: Walidacja tekstu potwierdzenia - poprawny tekst

**Kroki:**

1. Wpisz w pole input tekst: `DELETE` (dokładnie, bez spacji)

**Oczekiwany rezultat:**

- ✅ Komunikat walidacji zniknął
- ✅ Przycisk "Potwierdź usunięcie" jest ENABLED (aktywny)

---

### TC-019: Anulowanie w kroku 2

**Kroki:**

1. Przejdź do kroku 2
2. Wpisz tekst w pole input
3. Kliknij przycisk "Anuluj"

**Oczekiwany rezultat:**

- ✅ Dialog się zamknął
- ✅ Stan dialogu został zresetowany (przy ponownym otwarciu jest krok 1)

---

### TC-020: Usuwanie konta - sukces

**⚠️ UWAGA: Ten test usunie konto! Użyj konta testowego!**

**Warunki wstępne:**

- Użyj TESTOWEGO konta, które można usunąć
- Zapisz dane logowania przed testem (jeśli potrzebujesz je odtworzyć)

**Kroki:**

1. Zaloguj się na konto testowe
2. Przejdź do `/settings`
3. Otwórz dialog usuwania konta
4. Kliknij "Kontynuuj"
5. Wpisz `DELETE` w pole input
6. Kliknij "Potwierdź usunięcie"

**Oczekiwany rezultat:**

- ✅ Przycisk zmienił tekst na "Usuwanie..."
- ✅ Przycisk stał się DISABLED podczas operacji
- ✅ Po chwili nastąpiło przekierowanie do `/login`
- ✅ Sesja użytkownika została zakończona
- ✅ Próba zalogowania się tym samym kontem kończy się błędem (konto nie istnieje)

**Weryfikacja w bazie danych (opcjonalnie):**

- ✅ Rekord użytkownika został usunięty z tabeli `auth.users`
- ✅ Rekord profilu został usunięty z tabeli `profiles`
- ✅ Wszystkie talie użytkownika zostały usunięte (kaskadowo)
- ✅ Wszystkie fiszki użytkownika zostały usunięte (kaskadowo)

---

### TC-021: Usuwanie konta - błąd 401 (sesja wygasła)

**Kroki:**

1. Otwórz dialog usuwania konta
2. Przejdź do kroku 2
3. **Symulacja:** W DevTools → Network → kliknij "Offline" lub wyloguj się w innej karcie
4. Wpisz `DELETE` i kliknij "Potwierdź usunięcie"

**Oczekiwany rezultat:**

- ✅ Nastąpiło przekierowanie do `/login`

---

### TC-022: Usuwanie konta - błąd 400 (nieprawidłowe potwierdzenie)

**Kroki:**

1. Otwórz dialog usuwania konta
2. Przejdź do kroku 2
3. **Symulacja:** W konsoli deweloperskiej zmień walidację tak, by przycisk był enabled mimo błędnego tekstu, LUB zmodyfikuj tymczasowo kod
4. Wyślij request z nieprawidłowym tekstem potwierdzenia

**Oczekiwany rezultat:**

- ✅ Wyświetlił się komunikat błędu: "Nieprawidłowy tekst potwierdzenia"
- ✅ Komunikat jest w czerwonym Alert (variant="destructive")
- ✅ Dialog pozostał otwarty
- ✅ Użytkownik może spróbować ponownie

---

### TC-023: Usuwanie konta - błąd 500 (błąd serwera)

**Kroki:**

1. **Symulacja:** Tymczasowo zmodyfikuj backend aby zwracał 500 dla DELETE /api/account
2. Otwórz dialog usuwania konta
3. Przejdź do kroku 2
4. Wpisz `DELETE` i kliknij "Potwierdź usunięcie"

**Oczekiwany rezultat:**

- ✅ Wyświetlił się komunikat błędu: "Nie udało się usunąć konta. Spróbuj ponownie."
- ✅ Komunikat jest w czerwonym Alert (variant="destructive")
- ✅ Dialog pozostał otwarty
- ✅ Przycisk "Potwierdź usunięcie" jest ponownie aktywny (nie jest już "Usuwanie...")
- ✅ Użytkownik może spróbować ponownie

---

### TC-024: Usuwanie konta - błąd sieci (brak połączenia)

**Kroki:**

1. Otwórz dialog usuwania konta
2. Przejdź do kroku 2
3. W DevTools → Network → wybierz "Offline"
4. Wpisz `DELETE` i kliknij "Potwierdź usunięcie"

**Oczekiwany rezultat:**

- ✅ Wyświetlił się komunikat błędu: "Nie udało się połączyć z serwerem"
- ✅ Dialog pozostał otwarty
- ✅ Użytkownik może spróbować ponownie po przywróceniu połączenia

---

## 5. Test stanów ładowania i błędów

### TC-025: Stan ładowania strony

**Kroki:**

1. **Symulacja:** Dodaj opóźnienie (delay) w hooku useSettings w funkcji fetchProfile
2. Odśwież stronę `/settings`

**Oczekiwany rezultat:**

- ✅ Wyświetla się spinner (Loader2 z lucide-react)
- ✅ Tekst: "Ładowanie ustawień..."
- ✅ Spinner jest wyśrodkowany
- ✅ Po załadowaniu danych wyświetla się normalna zawartość

---

### TC-026: Błąd ładowania profilu (500)

**Kroki:**

1. **Symulacja:** Zmodyfikuj endpoint GET /api/profile aby zwracał 500
2. Odśwież stronę `/settings`

**Oczekiwany rezultat:**

- ✅ Wyświetlił się czerwony Alert z komunikatem:
  - "Nie udało się załadować ustawień"
  - "Nie udało się załadować danych. Sprawdź połączenie i spróbuj ponownie."
- ✅ Widoczny jest przycisk "Spróbuj ponownie"
- ✅ Kliknięcie przycisku ponownie wywołuje fetchProfile

---

### TC-027: Błąd ładowania profilu (404 - profil nie znaleziony)

**Kroki:**

1. **Symulacja:** Zmodyfikuj endpoint GET /api/profile aby zwracał 404
2. Odśwież stronę `/settings`

**Oczekiwany rezultat:**

- ✅ Wyświetlił się czerwony Alert z komunikatem:
  - "Nie udało się załadować ustawień"
  - "Nie znaleziono profilu użytkownika"
- ✅ Widoczny jest przycisk "Spróbuj ponownie"

---

### TC-028: Retry po błędzie

**Kroki:**

1. Wywołaj błąd 500 (TC-026)
2. **Przywróć** normalny endpoint GET /api/profile
3. Kliknij przycisk "Spróbuj ponownie"

**Oczekiwany rezultat:**

- ✅ Wyświetlił się stan ładowania
- ✅ Po chwili wyświetliła się normalna zawartość strony
- ✅ Wszystkie sekcje są poprawnie wypełnione danymi

---

## 6. Test responsywności

### TC-029: Widok mobile (375px - iPhone SE)

**Kroki:**

1. Otwórz DevTools (F12)
2. Przełącz na widok mobile (Ctrl+Shift+M)
3. Ustaw rozdzielczość: 375x667 (iPhone SE)
4. Przejdź do `/settings`

**Oczekiwany rezultat:**

- ✅ Nagłówek z przyciskiem wstecz jest czytelny
- ✅ Wszystkie karty zajmują pełną szerokość
- ✅ W sekcji "Informacje o koncie": etykieta "Email" i wartość są w kolumnie (jeden pod drugim)
- ✅ Pasek postępu jest czytelny
- ✅ Przycisk "Usuń konto" zajmuje odpowiednią szerokość
- ✅ Dialog usuwania konta mieści się na ekranie
- ✅ Tekst w dialogu jest czytelny
- ✅ Przyciski w dialogu są dostępne

---

### TC-030: Widok tablet (768px - iPad)

**Kroki:**

1. Ustaw rozdzielczość: 768x1024 (iPad)
2. Przejdź do `/settings`

**Oczekiwany rezultat:**

- ✅ Layout jest czytelny
- ✅ W sekcji "Informacje o koncie": etykieta i wartość mogą być obok siebie (sm:flex-row)
- ✅ Wszystkie elementy są dobrze rozmieszczone

---

### TC-031: Widok desktop (1920px)

**Kroki:**

1. Ustaw rozdzielczość: 1920x1080
2. Przejdź do `/settings`

**Oczekiwany rezultat:**

- ✅ Zawartość jest wyśrodkowana (container mx-auto)
- ✅ Maksymalna szerokość jest zachowana
- ✅ Układ jest czytelny i estetyczny
- ✅ Dialog jest wyśrodkowany

---

## 7. Test dostępności (Accessibility)

### TC-032: Nawigacja klawiaturą - strona główna

**Kroki:**

1. Otwórz `/settings`
2. Nawiguj używając klawisza TAB

**Oczekiwany rezultat:**

- ✅ Focus przechodzi kolejno przez:
  1. Przycisk "Wróć do dashboardu"
  2. Przycisk "Usuń konto"
- ✅ Każdy element ma widoczny focus outline
- ✅ Focus nie przeskakuje nieoczekiwanie

---

### TC-033: Nawigacja klawiaturą - dialog (Krok 1)

**Kroki:**

1. Otwórz dialog usuwania konta
2. Nawiguj używając klawisza TAB

**Oczekiwany rezultat:**

- ✅ Focus jest "uwięziony" w dialogu (focus trap)
- ✅ Focus przechodzi między przyciskami: "Anuluj" → "Kontynuuj"
- ✅ Po ostatnim elemencie TAB wraca do pierwszego
- ✅ Shift+TAB działa wstecz

---

### TC-034: Nawigacja klawiaturą - dialog (Krok 2)

**Kroki:**

1. Przejdź do kroku 2 dialogu
2. Nawiguj używając klawisza TAB

**Oczekiwany rezultat:**

- ✅ Focus jest "uwięziony" w dialogu (focus trap)
- ✅ Focus przechodzi: Input → "Anuluj" → "Potwierdź usunięcie"
- ✅ Po ostatnim elemencie TAB wraca do pierwszego

---

### TC-035: Zamykanie dialogu klawiszem ENTER/SPACE

**Kroki:**

1. Otwórz dialog (krok 1)
2. Nawiguj TAB do przycisku "Anuluj"
3. Naciśnij ENTER

**Oczekiwany rezultat:**

- ✅ Dialog się zamknął

**Powtórz z:**

- ✅ Klawiszem SPACE na przycisku "Anuluj" - dialog się zamknął
- ✅ Klawiszem ENTER na przycisku "Kontynuuj" - przeszło do kroku 2

---

### TC-036: Screen reader - ARIA labels

**Narzędzia:** NVDA (Windows), JAWS, VoiceOver (Mac)

**Kroki:**

1. Włącz screen reader
2. Nawiguj po stronie `/settings`

**Oczekiwany rezultat:**

- ✅ Przycisk wstecz ma aria-label: "Wróć do dashboardu"
- ✅ Pasek postępu ma aria-label z informacją o procentowym wykorzystaniu
- ✅ Dialog ma odpowiednie role (dialog, alertdialog)
- ✅ Tytuły sekcji są ogłaszane jako headings
- ✅ Wszystkie interaktywne elementy mają czytelne etykiety

---

### TC-037: Kontrast kolorów (WCAG 2.1 AA)

**Narzędzia:** Chrome DevTools Lighthouse, Axe DevTools

**Kroki:**

1. Otwórz `/settings`
2. Uruchom Lighthouse audit (kategoria: Accessibility)

**Oczekiwany rezultat:**

- ✅ Wszystkie teksty mają kontrast minimum 4.5:1 (tekst normalny) lub 3:1 (tekst duży)
- ✅ Przycisk "Usuń konto" (destructive) ma odpowiedni kontrast
- ✅ Tytuł "Strefa niebezpieczna" (red) ma kontrast minimum 4.5:1
- ✅ Komunikaty błędów (czerwony alert) mają kontrast minimum 4.5:1

---

## 8. Test edge cases

### TC-038: Bardzo długi adres email

**Kroki:**

1. Utwórz konto z bardzo długim emailem (np. `very.long.email.address.for.testing@subdomain.example.com`)
2. Przejdź do `/settings`

**Oczekiwany rezultat:**

- ✅ Email jest wyświetlany w całości lub z odpowiednim word-wrap
- ✅ Nie przerywa layoutu strony
- ✅ Jest czytelny

---

### TC-039: Data resetu w formacie brzegowym

**Kroki:**

1. Sprawdź datę resetu dla daty: `2026-12-31` (31 grudnia)

**Oczekiwany rezultat:**

- ✅ Data jest poprawnie sformatowana: "31.12.2026"

---

### TC-040: Równoczesne otwieranie dialogów

**Kroki:**

1. Otwórz `/settings`
2. Kliknij szybko dwukrotnie "Usuń konto"

**Oczekiwany rezultat:**

- ✅ Otworzy się tylko jeden dialog
- ✅ Brak duplikatów overlay
- ✅ Brak błędów w konsoli

---

## 9. Checklist finalny

Po wykonaniu wszystkich testów, upewnij się że:

- [ ] Wszystkie testy TC-001 do TC-040 przeszły pomyślnie
- [ ] Nie ma błędów w konsoli przeglądarki (F12 → Console)
- [ ] Nie ma ostrzeżeń w konsoli React (development mode)
- [ ] Lighthouse Accessibility Score ≥ 90
- [ ] Aplikacja działa w przeglądarkach:
  - [ ] Chrome/Edge (najnowsza wersja)
  - [ ] Firefox (najnowsza wersja)
  - [ ] Safari (najnowsza wersja - Mac/iOS)
- [ ] Responsywność sprawdzona na:
  - [ ] Mobile (375px)
  - [ ] Tablet (768px)
  - [ ] Desktop (1920px)

---

## 10. Zgłaszanie błędów

Jeśli test nie przeszedł, zgłoś błąd z następującymi informacjami:

- **ID testu:** (np. TC-015)
- **Nazwa testu:** (np. "Walidacja tekstu potwierdzenia - nieprawidłowy tekst")
- **Kroki do reprodukcji:** (dokładne kroki)
- **Oczekiwany rezultat:** (co powinno się stać)
- **Rzeczywisty rezultat:** (co się faktycznie stało)
- **Screenshot/wideo:** (jeśli możliwe)
- **Przeglądarka i wersja:** (np. Chrome 120.0.6099.109)
- **System operacyjny:** (np. Windows 11, macOS 14.2)
- **Logi z konsoli:** (jeśli są błędy)

---

## Status wykonania

| Kategoria                   | Testy wykonane | Testy przeszły | Status      |
| --------------------------- | -------------- | -------------- | ----------- |
| 1. Nawigacja i autentykacja | 0/3            | 0/3            | ⏳ Oczekuje |
| 2. Informacje o koncie      | 0/1            | 0/1            | ⏳ Oczekuje |
| 3. Limit fiszek AI          | 0/4            | 0/4            | ⏳ Oczekuje |
| 4. Usuwanie konta           | 0/16           | 0/16           | ⏳ Oczekuje |
| 5. Stany ładowania/błędów   | 0/4            | 0/4            | ⏳ Oczekuje |
| 6. Responsywność            | 0/3            | 0/3            | ⏳ Oczekuje |
| 7. Dostępność               | 0/6            | 0/6            | ⏳ Oczekuje |
| 8. Edge cases               | 0/3            | 0/3            | ⏳ Oczekuje |
| **RAZEM**                   | **0/40**       | **0/40**       | ⏳ Oczekuje |

---

**Data ostatniej aktualizacji:** 2026-01-04
**Przygotował:** Claude Code (Sonnet 4.5)
