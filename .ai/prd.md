# Dokument wymagań produktu (PRD) - Flashcards AI

## 1. Przegląd produktu

Flashcards AI to webowa aplikacja do tworzenia i nauki z fiszek edukacyjnych, wykorzystująca sztuczną inteligencję do automatycznego generowania fiszek na podstawie dostarczonego tekstu. Aplikacja skierowana jest do profesjonalistów i studentów (osób dorosłych), którzy chcą efektywnie uczyć się z wykorzystaniem metody spaced repetition.

Kluczowe cechy produktu:
- Generowanie fiszek przez AI (GPT-4o-mini) na podstawie wklejonego tekstu
- Manualne tworzenie fiszek bez ograniczeń ilościowych
- System nauki z algorytmem powtórek FSRS (Free Spaced Repetition Scheduler)
- Organizacja fiszek w talie tematyczne
- Prosty system kont użytkowników z autentykacją Google OAuth i Magic Link
- Interfejs w języku polskim z responsywnym designem mobile-first

Stack technologiczny: Astro, React, TypeScript, Tailwind CSS, Supabase

Model biznesowy: aplikacja w 100% darmowa, koszty API pokrywane przez twórcę.

## 2. Problem użytkownika

Manualne tworzenie wysokiej jakości fiszek edukacyjnych jest czasochłonne, co zniechęca do korzystania z efektywnej metody nauki jaką jest spaced repetition. Użytkownicy często:

- Rezygnują z tworzenia fiszek ze względu na wymagany nakład czasu
- Tworzą fiszki niskiej jakości, próbując przyspieszyć proces
- Nie wykorzystują potencjału metody spaced repetition z powodu bariery wejścia
- Tracą motywację do systematycznej nauki przez brak gotowych materiałów

Flashcards AI rozwiązuje ten problem poprzez automatyczne generowanie fiszek z dowolnego tekstu, redukując czas potrzebny na przygotowanie materiałów do nauki o 80-90%. Użytkownik może wkleić fragment podręcznika, notatek lub artykułu i w kilka sekund otrzymać gotowe fiszki do nauki.

## 3. Wymagania funkcjonalne

### 3.1 Moduł autentykacji

- FR-001: System logowania przez Google OAuth jako główna metoda autentykacji
- FR-002: Alternatywna metoda logowania przez Magic Link (email)
- FR-003: Automatyczne przekierowanie niezalogowanych użytkowników do strony logowania
- FR-004: Funkcja usuwania konta z cascade delete wszystkich danych użytkownika (zgodność z RODO)
- FR-005: Brak landing page - bezpośrednie przekierowanie do ekranu logowania
- FR-006: Obsługa sesji użytkownika przez Supabase Auth

### 3.2 Moduł generowania fiszek AI

- FR-007: Pole tekstowe do wprowadzenia materiału źródłowego z limitem 5000 znaków
- FR-008: Walidacja długości tekstu wejściowego z komunikatem o limicie
- FR-009: Generowanie do 20 fiszek na pojedynczą sesję generowania
- FR-010: Miesięczny limit 200 fiszek AI na użytkownika (reset pierwszego dnia miesiąca kalendarzowego)
- FR-011: Wyświetlanie spinnera podczas generowania fiszek
- FR-012: Prezentacja wygenerowanych fiszek jako lista draftów w modalu
- FR-013: Przyciski akcji dla każdego draftu: Akceptuj / Edytuj / Odrzuć
- FR-014: Walidacja fiszek: przód maksymalnie 200 znaków, tył maksymalnie 500 znaków
- FR-015: Edycja inline draftu przed akceptacją
- FR-016: Zapis fiszki do bazy danych dopiero po akceptacji
- FR-017: Wyświetlanie przyjaznego komunikatu błędu w przypadku awarii AI
- FR-018: Logowanie błędów AI na serwerze do celów diagnostycznych
- FR-019: Wyświetlanie licznika pozostałych fiszek AI w bieżącym miesiącu
- FR-020: Komunikat o wyczerpaniu limitu z datą resetu

### 3.3 Moduł manualnego tworzenia fiszek

- FR-021: Formularz tworzenia fiszki z polami przód i tył
- FR-022: Walidacja: przód maksymalnie 200 znaków, tył maksymalnie 500 znaków
- FR-023: Brak limitu ilościowego dla manualnie tworzonych fiszek
- FR-024: Dostępność modułu nawet po wyczerpaniu limitu AI
- FR-025: Przypisanie fiszki do wybranej talii podczas tworzenia

### 3.4 Moduł zarządzania taliami

