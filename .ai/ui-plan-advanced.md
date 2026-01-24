# Architektura UI dla 10x-cards

## 1. Przegląd struktury UI

10x-cards to aplikacja webowa zoptymalizowana dla środowiska desktopowego, oparta na architekturze z bocznym stałym paskiem nawigacyjnym (Sidebar) oraz dynamicznych widoków zajmujących główną powierzchnię ekranu. Aplikacja dzieli się na dwie główne strefy funkcjonalne:

**Strefa kreacji** - widoki związane z generowaniem i wstępną edycją fiszek przy użyciu modelu LLM (Generator)

**Strefa konsumpcji** - widoki związane z zarządzaniem biblioteką, nauką oraz konfiguracją konta (Library, Study Mode, Settings)

Struktura nawigacyjna jest płaska, bez zagnieżdżonych ścieżek. Każdy widok jest dostępny bezpośrednio z paska bocznego. Komunikacja pomiędzy widokami następuje za pomocą standardowych przejść URL oraz stanów lokalnych utrzymywanych w React (np. propozycje AI przed zapisem).

Aplikacja korzysta z autoryzacji Supabase Auth, co oznacza, że widoki logowania i rejestracji są oddzielnymi, minimalistycznymi ekranami bez paska bocznego, natomiast wszystkie widoki aplikacji wymagają uwierzytelnienia i prezentowane są w ramach układu z Sidebaręm.

## 2. Lista widoków

### 2.1. Widok autoryzacji - Rejestracja

**Ścieżka**: `/signup`

**Główny cel**: Umożliwienie nowemu użytkownikowi stworzenia konta w systemie za pomocą adresu email i hasła.

**Kluczowe informacje do wyświetlenia**:

- Formularz rejestracyjny z polami: email, hasło, potwierdzenie hasła
- Link do widoku logowania dla użytkowników już posiadających konto
- Komunikaty błędów walidacji (format email, długość hasła, zgodność haseł)

**Kluczowe komponenty widoku**:

- Formularz rejestracyjny (Form)
- Input dla email (Input type="email")
- Input dla hasła (Input type="password")
- Przycisk "Zarejestruj się" (Button)
- Link nawigacyjny do logowania (Link)
- Obszar komunikatów błędów (Alert)

**UX, dostępność i względy bezpieczeństwa**:

- Walidacja formatu email w czasie rzeczywistym za pomocą HTML5 validation
- Minimalna długość hasła wymuszana na poziomie walidacji frontend i backend
- Wyświetlanie jasnych komunikatów błędów przy próbie rejestracji na istniejący email
- Walidacja zgodności haseł przed wysłaniem formularza
- Focus automatyczny na pierwszym polu przy załadowaniu widoku
- Obsługa klawiatury (Enter do przesłania formularza)
- Layout minimalistyczny bez rozpraszaczy, z jasną hierarchią wizualną
- Zabezpieczenie przed XSS poprzez HTML encoding

### 2.2. Widok autoryzacji - Logowanie

**Ścieżka**: `/login`

**Główny cel**: Umożliwienie zalogowania użytkownikowi, który posiada już konto w systemie.

**Kluczowe informacje do wyświetlenia**:

- Formularz logowania z polami: email, hasło
- Link do widoku rejestracji dla nowych użytkowników
- Komunikaty błędów logowania (błędne dane)

**Kluczowe komponenty widoku**:

- Formularz logowania (Form)
- Input dla email (Input type="email")
- Input dla hasła (Input type="password")
- Przycisk "Zaloguj się" (Button)
- Link nawigacyjny do rejestracji (Link)
- Obszar komunikatów błędów (Alert)

**UX, dostępność i względy bezpieczeństwa**:

- Walidacja formatu email
- Jasne komunikaty błędów przy błędnych danych logowania
- Zachowanie sesji użytkownika po odświeżeniu strony (Supabase Auth Session)
- Focus automatyczny na pierwszym polu
- Obsługa klawiatury (Enter)
- Minimalistyczny design spójny z widokiem rejestracji
- Rate limiting po stronie API (ochrona przed brute force)

### 2.3. Widok główny - Generator fiszek (Dashboard)

**Ścieżka**: `/` (strona główna po zalogowaniu)

**Główny cel**: Umożliwienie użytkownikowi wklejenia materiału źródłowego i wygenerowania propozycji fiszek za pomocą AI, a następnie ich edycji i zbiorczego zapisu.

**Kluczowe informacje do wyświetlenia**:

- Pole tekstowe do wprowadzenia materiału źródłowego (1000-10000 znaków)
- Licznik znaków z walidacją w czasie rzeczywistym
- Przycisk "Generuj fiszki" z dynamiczną blokadą i tooltipem ostrzegawczym
- Lista wygenerowanych propozycji fiszek (po kliknięciu generuj)
- Skeleton Screen podczas procesu generowania
- Komunikat "Generowanie fiszek..." podczas ładowania
- Stan edycji każdej propozycji (przód/tył)
- Checkboxy do zaznaczenia/odznaczenia propozycji
- Przycisk "Zapisz wybrane" (zbiorczy zapis)
- Toast z potwierdzeniem sukcesu po zapisie

**Kluczowe komponenty widoku**:

- Textarea z licznikiem znaków (Textarea)
- Przycisk generuj z tooltipem (Button + Tooltip)
- Skeleton loader (Skeleton)
- Lista edytowalnych kart propozycji (Card komponenty w pętli)
- Checkbox dla każdej propozycji (Checkbox)
- Edytowalne pola tekstowe dla przodu i tyłu fiszki (Input/Textarea inline editing)
- Przycisk zapisu zbiorczego (Button)
- Toast notification (Toast z shadcn)

**UX, dostępność i względy bezpieczeństwa**:

- Walidacja długości tekstu w czasie rzeczywistym (licznik 1000-10000 znaków)
- Blokada przycisku "Generuj" z tooltipem ostrzegawczym przy niewłaściwej długości tekstu
- Skeleton Screen z animacją i komunikatem "Generowanie fiszek..." podczas wywołania API
- Wyraźne wizualne rozróżnienie propozycji zaznaczonych vs. odrzuconych
- Edycja inline bez otwierania dodatkowych okien dialogowych
- Obsługa błędów API poprzez Alert z przyciskiem "Ponów"
- Komunikat Toast po udanym zapisie z linkiem/przyciskiem "Przejdź do biblioteki"
- Ręczne przejście do biblioteki (brak automatycznego przekierowania)
- Możliwość kontynuowania pracy w generatorze po zapisie (propozycje znikają, pole tekstowe wraca)
- HTML encoding wszystkich wpisów użytkownika
- Limit długości tekstu wymuszany zarówno frontend jak i backend

### 2.4. Widok Biblioteka fiszek

**Ścieżka**: `/library`

**Główny cel**: Prezentacja wszystkich zapisanych fiszek użytkownika z możliwością przeglądania, edycji, usuwania oraz ręcznego dodawania nowych.

**Kluczowe informacje do wyświetlenia**:

- Lista kart (Card) reprezentujących fiszki
- Przód każdej fiszki jako główna treść karty
- Ikony akcji (edycja, usuwanie) w prawym górnym rogu każdej karty
- Badge wizualnie oznaczający źródło fiszki (AI Generated, AI Edited, User Created)
- Paginacja z przyciskami numerycznymi i strzałkami na dole widoku
- Przycisk "Dodaj fiszkę" w prawym górnym rogu widoku
- Przycisk "Rozpocznij naukę" w górnym pasku
- Stan pusty (Empty State) z komunikatem zachęcającym do dodania pierwszej fiszki
- Liczba wszystkich fiszek i aktualny zakres stronnicowania

