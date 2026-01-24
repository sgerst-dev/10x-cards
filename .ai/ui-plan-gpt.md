# Architektura UI dla 10x-cards

## 1. Przegląd struktury UI

Architektura UI dla 10x-cards MVP skupia się na desktopowym przepływie „Generuj → Przejrzyj → Zapisz → Ucz się”, z czytelną nawigacją boczną i stałym paskiem nawigacyjnym. Interfejs dzieli się na cztery główne obszary: Generator (`/`), Biblioteka (`/library`), Nauka (`/study`) i Ustawienia (`/settings`), uzupełnione o widoki autoryzacji. UI jest zgodne z planem API (generowanie propozycji, zapis zbiorczy, zarządzanie fiszkami, paginacja) i uwzględnia spójne stany błędów, walidację danych oraz bezpieczeństwo akcji krytycznych.

Kluczowe wymagania z PRD:

- Uwierzytelnianie email/hasło oraz trwałe usuwanie konta.
- Generowanie propozycji z tekstu 1000–10000 znaków.
- Podgląd, edycja i odrzucanie propozycji przed zapisem.
- Biblioteka z paginacją, edycją i usuwaniem fiszek.
- Tryb nauki z przeglądem pytanie/odpowiedź.

Główne punkty końcowe API i cele:

- `POST /api/flashcards/generate-proposals`: generowanie propozycji AI.
- `POST /api/flashcards/save-generated-flashcards`: zapis wybranych propozycji.
- `GET /api/flashcards`: paginowana lista fiszek.
- `POST /api/flashcards`: ręczne dodanie fiszki.
- `GET /api/flashcards/{id}`: pobranie pojedynczej fiszki.
- `PUT /api/flashcards/{id}`: edycja fiszki.
- `DELETE /api/flashcards/{id}`: usunięcie fiszki.
- Auth: Supabase Auth (logowanie, rejestracja, sesja).

## 2. Lista widoków

- **Nazwa widoku**: Logowanie  
  **Ścieżka widoku**: `/login`  
  **Główny cel**: Umożliwić zalogowanie do aplikacji.  
  **Kluczowe informacje do wyświetlenia**: Formularz email/hasło, walidacja i komunikaty błędów.  
  **Kluczowe komponenty widoku**: Formularz, pola tekstowe, komunikaty walidacyjne, przycisk „Zaloguj”, link do rejestracji.  
  **UX, dostępność i względy bezpieczeństwa**: Jasne błędy, walidacja email/hasła, fokus na pierwszym polu, obsługa klawiatury, komunikaty 4xx.

- **Nazwa widoku**: Rejestracja  
  **Ścieżka widoku**: `/register`  
  **Główny cel**: Utworzyć konto użytkownika.  
  **Kluczowe informacje do wyświetlenia**: Formularz email/hasło z wymaganiami.  
  **Kluczowe komponenty widoku**: Formularz, walidacja długości hasła, komunikaty o błędach, przycisk „Utwórz konto”, link do logowania.  
  **UX, dostępność i względy bezpieczeństwa**: Walidacja w czasie rzeczywistym, czytelne komunikaty o błędach, obsługa klawiatury.

- **Nazwa widoku**: Generator fiszek  
  **Ścieżka widoku**: `/`  
  **Główny cel**: Wygenerować propozycje fiszek z tekstu.  
  **Kluczowe informacje do wyświetlenia**: Pole tekstowe (1000–10000 znaków), licznik znaków, status generowania, lista propozycji.  
  **Kluczowe komponenty widoku**: Pole tekstowe z licznikiem, przycisk „Generuj”, Skeleton + komunikat „Generowanie fiszek...”, tabela/siatka propozycji z edycją, checkboxy odrzucenia, przycisk „Zapisz wybrane”, Alerty błędów z „Ponów”, Toast sukcesu.  
  **UX, dostępność i względy bezpieczeństwa**: Blokada przycisku poza limitem z tooltipem, walidacja w czasie rzeczywistym, obsługa błędów API (400/429/502), ostrzeżenie przed opuszczeniem strony przy niezapisanych propozycjach

- **Nazwa widoku**: Biblioteka fiszek  
  **Ścieżka widoku**: `/library`  
  **Główny cel**: Przeglądać i zarządzać zapisanymi fiszkami.  
  **Kluczowe informacje do wyświetlenia**: Lista fiszek z podziałem na strony, źródło fiszki, fragment przodu/tyłu.  
  **Kluczowe komponenty widoku**: Karty fiszek z ikonami edycji/usuwania, Badge źródła (AI, AI Edytowana, Ręczna), paginacja numeryczna, Empty State z CTA „Utwórz pierwszą fiszkę”, przycisk „Dodaj fiszkę” (otwiera Dialog).  
  **UX, dostępność i względy bezpieczeństwa**: Dialog edycji/dodania z walidacją limitów (front 250, back 500), potwierdzenie usunięcia (AlertDialog), przewijanie treści przy długich tekstach.

