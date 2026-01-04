### 2.5 Sesja nauki (`/study` lub `/study/{deckId}`)

**Główny cel**: Nauka fiszek z wykorzystaniem algorytmu FSRS.

**Kluczowe informacje**:

- Aktualna fiszka (przód/tył)
- Postęp sesji (X/Y kart)
- Przyciski oceny po odsłonięciu odpowiedzi

**Kluczowe komponenty**:

| Komponent          | Opis                                    | Typ             |
| ------------------ | --------------------------------------- | --------------- |
| `StudyPage`        | Główny kontener sesji nauki             | Astro Page      |
| `StudyHeader`      | Minimalna nawigacja (X + pasek postępu) | React Component |
| `ProgressBar`      | Pasek postępu "X/Y kart"                | React Component |
| `FlashcardDisplay` | Centralna karta fiszki                  | React Component |
| `RevealButton`     | Przycisk "Pokaż odpowiedź"              | React Component |
| `RatingButtons`    | Przyciski oceny (Again/Hard/Good/Easy)  | React Component |
| `SessionComplete`  | Ekran zakończenia sesji                 | React Component |
| `EmptyStudyState`  | Stan gdy brak fiszek do powtórki        | React Component |

**Wymagania UX**:

- Minimalna nawigacja (tylko X/zakończ i pasek postępu)
- Ukryty pełny header podczas sesji
- Centralnie wyświetlana karta z przodu
- Przycisk "Pokaż odpowiedź" odsłania tył
- 4 przyciski oceny bez pokazywania interwałów czasowych
- Automatyczny zapis po każdej ocenie
- Ekran zakończenia: "Ukończono X fiszek" + przycisk powrotu
- Możliwość przerwania sesji w dowolnym momencie (bez potwierdzenia)

**Dostępność**:

- Duże przyciski (min 44px) dla obsługi dotykowej
- Keyboard shortcuts dla ocen (1/2/3/4 lub A/H/G/E)
- Focus automatycznie na przycisku "Pokaż odpowiedź"
- `aria-live` dla aktualizacji postępu

**Bezpieczeństwo**:

- Weryfikacja własności fiszek (RLS)
- Walidacja rating (1-4)

**Mapowanie historyjek**: US-031, US-032, US-033, US-034, US-035, US-036, US-037, US-038, US-039

**Integracja z API**:

- `GET /api/study/cards` - fiszki do powtórki
- `GET /api/study/cards?deck_id={deckId}` - fiszki z konkretnej talii
- `POST /api/study/review` - wysłanie oceny

---