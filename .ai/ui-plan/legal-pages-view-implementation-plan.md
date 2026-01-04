# Plan implementacji widoku Stron Prawnych (Legal Pages)

## 1. Przegląd

Strony prawne (`/privacy-policy` i `/terms-of-service`) to publiczne widoki prezentujące wymagane przez RODO dokumenty prawne: politykę prywatności oraz regulamin usługi. Strony te są dostępne bez autentykacji i zawierają statyczną treść w języku polskim. Mają za zadanie informować użytkowników o zasadach przetwarzania danych osobowych, prawach użytkownika oraz warunkach korzystania z aplikacji Flashcards AI.

## 2. Routing widoku

| Ścieżka             | Opis                 | Typ strony                  |
| ------------------- | -------------------- | --------------------------- |
| `/privacy-policy`   | Polityka prywatności | Publiczna (prerender: true) |
| `/terms-of-service` | Regulamin usługi     | Publiczna (prerender: true) |

**Uwaga**: Istniejący komponent `LegalLinks.astro` już używa tych ścieżek, więc routing jest zgodny z aktualną implementacją linków.

## 3. Struktura komponentów

```
PrivacyPolicyPage / TermsOfServicePage (Astro Page)
└── LegalLayout (Astro Layout)
    ├── LegalHeader (Astro Component)
    │   ├── BackLink
    │   └── Logo (opcjonalnie)
    ├── LegalContent (Astro Component)
    │   ├── h1 (tytuł dokumentu)
    │   ├── LastUpdated (data aktualizacji)
    │   ├── TableOfContents (opcjonalnie)
    │   └── ContentSections
    │       ├── h2 (tytuły sekcji)
    │       ├── h3 (podsekcje)
    │       └── p, ul, li (treść)
    └── LegalFooter (Astro Component)
        └── LegalLinks
```

## 4. Szczegóły komponentów

### 4.1 LegalLayout

- **Opis**: Główny layout dla stron prawnych. Definiuje strukturę HTML, meta tagi i wspólne style dla dokumentów prawnych.
- **Główne elementy**:
  - `<!doctype html>`, `<html lang="pl">`
  - `<head>` z meta tagami (charset, viewport, description, robots)
  - `<body>` z klasami Tailwind dla tła i minimalnej wysokości
  - `<main>` jako kontener dla treści
  - Slot dla zawartości strony
- **Obsługiwane interakcje**: Brak (statyczny layout)
- **Obsługiwana walidacja**: Brak
- **Typy**:
  ```typescript
  interface LegalLayoutProps {
    title: string;
    description: string;
  }
  ```
- **Propsy**:
  - `title: string` - tytuł strony (dla tagu `<title>`)
  - `description: string` - opis strony (dla meta description)

### 4.2 LegalHeader

- **Opis**: Nagłówek strony prawnej z linkiem powrotu. Minimalistyczny design pozwalający na skupienie się na treści dokumentu.
- **Główne elementy**:
  - `<header>` z klasami dla paddingu i wyrównania
  - `<nav>` z linkiem powrotu
  - Link z ikoną strzałki i tekstem "Powrót"
- **Obsługiwane interakcje**:
  - Kliknięcie linku powrotu -> nawigacja do poprzedniej strony lub dashboardu
- **Obsługiwana walidacja**: Brak
- **Typy**: Brak specjalnych typów
- **Propsy**: Brak (komponent bez propsów)

### 4.3 LegalContent

- **Opis**: Główny komponent do wyświetlania treści prawnych. Odpowiada za prawidłową strukturę semantyczną, typografię i responsywność długiego tekstu.
- **Główne elementy**:
  - `<article>` jako główny kontener semantyczny
  - `<h1>` dla tytułu dokumentu
  - `<p class="text-muted-foreground">` dla daty aktualizacji
  - `<nav>` dla spisu treści (opcjonalnie)
  - `<section>` dla każdej głównej sekcji dokumentu
  - `<h2>`, `<h3>` dla nagłówków sekcji
  - `<p>`, `<ul>`, `<li>` dla treści
