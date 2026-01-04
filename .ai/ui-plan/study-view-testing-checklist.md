# Checklista testów dla widoku Study View

## ✅ Testy funkcjonalne

### 1. Routing i autentykacja
- [ ] Strona `/study` przekierowuje do `/login` gdy użytkownik niezalogowany
- [ ] Strona `/study/{deckId}` przekierowuje do `/login` gdy użytkownik niezalogowany
- [ ] Nieprawidłowy UUID w `/study/{deckId}` przekierowuje do `/dashboard`
- [ ] Po zalogowaniu użytkownik jest przekierowany z powrotem do `/study`
- [ ] Po zalogowaniu użytkownik jest przekierowany z powrotem do `/study/{deckId}`

### 2. Ładowanie danych
- [ ] Spinner wyświetla się podczas ładowania fiszek
- [ ] Komunikat "Ładowanie fiszek..." jest widoczny
- [ ] Po załadowaniu fiszek spinner znika
- [ ] Stan loading ma poprawny `role="status"` dla screen readerów

### 3. Stan pusty (EmptyStudyState)
- [ ] Gdy brak fiszek do powtórki, wyświetla się EmptyStudyState
- [ ] Ikona BookOpen jest widoczna
- [ ] Komunikat "Brak fiszek do powtórki" jest wyświetlany
- [ ] Data najbliższej powtórki jest wyświetlana (jeśli dostępna)
- [ ] Przycisk "Wróć do dashboardu" działa poprawnie
- [ ] Z `/study` wraca do `/dashboard`
- [ ] Z `/study/{deckId}` wraca do `/decks/{deckId}`

### 4. Wyświetlanie fiszki
- [ ] Przód fiszki jest zawsze widoczny
- [ ] Etykieta "Pytanie:" jest widoczna
- [ ] Tekst fiszki jest czytelny i prawidłowo sformatowany
- [ ] Długie słowa łamią się poprawnie (break-words)
- [ ] Wieloliniowy tekst zachowuje formatowanie (whitespace-pre-wrap)
- [ ] Karta jest wycentrowana na ekranie

### 5. Przycisk "Pokaż odpowiedź"
- [ ] Przycisk jest widoczny przed odsłonięciem odpowiedzi
- [ ] Przycisk automatycznie otrzymuje focus
- [ ] Kliknięcie przycisku odsłania odpowiedź
- [ ] Przycisk znika po odsłonięciu odpowiedzi
- [ ] Aria-label informuje o skrócie klawiszowym (Space)

### 6. Odsłanianie odpowiedzi
- [ ] Po kliknięciu "Pokaż odpowiedź" wyświetla się separator (hr)
- [ ] Tył fiszki pojawia się z animacją
- [ ] Etykieta "Odpowiedź:" jest widoczna
- [ ] Tekst odpowiedzi jest czytelny
- [ ] Przyciski oceny pojawiają się po odsłonięciu
- [ ] Screen reader ogłasza pojawienie się odpowiedzi (aria-live="polite")

### 7. Przyciski oceny
- [ ] 4 przyciski są widoczne: Again, Hard, Good, Easy
- [ ] Przyciski mają odpowiednie kolory:
  - [ ] Again - czerwony (destructive)
  - [ ] Hard - pomarańczowy (outline)
  - [ ] Good - zielony (custom)
  - [ ] Easy - niebieski (custom)
- [ ] Kliknięcie przycisku wysyła ocenę do API
- [ ] Po wysłaniu oceny przechodzi do następnej karty
- [ ] Podczas wysyłania przyciski są disabled
- [ ] Podczas wysyłania pokazuje się spinner
- [ ] Aria-labels informują o skrótach klawiszowych

### 8. Pasek postępu
- [ ] Pasek postępu jest widoczny w headerze
- [ ] Tekst "X/Y kart" wyświetla się poprawnie
- [ ] Licznik aktualizuje się po każdej ocenionej fiszce
- [ ] Pasek wizualny wypełnia się proporcjonalnie
- [ ] Animacja paska jest płynna
- [ ] Atrybuty ARIA są poprawne (aria-valuenow, aria-valuemax)

