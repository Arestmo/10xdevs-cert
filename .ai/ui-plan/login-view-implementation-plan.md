# Plan implementacji widoku logowania

## 1. Przegląd

Widok logowania stanowi punkt wejścia do aplikacji Flashcards AI. Jego głównym celem jest umożliwienie użytkownikom bezpiecznego uwierzytelnienia się za pomocą dwóch metod: Google OAuth (metoda główna) oraz Magic Link wysyłany na email (metoda alternatywna). Widok charakteryzuje się minimalistycznym designem, który koncentruje uwagę użytkownika na procesie logowania bez rozpraszaczy. Niezalogowani użytkownicy próbujący uzyskać dostęp do dowolnej chronionej strony aplikacji są automatycznie przekierowywani na ten widok.

## 2. Routing widoku

**Ścieżka:** `/login`

**Logika routingu:**

- Niezalogowani użytkownicy: wyświetl stronę logowania
- Zalogowani użytkownicy: przekieruj do `/dashboard`
- Przekierowanie po zalogowaniu:
  - Jeśli istnieje parametr `?redirect=/sciezka`, przekieruj do wskazanej ścieżki
  - W przeciwnym razie przekieruj do `/dashboard`

**Implementacja w middleware** (`src/middleware/index.ts`):

```typescript
// Sprawdzenie sesji i przekierowanie niezalogowanych użytkowników
const {
  data: { session },
} = await supabase.auth.getSession();

if (!session && !publicRoutes.includes(pathname)) {
  return context.redirect(`/login?redirect=${pathname}`);
}

if (session && pathname === "/login") {
  const redirectTo = url.searchParams.get("redirect") || "/dashboard";
  return context.redirect(redirectTo);
}
```

## 3. Struktura komponentów

```
LoginPage (Astro Page)
├── LoginLayout (Astro Component)
│   ├── Logo (SVG/Image)
│   ├── Heading (H1)
│   ├── GoogleOAuthButton (React Component) ← główny CTA
│   ├── Divider (HR z tekstem "lub")
│   ├── MagicLinkForm (React Component)
│   └── LegalLinks (Astro Component)
│       ├── Link do polityki prywatności
│       └── Link do regulaminu
```

## 4. Szczegóły komponentów

### 4.1 LoginPage (Astro Page)

**Opis:** Główna strona logowania - kontener serwerowy odpowiedzialny za sprawdzenie stanu uwierzytelnienia i renderowanie layoutu.

**Lokalizacja:** `src/pages/login.astro`

**Główne elementy:**

- Import komponentu `LoginLayout`
- Logika server-side: sprawdzenie sesji użytkownika
- Przekierowanie zalogowanych użytkowników do dashboard

**Obsługiwane interakcje:** Brak (strona serwerowa)

**Obsługiwana walidacja:**

- Sprawdzenie istnienia sesji użytkownika (server-side)
- Przekierowanie jeśli użytkownik jest już zalogowany

**Typy:**

- `SupabaseClient` z `src/db/supabase.client.ts`
- `Session` z `@supabase/supabase-js`

**Propsy:** Brak (to strona, nie komponent)

**Pseudo-kod:**

```astro
---
const {
  data: { session },
} = await Astro.locals.supabase.auth.getSession();
const redirectUrl = Astro.url.searchParams.get("redirect") || "/dashboard";

if (session) {
  return Astro.redirect(redirectUrl);
}
---

<LoginLayout />
```

### 4.2 LoginLayout (Astro Component)

**Opis:** Komponent layoutu zawierający wszystkie elementy wizualne strony logowania.

**Lokalizacja:** `src/layouts/LoginLayout.astro`

**Główne elementy:**

```html
<main class="container">
  <div class="login-card">
    <!-- Logo aplikacji -->
    <img src="/logo.svg" alt="Flashcards AI" />

    <!-- Nagłówek -->
    <h1>Zaloguj się do Flashcards AI</h1>

    <!-- Przycisk Google OAuth (React) -->
    <GoogleOAuthButton client:load />

    <!-- Separator -->
    <div class="divider">
      <hr />
      <span>lub</span>
      <hr />
    </div>

    <!-- Formularz Magic Link (React) -->
    <MagicLinkForm client:load />

    <!-- Linki prawne -->
    <LegalLinks />
  </div>
</main>
```

**Obsługiwane interakcje:** Brak (statyczny kontener)

**Obsługiwana walidacja:** Brak

**Typy:** Brak

**Propsy:** Brak

### 4.3 GoogleOAuthButton (React Component)

**Opis:** Przycisk inicjujący proces logowania przez Google OAuth. Jest to główny element call-to-action (CTA) na stronie logowania, wizualnie wyróżniony.

**Lokalizacja:** `src/components/GoogleOAuthButton.tsx`

**Główne elementy:**

```tsx
<Button variant="default" size="lg" onClick={handleGoogleLogin} disabled={isLoading} className="w-full">
  {isLoading ? (
    <LoadingSpinner />
  ) : (
    <>
      <GoogleIcon />
      <span>Zaloguj przez Google</span>
    </>
  )}
</Button>;

{
  error && (
    <Alert variant="destructive">
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
}
```

**Obsługiwane interakcje:**