- **Obsługiwane interakcje**:
  - Kliknięcie linku w spisie treści -> przewinięcie do sekcji (anchor links)
- **Obsługiwana walidacja**: Brak
- **Typy**:

  ```typescript
  interface LegalSection {
    id: string;
    title: string;
    content: string | LegalSubsection[];
  }

  interface LegalSubsection {
    title?: string;
    paragraphs: string[];
    list?: string[];
  }

  interface LegalContentProps {
    title: string;
    lastUpdated: string;
    sections: LegalSection[];
    showTableOfContents?: boolean;
  }
  ```

- **Propsy**:
  - `title: string` - tytuł dokumentu
  - `lastUpdated: string` - data ostatniej aktualizacji
  - `sections: LegalSection[]` - sekcje dokumentu
  - `showTableOfContents?: boolean` - czy wyświetlać spis treści (domyślnie: false)

### 4.4 LegalFooter

- **Opis**: Stopka strony prawnej z linkami do innych dokumentów prawnych i opcjonalnie linkiem do dashboardu.
- **Główne elementy**:
  - `<footer>` z klasami dla marginesów i separatora
  - `<hr>` jako separator wizualny
  - `<div>` z linkami do innych dokumentów
  - Istniejący komponent `LegalLinks`
- **Obsługiwane interakcje**:
  - Kliknięcie linków -> nawigacja do odpowiedniego dokumentu
- **Obsługiwana walidacja**: Brak
- **Typy**: Brak specjalnych typów
- **Propsy**: Brak

### 4.5 PrivacyPolicyPage

- **Opis**: Strona Astro wyświetlająca politykę prywatności. Zawiera pełną treść dokumentu zgodną z wymaganiami RODO.
- **Główne elementy**:
  - Import `LegalLayout`
  - Definicja treści polityki prywatności
  - Komponent `LegalContent` z odpowiednimi propsami
- **Obsługiwane interakcje**: Przewijanie, nawigacja przez spis treści
- **Obsługiwana walidacja**: Brak
- **Typy**: Wykorzystuje `LegalSection[]` i `LegalContentProps`
- **Propsy**: Brak (strona Astro)

### 4.6 TermsOfServicePage

- **Opis**: Strona Astro wyświetlająca regulamin usługi. Zawiera warunki korzystania z aplikacji.
- **Główne elementy**:
  - Import `LegalLayout`
  - Definicja treści regulaminu
  - Komponent `LegalContent` z odpowiednimi propsami
- **Obsługiwane interakcje**: Przewijanie, nawigacja przez spis treści
- **Obsługiwana walidacja**: Brak
- **Typy**: Wykorzystuje `LegalSection[]` i `LegalContentProps`
- **Propsy**: Brak (strona Astro)

## 5. Typy

Ponieważ strony prawne są statyczne i nie wymagają integracji z API, potrzebne są jedynie typy pomocnicze do strukturyzacji treści:

```typescript
// src/types/legal.ts

/**
 * Reprezentuje pojedynczą podsekcję dokumentu prawnego
 */
interface LegalSubsection {
  /** Opcjonalny tytuł podsekcji (h3) */
  title?: string;
  /** Akapity tekstu */
  paragraphs: string[];
  /** Opcjonalna lista punktowana */
  list?: string[];
}

/**
 * Reprezentuje główną sekcję dokumentu prawnego
 */
interface LegalSection {
  /** Unikalny identyfikator dla anchor links */
  id: string;
  /** Tytuł sekcji (h2) */
  title: string;
  /** Zawartość sekcji - string dla prostego tekstu lub tablica podsekcji */
  content: string | LegalSubsection[];
}

/**
 * Props dla komponentu LegalContent
 */
interface LegalContentProps {
  /** Główny tytuł dokumentu (h1) */
  title: string;
  /** Data ostatniej aktualizacji w formacie czytelnym */
  lastUpdated: string;
  /** Tablica sekcji dokumentu */
  sections: LegalSection[];
  /** Czy wyświetlać automatycznie generowany spis treści */
  showTableOfContents?: boolean;
}

/**
 * Props dla LegalLayout
 */
interface LegalLayoutProps {
  /** Tytuł strony dla tagu <title> */
  title: string;
  /** Opis strony dla meta description */
  description: string;
}
```