**Kluczowe komponenty widoku**:

- Grid/Lista kart fiszek (Card w układzie grid)
- Badge dla źródła fiszki (Badge z shadcn)
- Ikony akcji edycji i usuwania (Button jako icon button)
- Paginacja (Pagination z przyciskami numerycznymi)
- Przycisk "Dodaj fiszkę" otwierający modal (Button)
- Dialog/Modal do ręcznego dodawania fiszki (Dialog z shadcn)
- Dialog/Modal do edycji fiszki (Dialog z shadcn)
- AlertDialog do potwierdzenia usunięcia (AlertDialog z shadcn)
- Empty State component z ilustracją i CTA
- Przycisk "Rozpocznij naukę" (Button)

**UX, dostępność i względy bezpieczeństwa**:

- Wyświetlanie tylko przodu fiszki na karcie w bibliotece (bez odwracania)
- Skrócenie długiego tekstu z elipsą (...) jeśli przekracza max-height karty
- Możliwość rozwinięcia całego tekstu przez kliknięcie w kartę (opcjonalnie w tooltip lub modal)
- Przyciski edycji i usuwania zawsze widoczne w rogu karty
- Potwierdzenie usunięcia w AlertDialog z przyciskami "Anuluj" i "Usuń"
- Ikony akcji z etykietami aria-label dla czytników ekranu
- Paginacja z obsługą klawiatury (strzałki, Enter)
- Empty State z wyraźnym CTA "Dodaj pierwszą fiszkę" lub "Wygeneruj fiszki"
- Modal dodawania/edycji fiszki z walidacją długości pól (max 250 front, max 500 back)
- Toast notification po pomyślnym dodaniu/edycji/usunięciu
- Badge z odpowiednimi kolorami i kontrastem dla czytelności
- Odświeżanie listy po zapisie nowych fiszek z generatora (re-fetch przy załadowaniu widoku)
- RLS (Row Level Security) w bazie zapewnia dostęp tylko do własnych fiszek
- Wyłączenie przycisku "Rozpocznij naukę" jeśli brak fiszek (z tooltipem informacyjnym)

### 2.5. Widok Tryb nauki

**Ścieżka**: `/study`

**Główny cel**: Umożliwienie użytkownikowi przeprowadzenia sesji nauki z wykorzystaniem wszystkich dostępnych fiszek, z mechaniką odwracania karty i śledzenia postępu.

**Kluczowe informacje do wyświetlenia**:

- Karta fiszki w pełnoekranowym, centralnym widoku
- Animacja 3D flip przy odwracaniu karty (front -> back)
- Pasek postępu (Progress bar) pokazujący aktualne X z Y
- Licznik tekstowy "X z Y" fiszek
- Przyciski nawigacyjne: "Następna", "Poprzednia" (opcjonalnie)
- Przycisk "Obróć kartę" lub automatyczne obracanie po kliknięciu w kartę
- Przycisk "Wyjdź" w górnym rogu (powrót do biblioteki)
- Ekran podsumowania sesji po przejściu przez wszystkie fiszki

**Kluczowe komponenty widoku**:

- Komponent karty fiszki z animacją 3D flip (Card z custom CSS transform)
- Progress bar (Progress z shadcn)
- Licznik tekstowy postępu
- Przyciski nawigacyjne (Button)
- Przycisk "Obróć kartę" lub obsługa kliknięcia w kartę (Button/ClickHandler)
- Przycisk "Wyjdź" (Button)
- Ekran podsumowania (Card lub dedykowany layout)
- Przyciski na ekranie podsumowania: "Powtórz sesję", "Wróć do biblioteki" (Button)

**UX, dostępność i względy bezpieczeństwa**:

- Pełnoekranowy, immersive experience bez rozpraszających elementów
- Czytelna typografia z fontem Inter i wysokim kontrastem
- Obsługa skrótów klawiszowych: Spacja (odwrócenie karty), Strzałki (poprzednia/następna)
- Animacja 3D flip dla wzmocnienia doświadczenia wizualnego
- Długie teksty na kartach obsługiwane przez max-height i wewnętrzny scroll
- Progress bar na górze ekranu z aktualnym postępem
- Brak automatycznego przejścia do następnej karty (użytkownik kontroluje tempo)
- Przycisk "Wyjdź" z opcjonalnym potwierdzeniem w AlertDialog
- Ekran podsumowania prezentujący statystyki: liczba przejrzanych fiszek
- Brak zapamiętywania postępu sesji (każda sesja zaczyna się od początku w MVP)
- Obsługa przypadku braku fiszek (przekierowanie lub komunikat przed wejściem)
- Tryb nauki obejmuje WSZYSTKIE dostępne fiszki (brak losowania próbki w MVP)
- Focus management dla dostępności (focus na głównej karcie)
- ARIA labels dla przycisków nawigacyjnych

### 2.6. Widok Ustawienia

**Ścieżka**: `/settings`

**Główny cel**: Prezentacja informacji o koncie użytkownika oraz udostępnienie opcji usunięcia konta.

**Kluczowe informacje do wyświetlenia**:

- Adres email użytkownika
- Data utworzenia konta (opcjonalnie)
- Sekcja "Zarządzanie kontem"
- Przycisk "Usuń konto" w strefie zagrożenia (danger zone)
- Informacja o nieodwracalności usunięcia

**Kluczowe komponenty widoku**:

- Sekcja profilu z informacjami o użytkowniku (Card)
- Przycisk "Usuń konto" w kolorze destructive (Button variant="destructive")
- AlertDialog do potwierdzenia usunięcia konta z wymogiem wpisania adresu email
- Input do wpisania email jako potwierdzenie (Input)
- Przyciski w AlertDialog: "Anuluj", "Usuń konto" (Button)

**UX, dostępność i względy bezpieczeństwa**:

- Wyraźne wizualne oddzielenie strefy zagrożenia (czerwone tło/ramka)
- AlertDialog z wymogiem wpisania adresu email jako potwierdzenie zamiaru usunięcia
- Przycisk "Usuń konto" w AlertDialog aktywny dopiero po wpisaniu poprawnego emaila
- Walidacja wpisanego emaila w czasie rzeczywistym
- Komunikat ostrzegawczy o nieodwracalności operacji
- Toast lub komunikat błędu jeśli usunięcie się nie powiedzie
- Usunięcie konta usuwa wszystkie fiszki i dane użytkownika (kaskadowe usuwanie w bazie)
- Wylogowanie i przekierowanie do strony logowania po pomyślnym usunięciu
- ARIA labels i role dla dostępności
- Jasna hierarchia wizualna z nagłówkami sekcji

### 2.7. Sidebar - Główny element nawigacyjny

**Lokalizacja**: Lewa strona ekranu, widoczny na wszystkich widokach aplikacji (po zalogowaniu)

**Główny cel**: Umożliwienie szybkiej nawigacji pomiędzy głównymi widokami aplikacji oraz wyświetlanie informacji o użytkowniku.

**Kluczowe informacje do wyświetlenia**:

- Logo aplikacji lub nazwa "10x-cards" na górze
- Lista linków nawigacyjnych:
  - Generator (/)
  - Biblioteka (/library)
  - Nauka (/study)
  - Ustawienia (/settings)
- Sekcja użytkownika na dole:
  - Avatar/inicjały użytkownika
  - Email użytkownika
  - Przycisk "Wyloguj"

**Kluczowe komponenty widoku**:

- Kontener sidebara z fixed position
- Logo/Nazwa aplikacji
- Lista linków nawigacyjnych z ikonami (Button as Link)
- Sekcja użytkownika (Card lub custom component)
- Avatar użytkownika (Avatar z shadcn)
- Przycisk "Wyloguj" (Button)