- `onClick`: Wywołanie funkcji `handleGoogleLogin` która inicjuje proces OAuth

**Obsługiwana walidacja:** Brak (autentykacja obsługiwana przez Google i Supabase)

**Typy:**

- `AuthError` (ViewModel dla błędów)
- `SupabaseClient` z `@supabase/supabase-js`

**Propsy:** Brak

**Stan wewnętrzny:**

```typescript
{
  isLoading: boolean; // Czy trwa proces logowania
  error: string | null; // Komunikat błędu (jeśli wystąpił)
}
```

**Logika:**

```typescript
const handleGoogleLogin = async () => {
  setIsLoading(true);
  setError(null);

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    setError("Nie udało się zalogować przez Google. Spróbuj ponownie.");
    setIsLoading(false);
  }
  // Jeśli sukces, Supabase przekieruje automatycznie
};
```

### 4.4 MagicLinkForm (React Component)

**Opis:** Formularz do wprowadzania adresu email i wysyłania magic link. Alternatywna metoda logowania dla użytkowników bez konta Google.

**Lokalizacja:** `src/components/MagicLinkForm.tsx`

**Główne elementy:**

```tsx
<form onSubmit={handleSubmit}>
  <div className="space-y-4">
    <div>
      <Label htmlFor="email">Adres email</Label>
      <Input
        id="email"
        type="email"
        placeholder="twoj@email.pl"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={isLoading || isSent}
        required
        aria-invalid={!!error}
        aria-describedby={error ? "email-error" : undefined}
      />
      {error && (
        <p id="email-error" className="text-destructive text-sm">
          {error}
        </p>
      )}
    </div>

    <Button type="submit" variant="outline" disabled={isLoading || isSent || !isEmailValid} className="w-full">
      {isLoading ? <LoadingSpinner /> : isSent ? "Link wysłany" : "Wyślij link do logowania"}
    </Button>

    {isSent && (
      <Alert>
        <MailIcon />
        <AlertDescription>
          Link do logowania został wysłany na adres <strong>{email}</strong>. Sprawdź swoją skrzynkę pocztową. Link jest
          ważny przez 1 godzinę.
        </AlertDescription>
      </Alert>
    )}
  </div>
</form>
```

**Obsługiwane interakcje:**

- `onChange` (input email): Aktualizacja wartości email w stanie
- `onSubmit` (formularz): Wysłanie magic link przez Supabase

**Obsługiwana walidacja:**

1. **Format email (klient):**
   - Typ HTML5: `type="email"`
   - Dodatkowa walidacja regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
   - Komunikat błędu: "Podaj poprawny adres email"

2. **Pole wymagane:**
   - Email nie może być pusty
   - Komunikat błędu: "Adres email jest wymagany"

3. **Stan przycisku submit:**
   - Wyłączony gdy: email pusty, niepoprawny format, `isLoading === true`, lub `isSent === true`
   - Włączony gdy: email poprawny i `isLoading === false` i `isSent === false`

**Typy:**

- `MagicLinkFormState` (ViewModel)
- `SupabaseClient` z `@supabase/supabase-js`

**Propsy:** Brak

**Stan wewnętrzny** (zarządzany przez hook `useMagicLinkAuth`):

```typescript
{
  email: string; // Wartość pola email
  isLoading: boolean; // Czy trwa wysyłanie linku
  isSent: boolean; // Czy link został wysłany
  error: string | null; // Komunikat błędu walidacji lub API
}
```

### 4.5 LegalLinks (Astro Component)

**Opis:** Prosty komponent statyczny wyświetlający linki do polityki prywatności i regulaminu usługi.

**Lokalizacja:** `src/components/LegalLinks.astro`

**Główne elementy:**

```html
<footer class="legal-links">
  <a href="/privacy-policy">Polityka prywatności</a>
  <span aria-hidden="true">•</span>
  <a href="/terms-of-service">Regulamin</a>
</footer>
```

**Obsługiwane interakcje:**

- Kliknięcie linków (standardowa nawigacja)

**Obsługiwana walidacja:** Brak

**Typy:** Brak

**Propsy:** Brak

## 5. Typy

### 5.1 MagicLinkFormState (ViewModel)

Typ opisujący stan formularza Magic Link.

```typescript
interface MagicLinkFormState {
  /** Wartość pola email wprowadzona przez użytkownika */
  email: string;

  /** Czy trwa proces wysyłania magic link (stan ładowania) */
  isLoading: boolean;

  /** Czy magic link został pomyślnie wysłany */
  isSent: boolean;

  /** Komunikat błędu walidacji lub błędu API (null jeśli brak błędu) */
  error: string | null;
}
```

### 5.2 AuthError (ViewModel)

Typ opisujący błędy uwierzytelniania.

```typescript
interface AuthError {
  /** Przyjazny dla użytkownika komunikat błędu */
  message: string;

  /** Opcjonalny kod błędu z Supabase do celów diagnostycznych */
  code?: string;
}
```

### 5.3 Typy z Supabase

Wykorzystywane typy z biblioteki `@supabase/supabase-js`:

```typescript
import type { SupabaseClient, Session, AuthError as SupabaseAuthError } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";

type AppSupabaseClient = SupabaseClient<Database>;
```

