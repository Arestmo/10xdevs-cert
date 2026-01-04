/**
 * Terms of Service Content
 *
 * Treść regulaminu usługi Flashcards AI.
 * Data ostatniej aktualizacji: 4 stycznia 2026
 */

import type { LegalSection } from "@/types/legal";

export const TERMS_OF_SERVICE_LAST_UPDATED = "4 stycznia 2026";

export const TERMS_OF_SERVICE_SECTIONS: LegalSection[] = [
  {
    id: "postanowienia-ogolne",
    title: "1. Postanowienia ogólne",
    content: [
      {
        paragraphs: [
          'Niniejszy Regulamin określa zasady korzystania z aplikacji internetowej Flashcards AI (dalej: "Aplikacja" lub "Usługa"), dostępnej pod adresem internetowym prowadzonym przez Usługodawcę.',
          'Usługodawcą jest osoba fizyczna prowadząca działalność gospodarczą (dalej: "Usługodawca" lub "Administrator").',
          "Regulamin jest dostępny nieodpłatnie w Aplikacji, co umożliwia jego pobranie, utrwalenie i wydrukowanie.",
        ],
      },
    ],
  },
  {
    id: "definicje",
    title: "2. Definicje",
    content: [
      {
        paragraphs: ["Użyte w Regulaminie pojęcia oznaczają:"],
        list: [
          "Użytkownik – osoba fizyczna posiadająca pełną zdolność do czynności prawnych, która korzysta z Aplikacji po dokonaniu rejestracji",
          "Konto – zbiór zasobów i uprawnień przypisanych do Użytkownika po rejestracji",
          "Fiszka – jednostka nauki składająca się z pytania (front) i odpowiedzi (back), służąca do nauki metodą powtórek",
          "Talia – zbiór fiszek zgrupowanych tematycznie przez Użytkownika",
          "AI (Sztuczna Inteligencja) – technologia służąca do automatycznego generowania fiszek na podstawie tekstu źródłowego dostarczonego przez Użytkownika",
          "Algorytm FSRS – algorytm spaced repetition wykorzystywany do optymalizacji powtórek i nauki",
          "Limit AI – miesięczny limit generacji fiszek przy użyciu sztucznej inteligencji",
        ],
      },
    ],
  },
  {
    id: "rejestracja",
    title: "3. Rejestracja i konto użytkownika",
    content: [
      {
        title: "3.1. Warunki rejestracji",
        paragraphs: [
          "Korzystanie z Aplikacji wymaga utworzenia Konta poprzez rejestrację.",
          "Rejestracja wymaga podania:",
        ],
        list: ["Adresu e-mail", "Hasła spełniającego wymagania bezpieczeństwa"],
      },
      {
        title: "3.2. Zasady bezpieczeństwa konta",
        paragraphs: ["Użytkownik zobowiązany jest do:"],
        list: [
          "Zachowania poufności hasła i nieudostępniania go osobom trzecim",
          "Niezwłocznego powiadomienia Usługodawcy o podejrzeniu nieuprawnionego dostępu do Konta",
          "Używania silnego, unikalnego hasła",
          "Korzystania z Konta wyłącznie osobiście",
        ],
      },
      {
        title: "3.3. Odpowiedzialność za konto",
        paragraphs: [
          "Użytkownik ponosi pełną odpowiedzialność za wszelkie działania podejmowane przy użyciu jego Konta.",
          "Usługodawca nie ponosi odpowiedzialności za szkody wynikające z udostępnienia hasła osobom trzecim.",
        ],
      },
    ],
  },
  {
    id: "zasady-korzystania",
    title: "4. Zasady korzystania z usługi",
    content: [
      {
        title: "4.1. Dozwolone użycie",
        paragraphs: ["Użytkownik ma prawo do:"],
        list: [
          "Tworzenia i edycji własnych fiszek oraz talii",
          "Korzystania z funkcji nauki z wykorzystaniem algorytmu FSRS",
          "Generowania fiszek przy użyciu AI w ramach przysługującego limitu",
          "Eksportowania i importowania własnych danych",
          "Usunięcia Konta w dowolnym momencie",
        ],
      },
      {
        title: "4.2. Zakazy",
        paragraphs: ["Użytkownik zobowiązuje się do niepodejmowania działań, które:"],
        list: [
          "Naruszają obowiązujące przepisy prawa",
          "Naruszają prawa osób trzecich, w tym prawa autorskie",
          "Obejmują treści obraźliwe, nielegalne, obsceniczne lub szkodliwe",
          "Polegają na próbach obejścia ograniczeń technicznych lub limitów Usługi",
          "Polegają na automatycznym wykorzystywaniu API bez zgody Usługodawcy",
          "Obciążają nadmiernie infrastrukturę Usługi (spam, nadużycia)",
          "Polegają na dystrybucji złośliwego oprogramowania",
        ],
      },
      {
        title: "4.3. Konsekwencje naruszenia",
        paragraphs: ["W przypadku naruszenia Regulaminu Usługodawca ma prawo do:"],
        list: [
          "Wysłania ostrzeżenia",
          "Czasowego zawieszenia dostępu do Konta",
          "Trwałego usunięcia Konta bez możliwości odzyskania danych",
          "Podjęcia kroków prawnych w przypadku poważnych naruszeń",
        ],
      },
    ],
  },
  {
    id: "generowanie-ai",
    title: "5. Generowanie fiszek przez AI",
    content: [
      {
        title: "5.1. Zasady generowania",
        paragraphs: [
          "Funkcja generowania fiszek przez AI umożliwia automatyczne tworzenie fiszek na podstawie tekstu źródłowego dostarczonego przez Użytkownika.",
          "Użytkownik może edytować, akceptować lub odrzucać wygenerowane fiszki przed zapisaniem ich w Aplikacji.",
        ],
      },
      {
        title: "5.2. Limity AI",
        paragraphs: [
          "Każdy Użytkownik posiada miesięczny limit generacji fiszek przez AI.",
          "Limit resetuje się pierwszego dnia każdego miesiąca kalendarzowego.",
          "Usługodawca zastrzega sobie prawo do zmiany wysokości limitu AI z odpowiednim powiadomieniem Użytkowników.",
        ],
      },
      {
        title: "5.3. Jakość treści generowanych",
        paragraphs: [
          "Usługodawca nie gwarantuje, że wygenerowane fiszki będą bezbłędne lub w pełni zgodne z oczekiwaniami Użytkownika.",
          "Użytkownik zobowiązany jest do weryfikacji poprawności merytorycznej wygenerowanych treści.",
          "Usługodawca nie ponosi odpowiedzialności za błędy lub niedokładności w treściach wygenerowanych przez AI.",
        ],
      },
      {
        title: "5.4. Przetwarzanie tekstu źródłowego",
        paragraphs: [
          "Tekst źródłowy przesłany do generowania fiszek jest przetwarzany przez zewnętrzną usługę AI (OpenRouter).",
          "Użytkownik nie powinien przesyłać treści poufnych, objętych tajemnicą lub naruszających prawa osób trzecich.",
          "Tekst źródłowy nie jest przechowywany przez Usługodawcę dłużej niż jest to niezbędne do wygenerowania fiszek.",
        ],
      },
    ],
  },
  {
    id: "wlasnosc-intelektualna",
    title: "6. Własność intelektualna",
    content: [
      {
        title: "6.1. Prawa do Aplikacji",
        paragraphs: [
          "Wszelkie prawa własności intelektualnej do Aplikacji, w tym kod źródłowy, interfejs użytkownika, logo i marka, należą do Usługodawcy lub jego licencjodawców.",
          "Użytkownik nie nabywa żadnych praw do elementów Aplikacji poza prawem do korzystania z Usługi zgodnie z Regulaminem.",
        ],
      },
      {
        title: "6.2. Prawa do treści użytkownika",
        paragraphs: [
          "Użytkownik zachowuje pełne prawa autorskie do treści fiszek i talii, które tworzy w Aplikacji.",
          "Poprzez korzystanie z Usługi Użytkownik udziela Usługodawcy niewyłącznej, nieodpłatnej licencji do przechowywania i przetwarzania treści wyłącznie w celu świadczenia Usługi.",
          "Licencja wygasa z chwilą usunięcia treści przez Użytkownika lub usunięcia Konta.",
        ],
      },
    ],
  },
  {
    id: "odpowiedzialnosc",
    title: "7. Odpowiedzialność i wyłączenia",
    content: [
      {
        title: "7.1. Dostępność usługi",
        paragraphs: [
          "Usługodawca dołoży starań, aby Aplikacja działała nieprzerwanie, jednak nie gwarantuje braku przerw technicznych, konserwacji lub awarii.",
          "Usługodawca zastrzega sobie prawo do czasowego wyłączenia Aplikacji w celu przeprowadzenia prac konserwacyjnych.",
        ],
      },
      {
        title: "7.2. Wyłączenie odpowiedzialności",
        paragraphs: [
          'Usługa świadczona jest w modelu "as is" (tak jak jest).',
          "Usługodawca nie ponosi odpowiedzialności za:",
        ],
        list: [
          "Utratę danych spowodowaną przez działania Użytkownika lub błędy techniczne",
          "Szkody wynikające z nieprawidłowego użytkowania Aplikacji",
          "Szkody wynikające z przerw w dostępie do Usługi",
          "Treści generowane przez AI, w tym za ich błędność lub nieadekwatność",
          "Działania osób trzecich (np. ataki hakerskie)",
        ],
      },
      {
        title: "7.3. Zalecenia dotyczące kopii zapasowych",
        paragraphs: [
          "Usługodawca zaleca Użytkownikom regularne tworzenie kopii zapasowych własnych fiszek poprzez eksport danych.",
        ],
      },
    ],
  },
  {
    id: "rozwiazanie-umowy",
    title: "8. Rozwiązanie umowy i usunięcie konta",
    content: [
      {
        paragraphs: [
          "Użytkownik może w każdej chwili rozwiązać umowę i usunąć Konto za pośrednictwem funkcji dostępnej w ustawieniach Aplikacji.",
          "Usunięcie Konta jest nieodwracalne i skutkuje trwałym usunięciem wszystkich danych, w tym fiszek, talii i statystyk nauki.",
          "Usługodawca może rozwiązać umowę i usunąć Konto Użytkownika w przypadku:",
        ],
        list: [
          "Rażącego naruszenia Regulaminu",
          "Prowadzenia działań niezgodnych z prawem",
          "Braku aktywności na Koncie przez okres dłuższy niż 24 miesiące (po uprzednim powiadomieniu)",
        ],
      },
    ],
  },
  {
    id: "dane-osobowe",
    title: "9. Dane osobowe",
    content: [
      {
        paragraphs: [
          "Zasady przetwarzania danych osobowych Użytkowników określa odrębny dokument – Polityka Prywatności, dostępna pod adresem: /privacy-policy",
          "Korzystanie z Aplikacji oznacza akceptację zasad przetwarzania danych osobowych opisanych w Polityce Prywatności.",
        ],
      },
    ],
  },
  {
    id: "zmiany-regulaminu",
    title: "10. Zmiany regulaminu",
    content: [
      {
        paragraphs: [
          "Usługodawca zastrzega sobie prawo do wprowadzania zmian w Regulaminie w następujących przypadkach:",
        ],
        list: [
          "Zmiany przepisów prawa mających wpływ na świadczenie Usługi",
          "Zmiany funkcjonalności Aplikacji",
          "Zmiany zakresu lub sposobu świadczenia Usługi",
          "Zmiany warunków technicznych lub organizacyjnych",
        ],
      },
      {
        paragraphs: [
          "O zmianach Regulaminu Użytkownicy zostaną poinformowani z co najmniej 7-dniowym wyprzedzeniem poprzez:",
        ],
        list: ["Powiadomienie w Aplikacji po zalogowaniu", "Wiadomość e-mail na adres powiązany z Kontem"],
      },
      {
        paragraphs: [
          "Użytkownik ma prawo wypowiedzieć umowę (usunąć Konto) w przypadku braku akceptacji zmian w Regulaminie, w terminie 14 dni od dnia powiadomienia o zmianach.",
          "Kontynuowanie korzystania z Usługi po wejściu w życie zmian oznacza akceptację nowego Regulaminu.",
        ],
      },
    ],
  },
  {
    id: "rozstrzyganie-sporow",
    title: "11. Rozstrzyganie sporów",
    content: [
      {
        paragraphs: [
          "W sprawach nieuregulowanych Regulaminem zastosowanie mają przepisy prawa polskiego, w szczególności:",
        ],
        list: [
          "Ustawa z dnia 18 lipca 2002 r. o świadczeniu usług drogą elektroniczną",
          "Ustawa z dnia 23 kwietnia 1964 r. Kodeks cywilny",
          "Rozporządzenie Parlamentu Europejskiego i Rady (UE) 2016/679 (RODO)",
        ],
      },
      {
        paragraphs: [
          "Wszelkie spory wynikłe z korzystania z Usługi będą rozstrzygane przez sąd właściwy według przepisów Kodeksu postępowania cywilnego.",
          "Użytkownik ma prawo skorzystać z pozasądowych sposobów rozpatrywania reklamacji i dochodzenia roszczeń, w tym poprzez platformę ODR dostępną pod adresem: https://ec.europa.eu/consumers/odr",
        ],
      },
    ],
  },
  {
    id: "postanowienia-koncowe",
    title: "12. Postanowienia końcowe",
    content: [
      {
        paragraphs: [
          "Regulamin wchodzi w życie z dniem publikacji w Aplikacji.",
          "Aktualny Regulamin jest zawsze dostępny pod adresem: /terms-of-service",
          "W sprawach związanych z interpretacją Regulaminu lub korzystaniem z Usługi należy kontaktować się z Usługodawcą za pośrednictwem adresu e-mail: kontakt@flashcards-ai.pl (adres przykładowy – należy zastąpić rzeczywistym adresem kontaktowym)",
        ],
      },
    ],
  },
];