- FR-026: Tworzenie nowej talii z podaniem nazwy
- FR-027: Edycja nazwy istniejącej talii
- FR-028: Usuwanie talii z potwierdzeniem (dialog)
- FR-029: Cascade delete fiszek przy usuwaniu talii
- FR-030: Nielimitowana liczba talii na użytkownika
- FR-031: Widok talii jako lista fiszek z podglądem przodu (pierwsze ~50 znaków)
- FR-032: Rozwijany widok pełnej fiszki (przód i tył) po kliknięciu
- FR-033: Przyciski edycji i usunięcia fiszki w rozwiniętym widoku

### 3.5 Moduł zarządzania fiszkami

- FR-034: Edycja treści fiszki (przód i tył)
- FR-035: Usuwanie pojedynczej fiszki z potwierdzeniem
- FR-036: Walidacja przy edycji: przód max 200 znaków, tył max 500 znaków

### 3.6 Moduł nauki (FSRS)

- FR-037: Integracja z biblioteką FSRS (Free Spaced Repetition Scheduler)
- FR-038: Agregacja fiszek do powtórki ze wszystkich talii użytkownika
- FR-039: Opcja nauki tylko z wybranej talii
- FR-040: Ekran nauki z centralnie wyświetlaną kartą
- FR-041: Przycisk "Pokaż odpowiedź" do odsłonięcia tyłu karty
- FR-042: Cztery przyciski oceny po odsłonięciu odpowiedzi: Again (1) / Hard (2) / Good (3) / Easy (4)
- FR-043: Pasek postępu sesji w formacie "X/Y kart"
- FR-044: Aktualizacja parametrów FSRS fiszki po każdej ocenie
- FR-045: Obliczanie kolejnej daty powtórki na podstawie oceny
- FR-046: Zakończenie sesji po przeglądnięciu wszystkich kart do powtórki
- FR-047: Powrót do dashboardu po zakończeniu sesji

### 3.7 Dashboard

- FR-048: Layout kafelkowy responsywny
- FR-049: Kafelek "Do powtórki" z liczbą fiszek zaplanowanych na dziś
- FR-050: Kafelek "Nowa talia / Generuj fiszki" jako główne CTA
- FR-051: Lista talii użytkownika jako kafelki
- FR-052: Puste stany z CTA dla nowych użytkowników
- FR-053: Szybki dostęp do sesji nauki z kafelka "Do powtórki"

### 3.8 Logowanie i analityka

- FR-054: Logowanie eventu: fiszka_wygenerowana (przy każdym drafcie z AI)
- FR-055: Logowanie eventu: fiszka_zaakceptowana
- FR-056: Logowanie eventu: fiszka_odrzucona
- FR-057: Logowanie eventu: fiszka_edytowana (edycja draftu przed akceptacją)
- FR-058: Przechowywanie logów w tabelach Supabase

### 3.9 Wymagania prawne

- FR-059: Strona z polityką prywatności
- FR-060: Strona z regulaminem usługi
- FR-061: Mechanizm usuwania konta użytkownika dostępny w ustawieniach
- FR-062: Cascade delete wszystkich danych użytkownika przy usuwaniu konta

## 4. Granice produktu

### W zakresie MVP

- Generowanie fiszek przez AI na podstawie wprowadzonego tekstu (kopiuj-wklej)
- Manualne tworzenie fiszek
- Przeglądanie, edycja i usuwanie fiszek
- Prosty system kont użytkowników (Google OAuth + Magic Link)
- Organizacja fiszek w talie
- Integracja z algorytmem FSRS do planowania powtórek
- Responsywny interfejs webowy (mobile-first)
- Interfejs w języku polskim

### Poza zakresem MVP

- Własny, zaawansowany algorytm powtórek (implementacja od zera)
- Import wielu formatów plików (PDF, DOCX, PPTX itp.)
- Współdzielenie zestawów fiszek między użytkownikami
- Integracje z platformami edukacyjnymi (Moodle, Canvas itp.)
- Aplikacje mobilne natywne (iOS, Android)
- Eksport fiszek do innych formatów
- Przenoszenie fiszek między taliami
- Przechowywanie odrzuconych draftów
- Landing page marketingowy
- Wielojęzyczny interfejs
- System płatności i plany premium
- Statystyki nauki i wykresy postępu
- Gamifikacja (odznaki, streak, punkty)
- Tryb offline
- Synchronizacja między urządzeniami w czasie rzeczywistym

## 5. Historyjki użytkowników

### Autentykacja i zarządzanie kontem

US-001
Tytuł: Rejestracja i logowanie przez Google
Opis: Jako nowy użytkownik chcę zalogować się jednym klikiem przez konto Google, aby szybko rozpocząć korzystanie z aplikacji bez wypełniania formularzy rejestracyjnych.
Kryteria akceptacji:
- Na stronie logowania widoczny jest przycisk "Zaloguj przez Google"
- Po kliknięciu użytkownik jest przekierowany do autoryzacji Google
- Po pomyślnej autoryzacji użytkownik jest przekierowany do dashboardu
- Przy pierwszym logowaniu automatycznie tworzone jest konto użytkownika
- Przy kolejnych logowaniach użytkownik jest rozpoznawany i logowany do istniejącego konta

