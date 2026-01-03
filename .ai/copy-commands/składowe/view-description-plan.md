### 2.3 Widok talii (`/decks/{deckId}`)

**Główny cel**: Zarządzanie pojedynczą talią i jej fiszkami.

**Kluczowe informacje**:

- Nazwa talii (edytowalna inline)
- Liczba fiszek w talii
- Liczba fiszek do powtórki w tej talii
- Lista fiszek z podglądem

**Kluczowe komponenty**:

| Komponent                | Opis                                            | Typ             |
| ------------------------ | ----------------------------------------------- | --------------- |
| `DeckPage`               | Główny kontener widoku talii                    | Astro Page      |
| `DeckHeader`             | Nagłówek z nazwą talii i akcjami                | React Component |
| `InlineEditField`        | Edytowalne pole nazwy talii                     | React Component |
| `DeckActions`            | Przyciski akcji (Ucz się, Generuj, Dodaj, Usuń) | React Component |
| `FlashcardList`          | Lista fiszek z accordion                        | React Component |
| `FlashcardAccordionItem` | Pojedyncza fiszka z rozwinięciem                | React Component |
| `FlashcardForm`          | Formularz tworzenia/edycji fiszki               | React Component |
| `DeleteDeckDialog`       | Dialog potwierdzenia usunięcia talii            | React Component |
| `DeleteFlashcardDialog`  | Dialog potwierdzenia usunięcia fiszki           | React Component |

**Wymagania UX**:

- Inline editing nazwy talii (Enter/Escape lub przyciski Save/Cancel)
- Przycisk "Ucz się (X)" pokazujący liczbę due flashcards
- Lista fiszek z accordion pattern (pierwsze ~50 znaków, rozwijane)
- Rozwinięta fiszka pokazuje przód/tył + przyciski Edytuj/Usuń
- Dialog potwierdzenia przed usunięciem talii/fiszki

**Dostępność**:

- Accordion z `aria-expanded` i `aria-controls`
- Focus trap w dialogach
- Keyboard shortcuts (Enter/Escape dla inline edit)
- `aria-describedby` dla pól formularza z walidacją

**Bezpieczeństwo**:

- Weryfikacja własności talii (RLS + sprawdzenie w API)
- Walidacja danych wejściowych (front: max 200, back: max 500 znaków)

**Mapowanie historyjek**: US-018, US-019, US-023, US-024, US-025, US-026, US-027, US-028, US-029, US-032

**Integracja z API**:

- `GET /api/decks/{deckId}` - dane talii
- `PATCH /api/decks/{deckId}` - aktualizacja nazwy
- `DELETE /api/decks/{deckId}` - usunięcie talii
- `GET /api/flashcards?deck_id={deckId}` - lista fiszek
- `POST /api/flashcards` - tworzenie fiszki
- `PATCH /api/flashcards/{flashcardId}` - edycja fiszki
- `DELETE /api/flashcards/{flashcardId}` - usunięcie fiszki

---