## 6. Zarządzanie stanem

Strony prawne są w pełni statyczne i nie wymagają zarządzania stanem po stronie klienta. Wszystkie komponenty są komponentami Astro (`.astro`) bez potrzeby używania React.

**Uzasadnienie braku stanu:**

- Treść jest statyczna i nie zmienia się w czasie działania
- Brak formularzy ani interaktywnych elementów wymagających stanu
- Nawigacja przez anchor links obsługiwana natywnie przez przeglądarkę
- Strony mogą być w pełni prerenderowane (SSG)

**Opcjonalne usprawnienia (poza MVP):**

- Przycisk "Wróć na górę" - wymagałby minimalnego stanu React dla śledzenia pozycji przewinięcia
- Zapamiętywanie ostatniej pozycji przewinięcia - localStorage

## 7. Integracja API

Strony prawne **nie wymagają integracji z API**. Są to całkowicie statyczne strony z predefiniowaną treścią.

**Uwagi:**

- Brak wywołań do backendu Supabase
- Brak potrzeby autentykacji
- Strony mogą być prerenderowane (`export const prerender = true`)
- Treść dokumentów prawnych jest hardcoded w plikach `.astro`

## 8. Interakcje użytkownika

| Interakcja                                 | Element        | Oczekiwany rezultat                                                                      |
| ------------------------------------------ | -------------- | ---------------------------------------------------------------------------------------- |
| Kliknięcie "Powrót" w nagłówku             | `LegalHeader`  | Nawigacja do poprzedniej strony (history.back()) lub do `/dashboard` jeśli brak historii |
| Kliknięcie linku w spisie treści           | `LegalContent` | Płynne przewinięcie do odpowiedniej sekcji (anchor link z `scroll-behavior: smooth`)     |
| Kliknięcie "Polityka prywatności" w stopce | `LegalFooter`  | Nawigacja do `/privacy-policy`                                                           |
| Kliknięcie "Regulamin" w stopce            | `LegalFooter`  | Nawigacja do `/terms-of-service`                                                         |
| Przewijanie strony                         | Cała strona    | Standardowe zachowanie przewijania                                                       |

## 9. Warunki i walidacja

Strony prawne nie wymagają walidacji danych wejściowych, ponieważ:

- Są to strony tylko do odczytu
- Nie zawierają formularzy
- Nie przyjmują danych od użytkownika
- Nie komunikują się z API

**Jedyna walidacja dotyczy routingu:**

- Jeśli użytkownik wejdzie na nieistniejącą ścieżkę podobną do stron prawnych (np. `/privacy`), powinien zostać przekierowany na właściwą stronę lub zobaczyć stronę 404

## 10. Obsługa błędów

| Scenariusz                | Obsługa                                                                 |
| ------------------------- | ----------------------------------------------------------------------- |
| Strona nie istnieje (404) | Wyświetlenie standardowej strony 404 Astro                              |
| Błąd renderowania         | Strony są prerenderowane, więc błędy występują tylko w czasie budowania |
| Brak JavaScript           | Strony działają w pełni bez JS (Astro Islands)                          |
| Wolne połączenie          | Strony są statyczne, więc ładują się szybko po zbuforowaniu             |

**Uwaga**: Ponieważ strony są statyczne i prerenderowane, większość typowych błędów runtime nie występuje. Głównym zagrożeniem są błędy w czasie budowania aplikacji.

## 11. Kroki implementacji

### Krok 1: Utworzenie typów dla treści prawnych

1. Utworzyć plik `src/types/legal.ts`
2. Zdefiniować interfejsy `LegalSection`, `LegalSubsection`, `LegalContentProps`, `LegalLayoutProps`
3. Wyeksportować typy