US-002
Tytuł: Logowanie przez Magic Link
Opis: Jako użytkownik bez konta Google chcę zalogować się przez link wysłany na email, aby mieć alternatywną metodę dostępu do aplikacji.
Kryteria akceptacji:
- Na stronie logowania dostępna jest opcja "Zaloguj przez email"
- Po wpisaniu adresu email i kliknięciu przycisku wysyłany jest link logowania
- Wyświetlany jest komunikat o wysłaniu linku na podany adres
- Link w emailu jest ważny przez 1 godzinę
- Po kliknięciu linku użytkownik jest automatycznie zalogowany i przekierowany do dashboardu
- Przy pierwszym logowaniu automatycznie tworzone jest konto

US-003
Tytuł: Automatyczne przekierowanie do logowania
Opis: Jako niezalogowany użytkownik próbujący wejść na chronioną stronę chcę być automatycznie przekierowany do logowania, aby zrozumieć, że muszę się zalogować.
Kryteria akceptacji:
- Próba wejścia na dowolną stronę aplikacji bez zalogowania przekierowuje do strony logowania
- Po zalogowaniu użytkownik jest przekierowany do pierwotnie żądanej strony
- Jeśli pierwotna strona nie była określona, przekierowanie następuje do dashboardu

US-004
Tytuł: Wylogowanie z aplikacji
Opis: Jako zalogowany użytkownik chcę móc się wylogować, aby zabezpieczyć swoje konto na współdzielonym urządzeniu.
Kryteria akceptacji:
- W menu użytkownika dostępna jest opcja "Wyloguj"
- Po kliknięciu sesja użytkownika jest zakończona
- Użytkownik jest przekierowany do strony logowania
- Próba wejścia na chronione strony wymaga ponownego logowania

US-005
Tytuł: Usuwanie konta
Opis: Jako użytkownik chcę móc usunąć swoje konto i wszystkie dane, aby skorzystać z prawa do bycia zapomnianym zgodnie z RODO.
Kryteria akceptacji:
- W ustawieniach konta dostępna jest opcja "Usuń konto"
- Przed usunięciem wyświetlane jest ostrzeżenie o nieodwracalności operacji
- Wymagane jest potwierdzenie zamiaru usunięcia (np. wpisanie słowa "USUŃ")
- Po potwierdzeniu wszystkie dane użytkownika są trwale usuwane (cascade delete)
- Usuwane są: konto, talie, fiszki, logi, parametry FSRS
- Użytkownik jest wylogowany i przekierowany do strony logowania
- Wyświetlany jest komunikat potwierdzający usunięcie konta

### Generowanie fiszek przez AI

US-006
Tytuł: Otwieranie modalu generowania fiszek
Opis: Jako użytkownik chcę mieć łatwy dostęp do funkcji generowania fiszek, aby szybko tworzyć nowe materiały do nauki.
Kryteria akceptacji:
- Na dashboardzie widoczny jest kafelek/przycisk "Generuj fiszki"
- W widoku talii dostępny jest przycisk "Generuj fiszki"
- Po kliknięciu otwiera się modal z formularzem generowania
- Modal można zamknąć przyciskiem X lub kliknięciem poza obszar

US-007
Tytuł: Wprowadzanie tekstu źródłowego
Opis: Jako użytkownik chcę wkleić tekst, z którego AI wygeneruje fiszki, aby nie musieć ręcznie przepisywać materiałów.
Kryteria akceptacji:
- W modalu generowania dostępne jest pole tekstowe na materiał źródłowy
- Pole akceptuje tekst do 5000 znaków
- Widoczny jest licznik znaków pokazujący wykorzystanie limitu (np. "2500/5000")
- Przy przekroczeniu limitu tekst jest obcinany lub wyświetlany jest komunikat błędu
- Pole obsługuje wklejanie tekstu ze schowka (Ctrl+V / Cmd+V)

US-008
Tytuł: Wybór talii docelowej przy generowaniu
Opis: Jako użytkownik chcę wybrać talię, do której trafią zaakceptowane fiszki, aby zachować organizację materiałów.
Kryteria akceptacji:
- W modalu generowania dostępna jest lista rozwijana z taliami użytkownika
- Można wybrać istniejącą talię z listy
- Dostępna jest opcja utworzenia nowej talii (pole tekstowe na nazwę)
- Wybór talii jest wymagany przed rozpoczęciem generowania

