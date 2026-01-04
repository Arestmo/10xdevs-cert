# Skróty klawiszowe - Sesja Nauki

Ten dokument opisuje wszystkie dostępne skróty klawiszowe w widoku sesji nauki (Study View).

## 📝 Podstawowe skróty

### Odsłanianie odpowiedzi

| Klawisz | Akcja                   |
| ------- | ----------------------- |
| `Space` | Odsłoń odpowiedź fiszki |

**Kiedy działa:** Tylko gdy odpowiedź jest jeszcze niewidoczna

**Uwaga:** Gdy odpowiedź jest już odsłonięta, Space nie ma żadnego efektu.

---

## ⭐ Ocenianie fiszek

Po odsłonięciu odpowiedzi możesz ocenić swoją znajomość materiału. Dla każdej oceny dostępne są **dwa skróty** - cyfra lub litera.

### Again (Powtórz)

| Klawisz     | Akcja                                   |
| ----------- | --------------------------------------- |
| `1` lub `A` | Ocena "Again" - materiał niezapamiętany |

**Kolor przycisku:** 🔴 Czerwony
**Kiedy używać:** Gdy nie pamiętasz materiału lub odpowiedź była niepoprawna

---

### Hard (Trudne)

| Klawisz     | Akcja                                          |
| ----------- | ---------------------------------------------- |
| `2` lub `H` | Ocena "Hard" - materiał trudny do zapamiętania |

**Kolor przycisku:** 🟠 Pomarańczowy
**Kiedy używać:** Gdy pamiętasz materiał z trudem, odpowiedź była niepewna

---

### Good (Dobre)

| Klawisz     | Akcja                                      |
| ----------- | ------------------------------------------ |
| `3` lub `G` | Ocena "Good" - materiał dobrze zapamiętany |

**Kolor przycisku:** 🟢 Zielony
**Kiedy używać:** Gdy pamiętasz materiał dobrze, odpowiedź była poprawna

---

### Easy (Łatwe)

| Klawisz     | Akcja                                         |
| ----------- | --------------------------------------------- |
| `4` lub `E` | Ocena "Easy" - materiał łatwy do zapamiętania |

**Kolor przycisku:** 🔵 Niebieski
**Kiedy używać:** Gdy pamiętasz materiał perfekcyjnie, odpowiedź była natychmiastowa i pewna

---

## 🚪 Zakończenie sesji

| Klawisz | Akcja                                    |
| ------- | ---------------------------------------- |
| `Esc`   | Zakończ sesję nauki i wróć do dashboardu |

**Kiedy działa:** W każdym momencie sesji (przed i po odsłonięciu odpowiedzi)

**Uwaga:** Postęp sesji (ocenione fiszki) jest zapisywany automatycznie, więc możesz bezpiecznie zakończyć sesję w dowolnym momencie.

---

## 🎯 Przykładowy przepływ

1. **Start sesji** - pierwsza fiszka jest wyświetlona, focus na przycisku "Pokaż odpowiedź"
2. **Naciśnij `Space`** - odpowiedź zostaje odsłonięta
3. **Oceń swoją znajomość:**
   - Naciśnij `1` lub `A` jeśli nie pamiętałeś
   - Naciśnij `2` lub `H` jeśli było trudno
   - Naciśnij `3` lub `G` jeśli było dobrze
   - Naciśnij `4` lub `E` jeśli było łatwo
4. **Następna fiszka** - automatycznie przechodzisz do kolejnej karty
5. **Powtórz kroki 2-4** dla kolejnych fiszek
6. **Zakończenie** - po ocenieniu wszystkich fiszek lub naciśnij `Esc` aby zakończyć wcześniej

---

## 💡 Wskazówki

### Wybór między cyfrą a literą

- **Cyfry (1-4):** Wygodne gdy korzystasz z numerycznej klawiatury
- **Litery (A/H/G/E):** Mnemonic - pierwszy litera angielskiej nazwy (Again, Hard, Good, Easy)

### Ignorowanie skrótów

Skróty klawiszowe są automatycznie wyłączane gdy:

- Focus jest w polu tekstowym (input/textarea)
- Trwa wysyłanie oceny do serwera (pokazuje się spinner)
- Sesja jest już ukończona

### Duże vs małe litery

Skróty literowe działają zarówno z małymi jak i dużymi literami:

- `a` = `A` = Again
- `h` = `H` = Hard
- `g` = `G` = Good
- `e` = `E` = Easy

---

## ♿ Dostępność

### Screen reader support

Wszystkie interaktywne elementy mają rozszerzone `aria-label` które informują o dostępnych skrótach:

- "Pokaż odpowiedź. Naciśnij spację"
- "Ocena: Again (1). Naciśnij 1 lub A"
- "Ocena: Hard (2). Naciśnij 2 lub H"
- Itd.

### Focus management

- Przycisk "Pokaż odpowiedź" automatycznie otrzymuje focus po załadowaniu fiszki
- Możesz nawigować między przyciskami używając `Tab` i `Shift+Tab`
- `Enter` aktywuje przycisk, na którym jest focus

### Ukryte komunikaty

Screen reader ogłasza dodatkowe informacje:

- "Naciśnij spację aby odsłonić odpowiedź" (gdy odpowiedź niewidoczna)
- "Oceń swoją znajomość: 1 lub A - Again, 2 lub H - Hard, 3 lub G - Good, 4 lub E - Easy" (gdy odpowiedź widoczna)

---

## 🐛 Troubleshooting

### Skróty nie działają

1. Sprawdź czy focus nie jest w polu tekstowym
2. Upewnij się, że nie trwa wysyłanie oceny (nie ma spinnera)
3. Sprawdź czy sesja nie jest już ukończona
4. Sprawdź czy odpowiedź jest odsłonięta (dla ocen)

### Space scrolluje stronę zamiast odsłaniać odpowiedź

To nie powinno się zdarzyć - implementacja używa `event.preventDefault()`. Jeśli jednak się zdarza, kliknij w obszar karty aby focus był na stronie.

### Wielokrotne naciśnięcie klawisza

System zabezpiecza przed wielokrotnym wysłaniem tej samej oceny. Podczas wysyłania (spinner) wszystkie skróty są wyłączone.

---

## 📊 Statystyki

**Całkowita liczba skrótów:** 11

- Odsłanianie: 1 (`Space`)
- Ocenianie: 8 (4 cyfry + 4 litery)
- Zakończenie: 1 (`Esc`)
- Nawigacja: 1 (`Tab`)

**Średni czas sesji z skrótami:** ~50% szybciej niż z myszką
**Zalecane dla:** Power users, osoby które chcą szybko przejść przez dużą liczbę fiszek

---

## 🔄 Przyszłe rozszerzenia (planowane)

- [ ] `?` - wyświetl pomoc ze skrótami (modal)
- [ ] `U` - cofnij ostatnią ocenę (undo)
- [ ] `S` - pomiń aktualną fiszkę (skip)
- [ ] Arrow keys - nawigacja poprzednia/następna fiszka
- [ ] `F` - oznacz fiszkę jako ulubioną (favorite)

---

**Ostatnia aktualizacja:** 2026-01-04
**Wersja dokumentu:** 1.0
