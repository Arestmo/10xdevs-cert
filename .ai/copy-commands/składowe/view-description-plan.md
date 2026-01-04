### 2.6 Strona ustawień (`/settings`)

**Główny cel**: Zarządzanie kontem użytkownika i preferencjami.

**Kluczowe informacje**:

- Informacje o koncie (email)
- Status limitu AI (wykorzystane/dostępne)
- Opcja usunięcia konta

**Kluczowe komponenty**:

| Komponent              | Opis                                | Typ             |
| ---------------------- | ----------------------------------- | --------------- |
| `SettingsPage`         | Główny kontener ustawień            | Astro Page      |
| `AccountInfo`          | Sekcja z informacjami o koncie      | React Component |
| `AILimitStatus`        | Status limitu AI z datą resetu      | React Component |
| `DeleteAccountSection` | Sekcja usuwania konta               | React Component |
| `DeleteAccountDialog`  | Dialog z dwuetapowym potwierdzeniem | React Component |

**Wymagania UX**:

- Prosty layout z sekcjami
- Wyraźne pokazanie wykorzystanego/pozostałego limitu AI
- Informacja o dacie resetu limitu
- Dwuetapowe usuwanie konta:
  1. Kliknięcie "Usuń konto" pokazuje ostrzeżenie
  2. Potwierdzenie przez wpisanie "USUŃ"
- Przycisk powrotu do dashboardu

**Dostępność**:

- Jasne etykiety sekcji
- Focus trap w dialogu usuwania
- Czytelne komunikaty ostrzegawcze

**Bezpieczeństwo**:

- Potwierdzenie przez wpisanie tekstu "USUŃ"
- Cascade delete wszystkich danych użytkownika
- Wylogowanie po usunięciu konta

**Mapowanie historyjek**: US-005, US-043

**Integracja z API**:

- `GET /api/profile` - informacje o koncie i limicie AI
- `DELETE /api/account` - usunięcie konta

---