### 9. Przycisk zamknięcia (X)
- [ ] Przycisk X jest widoczny w headerze
- [ ] Kliknięcie przycisku kończy sesję
- [ ] Z `/study` wraca do `/dashboard`
- [ ] Z `/study/{deckId}` wraca do `/decks/{deckId}`
- [ ] Aria-label "Zakończ sesję nauki" jest obecny

### 10. Zakończenie sesji (SessionComplete)
- [ ] Po ocenieniu wszystkich fiszek pokazuje się SessionComplete
- [ ] Ikona CheckCircle2 (zielona) jest widoczna
- [ ] Tytuł "Sesja zakończona" jest wyświetlany
- [ ] Komunikat "Ukończono X fiszek" jest poprawny
- [ ] Odmiana słowa "fiszka/fiszek" jest poprawna
- [ ] Przycisk "Wróć do dashboardu" działa

### 11. Obsługa błędów
- [ ] Błąd 401 (brak autentykacji) przekierowuje do `/login`
- [ ] Błąd 404 (talia nie znaleziona) wyświetla komunikat
- [ ] Błąd sieci wyświetla komunikat z przyciskiem retry
- [ ] Przycisk "Spróbuj ponownie" ponawia zapytanie
- [ ] Komunikat błędu ma `role="alert"` dla screen readerów
- [ ] Nieudane wysłanie oceny nie przerywa sesji (kontynuacja)

## ⌨️ Testy skrótów klawiszowych

### 12. Skrót: Space (odsłonięcie odpowiedzi)
- [ ] Space odsłania odpowiedź gdy jeszcze niewidoczna
- [ ] Space NIE działa gdy odpowiedź już odsłonięta
- [ ] Space NIE działa gdy focus w input/textarea
- [ ] Event.preventDefault() zapobiega scrollowaniu strony

### 13. Skróty: 1/A (Again)
- [ ] Klawisz "1" wysyła ocenę Again
- [ ] Klawisz "a" (małe) wysyła ocenę Again
- [ ] Klawisz "A" (duże) wysyła ocenę Again
- [ ] Działa tylko gdy odpowiedź odsłonięta
- [ ] NIE działa gdy trwa wysyłanie (isSubmitting)

### 14. Skróty: 2/H (Hard)
- [ ] Klawisz "2" wysyła ocenę Hard
- [ ] Klawisz "h" (małe) wysyła ocenę Hard
- [ ] Klawisz "H" (duże) wysyła ocenę Hard
- [ ] Działa tylko gdy odpowiedź odsłonięta
- [ ] NIE działa gdy trwa wysyłanie

### 15. Skróty: 3/G (Good)
- [ ] Klawisz "3" wysyła ocenę Good
- [ ] Klawisz "g" (małe) wysyła ocenę Good
- [ ] Klawisz "G" (duże) wysyła ocenę Good
- [ ] Działa tylko gdy odpowiedź odsłonięta
- [ ] NIE działa gdy trwa wysyłanie

### 16. Skróty: 4/E (Easy)
- [ ] Klawisz "4" wysyła ocenę Easy
- [ ] Klawisz "e" (małe) wysyła ocenę Easy
- [ ] Klawisz "E" (duże) wysyła ocenę Easy
- [ ] Działa tylko gdy odpowiedź odsłonięta
- [ ] NIE działa gdy trwa wysyłanie

### 17. Skrót: Escape (zakończenie sesji)
- [ ] Escape kończy sesję w każdym momencie
- [ ] Escape działa przed odsłonięciem odpowiedzi
- [ ] Escape działa po odsłonięciu odpowiedzi
- [ ] Escape przekierowuje do odpowiedniego URL
- [ ] Escape NIE działa gdy focus w input/textarea

## 📱 Testy responsywności (Mobile-First)

