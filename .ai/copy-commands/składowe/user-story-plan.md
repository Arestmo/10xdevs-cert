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