**UX, dostępność i względy bezpieczeństwa**:

- Stała szerokość sidebara (np. 240-280px)
- Aktywny link wizualnie wyróżniony (highlight)
- Ikony dla każdego linku nawigacyjnego dla szybszego rozpoznania
- Hover states dla interaktywnych elementów
- Sekcja użytkownika wyraźnie oddzielona na dole (np. linią)
- Przycisk "Wyloguj" z ikoną
- ARIA current dla aktywnego linku
- Obsługa klawiatury (Tab, Enter)
- Focus states dla wszystkich interaktywnych elementów
- Sidebar pozostaje widoczny również w trybie nauki (z opcją ukrycia za pomocą toggle button)

## 3. Mapa podróży użytkownika

### 3.1. Onboarding - Nowy użytkownik

1. **Start**: Użytkownik wchodzi na stronę aplikacji (nieautoryzowany)
2. **Przekierowanie**: System przekierowuje na `/login`
3. **Rejestracja**: Użytkownik klika link "Zarejestruj się" -> przechodzi na `/signup`
4. **Wypełnienie formularza**: Wprowadza email i hasło
5. **Walidacja**: System waliduje dane w czasie rzeczywistym
6. **Utworzenie konta**: Po kliknięciu "Zarejestruj się" system tworzy konto
7. **Automatyczne logowanie**: System automatycznie loguje użytkownika
8. **Przekierowanie**: Użytkownik ląduje na `/` (Generator)

### 3.2. Główny przepływ - Generowanie i nauka

1. **Start**: Użytkownik loguje się -> ląduje na `/` (Generator)
2. **Wprowadzenie tekstu**: Użytkownik wkleja materiał źródłowy (1000-10000 znaków)
3. **Walidacja**: Licznik pokazuje aktualną liczbę znaków, przycisk "Generuj" staje się aktywny
4. **Generowanie**: Użytkownik klika "Generuj fiszki"
5. **Loading state**: Pole tekstowe zwija się, pojawia się Skeleton Screen z komunikatem "Generowanie fiszek..."
6. **Wyświetlenie propozycji**: System prezentuje listę wygenerowanych propozycji fiszek
7. **Edycja propozycji**: Użytkownik edytuje wybrane propozycje inline (front/back)
8. **Odrzucenie propozycji**: Użytkownik odznacza niepotrzebne propozycje (checkbox)
9. **Zapis**: Użytkownik klika "Zapisz wybrane"
10. **Potwierdzenie**: Toast notification informuje o sukcesie z opcją "Przejdź do biblioteki"
11. **Nawigacja**: Użytkownik ręcznie przechodzi do `/library` (przez toast lub sidebar)
12. **Przegląd biblioteki**: Widzi listę zapisanych fiszek z kartami
13. **Rozpoczęcie nauki**: Klika "Rozpocznij naukę"
14. **Tryb nauki**: Przechodzi na `/study` i rozpoczyna sesję nauki
15. **Nawigacja przez fiszki**: Używa Spacji do odwracania karty, strzałek do nawigacji
16. **Postęp**: Progress bar i licznik pokazują postęp
17. **Zakończenie sesji**: Po ostatniej fiszce widzi ekran podsumowania
18. **Wybór**: Klika "Powtórz" (restart sesji) lub "Wróć do biblioteki" (powrót do `/library`)

### 3.3. Przepływ zarządzania biblioteką

1. **Start**: Użytkownik na `/library`
2. **Przeglądanie**: Scrolluje listę kart fiszek
3. **Paginacja**: Klika numer strony lub strzałki do przejścia na kolejną stronę
4. **Edycja fiszki**: Klika ikonę edycji na karcie
5. **Modal edycji**: Otwiera się Dialog z formularzem edycji
6. **Modyfikacja**: Użytkownik zmienia front lub back
7. **Zapis**: Klika "Zapisz zmiany"
8. **Potwierdzenie**: Toast notification informuje o sukcesie, modal się zamyka
9. **Ręczne dodawanie**: Użytkownik klika "Dodaj fiszkę" w prawym górnym rogu
10. **Modal dodawania**: Otwiera się Dialog z pustym formularzem
11. **Wypełnienie**: Użytkownik wprowadza front i back
12. **Zapis**: Klika "Dodaj"
13. **Potwierdzenie**: Toast notification, modal się zamyka, nowa fiszka pojawia się w bibliotece
14. **Usuwanie**: Użytkownik klika ikonę usuwania na karcie
15. **Potwierdzenie usunięcia**: Otwiera się AlertDialog "Czy na pewno usunąć?"
16. **Usunięcie**: Użytkownik klika "Usuń"
17. **Potwierdzenie**: Toast notification, karta znika z listy

### 3.4. Przepływ ustawień i usuwania konta

1. **Start**: Użytkownik na dowolnym widoku
2. **Nawigacja**: Klika "Ustawienia" w sidebarze
3. **Widok ustawień**: Przechodzi na `/settings`
4. **Przegląd**: Widzi informacje o koncie (email, data utworzenia)
5. **Decyzja o usunięciu**: Klika "Usuń konto" w danger zone
6. **AlertDialog**: Otwiera się dialog z ostrzeżeniem i polem do wpisania emaila
7. **Potwierdzenie**: Użytkownik wpisuje swój email
8. **Walidacja**: Przycisk "Usuń konto" staje się aktywny po poprawnym wpisaniu emaila
9. **Usunięcie**: Użytkownik klika "Usuń konto"
10. **Wykonanie**: System usuwa konto i wszystkie dane
11. **Wylogowanie**: Automatyczne wylogowanie
12. **Przekierowanie**: Użytkownik ląduje na `/login` z komunikatem o pomyślnym usunięciu

### 3.5. Przepływ obsługi błędów API

1. **Kontekst**: Użytkownik próbuje wygenerować fiszki na `/`
2. **Wywołanie API**: System wysyła request do `/api/flashcards/generate-proposals`
3. **Błąd API**: Backend zwraca błąd (429 Too Many Requests lub 502 Bad Gateway)
4. **Alert**: System wyświetla Alert z opisem błędu i przyciskiem "Ponów"
5. **Ponowienie**: Użytkownik klika "Ponów"
6. **Retry**: System ponownie wywołuje API
7. **Sukces/Błąd**: Proces kończy się sukcesem lub ponownym alertem

## 4. Układ i struktura nawigacji

### 4.1. Architektura nawigacji

Aplikacja wykorzystuje **flat navigation architecture** z głównym Sidebareem jako centralnym punktem nawigacyjnym. Struktura URL jest płaska bez zagnieżdżeń:

```
/ (Generator - Dashboard)
/library (Biblioteka)
/study (Tryb nauki)
/settings (Ustawienia)
/login (Logowanie - bez sidebara)
/signup (Rejestracja - bez sidebara)
```

### 4.2. Sidebar jako główny element nawigacyjny

Sidebar jest **stałym elementem** widocznym na wszystkich widokach aplikacji (po zalogowaniu). Jest umieszczony po lewej stronie ekranu z fixed position i zawiera:

**Górna sekcja**:

- Logo/Nazwa "10x-cards"
- Główne linki nawigacyjne z ikonami:
  - 🏠 Generator
  - 📚 Biblioteka
  - 🎓 Nauka
  - ⚙️ Ustawienia

**Dolna sekcja**:

- Avatar użytkownika
- Email użytkownika
- Przycisk "Wyloguj"

### 4.3. Wzorce nawigacji

**Główne przejścia**:

- Sidebar -> kliknięcie linku -> przejście na wybrany widok
- Generator -> Toast po zapisie -> opcjonalne przejście do Biblioteki
- Biblioteka -> "Rozpocznij naukę" -> Tryb nauki
- Tryb nauki -> "Wyjdź" -> powrót do Biblioteki
- Tryb nauki -> Ekran podsumowania -> "Wróć do biblioteki" -> Biblioteka
- Dowolny widok -> "Wyloguj" -> /login

**Zabezpieczenia nawigacyjne**:

- `beforeunload` event na Generatorze gdy są niezapisane propozycje AI
- AlertDialog przy próbie wyjścia z trybu nauki (opcjonalnie)
- Automatyczne przekierowanie na `/login` dla nieautoryzowanych użytkowników
- Middleware Astro sprawdzające sesję użytkownika

### 4.4. Breadcrumbs i kontekst

Aplikacja **nie używa breadcrumbów** ze względu na płaską strukturę nawigacji. Aktualny kontekst jest jasno określony przez:

- Aktywny (highlighted) link w Sidebarze
- Tytuł widoku na głównym obszarze
- URL w pasku przeglądarki

### 4.5. Responsywność nawigacji

**Desktop (MVP)**:

- Sidebar zawsze widoczny, stała szerokość 240-280px
- Główny obszar zajmuje pozostałą przestrzeń

**Przyszłe rozszerzenia (poza MVP)**:

- Mobile: Sidebar jako drawer/hamburger menu
- Tablet: Opcjonalnie zwijany sidebar

## 5. Kluczowe komponenty

### 5.1. Komponenty Shadcn/ui (podstawowe)

**Button** - wykorzystywany wszędzie dla akcji użytkownika

- Warianty: default, destructive, outline, ghost
- Zastosowanie: przyciski akcji, linki nawigacyjne, icon buttons

**Input** - pola tekstowe do wprowadzania danych

- Zastosowanie: formularze logowania, rejestracji, edycji fiszek, pole email w AlertDialog usuwania konta

**Textarea** - większe pola tekstowe

- Zastosowanie: pole wprowadzania materiału źródłowego w generatorze, pola front/back w dodawaniu/edycji fiszek

**Card** - kontener dla grupowania treści

- Zastosowanie: karty fiszek w bibliotece, sekcje w ustawieniach, karta fiszki w trybie nauki

**Dialog** - modalne okna dialogowe

- Zastosowanie: dodawanie nowej fiszki, edycja istniejącej fiszki

**AlertDialog** - okna dialogowe do potwierdzenia krytycznych akcji

- Zastosowanie: potwierdzenie usunięcia fiszki, potwierdzenie usunięcia konta, ostrzeżenie przed wyjściem z sesji nauki

**Toast** - powiadomienia sukcesu/błędu

- Zastosowanie: potwierdzenie zapisu fiszek, potwierdzenie dodania/edycji/usunięcia fiszki, komunikaty o błędach

**Alert** - komunikaty błędów inline

- Zastosowanie: błędy API, błędy walidacji formularzy, ostrzeżenia

**Progress** - pasek postępu

- Zastosowanie: pasek postępu w trybie nauki

**Badge** - etykiety wizualne

- Zastosowanie: oznaczenie źródła fiszki (AI Generated, AI Edited, User Created)

**Checkbox** - pola wyboru

- Zastosowanie: zaznaczanie/odznaczanie propozycji fiszek w generatorze

**Tooltip** - podpowiedzi

- Zastosowanie: tooltip na zablokowanym przycisku "Generuj", podpowiedzi dla icon buttons

**Avatar** - awatar użytkownika

- Zastosowanie: sekcja użytkownika w sidebarze

**Skeleton** - placeholder podczas ładowania

- Zastosowanie: Skeleton Screen podczas generowania fiszek

### 5.2. Komponenty dedykowane (custom)

**FlashcardGenerator**

- Lokalizacja: widok Generator (`/`)
- Odpowiedzialność: zarządzanie stanem wprowadzania tekstu, wywołanie API generowania, prezentacja propozycji, edycja inline, zapis
- Stan lokalny: source_text, proposals[], selected_ids[], loading, error
- Integracja API: POST `/api/flashcards/generate-proposals`, POST `/api/flashcards/save-generated-flashcards`

**FlashcardLibrary**

- Lokalizacja: widok Biblioteka (`/library`)
- Odpowiedzialność: wyświetlanie listy fiszek, paginacja, obsługa akcji edycji/usuwania, modal dodawania
- Stan lokalny: flashcards[], current_page, total_pages, loading
- Integracja API: GET `/api/flashcards?page=X&limit=20`, POST `/api/flashcards`, PUT `/api/flashcards/{id}`, DELETE `/api/flashcards/{id}`

**FlashcardStudyMode**

- Lokalizacja: widok Nauka (`/study`)
- Odpowiedzialność: prezentacja fiszek w trybie nauki, animacja flip, nawigacja, śledzenie postępu, ekran podsumowania
- Stan lokalny: flashcards[], current_index, is_flipped, completed
- Integracja API: GET `/api/flashcards?limit=all` (lub fetch all w paginacji)

**FlashcardCard**

- Lokalizacja: komponenty użyte w FlashcardLibrary i FlashcardStudyMode
- Odpowiedzialność: prezentacja pojedynczej fiszki, obsługa akcji (edycja/usuwanie w bibliotece), animacja flip (w trybie nauki)
- Props: flashcard, variant (library/study), onEdit?, onDelete?, onFlip?

**Sidebar**

- Lokalizacja: layout aplikacji (wszystkie widoki po zalogowaniu)
- Odpowiedzialność: nawigacja, prezentacja aktywnego linku, sekcja użytkownika, wylogowanie
- Stan: current_route, user_info
- Integracja: Supabase Auth (user session, signOut)

**AuthForm**

- Lokalizacja: widoki `/login` i `/signup`
- Odpowiedzialność: obsługa formularzy autoryzacji, walidacja, komunikaty błędów
- Warianty: login, signup
- Integracja: Supabase Auth (signIn, signUp)

**Pagination**

- Lokalizacja: widok Biblioteka
- Odpowiedzialność: prezentacja przycisków stronnicowania, obsługa kliknięć, aktualizacja URL
- Props: current_page, total_pages, onPageChange

**EmptyState**

- Lokalizacja: widok Biblioteka (gdy brak fiszek)
- Odpowiedzialność: prezentacja komunikatu i CTA gdy lista jest pusta
- Props: message, cta_text, cta_action

**StudySummary**

- Lokalizacja: widok Nauka (ekran podsumowania)
- Odpowiedzialność: prezentacja statystyk sesji nauki, przyciski "Powtórz" i "Wróć do biblioteki"
- Props: total_cards, onRestart, onExit

### 5.3. Layout komponenty

**MainLayout**

- Odpowiedzialność: główny layout aplikacji z Sidebareem i obszarem głównym
- Użycie: wszystkie widoki aplikacji po zalogowaniu
- Struktura: `<Sidebar /> + <main>{children}</main>`

**AuthLayout**

- Odpowiedzialność: minimalistyczny layout dla widoków autoryzacji
- Użycie: `/login`, `/signup`
- Struktura: `<main className="centered">{children}</main>`

### 5.4. Utility komponenty

**CharacterCounter**

- Lokalizacja: Generator (przy Textarea)
- Odpowiedzialność: licznik znaków z walidacją 1000-10000
- Props: current_length, min, max
- Wygląd: "2543 / 10000"

**LoadingSpinner**

- Odpowiedzialność: animowany spinner dla stanów ładowania
- Użycie: ogólne stany ładowania (nie w generatorze, tam Skeleton)

**ErrorBoundary**

- Odpowiedzialność: przechwytywanie błędów React, wyświetlanie fallback UI
- Użycie: owinięcie głównej aplikacji