US-009
Tytuł: Generowanie fiszek z tekstu
Opis: Jako użytkownik chcę uruchomić generowanie fiszek AI, aby otrzymać gotowe propozycje kart do nauki.
Kryteria akceptacji:
- Przycisk "Generuj" jest aktywny gdy wprowadzono tekst i wybrano talię
- Po kliknięciu przycisku wyświetlany jest spinner/animacja ładowania
- Generowanych jest maksymalnie 20 fiszek na sesję
- Po zakończeniu generowania wyświetlana jest lista draftów
- Każdy draft zawiera przód i tył fiszki

US-010
Tytuł: Przeglądanie wygenerowanych draftów
Opis: Jako użytkownik chcę przejrzeć propozycje fiszek wygenerowane przez AI, aby ocenić ich jakość przed zapisaniem.
Kryteria akceptacji:
- Lista draftów wyświetla wszystkie wygenerowane fiszki
- Dla każdego draftu widoczny jest przód i tył fiszki
- Drafty są ponumerowane (np. "1/15", "2/15")
- Można przewijać listę draftów
- Dla każdego draftu dostępne są przyciski: Akceptuj / Edytuj / Odrzuć

US-011
Tytuł: Akceptowanie draftu fiszki
Opis: Jako użytkownik chcę zaakceptować dobry draft, aby zapisać go jako fiszkę w wybranej talii.
Kryteria akceptacji:
- Przycisk "Akceptuj" jest dostępny przy każdym drafcie
- Po kliknięciu fiszka jest zapisywana do bazy danych w wybranej talii
- Draft znika z listy lub jest oznaczony jako zaakceptowany
- Logowany jest event fiszka_zaakceptowana
- Wyświetlane jest potwierdzenie akceptacji (np. zielony checkmark)

US-012
Tytuł: Edycja draftu przed akceptacją
Opis: Jako użytkownik chcę poprawić treść draftu przed zapisaniem, aby dostosować fiszkę do moich potrzeb.
Kryteria akceptacji:
- Przycisk "Edytuj" jest dostępny przy każdym drafcie
- Po kliknięciu pola przód i tył stają się edytowalne
- Widoczne są liczniki znaków (przód: max 200, tył: max 500)
- Dostępne są przyciski "Zapisz" i "Anuluj"
- Po zapisaniu draft pozostaje na liście z zaktualizowaną treścią
- Logowany jest event fiszka_edytowana
- Można następnie zaakceptować edytowany draft

US-013
Tytuł: Odrzucanie draftu fiszki
Opis: Jako użytkownik chcę odrzucić nieprzydatny draft, aby nie zaśmiecać mojej talii niskiej jakości fiszkami.
Kryteria akceptacji:
- Przycisk "Odrzuć" jest dostępny przy każdym drafcie
- Po kliknięciu draft znika z listy bez zapisywania do bazy
- Logowany jest event fiszka_odrzucona
- Odrzucone drafty nie są nigdzie przechowywane
- Nie jest wymagane potwierdzenie odrzucenia

US-014
Tytuł: Zamykanie modalu z draftami
Opis: Jako użytkownik chcę móc zamknąć modal generowania, gdy skończę przeglądać drafty.
Kryteria akceptacji:
- Dostępny jest przycisk zamknięcia modalu (X)
- Można zamknąć modal kliknięciem poza jego obszar
- Niezaakceptowane drafty przepadają przy zamknięciu modalu
- Przed zamknięciem z niezaakceptowanymi draftami wyświetlane jest ostrzeżenie
- Zaakceptowane fiszki pozostają zapisane w talii

US-015
Tytuł: Wyświetlanie limitu fiszek AI
Opis: Jako użytkownik chcę widzieć ile fiszek AI mogę jeszcze wygenerować w tym miesiącu, aby planować korzystanie z funkcji.
Kryteria akceptacji:
- W modalu generowania widoczny jest licznik "Pozostało: X/200 fiszek w tym miesiącu"
- Licznik aktualizuje się po każdym generowaniu
- Gdy limit zostanie wyczerpany, wyświetlana jest informacja o dacie resetu
- Limit resetuje się pierwszego dnia każdego miesiąca kalendarzowego

US-016
Tytuł: Komunikat o wyczerpaniu limitu AI
Opis: Jako użytkownik z wyczerpanym limitem chcę otrzymać jasną informację, aby wiedzieć kiedy będę mógł ponownie generować fiszki.
Kryteria akceptacji:
- Przy próbie generowania po wyczerpaniu limitu wyświetlany jest komunikat
- Komunikat zawiera informację o dacie resetu limitu (pierwszy dzień następnego miesiąca)
- Sugerowane jest manualne tworzenie fiszek jako alternatywa
- Przycisk "Generuj" jest nieaktywny gdy limit wyczerpany