### 18. Mobile (< 640px)
- [ ] Nagłówek jest czytelny i nie zawija się
- [ ] Pasek postępu mieści się w headerze
- [ ] Karta fiszki zajmuje pełną szerokość (z paddingiem)
- [ ] Tekst fiszki jest czytelny (min. 16px)
- [ ] Przyciski oceny są w dwóch kolumnach (flex-wrap)
- [ ] Każdy przycisk ma min. 44px wysokości (touch target)
- [ ] Przyciski są wystarczająco duże dla kciuka
- [ ] Scroll działa płynnie
- [ ] Fixed header nie zasłania contentu

### 19. Tablet (640px - 1024px)
- [ ] Layout przechodzi w tryb szerszy
- [ ] Przyciski oceny mogą być w jednej linii
- [ ] Karta fiszki jest wycentrowana (max-w-2xl)
- [ ] Padding jest odpowiedni

### 20. Desktop (> 1024px)
- [ ] Karta fiszki jest wycentrowana
- [ ] Maksymalna szerokość jest zachowana (max-w-2xl)
- [ ] Przyciski oceny są w jednej linii
- [ ] Wszystkie elementy są czytelne

## 🌓 Testy ciemnego motywu

### 21. Light mode
- [ ] Wszystkie kolory są czytelne
- [ ] Kontrast tekstu jest wystarczający
- [ ] Przyciski są wyraźnie widoczne
- [ ] Karta ma odpowiednie cienie

### 22. Dark mode
- [ ] Tło jest ciemne (bg-background)
- [ ] Tekst jest jasny i czytelny
- [ ] Przyciski mają poprawne kolory dark mode:
  - [ ] Again - czerwony
  - [ ] Hard - pomarańczowy (dark:border-orange-400, dark:text-orange-400)
  - [ ] Good - zielony (dark:bg-green-700)
  - [ ] Easy - niebieski (dark:bg-blue-700)
- [ ] Karta ma odpowiednie tło i obramowanie
- [ ] Header ma backdrop-blur effect
- [ ] Prose content jest czytelne (dark:prose-invert)

### 23. Przełączanie motywów
- [ ] Przełączanie light/dark nie psuje layoutu
- [ ] Wszystkie elementy przełączają się płynnie
- [ ] Brak "flashowania" kolorów

## ♿ Testy dostępności (Accessibility)

### 24. Screen reader support
- [ ] Header ma poprawne role i aria-labels
- [ ] Pasek postępu ma `role="progressbar"`
- [ ] Stan loading ma `role="status"`
- [ ] Stan błędu ma `role="alert"`
- [ ] Karta ma `role="article"`
- [ ] Główna sekcja ma `role="application"`
- [ ] Ukryte komunikaty o skrótach (sr-only) działają
- [ ] Aria-live regions ogłaszają zmiany

### 25. Keyboard navigation
- [ ] Tab przechodzi przez interaktywne elementy
- [ ] Focus jest widoczny (outline)
- [ ] Przycisk "Pokaż odpowiedź" otrzymuje auto-focus
- [ ] Enter/Space aktywuje przyciski
- [ ] Kolejność tabulacji jest logiczna

### 26. ARIA attributes
- [ ] Wszystkie przyciski mają aria-label
- [ ] Aria-labels zawierają informację o skrótach
- [ ] Aria-live regions są odpowiednio ustawione (polite/assertive)
- [ ] Aria-atomic jest ustawione dla dynamicznych komunikatów
- [ ] Aria-hidden ukrywa dekoracyjne elementy (ikony, spinner)

### 27. Color contrast
- [ ] Tekst ma kontrast min. 4.5:1 (WCAG AA)
- [ ] Duży tekst ma kontrast min. 3:1
- [ ] Przyciski mają wystarczający kontrast
- [ ] Stan disabled jest wizualnie rozróżnialny

### 28. Touch targets
- [ ] Wszystkie przyciski mają min. 44x44px
- [ ] Odstępy między przyciskami są wystarczające
- [ ] Przyciski nie nakładają się na siebie

## 🚀 Testy wydajności

### 29. Rendering performance
- [ ] Komponenty nie re-renderują się niepotrzebnie
- [ ] useCallback/useMemo są użyte poprawnie
- [ ] Brak memory leaks (listeners są czyszczone)
- [ ] Animacje są płynne (60fps)

