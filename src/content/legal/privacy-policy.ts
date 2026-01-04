/**
 * Privacy Policy Content
 *
 * Treść polityki prywatności zgodna z wymaganiami RODO.
 * Data ostatniej aktualizacji: 4 stycznia 2026
 */

import type { LegalSection } from "@/types/legal";

export const PRIVACY_POLICY_LAST_UPDATED = "4 stycznia 2026";

export const PRIVACY_POLICY_SECTIONS: LegalSection[] = [
  {
    id: "administrator",
    title: "1. Administrator danych osobowych",
    content: [
      {
        paragraphs: [
          'Administratorem danych osobowych przetwarzanych w ramach aplikacji Flashcards AI jest osoba fizyczna prowadząca działalność gospodarczą (dalej: "Administrator").',
          'Kontakt z Administratorem możliwy jest za pośrednictwem adresu e-mail dostępnego w sekcji "Kontakt" niniejszej polityki prywatności.',
        ],
      },
    ],
  },
  {
    id: "zakres-danych",
    title: "2. Zakres przetwarzanych danych",
    content: [
      {
        title: "2.1. Dane rejestracyjne i uwierzytelniania",
        paragraphs: ["W celu świadczenia usługi przetwarzamy następujące dane osobowe:"],
        list: [
          "Adres e-mail użytkownika",
          "Hasło (przechowywane w formie zaszyfrowanej przez dostawcę usługi uwierzytelniania Supabase)",
          "Unikalny identyfikator użytkownika (UUID)",
          "Daty utworzenia i ostatniej aktualizacji konta",
        ],
      },
      {
        title: "2.2. Dane dotyczące korzystania z usługi",
        paragraphs: ["W ramach korzystania z funkcjonalności aplikacji przetwarzamy:"],
        list: [
          "Treści fiszek tworzonych przez użytkownika (pytania i odpowiedzi)",
          "Nazwy i strukturę talii fiszek",
          "Statystyki nauki i powtórek (zgodnie z algorytmem FSRS)",
          "Liczbę wykorzystanych generacji AI",
          "Teksty źródłowe przesyłane do generowania fiszek przez AI",
          "Zdarzenia dotyczące akceptacji lub odrzucenia wygenerowanych fiszek",
        ],
      },
      {
        title: "2.3. Dane techniczne",
        paragraphs: ["Automatycznie zbieramy podstawowe dane techniczne niezbędne do prawidłowego działania usługi:"],
        list: ["Adres IP", "Typ i wersja przeglądarki", "System operacyjny", "Informacje o sesji użytkownika"],
      },
    ],
  },
  {
    id: "cel-przetwarzania",
    title: "3. Cel i podstawa prawna przetwarzania danych",
    content: [
      {
        paragraphs: ["Dane osobowe przetwarzane są w następujących celach:"],
        list: [
          "Rejestracja i zarządzanie kontem użytkownika (podstawa prawna: wykonanie umowy – art. 6 ust. 1 lit. b RODO)",
          "Świadczenie usługi aplikacji do nauki fiszek z wykorzystaniem algorytmu spaced repetition (podstawa prawna: wykonanie umowy – art. 6 ust. 1 lit. b RODO)",
          "Generowanie fiszek przy użyciu sztucznej inteligencji (podstawa prawna: wykonanie umowy – art. 6 ust. 1 lit. b RODO)",
          "Zapewnienie bezpieczeństwa i prawidłowego działania usługi (podstawa prawna: prawnie uzasadniony interes Administratora – art. 6 ust. 1 lit. f RODO)",
          "Egzekwowanie limitów generacji AI (podstawa prawna: prawnie uzasadniony interes Administratora – art. 6 ust. 1 lit. f RODO)",
          "Archiwizacja danych w celach dowodowych (podstawa prawna: prawnie uzasadniony interes Administratora – art. 6 ust. 1 lit. f RODO)",
          "Wypełnienie obowiązków prawnych ciążących na Administratorze (podstawa prawna: obowiązek prawny – art. 6 ust. 1 lit. c RODO)",
        ],
      },
    ],
  },
  {
    id: "odbiorcy-danych",
    title: "4. Odbiorcy danych osobowych",
    content: [
      {
        paragraphs: ["Dane osobowe mogą być przekazywane następującym kategoriom odbiorców:"],
        list: [
          "Supabase Inc. – dostawca usług uwierzytelniania i bazy danych (hosting w Unii Europejskiej)",
          "OpenRouter – dostawca usług AI wykorzystywanych do generowania fiszek (przetwarzanie tekstu źródłowego)",
          "Dostawcy usług hostingowych i infrastruktury technicznej",
          "Podmioty świadczące usługi IT i wsparcia technicznego",
        ],
      },
      {
        paragraphs: [
          "Wszyscy odbiorcy danych zobowiązani są do zachowania poufności i przetwarzania danych zgodnie z RODO.",
        ],
      },
    ],
  },
  {
    id: "okres-przechowywania",
    title: "5. Okres przechowywania danych",
    content: [
      {
        paragraphs: ["Dane osobowe są przechowywane przez następujące okresy:"],
        list: [
          "Dane konta użytkownika – do momentu usunięcia konta przez użytkownika lub przez Administratora w przypadku naruszenia regulaminu",
          "Dane dotyczące fiszek i nauki – do momentu usunięcia konta",
          "Logi i dane techniczne – przez okres maksymalnie 12 miesięcy",
          "Dane przetwarzane w celach archiwizacyjnych i dowodowych – przez okres wymagany przepisami prawa (do 6 lat od zakończenia roku podatkowego)",
        ],
      },
    ],
  },
  {
    id: "prawa-uzytkownika",
    title: "6. Prawa użytkownika",
    content: [
      {
        paragraphs: ["Każdy użytkownik ma prawo do:"],
        list: [
          "Dostępu do swoich danych osobowych (art. 15 RODO)",
          "Sprostowania nieprawidłowych danych (art. 16 RODO)",
          "Usunięcia danych w określonych przypadkach (art. 17 RODO) – w tym poprzez funkcję usunięcia konta dostępną w ustawieniach",
          "Ograniczenia przetwarzania danych w określonych przypadkach (art. 18 RODO)",
          "Przenoszenia danych (art. 20 RODO)",
          "Wniesienia sprzeciwu wobec przetwarzania danych (art. 21 RODO)",
          "Cofnięcia zgody w dowolnym momencie (jeżeli przetwarzanie odbywa się na podstawie zgody)",
          "Wniesienia skargi do organu nadzorczego (Prezes Urzędu Ochrony Danych Osobowych)",
        ],
      },
      {
        paragraphs: [
          'Aby skorzystać z powyższych praw, należy skontaktować się z Administratorem za pośrednictwem adresu e-mail wskazanego w sekcji "Kontakt".',
        ],
      },
    ],
  },
  {
    id: "usuwanie-konta",
    title: "7. Usuwanie konta i prawo do bycia zapomnianym",
    content: [
      {
        paragraphs: [
          'Użytkownik może w każdej chwili usunąć swoje konto wraz ze wszystkimi danymi osobowymi poprzez funkcję dostępną w sekcji "Ustawienia konta" w aplikacji.',
          "Usunięcie konta jest nieodwracalne i skutkuje trwałym usunięciem:",
        ],
        list: [
          "Danych konta użytkownika (e-mail, identyfikator)",
          "Wszystkich utworzonych fiszek i talii",
          "Statystyk nauki i postępów",
          "Historii generacji AI",
        ],
      },
      {
        paragraphs: [
          "Po usunięciu konta dane mogą być przechowywane w formie zanonimizowanych logów i statystyk przez okres wymagany przepisami prawa.",
        ],
      },
    ],
  },
  {
    id: "bezpieczenstwo",
    title: "8. Bezpieczeństwo danych",
    content: [
      {
        paragraphs: [
          "Administrator stosuje odpowiednie środki techniczne i organizacyjne zapewniające bezpieczeństwo przetwarzanych danych osobowych, w tym:",
        ],
        list: [
          "Szyfrowanie połączeń (SSL/TLS)",
          "Szyfrowanie haseł użytkowników",
          "Regularne kopie zapasowe danych",
          "Ograniczenie dostępu do danych osobowych wyłącznie do upoważnionych osób",
          "Monitoring i audyt bezpieczeństwa",
        ],
      },
    ],
  },
  {
    id: "cookies",
    title: "9. Pliki cookies i technologie śledzące",
    content: [
      {
        paragraphs: [
          "Aplikacja Flashcards AI wykorzystuje pliki cookies niezbędne do zapewnienia prawidłowego działania usługi, w szczególności:",
        ],
        list: [
          "Cookies sesji użytkownika (utrzymanie zalogowania)",
          "Cookies uwierzytelniania (weryfikacja tożsamości użytkownika)",
        ],
      },
      {
        paragraphs: [
          "Nie wykorzystujemy cookies analitycznych, marketingowych ani śledzących bez zgody użytkownika.",
          "Użytkownik może zarządzać ustawieniami cookies w swojej przeglądarce. Wyłączenie cookies może skutkować ograniczeniem funkcjonalności aplikacji.",
        ],
      },
    ],
  },
  {
    id: "zmiany",
    title: "10. Zmiany polityki prywatności",
    content: [
      {
        paragraphs: [
          "Administrator zastrzega sobie prawo do wprowadzania zmian w niniejszej polityce prywatności. O wszelkich zmianach użytkownicy zostaną poinformowani poprzez powiadomienie w aplikacji lub wiadomość e-mail.",
          "Aktualna wersja polityki prywatności zawsze dostępna jest pod adresem: /privacy-policy",
          "Data ostatniej aktualizacji wskazana jest na początku niniejszego dokumentu.",
        ],
      },
    ],
  },
  {
    id: "kontakt",
    title: "11. Kontakt",
    content: [
      {
        paragraphs: [
          "W sprawach związanych z przetwarzaniem danych osobowych i realizacją praw wynikających z RODO należy kontaktować się z Administratorem za pośrednictwem:",
        ],
        list: [
          "E-mail: kontakt@flashcards-ai.pl (adres przykładowy – należy zastąpić rzeczywistym adresem kontaktowym)",
        ],
      },
      {
        paragraphs: [
          "Administrator zobowiązuje się do udzielenia odpowiedzi na zapytania w terminie 30 dni od daty otrzymania wiadomości.",
        ],
      },
    ],
  },
];