US-017
Tytuł: Obsługa błędu generowania AI
Opis: Jako użytkownik chcę otrzymać zrozumiały komunikat gdy wystąpi błąd AI, aby wiedzieć co robić dalej.
Kryteria akceptacji:
- W przypadku błędu API wyświetlany jest przyjazny komunikat (nie techniczny stack trace)
- Komunikat sugeruje ponowienie próby lub kontakt z supportem
- Błąd jest logowany na serwerze z pełnymi szczegółami technicznymi
- Użytkownik może ponowić próbę generowania
- Nieudana próba nie zmniejsza limitu fiszek

### Manualne tworzenie fiszek

US-018
Tytuł: Otwieranie formularza tworzenia fiszki
Opis: Jako użytkownik chcę mieć dostęp do formularza tworzenia fiszki, aby dodawać własne karty do nauki.
Kryteria akceptacji:
- W widoku talii dostępny jest przycisk "Dodaj fiszkę"
- Po kliknięciu otwiera się formularz tworzenia fiszki
- Formularz można zamknąć bez zapisywania

US-019
Tytuł: Tworzenie fiszki manualnie
Opis: Jako użytkownik chcę ręcznie utworzyć fiszkę wpisując przód i tył, aby dodać specyficzne karty których AI nie wygenerował.
Kryteria akceptacji:
- Formularz zawiera pola: przód (max 200 znaków) i tył (max 500 znaków)
- Widoczne są liczniki znaków dla obu pól
- Przycisk "Zapisz" jest aktywny gdy oba pola są wypełnione i w limitach
- Po zapisaniu fiszka pojawia się w wybranej talii
- Formularz może być użyty ponownie do dodania kolejnych fiszek
- Brak limitu ilościowego dla manualnie tworzonych fiszek

US-020
Tytuł: Tworzenie fiszek po wyczerpaniu limitu AI
Opis: Jako użytkownik z wyczerpanym limitem AI chcę nadal móc tworzyć fiszki manualnie, aby kontynuować naukę.
Kryteria akceptacji:
- Formularz manualnego tworzenia jest dostępny niezależnie od limitu AI
- Nie ma żadnych ograniczeń ilościowych dla manualnych fiszek
- Funkcja działa identycznie jak przy aktywnym limicie AI

### Zarządzanie taliami

US-021
Tytuł: Tworzenie nowej talii
Opis: Jako użytkownik chcę utworzyć nową talię, aby organizować fiszki tematycznie.
Kryteria akceptacji:
- Na dashboardzie dostępny jest przycisk "Nowa talia"
- Po kliknięciu wyświetla się formularz z polem na nazwę talii
- Nazwa talii jest wymagana (nie może być pusta)
- Po zapisaniu talia pojawia się na dashboardzie
- Użytkownik jest przekierowany do widoku nowej talii
- Można utworzyć nieograniczoną liczbę talii

US-022
Tytuł: Przeglądanie listy talii
Opis: Jako użytkownik chcę widzieć wszystkie moje talie na dashboardzie, aby mieć przegląd moich materiałów.
Kryteria akceptacji:
- Dashboard wyświetla wszystkie talie użytkownika jako kafelki
- Każdy kafelek pokazuje nazwę talii
- Kafelki są klikalane i prowadzą do widoku talii
- Dla nowego użytkownika wyświetlany jest pusty stan z CTA do utworzenia talii

US-023
Tytuł: Otwieranie widoku talii
Opis: Jako użytkownik chcę otworzyć talię, aby zobaczyć i zarządzać jej fiszkami.
Kryteria akceptacji:
- Po kliknięciu kafelka talii otwiera się widok talii
- Widok zawiera nazwę talii, liczbę fiszek i listę fiszek
- Dostępne są przyciski: "Dodaj fiszkę", "Generuj fiszki", "Edytuj talię", "Usuń talię"
- Można wrócić do dashboardu

US-024
Tytuł: Edycja nazwy talii
Opis: Jako użytkownik chcę zmienić nazwę talii, aby lepiej odzwierciedlała jej zawartość.
Kryteria akceptacji:
- W widoku talii dostępna jest opcja "Edytuj nazwę"
- Po kliknięciu nazwa staje się edytowalna
- Nowa nazwa jest zapisywana po potwierdzeniu
- Zmiana jest natychmiast widoczna w interfejsie

US-025
Tytuł: Usuwanie talii
Opis: Jako użytkownik chcę usunąć talię której już nie potrzebuję, aby utrzymać porządek w materiałach.
Kryteria akceptacji:
- W widoku talii dostępna jest opcja "Usuń talię"
- Przed usunięciem wyświetlane jest okno potwierdzenia
- Potwierdzenie informuje o liczbie fiszek które zostaną usunięte
- Po potwierdzeniu talia i wszystkie jej fiszki są trwale usuwane
- Użytkownik jest przekierowany do dashboardu
- Wyświetlany jest komunikat potwierdzający usunięcie