### 5.5. Hooks i utilities

**useFlashcards** (custom hook)

- Odpowiedzialność: fetch, create, update, delete fiszek
- Return: { flashcards, loading, error, fetchFlashcards, createFlashcard, updateFlashcard, deleteFlashcard }

**useAuth** (custom hook)

- Odpowiedzialność: zarządzanie stanem autoryzacji użytkownika
- Return: { user, loading, signIn, signUp, signOut }

**useKeyboardShortcuts** (custom hook)

- Odpowiedzialność: obsługa skrótów klawiszowych (Spacja, Strzałki)
- Użycie: widok Nauka

**validateFlashcardInput** (utility function)

- Odpowiedzialność: walidacja długości front (max 250) i back (max 500)
- Return: { valid: boolean, errors: string[] }

**validateSourceText** (utility function)

- Odpowiedzialność: walidacja długości tekstu źródłowego (1000-10000)
- Return: { valid: boolean, error?: string }

## 6. Mapowanie wymagań funkcjonalnych na elementy UI

### 6.1. Uwierzytelnianie i zarządzanie kontem

**PRD 3.1**: System umożliwia rejestrację i logowanie za pomocą adresu email i hasła.

- **Widoki**: `/signup`, `/login`
- **Komponenty**: AuthForm, Input, Button, Alert
- **Integracja**: Supabase Auth (signUp, signIn)

**PRD 3.1**: Użytkownik może trwale usunąć swoje konto wraz ze wszystkimi powiązanymi danymi.

- **Widok**: `/settings`
- **Komponenty**: Button (destructive), AlertDialog, Input (email confirmation)
- **Flow**: Kliknięcie "Usuń konto" -> AlertDialog z polem email -> walidacja -> usunięcie -> wylogowanie -> przekierowanie na `/login`

### 6.2. Generowanie fiszek z użyciem AI

**PRD 3.2**: Interfejs posiada pole tekstowe do wklejenia materiału źródłowego o długości od 1000 do 10000 znaków.

- **Widok**: `/` (Generator)
- **Komponenty**: Textarea, CharacterCounter, Button, Tooltip
- **Walidacja**: real-time counting, button disabled with tooltip when invalid length

**PRD 3.2**: System prezentuje wygenerowane propozycje przed ich zapisaniem.

- **Widok**: `/` (Generator)
- **Komponenty**: Skeleton (during generation), Card list (proposals), Checkbox
- **Flow**: Textarea zwijane -> Skeleton + "Generowanie fiszek..." -> Lista propozycji

**PRD 3.2**: Użytkownik może edytować treść każdej propozycji (przód i tył) bezpośrednio w widoku podglądu.

- **Widok**: `/` (Generator)
- **Komponenty**: Inline editable Input/Textarea w każdej karcie propozycji
- **Mechanizm**: contentEditable lub Input fields w Card

**PRD 3.2**: Użytkownik może odrzucić wybrane propozycje, których nie chce zapisywać.

- **Widok**: `/` (Generator)
- **Komponenty**: Checkbox dla każdej propozycji
- **Flow**: Odznaczenie checkboxa = propozycja nie zostanie wysłana w request do save endpoint

**PRD 3.2**: Do bazy danych zapisywane są tylko nieodrzucone fiszki.

- **Widok**: `/` (Generator)
- **Komponenty**: Button "Zapisz wybrane"
- **Integracja**: POST `/api/flashcards/save-generated-flashcards` z tylko zaznaczonymi propozycjami
- **Potwierdzenie**: Toast notification

### 6.3. Zarządzanie biblioteką fiszek

**PRD 3.3**: Widok "Moje fiszki" prezentuje listę zapisanych elementów z podziałem na strony (paginacja).

- **Widok**: `/library`
- **Komponenty**: FlashcardLibrary, FlashcardCard (grid), Pagination
- **Integracja**: GET `/api/flashcards?page=X&limit=20`

**PRD 3.3**: Użytkownik może ręcznie dodać nową fiszkę, wpisując przód i tył.

- **Widok**: `/library`
- **Komponenty**: Button "Dodaj fiszkę", Dialog z formularzem (Input front, Textarea back)
- **Integracja**: POST `/api/flashcards`
- **Potwierdzenie**: Toast notification

**PRD 3.3**: Istniejące fiszki można edytować w dedykowanym oknie dialogowym.

- **Widok**: `/library`
- **Komponenty**: Icon button (edycja) na FlashcardCard, Dialog z formularzem
- **Integracja**: PUT `/api/flashcards/{id}`
- **Potwierdzenie**: Toast notification

**Dodatkowe** (z notatek sesji): Użytkownik może usunąć fiszkę.

- **Widok**: `/library`
- **Komponenty**: Icon button (usuwanie) na FlashcardCard, AlertDialog z potwierdzeniem
- **Integracja**: DELETE `/api/flashcards/{id}`
- **Potwierdzenie**: Toast notification

### 6.4. Nauka i powtórki

**PRD 3.4**: Użytkownik może rozpocząć sesję nauki z puli dostępnych fiszek.

- **Widok**: `/library`
- **Komponenty**: Button "Rozpocznij naukę"
- **Flow**: Kliknięcie -> przekierowanie na `/study`

**PRD 3.4**: Interfejs nauki wyświetla najpierw front (pytanie), a po odsłonięciu tył (odpowiedź).

- **Widok**: `/study`
- **Komponenty**: FlashcardCard z animacją 3D flip
- **Mechanizm**: Kliknięcie w kartę lub Spacja -> flip animation -> prezentacja back

**Dodatkowe** (z notatek sesji): Tryb nauki obejmuje wszystkie dostępne fiszki (bez losowania próbki w MVP).

- **Widok**: `/study`
- **Integracja**: GET `/api/flashcards` (all pages lub limit=large number)

**Dodatkowe** (z notatek sesji): Progress bar i licznik postępu.

- **Widok**: `/study`
- **Komponenty**: Progress, licznik tekstowy "X z Y"

**Dodatkowe** (z notatek sesji): Skróty klawiszowe (Spacja, Strzałki).

- **Widok**: `/study`
- **Mechanizm**: useKeyboardShortcuts hook
- **Funkcjonalność**: Spacja = flip, Strzałki = previous/next

**Dodatkowe** (z notatek sesji): Ekran podsumowania po zakończeniu sesji.

- **Widok**: `/study`
- **Komponenty**: StudySummary z przyciskami "Powtórz", "Wróć do biblioteki"

## 7. Stany aplikacji i obsługa błędów

### 7.1. Stany pustye (Empty States)

**Biblioteka pusta**:

- **Lokalizacja**: `/library`
- **Komponent**: EmptyState
- **Komunikat**: "Nie masz jeszcze żadnych fiszek"
- **CTA**: "Wygeneruj fiszki" (link do `/`) lub "Dodaj pierwszą fiszkę" (otwiera modal)

**Tryb nauki bez fiszek**:

- **Lokalizacja**: `/study`
- **Obsługa**: Przycisk "Rozpocznij naukę" wyłączony (disabled) z tooltipem "Brak fiszek do nauki"
- **Alternatywnie**: Przekierowanie z `/study` do `/library` z komunikatem Toast "Dodaj fiszki, aby rozpocząć naukę"

### 7.2. Stany ładowania (Loading States)

**Generowanie fiszek**:

- **Lokalizacja**: `/` (Generator)
- **Komponent**: Skeleton Screen z animacją + komunikat "Generowanie fiszek..."
- **Czas trwania**: Do otrzymania odpowiedzi z API (zazwyczaj 5-15 sekund)

**Ładowanie biblioteki**:

- **Lokalizacja**: `/library`
- **Komponent**: Skeleton cards w grid layout
- **Alternatywnie**: LoadingSpinner

**Zapisywanie fiszek**:

- **Lokalizacja**: `/` (Generator) - przycisk "Zapisz wybrane"
- **Stan**: Button z loading spinner, disabled podczas zapisu
- **Komunikat**: Toast po zakończeniu

**Usuwanie fiszki**:

- **Lokalizacja**: `/library`
- **Stan**: Optimistic update (karta znika od razu) + rollback jeśli błąd

### 7.3. Obsługa błędów API

**Błąd generowania (502 Bad Gateway, 429 Too Many Requests)**:

- **Lokalizacja**: `/` (Generator)
- **Komponent**: Alert z opisem błędu i przyciskiem "Ponów"
- **Przykład**: "Nie udało się wygenerować fiszek. Spróbuj ponownie za chwilę."

**Błąd zapisu fiszek**:

- **Lokalizacja**: `/` (Generator)
- **Komponent**: Toast z komunikatem błędu
- **Przykład**: "Nie udało się zapisać fiszek. Spróbuj ponownie."

**Błąd autoryzacji (401 Unauthorized)**:

- **Obsługa globalna**: Middleware Astro
- **Akcja**: Automatyczne przekierowanie na `/login`

**Błąd walidacji (400 Bad Request)**:

- **Lokalizacja**: Formularze (logowanie, rejestracja, edycja fiszek)
- **Komponent**: Alert inline pod formularzem lub field-level error messages
- **Przykład**: "Email jest nieprawidłowy", "Hasło musi mieć minimum 8 znaków"

**Błąd sieci (Network Error)**:

- **Obsługa globalna**: Error boundary
- **Komponent**: Alert z komunikatem "Brak połączenia z internetem"

### 7.4. Walidacja i zabezpieczenia

**Walidacja długości tekstu źródłowego**:

- **Miejsce**: Generator (`/`)
- **Mechanizm**: CharacterCounter + disabled button + tooltip
- **Walidacja**: Frontend (real-time) + Backend (API endpoint)

**Walidacja długości fiszek**:

- **Miejsce**: Generator, Biblioteka (dodawanie/edycja)
- **Mechanizm**: maxLength attribute + backend validation
- **Limity**: front max 250 chars, back max 500 chars

**Potwierdzenie krytycznych akcji**:

- **Usunięcie fiszki**: AlertDialog "Czy na pewno usunąć?"
- **Usunięcie konta**: AlertDialog z wymogiem wpisania emaila

**Ostrzeżenie przed utratą danych**:

- **Generator z niezapisanymi propozycjami**: beforeunload event
- **Komunikat**: "Masz niezapisane propozycje fiszek. Czy na pewno chcesz opuścić stronę?"

**Zabezpieczenie RLS (Row Level Security)**:

- **Miejsce**: Wszystkie operacje na fiszkach
- **Mechanizm**: Supabase RLS policies
- **Efekt**: Użytkownik może widzieć/edytować/usuwać tylko swoje fiszki

**HTML Encoding**:

- **Miejsce**: Wszystkie wyświetlane dane od użytkownika
- **Mechanizm**: Automatyczne escapowanie przez React
- **Cel**: Ochrona przed XSS

## 8. Dostępność (Accessibility)

### 8.1. Struktura semantyczna

**Wszystkie widoki**:

- Użycie semantycznych tagów HTML5: `<main>`, `<nav>`, `<header>`, `<section>`, `<article>`
- Hierarchia nagłówków: `<h1>` dla tytułu głównego widoku, `<h2>` dla sekcji

**Sidebar**:

- Tag `<nav>` dla głównej nawigacji
- Lista `<ul>/<li>` dla linków nawigacyjnych
- `aria-current="page"` dla aktywnego linku

### 8.2. Obsługa klawiatury

**Globalna**:

- Wszystkie interaktywne elementy dostępne przez Tab
- Focus states dla wszystkich przycisków i linków
- Enter/Space dla aktywacji przycisków

**Tryb nauki (`/study`)**:

- Spacja: odwrócenie karty
- Strzałka w prawo / Strzałka w dół: następna fiszka
- Strzałka w lewo / Strzałka w górę: poprzednia fiszka (opcjonalnie)
- Escape: wyjście z trybu nauki (opcjonalnie)

**Modals (Dialog, AlertDialog)**:

- Escape: zamknięcie modala
- Tab: focus trap wewnątrz modala
- Focus automatyczny na pierwszym polu lub głównym przycisku

### 8.3. ARIA labels i role

**Icon buttons**:

- `aria-label` dla przycisków bez tekstu (ikony edycji/usuwania)
- Przykład: `<Button aria-label="Edytuj fiszkę">✏️</Button>`

**Progress bar**:

- `role="progressbar"`
- `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- `aria-label="Postęp nauki"`

**Alert messages**:

- `role="alert"` dla komunikatów błędów
- Live region dla dynamicznych aktualizacji

**Checkbox**:

- Prawidłowe powiązanie label z input
- `aria-checked` dla custom checkboxów

### 8.4. Kontrast i czytelność

**Kolory**:

- Wysoki kontrast tekstu (minimum WCAG AA 4.5:1)
- Kolory nie są jedynym wskaźnikiem (np. Badge ma również tekst)

**Typografia**:

- Font Inter dla czytelności
- Minimalna wielkość tekstu 16px (14px dla secondary text)
- Line-height minimum 1.5 dla lepszej czytelności

**Fokus**:

- Wyraźny outline dla wszystkich elementów w focus
- Brak usuwania outline (nawet dla mouse users - CSS :focus-visible)

### 8.5. Screen readers

**Obrazy i ikony**:

- Alt text dla wszystkich obrazów
- `aria-hidden="true"` dla ikon czysto dekoracyjnych

**Announcements**:

- Toast notifications z `role="status"` dla screen readers
- Live region dla dynamicznych aktualizacji (np. licznik postępu)

**Skip links**:

- "Skip to main content" link na początku strony (opcjonalnie)

## 9. Optymalizacje UX i szczegóły interakcji

### 9.1. Micro-interactions

**Hover states**:

- Wszystkie przyciski i linki mają hover effect
- Karty fiszek w bibliotece z subtle shadow na hover

**Animacje**:

- 3D flip animation dla kart w trybie nauki (CSS transform)
- Smooth transition dla Progress bar
- Fade in/out dla Toast notifications
- Slide in dla Sidebara (jeśli collapsible w przyszłości)

**Loading animations**:

- Skeleton Screen z pulse animation
- Spinner dla przycisków w stanie loading

### 9.2. Feedback wizualny

**Sukces operacji**:

- Toast notification (zielony) z ikoną ✓
- Przykład: "Fiszki zostały zapisane"

**Błąd operacji**:

- Toast notification (czerwony) z ikoną ✗
- Alert inline dla błędów formularzy

**Progress**:

- Progress bar w trybie nauki aktualizowany po każdej fiszce
- Licznik tekstowy "3 z 20"

**Disabled states**:

- Przycisk "Generuj" disabled z tooltipem gdy invalid length
- Przycisk "Rozpocznij naukę" disabled z tooltipem gdy brak fiszek
- Wyraźne wizualne rozróżnienie disabled buttons (opacity 0.5)

### 9.3. Responsywność i adaptacja (Desktop focus)

**Breakpoints** (dla MVP tylko desktop):

- Desktop: min-width 1024px
- Poniżej tego wyświetlany komunikat "Aplikacja zoptymalizowana dla urządzeń desktopowych"

**Layout**:

- Sidebar: fixed 240-280px
- Main area: flex-grow zajmuje resztę
- Max-width dla contentu wewnętrznego: 1200-1400px (centered)

### 9.4. Performance

**Lazy loading**:

- Obrazy (jeśli będą) z lazy loading
- Code splitting dla różnych widoków (Astro automatic)

**Pagination**:

- Limit 20 fiszek na stronę w bibliotece
- Fetch tylko aktualnej strony

**Debouncing**:

- Character counter w Generatorze (jeśli input, nie paste)

**Optimistic updates**:

- Usuwanie fiszki z biblioteki (znika od razu, rollback jeśli błąd)

## 10. Zgodność z API

### 10.1. Mapowanie endpointów na widoki

**Generator (`/`)**:

- POST `/api/flashcards/generate-proposals` - generowanie propozycji
- POST `/api/flashcards/save-generated-flashcards` - zapis wybranych propozycji

**Biblioteka (`/library`)**:

- GET `/api/flashcards?page=X&limit=20` - pobranie listy fiszek
- POST `/api/flashcards` - ręczne dodanie nowej fiszki
- PUT `/api/flashcards/{id}` - edycja istniejącej fiszki
- DELETE `/api/flashcards/{id}` - usunięcie fiszki

**Tryb nauki (`/study`)**:

- GET `/api/flashcards` - pobranie wszystkich fiszek użytkownika (bez paginacji lub z dużym limitem)

**Autoryzacja** (Supabase Auth):

- Supabase Client SDK dla signIn, signUp, signOut, getSession

### 10.2. Struktura danych

**Flashcard entity**:

```typescript
{
  id: string; // UUID
  front: string; // max 250 chars
  back: string; // max 500 chars
  source: "ai_generated" | "ai_edited" | "user_created";
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}
```

**Generation request**:

```typescript
{
  source_text: string; // 1000-10000 chars
}
```

**Generation response**:

```typescript
{
  generation_id: string; // UUID
  generated_count: number;
  flashcards_proposals: Array<{
    front: string;
    back: string;
    source: "ai_generated";
  }>;
}
```

**Save request**:

```typescript
{
  generation_id: string;
  flashcards: Array<{
    front: string;
    back: string;
    source: "ai_generated" | "ai_edited";
  }>;
}
```

### 10.3. Walidacja zgodna z API

**Frontend validation (przed wysłaniem request)**:

- Source text: 1000-10000 znaków
- Flashcard front: max 250 znaków
- Flashcard back: max 500 znaków
- Email format (w autoryzacji)

**Backend validation (API endpoints)**:

- Te same reguły + dodatkowe business logic
- RLS enforcement dla wszystkich operacji na fiszkach

### 10.4. Error handling zgodny z API

**Kody błędów obsługiwane w UI**:

- 400 Bad Request - walidacja, wyświetlenie komunikatu
- 401 Unauthorized - przekierowanie na `/login`
- 404 Not Found - komunikat "Nie znaleziono zasobu"
- 429 Too Many Requests - komunikat "Zbyt wiele żądań, spróbuj później" z przyciskiem "Ponów"
- 502 Bad Gateway - komunikat "Problem z usługą AI, spróbuj później" z przyciskiem "Ponów"
- 5xx Server Error - ogólny komunikat "Wystąpił błąd, spróbuj ponownie"

## 11. Rozwiązania nierozstrzygniętych kwestii

### 11.1. Nawigacja z niezapisanymi propozycjami AI

**Kwestia**: Brak decyzji dotyczącej zachowania aplikacji przy próbie nawigacji do innej podstrony (np. przez Sidebar) podczas gdy wyświetlane są niezapisane propozycje AI (czy beforeunload wystarczy, czy potrzebny jest wewnętrzny modal blokujący w React?).

**Rekomendowane rozwiązanie dla MVP**:

- **beforeunload** wystarczy dla przejść poza aplikację (zamknięcie karty, odświeżenie)
- **Wewnętrzny guard** dla nawigacji przez Sidebar:
  - Stan `has_unsaved_proposals` w komponencie Generator
  - Sidebar sprawdza ten stan przed nawigacją (jeśli globalny context/store)
  - Alternatywnie: AlertDialog z pytaniem "Masz niezapisane propozycje. Czy na pewno chcesz przejść?" z przyciskami "Anuluj" i "Opuść bez zapisywania"
  - Implementacja: custom hook `useNavigationGuard`

**Implementacja**:

```typescript
// W komponencie Generator
const [hasUnsavedProposals, setHasUnsavedProposals] = useState(false);

// beforeunload dla nawigacji poza aplikację
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (hasUnsavedProposals) {
      e.preventDefault();
      e.returnValue = "";
    }
  };
  window.addEventListener("beforeunload", handleBeforeUnload);
  return () => window.removeEventListener("beforeunload", handleBeforeUnload);
}, [hasUnsavedProposals]);

