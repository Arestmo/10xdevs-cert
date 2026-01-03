### 2.4 Modal generowania AI

**Główny cel**: Generowanie fiszek z tekstu za pomocą AI.

**Kluczowe informacje**:

- Pole tekstowe na materiał źródłowy
- Wybór talii docelowej
- Licznik pozostałego limitu AI
- Lista wygenerowanych draftów

**Kluczowe komponenty**:

| Komponent            | Opis                                  | Typ             |
| -------------------- | ------------------------------------- | --------------- |
| `GenerationModal`    | Główny modal z logiką generowania     | React Component |
| `SourceTextArea`     | Pole tekstowe z licznikiem znaków     | React Component |
| `DeckSelector`       | Dropdown wyboru talii                 | React Component |
| `AILimitIndicator`   | Wskaźnik "Pozostało: X/200"           | React Component |
| `GenerationSpinner`  | Spinner z tekstem podczas generowania | React Component |
| `DraftsList`         | Lista przewijana draftów              | React Component |
| `DraftItem`          | Pojedynczy draft z akcjami            | React Component |
| `DraftEditForm`      | Formularz inline edycji draftu        | React Component |
| `CloseConfirmDialog` | Dialog ostrzeżenia przy zamknięciu    | React Component |

**Wymagania UX**:

- Blokujący modal z możliwością zamknięcia (X, klik poza obszar)
- Pole tekstowe do 5000 znaków z licznikiem real-time
- Preselekcja talii jeśli modal otwierany z widoku talii
- Spinner z tekstem "Generowanie fiszek..." podczas ładowania
- Lista przewijana draftów z numeracją "1/15", "2/15"
- Przyciski Akceptuj/Edytuj/Odrzuć przy każdym drafcie
- Natychmiastowy zapis przy akceptacji (bez możliwości cofnięcia)
- Ostrzeżenie przy zamknięciu z nieprzetworzonymi draftami
- Przyjazny komunikat przy pustych wynikach lub błędach AI

**Dostępność**:

- Focus trap wewnątrz modalu
- `aria-modal="true"` i `role="dialog"`
- Focus na pierwszym interaktywnym elemencie przy otwarciu
- `aria-live="polite"` dla statusu generowania
- Obsługa Escape do zamknięcia

**Bezpieczeństwo**:

- Walidacja długości tekstu (max 5000 znaków)
- Sprawdzenie limitu AI przed generowaniem
- Sanityzacja tekstu wejściowego

**Mapowanie historyjek**: US-007, US-008, US-009, US-010, US-011, US-012, US-013, US-014, US-015, US-016, US-017

**Integracja z API**:

- `GET /api/profile` - sprawdzenie limitu AI
- `POST /api/generations` - generowanie draftów
- `POST /api/flashcards` - akceptacja draftu (source: "ai")
- `POST /api/generations/{generationId}/reject` - odrzucenie draftu

---
