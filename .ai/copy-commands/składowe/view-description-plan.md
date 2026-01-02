### 2.1 Strona logowania (`/login`)

**Główny cel**: Umożliwienie użytkownikom zalogowania się do aplikacji.

**Kluczowe informacje**:

- Logo aplikacji
- Opcje logowania (Google OAuth, Magic Link)
- Linki do dokumentów prawnych

**Kluczowe komponenty**:

| Komponent           | Opis                                         | Typ             |
| ------------------- | -------------------------------------------- | --------------- |
| `LoginPage`         | Główny kontener strony logowania             | Astro Page      |
| `GoogleOAuthButton` | Przycisk logowania przez Google (główny CTA) | React Component |
| `MagicLinkForm`     | Formularz wysyłania magic link               | React Component |
| `LegalLinks`        | Linki do regulaminu i polityki prywatności   | Astro Component |

**Wymagania UX**:

- Minimalistyczny design bez rozpraszaczy
- Przycisk Google OAuth jako główne CTA (wyróżniony wizualnie)
- Opcja Magic Link jako alternatywa (mniej wyróżniona)
- Komunikat o wysłaniu linku po wypełnieniu formularza email

**Dostępność**:

- Focus visible na wszystkich interaktywnych elementach
- Prawidłowe etykiety ARIA dla formularzy
- Kontrast kolorów zgodny z WCAG 2.1 AA

**Bezpieczeństwo**:

- Walidacja adresu email po stronie klienta i serwera
- CSRF protection przez Supabase
- Rate limiting na wysyłanie magic linków

**Mapowanie historyjek**: US-001, US-002, US-003

---