US-026
Tytuł: Przeglądanie fiszek w talii
Opis: Jako użytkownik chcę przeglądać fiszki w talii, aby zobaczyć co zawiera i znaleźć konkretne karty.
Kryteria akceptacji:
- Widok talii wyświetla listę fiszek
- Każda fiszka pokazuje początek przodu (pierwsze ~50 znaków)
- Lista jest przewijalna gdy fiszek jest dużo
- Kliknięcie fiszki rozwija pełny widok (przód i tył)
- Ponowne kliknięcie zwija fiszkę

US-027
Tytuł: Rozwijanie szczegółów fiszki
Opis: Jako użytkownik chcę zobaczyć pełną treść fiszki, aby zweryfikować jej zawartość.
Kryteria akceptacji:
- Po kliknięciu fiszki na liście rozwija się pełny widok
- Widoczny jest pełny przód i tył fiszki
- Dostępne są przyciski "Edytuj" i "Usuń"
- Można zwinąć fiszkę klikając ponownie lub przycisk "Zwiń"

### Zarządzanie fiszkami

US-028
Tytuł: Edycja istniejącej fiszki
Opis: Jako użytkownik chcę edytować fiszkę, aby poprawić błędy lub zaktualizować treść.
Kryteria akceptacji:
- W rozwiniętym widoku fiszki dostępny jest przycisk "Edytuj"
- Po kliknięciu pola przód i tył stają się edytowalne
- Widoczne są liczniki znaków (przód: max 200, tył: max 500)
- Dostępne są przyciski "Zapisz" i "Anuluj"
- Po zapisaniu zaktualizowana treść jest widoczna w interfejsie
- Edycja nie resetuje parametrów FSRS fiszki

US-029
Tytuł: Usuwanie fiszki
Opis: Jako użytkownik chcę usunąć fiszkę której już nie potrzebuję, aby utrzymać jakość materiałów.
Kryteria akceptacji:
- W rozwiniętym widoku fiszki dostępny jest przycisk "Usuń"
- Przed usunięciem wyświetlane jest okno potwierdzenia
- Po potwierdzeniu fiszka jest trwale usuwana
- Fiszka znika z listy w widoku talii
- Wyświetlany jest komunikat potwierdzający usunięcie

### Nauka z algorytmem FSRS

US-030
Tytuł: Wyświetlanie liczby kart do powtórki
Opis: Jako użytkownik chcę widzieć ile mam kart do powtórki, aby planować czas nauki.
Kryteria akceptacji:
- Na dashboardzie widoczny jest kafelek "Do powtórki: X"
- Liczba X to suma fiszek ze wszystkich talii zaplanowanych na dziś lub wcześniej
- Liczba aktualizuje się po każdej sesji nauki
- Gdy X = 0, kafelek pokazuje "Brak fiszek do powtórki"

US-031
Tytuł: Rozpoczynanie sesji nauki ze wszystkich talii
Opis: Jako użytkownik chcę rozpocząć naukę wszystkich fiszek do powtórki, aby efektywnie przejrzeć cały materiał.
Kryteria akceptacji:
- Kliknięcie kafelka "Do powtórki" rozpoczyna sesję nauki
- Sesja zawiera fiszki ze wszystkich talii zaplanowane na dziś lub wcześniej
- Fiszki są prezentowane w kolejności wynikającej z algorytmu FSRS
- Wyświetlany jest ekran nauki z pierwszą fiszką

US-032
Tytuł: Rozpoczynanie sesji nauki z pojedynczej talii
Opis: Jako użytkownik chcę uczyć się tylko z wybranej talii, gdy przygotowuję się do egzaminu z konkretnego tematu.
Kryteria akceptacji:
- W widoku talii dostępny jest przycisk "Ucz się"
- Przycisk pokazuje liczbę fiszek do powtórki w tej talii
- Po kliknięciu rozpoczyna się sesja tylko z tej talii
- Fiszki z innych talii nie są uwzględniane

US-033
Tytuł: Przeglądanie przodu fiszki w sesji nauki
Opis: Jako użytkownik chcę zobaczyć przód fiszki i spróbować przypomnieć sobie odpowiedź, zanim zobaczę tył.
Kryteria akceptacji:
- Ekran nauki wyświetla centralnie przód fiszki
- Tył fiszki jest ukryty
- Dostępny jest przycisk "Pokaż odpowiedź"
- Widoczny jest pasek postępu "X/Y kart"

US-034
Tytuł: Odsłanianie odpowiedzi
Opis: Jako użytkownik chcę odsłonić tył fiszki po zastanowieniu się nad odpowiedzią.
Kryteria akceptacji:
- Po kliknięciu "Pokaż odpowiedź" wyświetlany jest tył fiszki
- Przód fiszki pozostaje widoczny
- Przycisk "Pokaż odpowiedź" znika
- Pojawiają się 4 przyciski oceny: Again / Hard / Good / Easy

