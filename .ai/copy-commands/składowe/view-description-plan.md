### 2.2 Dashboard (`/dashboard`)

**Główny cel**: Centralny hub aplikacji z przeglądem materiałów i szybkim dostępem do głównych funkcji.

**Kluczowe informacje**:

- Liczba fiszek do powtórki
- Lista talii użytkownika
- Status AI limitu (opcjonalnie w UI)

**Kluczowe komponenty**:

| Komponent          | Opis                                      | Typ             |
| ------------------ | ----------------------------------------- | --------------- |
| `DashboardPage`    | Główny kontener z layoutem                | Astro Page      |
| `AppHeader`        | Nagłówek z logo i menu użytkownika        | React Component |
| `UserDropdownMenu` | Dropdown z opcjami Ustawienia/Wyloguj     | React Component |
| `DueReviewTile`    | Kafelek "Do powtórki: X"                  | React Component |
| `CreateDeckTile`   | Kafelek CTA "Nowa talia / Generuj fiszki" | React Component |
| `DeckGrid`         | Grid z kafelkami talii                    | React Component |
| `DeckTile`         | Pojedynczy kafelek talii                  | React Component |
| `EmptyState`       | Pusty stan dla nowych użytkowników        | React Component |
| `GenerationModal`  | Modal generowania AI                      | React Component |

**Wymagania UX**:

- Layout kafelkowy responsywny (1/2/3-4 kolumny)
- Kafelek "Do powtórki" ukryty gdy 0 fiszek
- Pusty stan z CTA "Utwórz pierwszą talię" dla nowych użytkowników
- Kliknięcie kafelka talii otwiera widok talii
- Kliknięcie "Do powtórki" rozpoczyna sesję nauki

**Dostępność**:

- Kafelki jako interaktywne elementy z `role="button"` lub jako linki
- `aria-label` dla kafelków z dodatkowymi informacjami
- Keyboard navigation między kafelkami
- `aria-live` dla dynamicznych aktualizacji liczby fiszek

**Bezpieczeństwo**:

- Strona chroniona - wymaga autentykacji
- Dane ładowane tylko dla zalogowanego użytkownika (RLS)

**Mapowanie historyjek**: US-006, US-021, US-022, US-030, US-040, US-041, US-042

**Integracja z API**:

- `GET /api/decks` - lista talii
- `GET /api/study/summary` - liczba fiszek do powtórki
- `POST /api/decks` - tworzenie nowej talii

---