### 30. API calls
- [ ] Tylko jeden request przy montowaniu
- [ ] Request nie powtarza się przy re-renderach
- [ ] Błędy API są obsługiwane gracefully
- [ ] Retry działa poprawnie

### 31. Keyboard shortcuts cleanup
- [ ] Event listener jest dodawany tylko raz
- [ ] Event listener jest czyszczony przy unmount
- [ ] Brak konfliktów z innymi skrótami
- [ ] Skróty działają natychmiast (brak opóźnień)

## 📊 Testy integracji

### 32. Integracja z API
- [ ] Endpoint `/api/study/cards` zwraca fiszki
- [ ] Endpoint `/api/study/review` przyjmuje oceny
- [ ] Transformacja DTO → ViewModel działa
- [ ] Dane są wyświetlane poprawnie

### 33. Integracja z routing
- [ ] Przycisk X w headerze wraca do właściwej strony
- [ ] SessionComplete wraca do właściwej strony
- [ ] EmptyStudyState wraca do właściwej strony
- [ ] Wszystkie przekierowania zachowują kontekst (deckId)

### 34. Integracja z autentykacją
- [ ] Sesja wygasła (401) → redirect do /login z ?redirect
- [ ] Po zalogowaniu powrót do study view
- [ ] Brak infinite loops przy 401

## 🎨 Testy wizualne

### 35. Layout
- [ ] Wszystkie elementy są wycentrowane
- [ ] Padding i margins są konsystentne
- [ ] Brak overflowu poziomego
- [ ] Vertical rhythm jest zachowany

### 36. Typography
- [ ] Czcionki są czytelne
- [ ] Rozmiary tekstu są odpowiednie
- [ ] Line-height jest komfortowy
- [ ] Prose styling działa poprawnie

### 37. Colors
- [ ] Kolory są spójne z resztą aplikacji
- [ ] Wszystkie stany (hover, active, disabled) są wizualnie różne
- [ ] Loading states są jasne

## 📝 Testy edge cases

### 38. Długie teksty
- [ ] Bardzo długi przód fiszki wyświetla się poprawnie
- [ ] Bardzo długa odpowiedź wyświetla się poprawnie
- [ ] Tekst z długimi słowami (bez spacji) łamie się
- [ ] Tekst z emoji wyświetla się poprawnie
- [ ] Tekst z Unicode (polskie znaki) wyświetla się poprawnie

### 39. Szybkie interakcje
- [ ] Szybkie klikanie przycisków nie powoduje błędów
- [ ] Szybkie naciskanie klawiszy nie powoduje błędów
- [ ] Wielokrotne retry nie powodują duplikatów
- [ ] Zamknięcie podczas wysyłania oceny działa

### 40. Sesja z 1 fiszką
- [ ] Sesja z jedną fiszką działa poprawnie
- [ ] Po ocenie jednej fiszki pokazuje się SessionComplete
- [ ] Pasek postępu pokazuje "1/1 kart"

### 41. Duża sesja (50+ fiszek)
- [ ] Limit 50 fiszek jest respektowany
- [ ] Pasek postępu działa przez całą sesję
- [ ] Wydajność nie spada przy dużej liczbie kart
- [ ] Sesja może być zakończona w dowolnym momencie

---

## 📋 Podsumowanie

**Całkowita liczba testów:** 41 kategorii z ~150 indywidualnymi checkboxami

**Priorytety:**
1. 🔴 **Krytyczne:** Testy funkcjonalne (1-11), skróty klawiszowe (12-17)
2. 🟠 **Ważne:** Responsywność (18-20), accessibility (24-28)
3. 🟡 **Nice to have:** Ciemny motyw (21-23), wydajność (29-31), edge cases (38-41)

**Rekomendowane narzędzia:**
- Manual testing w przeglądarce
- Chrome DevTools (Lighthouse dla accessibility)
- Screen reader (macOS VoiceOver, NVDA na Windows)
- Responsive design mode (Chrome/Firefox DevTools)
- axe DevTools extension dla WCAG compliance