US-035
Tytuł: Ocenianie znajomości fiszki
Opis: Jako użytkownik chcę ocenić jak dobrze pamiętałem odpowiedź, aby algorytm FSRS zaplanował optymalny termin powtórki.
Kryteria akceptacji:
- Dostępne są 4 przyciski: Again (1), Hard (2), Good (3), Easy (4)
- Każdy przycisk pokazuje przewidywany interwał do następnej powtórki
- Po kliknięciu parametry FSRS fiszki są aktualizowane
- Obliczana jest nowa data następnej powtórki
- Wyświetlana jest następna fiszka z sesji

US-036
Tytuł: Śledzenie postępu sesji nauki
Opis: Jako użytkownik chcę widzieć postęp sesji, aby wiedzieć ile kart zostało do końca.
Kryteria akceptacji:
- Na ekranie nauki widoczny jest pasek postępu
- Postęp pokazuje format "X/Y" gdzie X to przejrzane karty, Y to suma
- Pasek wypełnia się proporcjonalnie do postępu
- Po każdej ocenie X zwiększa się o 1

US-037
Tytuł: Zakończenie sesji nauki
Opis: Jako użytkownik chcę wiedzieć że ukończyłem sesję i wrócić do dashboardu.
Kryteria akceptacji:
- Po ocenieniu ostatniej fiszki wyświetlany jest ekran zakończenia
- Ekran pokazuje podsumowanie: "Ukończono X fiszek"
- Dostępny jest przycisk "Wróć do dashboardu"
- Po kliknięciu użytkownik wraca do dashboardu
- Kafelek "Do powtórki" pokazuje zaktualizowaną liczbę (może być 0)

US-038
Tytuł: Przerywanie sesji nauki
Opis: Jako użytkownik chcę móc przerwać sesję nauki w dowolnym momencie.
Kryteria akceptacji:
- Na ekranie nauki dostępny jest przycisk "Zakończ sesję" lub X
- Po kliknięciu użytkownik wraca do dashboardu
- Postęp do tego momentu jest zapisany (ocenione fiszki mają zaktualizowane daty)
- Nieocenione fiszki pozostają do powtórki

US-039
Tytuł: Obsługa pustej sesji nauki
Opis: Jako użytkownik bez fiszek do powtórki chcę otrzymać odpowiednią informację.
Kryteria akceptacji:
- Gdy brak fiszek do powtórki, kafelek pokazuje "Brak fiszek do powtórki"
- Kliknięcie kafelka nie rozpoczyna sesji
- Wyświetlana jest informacja zachęcająca do tworzenia fiszek lub powrotu później
- Podana jest data najbliższej zaplanowanej powtórki (jeśli istnieje)

### Dashboard i nawigacja

US-040
Tytuł: Wyświetlanie dashboardu
Opis: Jako zalogowany użytkownik chcę widzieć przegląd moich materiałów i szybki dostęp do głównych funkcji.
Kryteria akceptacji:
- Po zalogowaniu wyświetlany jest dashboard
- Widoczny jest kafelek "Do powtórki: X"
- Widoczny jest kafelek "Nowa talia / Generuj fiszki"
- Widoczna jest lista talii użytkownika
- Layout jest responsywny (mobile-first)

US-041
Tytuł: Nawigacja z poziomu dashboardu
Opis: Jako użytkownik chcę łatwo nawigować do głównych funkcji aplikacji.
Kryteria akceptacji:
- Kliknięcie kafelka "Do powtórki" rozpoczyna sesję nauki
- Kliknięcie "Nowa talia" otwiera formularz tworzenia talii
- Kliknięcie "Generuj fiszki" otwiera modal generowania
- Kliknięcie kafelka talii otwiera widok talii
- Dostępne jest menu użytkownika z opcją wylogowania i ustawień

US-042
Tytuł: Pusty stan dla nowego użytkownika
Opis: Jako nowy użytkownik bez talii chcę otrzymać wskazówki jak zacząć.
Kryteria akceptacji:
- Gdy użytkownik nie ma żadnych talii, wyświetlany jest pusty stan
- Pusty stan zawiera komunikat powitalny
- Widoczny jest wyraźny CTA "Utwórz pierwszą talię"
- Opcjonalnie: krótka instrukcja korzystania z aplikacji

### Ustawienia i informacje prawne

US-043
Tytuł: Dostęp do ustawień konta
Opis: Jako użytkownik chcę mieć dostęp do ustawień konta, aby zarządzać swoim profilem.
Kryteria akceptacji:
- W menu użytkownika dostępna jest opcja "Ustawienia"
- Strona ustawień zawiera informacje o koncie (email)
- Dostępna jest opcja usunięcia konta
- Widoczny jest aktualny limit fiszek AI (wykorzystane/dostępne)