## 6. Zarządzanie stanem

### 6.1 GoogleOAuthButton - stan lokalny

Komponent zarządza stanem lokalnie za pomocą `useState`:

```typescript
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

**Przepływ stanu:**

1. Kliknięcie przycisku → `isLoading = true`, `error = null`
2. Wywołanie Supabase OAuth → oczekiwanie na odpowiedź
3. Sukces → przekierowanie przez Supabase (komponent się odmontowuje)
4. Błąd → `isLoading = false`, `error = komunikat błędu`

### 6.2 MagicLinkForm - custom hook

Do zarządzania stanem formularza używany jest dedykowany hook `useMagicLinkAuth`.

**Lokalizacja:** `src/components/hooks/useMagicLinkAuth.ts`

**Sygnatura:**

```typescript
function useMagicLinkAuth(): {
  email: string;
  setEmail: (email: string) => void;
  isLoading: boolean;
  isSent: boolean;
  error: string | null;
  isEmailValid: boolean;
  sendMagicLink: () => Promise<void>;
  resetForm: () => void;
};
```

**Implementacja:**

```typescript
export function useMagicLinkAuth() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Walidacja formatu email
  const isEmailValid = useMemo(() => {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, [email]);

  // Funkcja wysyłająca magic link
  const sendMagicLink = async () => {
    if (!isEmailValid) {
      setError("Podaj poprawny adres email");
      return;
    }

    setIsLoading(true);
    setError(null);

    const { error: supabaseError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setIsLoading(false);

    if (supabaseError) {
      // Mapowanie błędów Supabase na przyjazne komunikaty
      if (supabaseError.message.includes("rate limit")) {
        setError("Zbyt wiele prób. Spróbuj ponownie za kilka minut.");
      } else {
        setError("Nie udało się wysłać linku. Spróbuj ponownie.");
      }
    } else {
      setIsSent(true);
    }
  };

  const resetForm = () => {
    setEmail("");
    setIsLoading(false);
    setIsSent(false);
    setError(null);
  };

  return {
    email,
    setEmail,
    isLoading,
    isSent,
    error,
    isEmailValid,
    sendMagicLink,
    resetForm,
  };
}
```

**Przepływ stanu:**

1. Użytkownik wpisuje email → `email` aktualizowany, `isEmailValid` przeliczany
2. Submit formularza → `isLoading = true`, `error = null`
3. Wywołanie Supabase API → oczekiwanie na odpowiedź
4. Sukces → `isLoading = false`, `isSent = true`, wyświetlenie komunikatu
5. Błąd → `isLoading = false`, `error = komunikat`, umożliwienie ponownej próby

## 7. Integracja API

### 7.1 Google OAuth

**Metoda Supabase:** `signInWithOAuth`

**Wywołanie:**

```typescript
const { error } = await supabase.auth.signInWithOAuth({
  provider: "google",
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
    queryParams: {
      access_type: "offline",
      prompt: "consent",
    },
  },
});
```

**Parametry żądania:**

- `provider`: `'google'` (typ: `Provider`)
- `options.redirectTo`: URL callbacku po autoryzacji (typ: `string`)
- `options.queryParams`: Dodatkowe parametry OAuth (typ: `Record<string, string>`)

**Typ odpowiedzi:**

```typescript
{
  data: {
    provider: Provider;
    url: string; // URL do przekierowania
  }
  error: AuthError | null;
}
```

**Obsługa odpowiedzi:**

- **Sukces:** Supabase automatycznie przekierowuje przeglądarkę do Google OAuth
- **Błąd:** Wyświetl komunikat błędu, umożliw ponowną próbę

**Callback:**
Po autoryzacji Google przekierowuje do `/auth/callback`, gdzie:

1. Supabase middleware odbiera token
2. Tworzy sesję użytkownika
3. Przekierowuje do dashboard lub oryginalnej ścieżki

### 7.2 Magic Link

**Metoda Supabase:** `signInWithOtp`

**Wywołanie:**

```typescript
const { error } = await supabase.auth.signInWithOtp({
  email: email,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`,
  },
});
```

**Parametry żądania:**

- `email`: Adres email użytkownika (typ: `string`)
- `options.emailRedirectTo`: URL do przekierowania po kliknięciu linku (typ: `string`)

**Typ odpowiedzi:**

```typescript
{
  data: {
    user: User | null;
    session: Session | null;
  }
  error: AuthError | null;
}
```

**Obsługa odpowiedzi:**

- **Sukces:** Wyświetl komunikat potwierdzający wysłanie emaila
- **Błąd - rate limit:** "Zbyt wiele prób. Spróbuj ponownie za kilka minut."
- **Błąd - inny:** "Nie udało się wysłać linku. Spróbuj ponownie."

**Przepływ:**

1. Użytkownik wprowadza email i klika "Wyślij"
2. Supabase wysyła email z magic link
3. Użytkownik klika link w emailu
4. Supabase middleware tworzy sesję
5. Przekierowanie do dashboard

## 8. Interakcje użytkownika

### 8.1 Kliknięcie przycisku Google OAuth

**Sekwencja:**

1. Użytkownik klika przycisk "Zaloguj przez Google"
2. Przycisk przechodzi w stan ładowania (spinner, disabled)
3. Wywołanie `supabase.auth.signInWithOAuth({ provider: 'google' })`
4. **Sukces:**
   - Przekierowanie do strony autoryzacji Google
   - Użytkownik autoryzuje aplikację
   - Google przekierowuje do `/auth/callback`
   - Middleware tworzy sesję
   - Przekierowanie do dashboard
5. **Błąd:**
   - Wyświetlenie alertu z komunikatem błędu
   - Przycisk wraca do stanu początkowego
   - Użytkownik może spróbować ponownie

**Stany UI:**

- Początkowy: Przycisk aktywny, bez błędu
- Ładowanie: Przycisk nieaktywny, spinner, bez błędu
- Błąd: Przycisk aktywny, alert z błędem widoczny

### 8.2 Wypełnienie formularza Magic Link

**Sekwencja:**

1. Użytkownik wpisuje adres email w pole tekstowe
2. Walidacja email w czasie rzeczywistym (onChange)
3. Przycisk "Wyślij link" jest aktywny tylko gdy email jest poprawny
4. Użytkownik klika "Wyślij link do logowania"
5. Formularz przechodzi w stan ładowania
6. Wywołanie `supabase.auth.signInWithOtp({ email })`
7. **Sukces:**
   - Wyświetlenie alertu z potwierdzeniem
   - Pole email i przycisk nieaktywne
   - Komunikat: "Link wysłany na [email]. Sprawdź skrzynkę."
8. **Błąd:**
   - Wyświetlenie komunikatu błędu pod polem email
   - Formularz wraca do stanu aktywnego
   - Użytkownik może poprawić email lub spróbować ponownie

**Stany UI:**

- Początkowy: Pole aktywne, przycisk nieaktywny (brak emaila)
- Email niepoprawny: Pole aktywne, przycisk nieaktywny, błąd walidacji
- Email poprawny: Pole aktywne, przycisk aktywny, bez błędu
- Ładowanie: Pole nieaktywne, przycisk nieaktywny ze spinnerem
- Wysłano: Pole nieaktywne, przycisk nieaktywny "Link wysłany", alert sukcesu
- Błąd: Pole aktywne, przycisk aktywny, alert błędu

### 8.3 Kliknięcie linków prawnych

**Sekwencja:**

1. Użytkownik klika link "Polityka prywatności" lub "Regulamin"
2. Nawigacja do odpowiedniej strony (`/privacy-policy` lub `/terms-of-service`)
3. Wyświetlenie treści dokumentu prawnego

**Uwaga:** Po powrocie do strony logowania stan formularzy jest resetowany (nowa instancja strony).

## 9. Warunki i walidacja

### 9.1 Walidacja formatu email (MagicLinkForm)

**Gdzie:** Komponent `MagicLinkForm`, hook `useMagicLinkAuth`

**Warunki:**

1. Email nie może być pusty
2. Email musi pasować do regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
3. Dodatkowa walidacja HTML5 przez atrybut `type="email"`

**Wpływ na UI:**

- Przycisk submit jest `disabled` gdy `!isEmailValid`
- Komunikat błędu wyświetlany gdy użytkownik próbuje submitować niepoprawny email
- Atrybut `aria-invalid="true"` na polu input gdy jest błąd
- Atrybut `aria-describedby` wskazuje na element z komunikatem błędu

**Komunikaty błędów:**

- Pusty email: "Adres email jest wymagany"
- Niepoprawny format: "Podaj poprawny adres email"

### 9.2 Stan przycisku submit (MagicLinkForm)

**Gdzie:** Komponent `MagicLinkForm`

**Warunki wyłączenia przycisku:**

```typescript
disabled={isLoading || isSent || !isEmailValid}
```

1. `isLoading === true` - trwa wysyłanie linku
2. `isSent === true` - link już został wysłany
3. `!isEmailValid` - email jest pusty lub niepoprawny

**Wpływ na UI:**

- Przycisk wizualnie nieaktywny (opacity, cursor)
- Tekst przycisku zmienia się:
  - Normalny: "Wyślij link do logowania"
  - Ładowanie: Spinner + brak tekstu
  - Wysłano: "Link wysłany" + ikona checkmark

### 9.3 Sprawdzenie sesji (LoginPage - server-side)

**Gdzie:** Plik `src/pages/login.astro`, middleware `src/middleware/index.ts`

**Warunki:**

1. Użytkownik ma aktywną sesję w Supabase
2. Użytkownik próbuje wejść na `/login`

**Wpływ:**

- Automatyczne przekierowanie do dashboard
- Zapobiega wyświetleniu strony logowania zalogowanym użytkownikom

**Implementacja:**

```typescript
const {
  data: { session },
} = await Astro.locals.supabase.auth.getSession();

if (session) {
  const redirectUrl = Astro.url.searchParams.get("redirect") || "/dashboard";
  return Astro.redirect(redirectUrl);
}
```

### 9.4 Rate limiting (API Supabase)

**Gdzie:** API Supabase (server-side)

**Warunki:**

- Użytkownik próbuje wysłać zbyt wiele magic linków w krótkim czasie
- Supabase zwraca błąd z kodem rate limit

**Wpływ na UI:**

- Wyświetlenie specyficznego komunikatu: "Zbyt wiele prób. Spróbuj ponownie za kilka minut."
- Sugerowanie alternatywnej metody logowania (Google OAuth)

**Obsługa w kodzie:**

```typescript
if (supabaseError.message.includes("rate limit")) {
  setError("Zbyt wiele prób. Spróbuj ponownie za kilka minut.");
}
```

## 10. Obsługa błędów

### 10.1 Błędy Google OAuth

**Scenariusze błędów:**

1. **Użytkownik anuluje autoryzację**
   - **Detekcja:** Brak sesji po powrocie z Google
   - **Obsługa:** Wyświetl neutralny komunikat "Logowanie anulowane"
   - **Akcja użytkownika:** Może spróbować ponownie

2. **Błąd sieci podczas inicjacji OAuth**
   - **Detekcja:** `error` w odpowiedzi `signInWithOAuth`
   - **Obsługa:** Wyświetl "Nie udało się zalogować przez Google. Sprawdź połączenie z internetem."
   - **Akcja użytkownika:** Sprawdź internet, spróbuj ponownie

3. **Usługa Google niedostępna**
   - **Detekcja:** Timeout lub błąd 503 od Google
   - **Obsługa:** Wyświetl "Usługa logowania Google jest chwilowo niedostępna. Spróbuj za chwilę lub użyj emaila."
   - **Akcja użytkownika:** Poczekaj lub użyj Magic Link

4. **Błąd konfiguracji Supabase**
   - **Detekcja:** Błąd 400/401 od Supabase
   - **Obsługa:** Wyświetl ogólny komunikat + loguj szczegóły do konsoli dla dewelopera
   - **Akcja użytkownika:** Skontaktuj się z supportem

**Implementacja:**

```typescript
const { error } = await supabase.auth.signInWithOAuth({
  provider: "google",
  options: { redirectTo: `${window.location.origin}/auth/callback` },
});

if (error) {
  console.error("Google OAuth error:", error);

  let userMessage = "Nie udało się zalogować przez Google. Spróbuj ponownie.";

  if (error.message.includes("network")) {
    userMessage = "Nie udało się zalogować przez Google. Sprawdź połączenie z internetem.";
  }

  setError(userMessage);
  setIsLoading(false);
}
```

### 10.2 Błędy Magic Link

**Scenariusze błędów:**

1. **Niepoprawny format email (klient)**
   - **Detekcja:** Walidacja regex przed submitem
   - **Obsługa:** Wyświetl "Podaj poprawny adres email" pod polem
   - **Akcja użytkownika:** Popraw email

2. **Rate limiting**
   - **Detekcja:** `error.message.includes('rate limit')`
   - **Obsługa:** Wyświetl "Zbyt wiele prób. Spróbuj ponownie za kilka minut."
   - **Akcja użytkownika:** Poczekaj lub użyj Google OAuth

3. **Email nie istnieje (Supabase nie waliduje, zawsze wysyła)**
   - **Obsługa:** Supabase celowo nie zgłasza błędu (bezpieczeństwo)
   - **UI:** Zawsze wyświetl komunikat sukcesu
   - **Uwaga:** Użytkownik dostanie email tylko jeśli adres istnieje

4. **Błąd sieci podczas wysyłania**
   - **Detekcja:** Network error w catch
   - **Obsługa:** Wyświetl "Nie udało się wysłać linku. Sprawdź połączenie z internetem."
   - **Akcja użytkownika:** Sprawdź internet, spróbuj ponownie

5. **Usługa Supabase niedostępna**
   - **Detekcja:** Timeout lub błąd 5xx
   - **Obsługa:** Wyświetl "Serwis chwilowo niedostępny. Spróbuj za chwilę."
   - **Akcja użytkownika:** Poczekaj, spróbuj ponownie

**Implementacja:**

```typescript
const sendMagicLink = async () => {
  if (!isEmailValid) {
    setError("Podaj poprawny adres email");
    return;
  }

  setIsLoading(true);
  setError(null);

  try {
    const { error: supabaseError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (supabaseError) {
      console.error("Magic link error:", supabaseError);

      if (supabaseError.message.includes("rate limit")) {
        setError("Zbyt wiele prób. Spróbuj ponownie za kilka minut.");
      } else if (supabaseError.message.includes("network")) {
        setError("Nie udało się wysłać linku. Sprawdź połączenie z internetem.");
      } else {
        setError("Nie udało się wysłać linku. Spróbuj ponownie.");
      }
    } else {
      setIsSent(true);
    }
  } catch (err) {
    console.error("Unexpected error:", err);
    setError("Wystąpił nieoczekiwany błąd. Spróbuj ponownie.");
  } finally {
    setIsLoading(false);
  }
};
```

### 10.3 Błędy przekierowania

**Scenariusze błędów:**

1. **Niepoprawny parametr `redirect` w URL**
   - **Detekcja:** Walidacja URL w middleware
   - **Obsługa:** Zignoruj parametr, użyj domyślnego `/dashboard`
   - **Bezpieczeństwo:** Waliduj że URL jest wewnętrzny (nie zewnętrzna domena)

2. **Brak dostępu do strony docelowej po zalogowaniu**
   - **Detekcja:** 403 lub 404 na stronie docelowej
   - **Obsługa:** Przekieruj do `/dashboard` zamiast oryginalnej ścieżki
   - **UI:** Opcjonalnie wyświetl toast "Nie masz dostępu do żądanej strony"

**Implementacja walidacji redirect:**

```typescript
// src/middleware/index.ts
const redirectUrl = url.searchParams.get("redirect");
let safeRedirect = "/dashboard";

if (redirectUrl) {
  try {
    const redirectURL = new URL(redirectUrl, url.origin);
    // Sprawdź czy to ten sam origin (bezpieczeństwo)
    if (redirectURL.origin === url.origin) {
      safeRedirect = redirectURL.pathname;
    }
  } catch {
    // Niepoprawny URL - użyj domyślnego
    console.warn("Invalid redirect URL:", redirectUrl);
  }
}

return context.redirect(safeRedirect);
```

### 10.4 Logowanie błędów

Wszystkie błędy powinny być logowane do konsoli dla celów diagnostycznych:

```typescript
if (error) {
  console.error("[Auth Error]", {
    type: "google_oauth",
    message: error.message,
    code: error.code,
    timestamp: new Date().toISOString(),
  });
}
```

W przyszłości można rozszerzyć o zewnętrzny serwis monitoringu (np. Sentry).

## 11. Kroki implementacji

### Krok 1: Przygotowanie struktury plików

1.1. Utwórz strukturę katalogów:

```bash
mkdir -p src/pages/auth
mkdir -p src/components/auth
mkdir -p src/components/hooks
mkdir -p src/layouts
```

1.2. Utwórz pliki komponentów:

```bash
touch src/pages/login.astro
touch src/pages/auth/callback.astro
touch src/layouts/LoginLayout.astro
touch src/components/auth/GoogleOAuthButton.tsx
touch src/components/auth/MagicLinkForm.tsx
touch src/components/LegalLinks.astro
touch src/components/hooks/useMagicLinkAuth.ts
```

### Krok 2: Konfiguracja Supabase Auth

2.1. Sprawdź plik `.env` - upewnij się że istnieją:

```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
```

2.2. Skonfiguruj Supabase Auth providers w dashboard Supabase:

- Włącz Google OAuth provider
- Skonfiguruj Authorized Redirect URLs: `http://localhost:3000/auth/callback` (dev) i URL produkcyjny
- Włącz Email OTP (Magic Link)
- Skonfiguruj email templates dla Magic Link

### Krok 3: Implementacja middleware dla routingu

3.1. Zaktualizuj `src/middleware/index.ts`:

```typescript
import { defineMiddleware } from "astro:middleware";

const publicRoutes = ["/login", "/auth/callback", "/privacy-policy", "/terms-of-service"];

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, locals, redirect } = context;
  const pathname = url.pathname;

  // Sprawdź sesję
  const {
    data: { session },
  } = await locals.supabase.auth.getSession();

  // Przekieruj niezalogowanych do /login
  if (!session && !publicRoutes.includes(pathname)) {
    return redirect(`/login?redirect=${encodeURIComponent(pathname)}`);
  }

  // Przekieruj zalogowanych z /login do dashboard
  if (session && pathname === "/login") {
    const redirectParam = url.searchParams.get("redirect");
    let safeRedirect = "/dashboard";

    if (redirectParam) {
      try {
        const redirectURL = new URL(redirectParam, url.origin);
        if (redirectURL.origin === url.origin) {
          safeRedirect = redirectURL.pathname;
        }
      } catch {
        console.warn("Invalid redirect URL:", redirectParam);
      }
    }

    return redirect(safeRedirect);
  }

  return next();
});
```

### Krok 4: Implementacja strony callback

4.1. Utwórz `src/pages/auth/callback.astro`:

```astro
---
// Callback po uwierzytelnieniu OAuth/Magic Link
const { url } = Astro;
const code = url.searchParams.get("code");
const error = url.searchParams.get("error");
const errorDescription = url.searchParams.get("error_description");

if (error) {
  console.error("Auth callback error:", error, errorDescription);
  return Astro.redirect("/login?error=" + encodeURIComponent(errorDescription || "Authentication failed"));
}

if (code) {
  // Wymiana kodu na sesję
  const { error: exchangeError } = await Astro.locals.supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error("Code exchange error:", exchangeError);
    return Astro.redirect("/login?error=auth_failed");
  }
}

// Przekieruj do dashboard
const redirectTo = url.searchParams.get("redirect") || "/dashboard";
return Astro.redirect(redirectTo);
---
```

### Krok 5: Implementacja custom hook useMagicLinkAuth

5.1. Utwórz `src/components/hooks/useMagicLinkAuth.ts`:

```typescript
import { useState, useMemo } from "react";
import { supabaseClient } from "@/db/supabase.client";

export function useMagicLinkAuth() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEmailValid = useMemo(() => {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, [email]);

  const sendMagicLink = async () => {
    if (!isEmailValid) {
      setError("Podaj poprawny adres email");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error: supabaseError } = await supabaseClient.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (supabaseError) {
        console.error("Magic link error:", supabaseError);

        if (supabaseError.message.includes("rate limit")) {
          setError("Zbyt wiele prób. Spróbuj ponownie za kilka minut.");
        } else {
          setError("Nie udało się wysłać linku. Spróbuj ponownie.");
        }
      } else {
        setIsSent(true);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("Wystąpił nieoczekiwany błąd. Spróbuj ponownie.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setIsLoading(false);
    setIsSent(false);
    setError(null);
  };

  return {
    email,
    setEmail,
    isLoading,
    isSent,
    error,
    isEmailValid,
    sendMagicLink,
    resetForm,
  };
}
```

### Krok 6: Implementacja komponentu GoogleOAuthButton

6.1. Utwórz `src/components/auth/GoogleOAuthButton.tsx`:

```typescript
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabaseClient } from '@/db/supabase.client';

export function GoogleOAuthButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    const { error: oauthError } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (oauthError) {
      console.error('Google OAuth error:', oauthError);
      setError('Nie udało się zalogować przez Google. Spróbuj ponownie.');
      setIsLoading(false);
    }
    // Jeśli sukces, Supabase przekieruje automatycznie
  };

  return (
    <div className="space-y-4">
      <Button
        size="lg"
        onClick={handleGoogleLogin}
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span>Logowanie...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              {/* Google Icon SVG */}
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Zaloguj przez Google</span>
          </div>
        )}
      </Button>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
```

### Krok 7: Implementacja komponentu MagicLinkForm

7.1. Utwórz `src/components/auth/MagicLinkForm.tsx`:

```typescript
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useMagicLinkAuth } from '@/components/hooks/useMagicLinkAuth';

export function MagicLinkForm() {
  const {
    email,
    setEmail,
    isLoading,
    isSent,
    error,
    isEmailValid,
    sendMagicLink
  } = useMagicLinkAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMagicLink();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Adres email</Label>
        <Input
          id="email"
          type="email"
          placeholder="twoj@email.pl"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading || isSent}
          required
          aria-invalid={!!error}
          aria-describedby={error ? "email-error" : undefined}
        />
        {error && (
          <p id="email-error" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>

      <Button
        type="submit"
        variant="outline"
        size="lg"
        disabled={isLoading || isSent || !isEmailValid}
        className="w-full"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span>Wysyłanie...</span>
          </div>
        ) : isSent ? (
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Link wysłany</span>
          </div>
        ) : (
          'Wyślij link do logowania'
        )}
      </Button>

      {isSent && (
        <Alert>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <AlertDescription>
            Link do logowania został wysłany na adres <strong>{email}</strong>.
            Sprawdź swoją skrzynkę pocztową. Link jest ważny przez 1 godzinę.
          </AlertDescription>
        </Alert>
      )}
    </form>
  );
}
```

### Krok 8: Implementacja komponentu LegalLinks

8.1. Utwórz `src/components/LegalLinks.astro`:

```astro
<footer class="text-muted-foreground mt-8 flex items-center justify-center gap-2 text-sm">
  <a href="/privacy-policy" class="hover:text-foreground underline-offset-4 hover:underline"> Polityka prywatności </a>
  <span aria-hidden="true">•</span>
  <a href="/terms-of-service" class="hover:text-foreground underline-offset-4 hover:underline"> Regulamin </a>
</footer>
```

### Krok 9: Implementacja layoutu LoginLayout

9.1. Utwórz `src/layouts/LoginLayout.astro`:

```astro
---
import { GoogleOAuthButton } from "@/components/auth/GoogleOAuthButton";
import { MagicLinkForm } from "@/components/auth/MagicLinkForm";
import LegalLinks from "@/components/LegalLinks.astro";
---

<!doctype html>
<html lang="pl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Logowanie - Flashcards AI</title>
  </head>
  <body class="bg-background min-h-screen">
    <main class="container flex min-h-screen items-center justify-center px-4 py-8">
      <div class="w-full max-w-md space-y-8">
        {/* Logo */}
        <div class="flex justify-center">
          <img src="/logo.svg" alt="Flashcards AI" class="h-12 w-auto" />
        </div>

        {/* Nagłówek */}
        <div class="text-center">
          <h1 class="text-3xl font-bold tracking-tight">Zaloguj się do Flashcards AI</h1>
          <p class="text-muted-foreground mt-2 text-sm">Efektywna nauka z fiszkami wspieranymi przez AI</p>
        </div>

        {/* Google OAuth Button */}
        <GoogleOAuthButton client:load />

        {/* Separator */}
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t"></div>
          </div>
          <div class="relative flex justify-center text-xs uppercase">
            <span class="bg-background text-muted-foreground px-2"> lub </span>
          </div>
        </div>

        {/* Magic Link Form */}
        <MagicLinkForm client:load />

        {/* Legal Links */}
        <LegalLinks />
      </div>
    </main>
  </body>
</html>
```

### Krok 10: Implementacja strony logowania

10.1. Utwórz `src/pages/login.astro`:

```astro
---
import LoginLayout from "@/layouts/LoginLayout.astro";

// Sprawdź czy użytkownik jest już zalogowany
const {
  data: { session },
} = await Astro.locals.supabase.auth.getSession();

if (session) {
  const redirectUrl = Astro.url.searchParams.get("redirect") || "/dashboard";
  return Astro.redirect(redirectUrl);
}

// Sprawdź czy są błędy z callback
const error = Astro.url.searchParams.get("error");
---

<LoginLayout error={error} />
```

### Krok 11: Stylowanie z Tailwind CSS

11.1. Upewnij się że w `tailwind.config.mjs` są skonfigurowane kolory i warianty Shadcn/ui:

```javascript
// tailwind.config.mjs
export default {
  darkMode: ["class"],
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // ... reszta kolorów Shadcn
      },
    },
  },
};
```

11.2. Dodaj globalne style w `src/styles/globals.css` (jeśli nie istnieją):

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    /* ... reszta zmiennych CSS dla motywu */
  }

  .dark {
    --background: 0 0% 3.9%;
    --foreground: 0 0% 98%;
    /* ... zmienne dla dark mode */
  }
}
```

### Krok 12: Instalacja wymaganych komponentów Shadcn/ui

12.1. Zainstaluj wymagane komponenty (jeśli nie są już zainstalowane):

```bash
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add alert
```

### Krok 13: Testowanie implementacji

13.1. Testowanie lokalne:

```bash
npm run dev
```

13.2. Przetestuj następujące scenariusze:

**Google OAuth:**

- [ ] Kliknięcie przycisku przekierowuje do Google
- [ ] Po autoryzacji następuje przekierowanie do dashboard
- [ ] Przy pierwszym logowaniu tworzone jest konto
- [ ] Przy kolejnym logowaniu użytkownik jest rozpoznawany
- [ ] Obsługa anulowania autoryzacji przez użytkownika
- [ ] Wyświetlanie błędów gdy autoryzacja się nie powiedzie

**Magic Link:**

- [ ] Walidacja formatu email działa poprawnie
- [ ] Przycisk submit jest nieaktywny przy niepoprawnym email
- [ ] Wysyłanie linku wyświetla komunikat potwierdzający
- [ ] Kliknięcie linku w emailu loguje użytkownika
- [ ] Obsługa rate limiting (zbyt wiele prób)
- [ ] Wyświetlanie błędów przy problemach z wysyłką

**Przekierowania:**

- [ ] Niezalogowani użytkownicy są przekierowywani do `/login`
- [ ] Parametr `?redirect=` działa poprawnie
- [ ] Zalogowani użytkownicy na `/login` są przekierowywani do dashboard
- [ ] Walidacja bezpieczeństwa parametru redirect (tylko wewnętrzne URL)

**Responsywność:**

- [ ] Widok wygląda dobrze na mobile (320px+)
- [ ] Widok wygląda dobrze na tablet
- [ ] Widok wygląda dobrze na desktop
- [ ] Przyciski mają odpowiedni rozmiar na urządzeniach dotykowych

**Dostępność:**

- [ ] Focus visible na wszystkich interaktywnych elementach
- [ ] Etykiety ARIA dla formularzy są poprawne
- [ ] Komunikaty błędów są powiązane z polami (aria-describedby)
- [ ] Kontrast kolorów spełnia WCAG 2.1 AA
- [ ] Nawigacja klawiaturą działa poprawnie

### Krok 14: Optymalizacja i finalne poprawki

14.1. Optymalizacja wydajności:

- Upewnij się że komponenty React są lazy-loaded (`client:load`)
- Zminimalizuj rozmiar bundle przez usunięcie nieużywanych importów
- Dodaj preload dla krytycznych zasobów (logo, fonty)

  14.2. Dodanie meta tagów SEO:

```astro
<head>
  <meta
    name="description"
    content="Zaloguj się do Flashcards AI - efektywna nauka z fiszkami wspieranymi przez sztuczną inteligencję"
  />
  <meta name="robots" content="noindex, nofollow" />
  {/* strona logowania nie powinna być indeksowana */}
