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

US-032
Tytuł: Rozpoczynanie sesji nauki z pojedynczej talii
Opis: Jako użytkownik chcę uczyć się tylko z wybranej talii, gdy przygotowuję się do egzaminu z konkretnego tematu.
Kryteria akceptacji:

- W widoku talii dostępny jest przycisk "Ucz się"
- Przycisk pokazuje liczbę fiszek do powtórki w tej talii
- Po kliknięciu rozpoczyna się sesja tylko z tej talii
- Fiszki z innych talii nie są uwzględniane