US-044
Tytuł: Przeglądanie polityki prywatności
Opis: Jako użytkownik chcę przeczytać politykę prywatności, aby wiedzieć jak przetwarzane są moje dane.
Kryteria akceptacji:
- W stopce lub menu dostępny jest link do polityki prywatności
- Strona zawiera pełną treść polityki prywatności w języku polskim
- Polityka opisuje: zbierane dane, cel przetwarzania, prawa użytkownika, kontakt

US-045
Tytuł: Przeglądanie regulaminu
Opis: Jako użytkownik chcę przeczytać regulamin usługi, aby znać zasady korzystania z aplikacji.
Kryteria akceptacji:
- W stopce lub menu dostępny jest link do regulaminu
- Strona zawiera pełną treść regulaminu w języku polskim
- Regulamin opisuje: zasady korzystania, ograniczenia, odpowiedzialność

### Responsywność i dostępność

US-046
Tytuł: Korzystanie z aplikacji na urządzeniu mobilnym
Opis: Jako użytkownik mobilny chcę wygodnie korzystać z aplikacji na smartfonie, aby uczyć się w dowolnym miejscu.
Kryteria akceptacji:
- Wszystkie ekrany są responsywne i czytelne na ekranach 320px+
- Przyciski i elementy interaktywne mają odpowiedni rozmiar do dotykowej obsługi (min 44px)
- Sesja nauki jest wygodna na telefonie (duże karty, czytelne przyciski oceny)
- Modal generowania działa poprawnie na mobile
- Formularze są wygodne do wypełniania na klawiaturze ekranowej

US-047
Tytuł: Korzystanie z aplikacji na tablecie
Opis: Jako użytkownik tabletu chcę mieć zoptymalizowany widok aplikacji.
Kryteria akceptacji:
- Layout dostosowuje się do średnich ekranów (tablet)
- Kafelki dashboardu rozkładają się optymalnie
- Sesja nauki wykorzystuje dostępną przestrzeń

US-048
Tytuł: Korzystanie z aplikacji na desktopie
Opis: Jako użytkownik desktopowy chcę mieć wygodny widok na dużym ekranie.
Kryteria akceptacji:
- Layout dostosowuje się do dużych ekranów
- Treść nie rozciąga się na całą szerokość (max-width)
- Elementy są proporcjonalne i czytelne

## 6. Metryki sukcesu

### Główne KPI

1. Wskaźnik akceptacji fiszek AI
   - Cel: 75%
   - Definicja: (fiszki_zaakceptowane + fiszki_edytowane) / fiszki_wygenerowane * 100%
   - Sposób mierzenia: Zliczanie eventów w tabeli logów Supabase
   - Częstotliwość pomiaru: Tygodniowo

2. Udział AI w tworzeniu fiszek
   - Cel: 75%
   - Definicja: fiszki_utworzone_przez_AI / wszystkie_fiszki_użytkownika * 100%
   - Sposób mierzenia: Zapytanie SQL agregujące fiszki po źródle (AI/manual)
   - Częstotliwość pomiaru: Miesięcznie

### Metryki pomocnicze

3. Średnia liczba fiszek na użytkownika
   - Sposób mierzenia: COUNT(fiszki) / COUNT(DISTINCT użytkownicy)
   - Cel: Rosnący trend

4. Retencja użytkowników (D7)
   - Definicja: Użytkownicy aktywni 7 dni po rejestracji / Nowi użytkownicy
   - Sposób mierzenia: Zapytanie na bazie timestampów logowania
   - Cel: > 30%

5. Średnia liczba sesji nauki na użytkownika tygodniowo
   - Sposób mierzenia: Zliczanie rozpoczętych sesji z podziałem na użytkowników
   - Cel: >= 3 sesje/tydzień

6. Wskaźnik ukończenia sesji nauki
   - Definicja: Sesje zakończone / Sesje rozpoczęte
   - Cel: > 80%

### Implementacja mierzenia

Tabela: generation_events
- id (UUID)
- user_id (UUID, FK)
- event_type (ENUM: wygenerowana, zaakceptowana, odrzucona, edytowana)
- flashcard_id (UUID, nullable - dla wygenerowanych przed akceptacją)
- created_at (TIMESTAMP)

Tabela: flashcards
- source (ENUM: ai, manual) - do rozróżnienia źródła fiszki

Zapytania SQL:
- Wskaźnik akceptacji: SELECT (COUNT(CASE WHEN event_type IN ('zaakceptowana', 'edytowana') THEN 1 END) * 100.0 / NULLIF(COUNT(CASE WHEN event_type = 'wygenerowana' THEN 1 END), 0)) as acceptance_rate FROM generation_events WHERE created_at >= [okres]
- Udział AI: SELECT (COUNT(CASE WHEN source = 'ai' THEN 1 END) * 100.0 / COUNT(*)) as ai_share FROM flashcards WHERE user_id = [user]