// Custom guard dla nawigacji wewnętrznej (opcjonalnie przez React Context)
```

### 11.2. Limity znaków na karcie w bibliotece

**Kwestia**: Brak szczegółowych wytycznych co do limitów znaków wyświetlanych na samej karcie w bibliotece (czy tekst ma być ucinany z elipsą ..., jeśli jest za długi, mimo max-height?).

**Rekomendowane rozwiązanie dla MVP**:

- **Strategia wyświetlania**:
  - `max-height` na Card content (np. 100px)
  - `overflow: hidden`
  - `text-overflow: ellipsis` dla tekstu przekraczającego wysokość
  - Liczba linii: `line-clamp: 3` (CSS)
- **Interakcja**:
  - Kliknięcie w kartę otwiera **Tooltip** lub **Popover** z pełnym tekstem przodu
  - Alternatywnie: kliknięcie w kartę otwiera modal "Podgląd fiszki" z pełnym frontem i backiem (bez edycji)
  - Ikony edycji/usuwania pozostają widoczne i klikalne niezależnie

**CSS przykład**:

```css
.flashcard-card-content {
  max-height: 100px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  text-overflow: ellipsis;
}
```

### 11.3. Resetowanie sesji nauki

**Kwestia**: Czy system powinien zapamiętywać postęp, jeśli użytkownik wyjdzie w trakcie (przycisk "Wyjdź"), czy sesja zawsze zaczyna się od nowa?

**Rekomendowane rozwiązanie dla MVP**:

- **Brak zapamiętywania postępu** (prostsze, zgodne z MVP)
- Każde wejście na `/study` rozpoczyna nową sesję od początku
- Przyciski:
  - "Wyjdź" - powrót do `/library` bez zapisywania postępu
  - Opcjonalnie: AlertDialog "Czy na pewno chcesz przerwać sesję nauki?" jeśli użytkownik jest w trakcie

**Przyszłe rozszerzenie (poza MVP)**:

- Zapisywanie stanu sesji w localStorage
- Prop "Kontynuuj" vs "Rozpocznij od nowa" przy wejściu na `/study`
- Tracking postępu w bazie danych (wymaga dodatkowej tabeli `study_sessions`)

## 12. Punkty bólu użytkownika i rozwiązania UI

### 12.1. Żmudne ręczne tworzenie fiszek

**Punkt bólu**: Użytkownik musi spędzić dużo czasu na ręcznym tworzeniu fiszek.

**Rozwiązanie UI**:

- **Generator z AI** jako główny widok aplikacji (strona startowa `/`)
- Pole tekstowe z jasną instrukcją "Wklej tekst (1000-10000 znaków), a AI wygeneruje fiszki"
- Licznik znaków w czasie rzeczywistym dla natychmiastowego feedback
- Szybki proces: wklej -> kliknij -> edytuj -> zapisz

### 12.2. Niepewność co do jakości wygenerowanych fiszek

**Punkt bólu**: Użytkownik obawia się, że AI wygeneruje słabe fiszki, które trzeba będzie poprawiać.

**Rozwiązanie UI**:

- **Podgląd przed zapisem**: wszystkie propozycje wyświetlone przed zapisem
- **Edycja inline**: możliwość szybkiej poprawki bez otwierania dodatkowych okien
- **Selekcja**: checkboxy do odrzucenia niepotrzebnych propozycji
- **Wizualne oznaczenie źródła**: Badge pokazuje czy fiszka jest "AI Generated" czy "AI Edited" (po edycji)

### 12.3. Utrata niezapisanych propozycji

**Punkt bólu**: Użytkownik przypadkowo zamyka kartę przeglądarki lub przechodzi na inną stronę i traci wygenerowane propozycje.

**Rozwiązanie UI**:

- **beforeunload warning**: ostrzeżenie przeglądarki przed zamknięciem karty
- **Wewnętrzny navigation guard**: AlertDialog przy próbie przejścia przez Sidebar
- **Wyraźny przycisk zapisu**: duży, widoczny "Zapisz wybrane"
- **Toast z potwierdzeniem**: natychmiastowy feedback po zapisie

### 12.4. Brak widocznego postępu podczas nauki

**Punkt bólu**: Użytkownik nie wie ile fiszek już przejrzał i ile zostało.

**Rozwiązanie UI**:

- **Progress bar** na górze ekranu w trybie nauki
- **Licznik tekstowy** "3 z 20" widoczny cały czas
- **Ekran podsumowania** po zakończeniu sesji z statystykami

### 12.5. Trudność w odnalezieniu konkretnej fiszki w bibliotece

**Punkt bólu**: Użytkownik ma dużo fiszek i chce znaleźć konkretną.

**Rozwiązanie UI dla MVP**:

- **Paginacja** dla lepszej wydajności
- **Sortowanie od najnowszych** (default)
- **Badge ze źródłem** dla szybkiej identyfikacji

**Przyszłe rozszerzenia (poza MVP)**:

- Wyszukiwanie full-text
- Filtrowanie po źródle, dacie, tagach
- Sortowanie po różnych kryteriach

### 12.6. Długi czas oczekiwania na generowanie bez feedback

**Punkt bólu**: Po kliknięciu "Generuj" nic się nie dzieje przez kilka sekund, użytkownik nie wie czy system działa.

**Rozwiązanie UI**:

- **Natychmiastowa zmiana UI**: zwijanie Textarea, pojawienie się Skeleton
- **Komunikat "Generowanie fiszek..."**: jasna informacja o trwającym procesie
- **Animowany Skeleton Screen**: wizualna informacja o ładowaniu

### 12.7. Monotonia nauki

**Punkt bólu**: Nauka może być nudna, użytkownik potrzebuje angażującego doświadczenia.

**Rozwiązanie UI**:

- **Animacja 3D flip**: ładna, płynna animacja odwracania karty
- **Skróty klawiszowe**: szybsza nawigacja (Spacja, Strzałki)
- **Minimalistyczny design**: brak rozpraszaczy, focus na treści
- **Czytelna typografia**: font Inter, wysoki kontrast

### 12.8. Przypadkowe usunięcie fiszki lub konta

**Punkt bólu**: Użytkownik może przypadkowo kliknąć "Usuń" i stracić dane.

**Rozwiązanie UI**:

- **AlertDialog dla usunięcia fiszki**: "Czy na pewno usunąć?"
- **AlertDialog z wpisaniem emaila dla usunięcia konta**: dodatkowa bariera
- **Wyraźne komunikaty**: informacja o nieodwracalności operacji
- **Destructive variant dla przycisków**: wizualne ostrzeżenie (czerwony kolor)

## 13. Style i Design System

### 13.1. Kolory

**Główne kolory** (do zdefiniowania z Tailwind 4 / shadcn variables):

- **Primary**: Główny kolor akcji (przyciski, linki aktywne)
- **Secondary**: Drugoplanowe elementy
- **Destructive**: Czerwony dla akcji destrukcyjnych (usuwanie, danger zone)
- **Muted**: Tła, delikatne elementy
- **Accent**: Kolor akcentujący (Badge, highlight)

**Semantyczne kolory**:

- **Success**: Zielony dla Toast sukcesu, potwierdzenia
- **Error**: Czerwony dla błędów, Alert
- **Warning**: Żółty/pomarańczowy dla ostrzeżeń
- **Info**: Niebieski dla informacji

**Tła i tekst**:

- **Background**: Jasne tło (white/light gray)
- **Foreground**: Ciemny tekst (black/dark gray)
- **Card background**: Białe karty na lekko szarym tle

### 13.2. Typografia

**Font**: Inter (Google Fonts)

- Czytelny, nowoczesny, dobry dla aplikacji edukacyjnych
- Weights: 400 (Regular), 500 (Medium), 600 (Semi-Bold), 700 (Bold)

**Hierarchia**:

- **h1**: 32px (2rem), Semi-Bold - tytuły główne widoków
- **h2**: 24px (1.5rem), Semi-Bold - sekcje
- **h3**: 20px (1.25rem), Medium - subsekcje
- **Body**: 16px (1rem), Regular - główny tekst
- **Small**: 14px (0.875rem), Regular - secondary text, meta info

**Line-height**: 1.5 dla body, 1.2 dla headings

### 13.3. Spacing

**System 4px**:

- Base unit: 4px
- Spacing scale: 4px, 8px, 12px, 16px, 20px, 24px, 32px, 48px, 64px
- Tailwind classes: p-1 (4px), p-2 (8px), p-4 (16px), etc.

### 13.4. Shadows

**Card shadow**: subtle, lekki cień dla separacji kart od tła
**Hover shadow**: bardziej wyraźny cień na hover dla interaktywnych elementów
**Modal shadow**: głęboki cień dla modal/dialog

### 13.5. Border radius

**Komponenty**:

- Przyciski: 6px (rounded-md)
- Karty: 8px (rounded-lg)
- Inputy: 6px (rounded-md)
- Modals: 12px (rounded-xl)

### 13.6. Animacje i transitions

**Duration**:

- Fast: 150ms (hover states, focus)
- Medium: 300ms (slide in/out, fade)
- Slow: 500ms (3D flip, progress bar)

**Easing**: ease-in-out dla większości, ease-out dla pojawiania się elementów

## 14. Podsumowanie architektury

Architektura UI aplikacji 10x-cards została zaprojektowana z naciskiem na prostotę, wydajność i intuicyjność. Kluczowe założenia:

1. **Flat navigation** z Sidebarem jako głównym punktem nawigacyjnym
2. **Desktop-first** w fazie MVP
3. **Generator jako centralny punkt** aplikacji (strona startowa)
4. **Podgląd i edycja przed zapisem** dla propozycji AI
5. **Zbiorczy zapis** fiszek jednym przyciskiem
6. **Paginacja** w bibliotece dla wydajności
7. **Immersive study mode** z animacjami 3D i skrótami klawiszowymi
8. **Wysoka dostępność** (ARIA, keyboard navigation, high contrast)
9. **Obsługa błędów** z przyciskami "Ponów" i jawnymi komunikatami
10. **Zabezpieczenia UX** (AlertDialog dla krytycznych akcji, beforeunload dla niezapisanych danych)
11. **Komponenty Shadcn/ui** dla spójności i dostępności
12. **Ręczne zarządzanie stanem** bez TanStack Query w MVP
13. **Integracja z Supabase** dla auth i RLS

Architektura jest skalowalna i przygotowana na przyszłe rozszerzenia (mobile, zaawansowane algorytmy nauki, współdzielenie zestawów), przy jednoczesnym zachowaniu prostoty w fazie MVP.