### Krok 2: Utworzenie LegalLayout

1. Utworzyć plik `src/layouts/LegalLayout.astro`
2. Zaimplementować podstawową strukturę HTML z `lang="pl"`
3. Dodać meta tagi dla SEO (title, description, robots: "index, follow")
4. Zaimplementować responsywny kontener dla treści
5. Dodać import globalnych stylów

### Krok 3: Utworzenie LegalHeader

1. Utworzyć plik `src/components/legal/LegalHeader.astro`
2. Zaimplementować nagłówek z linkiem powrotu
3. Dodać ikonę strzałki (ChevronLeft lub ArrowLeft)
4. Stylować zgodnie z design systemem (Tailwind)

### Krok 4: Utworzenie LegalContent

1. Utworzyć plik `src/components/legal/LegalContent.astro`
2. Zaimplementować strukturę semantyczną (`<article>`, `<section>`)
3. Dodać style typograficzne dla długiego tekstu:
   - `prose` lub własne klasy dla czytelności
   - Odpowiednie odstępy między paragrafami
   - Stylowanie list
   - Responsywne marginesy
4. Zaimplementować opcjonalny spis treści z anchor links
5. Dodać style dla nagłówków (h1, h2, h3)

### Krok 5: Utworzenie LegalFooter

1. Utworzyć plik `src/components/legal/LegalFooter.astro`
2. Zaimportować istniejący komponent `LegalLinks`
3. Dodać separator wizualny
4. Stylować zgodnie z resztą aplikacji

### Krok 6: Przygotowanie treści Polityki Prywatności

1. Utworzyć plik `src/content/legal/privacy-policy.ts` z treścią polityki
2. Uwzględnić wymagane sekcje:
   - Informacje o administratorze danych
   - Jakie dane są zbierane (email, dane uwierzytelniania)
   - Cel przetwarzania danych
   - Podstawa prawna przetwarzania
   - Okres przechowywania danych
   - Prawa użytkownika (RODO)
   - Informacje o cookies
   - Kontakt

### Krok 7: Przygotowanie treści Regulaminu

1. Utworzyć plik `src/content/legal/terms-of-service.ts` z treścią regulaminu
2. Uwzględnić wymagane sekcje:
   - Definicje
   - Zasady korzystania z usługi
   - Rejestracja i konto użytkownika
   - Generowanie fiszek przez AI
   - Limity i ograniczenia
   - Własność intelektualna
   - Odpowiedzialność
   - Zmiany regulaminu
   - Postanowienia końcowe

### Krok 8: Utworzenie strony Privacy Policy

1. Utworzyć plik `src/pages/privacy-policy.astro`
2. Zaimportować `LegalLayout` i komponenty
3. Dodać `export const prerender = true`
4. Zaimportować treść z `src/content/legal/privacy-policy.ts`
5. Wyrenderować stronę z odpowiednimi propsami

### Krok 9: Utworzenie strony Terms of Service

1. Utworzyć plik `src/pages/terms-of-service.astro`
2. Zaimportować `LegalLayout` i komponenty
3. Dodać `export const prerender = true`
4. Zaimportować treść z `src/content/legal/terms-of-service.ts`
5. Wyrenderować stronę z odpowiednimi propsami

### Krok 10: Testowanie i dostępność

1. Zweryfikować prawidłową strukturę nagłówków (h1 -> h2 -> h3)
2. Sprawdzić kontrast tekstu (WCAG 2.1 AA)
3. Przetestować nawigację klawiaturą
4. Sprawdzić responsywność na różnych urządzeniach
5. Zweryfikować działanie anchor links
6. Przetestować link powrotu

### Krok 11: Finalizacja

1. Zweryfikować spójność z istniejącym komponentem `LegalLinks`
2. Upewnić się, że linki w stopce innych stron prowadzą do poprawnych URL-i
3. Sprawdzić meta tagi i SEO
4. Zweryfikować poprawność języka polskiego w treści