- **Nazwa widoku**: Tryb nauki  
  **Ścieżka widoku**: `/study`  
  **Główny cel**: Uczyć się z fiszek w pełnoekranowym trybie.  
  **Kluczowe informacje do wyświetlenia**: Aktualna fiszka (front/back), postęp (X z Y), pasek postępu.  
  **Kluczowe komponenty widoku**: Karta z animacją 3D flip, przyciski „Pokaż odpowiedź”, „Następna”, Progress, licznik, skróty klawiaturowe (Spacja/Strzałki).  
  **UX, dostępność i względy bezpieczeństwa**: Obsługa klawiatury, kontrastowa typografia (Inter), max-height z wewnętrznym scrollowaniem treści.

- **Nazwa widoku**: Podsumowanie sesji  
  **Ścieżka widoku**: `/study/summary`  
  **Główny cel**: Zakończyć sesję i umożliwić dalsze akcje.  
  **Kluczowe informacje do wyświetlenia**: Informacja o zakończeniu sesji, podstawowe podsumowanie.  
  **Kluczowe komponenty widoku**: Przyciski „Powtórz” i „Wróć do biblioteki”.  
  **UX, dostępność i względy bezpieczeństwa**: Jasne CTA, obsługa klawiatury.

- **Nazwa widoku**: Ustawienia  
  **Ścieżka widoku**: `/settings`  
  **Główny cel**: Zarządzać kontem i bezpieczeństwem.  
  **Kluczowe informacje do wyświetlenia**: Dane użytkownika, opcja wylogowania, opcja usunięcia konta.  
  **Kluczowe komponenty widoku**: Sekcja profilu, przycisk „Wyloguj”, AlertDialog „Usuń konto” z potwierdzeniem przez wpisanie emaila.  
  **UX, dostępność i względy bezpieczeństwa**: Wyraźne ostrzeżenie o nieodwracalności, dodatkowe potwierdzenie email.

## 3. Mapa podróży użytkownika

Główny przypadek użycia (generowanie i nauka):

1. Użytkownik loguje się (`/login`) lub rejestruje (`/register`).
2. Trafia do Generatora (`/`), wkleja tekst i widzi licznik znaków oraz walidację.
3. Kliknięcie „Generuj” uruchamia skeleton i komunikat „Generowanie fiszek...”.
4. Po otrzymaniu propozycji użytkownik edytuje/odrzuca wybrane fiszki.
5. Kliknięcie „Zapisz wybrane” zapisuje fiszki (zbiorczo); pojawia się Toast sukcesu.
6. Użytkownik przechodzi do Biblioteki (`/library`) i widzi zapisane fiszki z paginacją.
7. Z Biblioteki uruchamia Nauka (`/study`), przechodzi przez fiszki skrótami.
8. Po zakończeniu widzi Podsumowanie (`/study/summary`) i wybiera „Powtórz” lub „Wróć do biblioteki”.

Mapowanie historyjek użytkownika do UI:

- US-001/US-002: `/register`, `/login` (formularze, walidacja, błędy).
- US-003: `/settings` (AlertDialog usuwania konta).
- US-004/US-005: `/` (generator, edycja, odrzucanie, zapis).
- US-006/US-007/US-008/US-009: `/library` (lista, dodawanie, edycja, usuwanie).
- US-010: `/study` i `/study/summary` (nauka i podsumowanie).

## 4. Układ i struktura nawigacji

- Stały pasek nawigacyjny (Sidebar) jako główny element nawigacji po widokach: Generator, Biblioteka, Nauka, Ustawienia.
- Informacje o użytkowniku i wylogowanie w dolnej części Sidebar.
- Brak nawigacji mobilnej (MVP desktop-only).
- Dodatkowe nawigacje kontekstowe: przyciski CTA w widokach (np. „Zapisz wybrane”, „Dodaj fiszkę”, „Powtórz”).
- Zabezpieczenie przed utratą danych: ostrzeżenie beforeunload przy niezapisanych propozycjach AI.

## 5. Kluczowe komponenty

- **Sidebar / Navbar**: Stała nawigacja między `/`, `/library`, `/study`, `/settings` z sekcją użytkownika.
- **GeneratorForm**: Pole tekstowe z licznikiem, walidacją i tooltipem błędu.
- **ProposalsList**: Lista propozycji z edycją front/back, checkboxy odrzucenia.
- **SaveSelectedButton**: Zbiorczy zapis z blokadą przy braku wyboru.
- **FlashcardCard**: Karta biblioteki z Badge źródła i ikonami akcji.
- **Pagination**: Nawigacja po stronach listy fiszek.
- **Dialogs (Dialog/AlertDialog)**: Dodawanie/edycja/usuń fiszkę, usuwanie konta.
- **Toast & Alert**: Informacje o sukcesie i błędach z opcją „Ponów”.
- **StudyCard**: Karta z animacją flip i obsługą skrótów klawiszowych.
- **Progress**: Pasek postępu i licznik „X z Y”.

Stany brzegowe i błędy:

- Tekst poza zakresem 1000–10000 znaków: blokada generowania z tooltipem.
- Błędy API (400/401/429/502): Alert z „Ponów”, zachowanie wpisanego tekstu.
- Brak fiszek w bibliotece: Empty State z CTA.
- Długie treści: max-height + wewnętrzny scroll, bez utraty czytelności.
- Niezapisane propozycje AI: ostrzeżenie beforeunload; opcjonalnie modal przy nawigacji wewnętrznej.
- Sesja nauki przy wyjściu: domyślnie start od nowa po powrocie (MVP).