</head>
```

14.3. Dodanie favicon i PWA meta tagów (jeśli wymagane).

### Krok 15: Code review i dokumentacja

15.1. Przeprowadź code review:

- Sprawdź czy wszystkie komponenty mają odpowiednie TypeScript types
- Upewnij się że błędy są logowane do konsoli
- Sprawdź czy nie ma hardcoded wartości (wszystko w env variables)

  15.2. Zaktualizuj dokumentację:

- Dodaj komentarze do skomplikowanych fragmentów kodu
- Zaktualizuj README jeśli potrzebne
- Dodaj informacje o konfiguracji Supabase Auth w docs

  15.3. Przygotuj do merge:

```bash
git add .
git commit -m "feat(auth): implement login page with Google OAuth and Magic Link"
git push origin feature/login-view
```

### Krok 16: Deployment i monitoring

16.1. Deploy do środowiska staging:

- Upewnij się że environment variables są skonfigurowane
- Przetestuj wszystkie flow na staging
- Sprawdź czy email templates działają poprawnie

  16.2. Konfiguracja monitoringu:

- Dodaj error tracking (np. Sentry) dla błędów auth
- Skonfiguruj alerty dla wysokiego wskaźnika błędów logowania
- Monitoruj metryki konwersji (ile użytkowników kończy flow logowania)

  16.3. Deploy do produkcji po zatwierdzeniu testów.

---

**Koniec planu implementacji**
