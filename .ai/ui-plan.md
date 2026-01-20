# Architektura UI dla 10x-cards

## 1. Przegląd struktury UI

Aplikacja 10x-cards została zaprojektowana jako aplikacja webowa wspierające proces nauki. Struktura opiera się na stałym nawigacyjnym (Navbar), który zapewnia szybki dostęp do kluczowych modułów: 'Generator fiszek' (`/`), 'Moje fiszki' (`/my-flashcards`) oraz 'Nauka' (`/learning`). Interfejs wykorzystuje nowoczesne komponenty Shadcn/ui, Tailwind oraz React.

## 2. Lista widoków

### Widok główny (Generator fiszek)
- **Ścieżka widoku**: `/`
- **Główny cel**: Pozwala użytkownikowi wygenerowanie fiszek na podstawie wprowadzonego tekstu, a następnie na ich ocenie (akceptacji/edycji/odrzucenia).
- **Kluczowe informacje do wyświetlenia**:
    - Pole tekstowe z licznikiem znaków. Walidacja 1000-10000 znaków
    - Lista propozycji fiszek wygenerowanych przez LLM
    - Przyciski do akceptacji/edycji/odrzucenia każdej propozycji fiszki z osobna
    - Licznik wybranych propozycji do zapisu
    - Przycisk do zapisu wybranych propozycji fiszek
- **Kluczowe komponenty widoku**:
    - Pole tekstowe
    - Lista propozycji fiszek
    - Propozycja fiszki z przyciskami akceptacji/edycji/odrzucenia 
    - Przycisk do generowania fiszek
    - Przycisk do zapisu wybranych fiszek
- **UX, dostępność i względy bezpieczeństwa**:
    - Toast po udanym zapisie zbiorczym
    - Walidacja 1000-10000 znaków wprowadzonego tekstu

### Widok Biblioteki
- **Ścieżka widoku**: `/my-flashcards`
- **Główny cel**: Zarządzanie posiadaną kolekcją fiszek i ręczne uzupełnianie bazy.
- **Kluczowe informacje do wyświetlenia**:
    - Grid/Lista fiszek z fragmentami treści (Przód/Tył).
    - Badge oznaczenia źródła (AI, AI Edytowana, Ręczna).
    - Paginacja numeryczna.
    - Stan pusty (Empty State) z zachętą do generowania/dodawania.
- **Kluczowe komponenty widoku**:
    - `FlashcardLibraryCard`: karta z ikonami akcji ('Edit', 'Remove').
    - `Dialog` (Modal): Formularz ręcznego dodawania i edycji fiszki.
    - `AlertDialog`: Potwierdzenie trwałego usunięcia fiszki.
- **UX, dostępność i względy bezpieczeństwa**:
    - Szybka edycja bez opuszczania widoku listy.
    - Obsługa długich tekstów na kartach poprzez `max-height` i scroll wewnętrzny.

### Widok Nauki
- **Ścieżka widoku**: `/study`
- **Główny cel**: Skoncentrowana sesja nauki z wykorzystaniem metody fiszek.
- **Kluczowe informacje do wyświetlenia**:
    - Karta do nauki (stan: Zakryta/Odkryta).
    - Pasek postępu (`Progress`) oraz licznik "X z Y".
    - Ekran podsumowania po zakończeniu sesji.
- **Kluczowe komponenty widoku**:
    - `StudyCard`: Komponent z animacją 3D Flip (CSS Transition).
    - `Progress`: Wizualizacja postępu w sesji.
    - Ekran podsumowania: Statystyki sesji i przyciski "Retry" / "Back to library".
- **UX, dostępność i względy bezpieczeństwa**:
    - Pełna obsługa skrótów klawiszowych (Spacja: Flip, Strzałki: Następna/Poprzednia).
    - Tryb pełnoekranowy (focus mode) minimalizujący rozpraszacze.

### Widok Ustawień
- **Ścieżka widoku**: `/settings`
- **Główny cel**: Zarządzanie profilem użytkownika i bezpieczeństwem danych.
- **Kluczowe informacje do wyświetlenia**:
    - Adres email zalogowanego użytkownika.
    - Opcja usunięcia konta.
- **Kluczowe komponenty widoku**:
    - `AlertDialog`: Krytyczna akcja usunięcia konta wymagająca wpisania adresu email dla potwierdzenia.
- **UX, dostępność i względy bezpieczeństwa**:
    - Jasne ostrzeżenie o nieodwracalności operacji usuwania danych.

### Widoki Autoryzacji
- **Ścieżka widoku**: `/login`, `/register`
- **Główny cel**: Zarządzanie dostępem do aplikacji.
- **Kluczowe komponenty widoku**:
    - Formularze `shadcn/ui` z jasną walidacją błędów z Supabase Auth.

## 3. Mapa podróży użytkownika

1. **Inicjacja**: Użytkownik loguje się i trafia na Dashboard (Generator).
2. **Tworzenie**: Wkleja tekst notatek -> Widzi postęp generowania -> Przegląda propozycje AI -> Edytuje/Odrzuca wybrane -> Klika "Save selected".
3. **Weryfikacja**: Otrzymuje powiadomienie Toast -> Przechodzi do Biblioteki, aby zobaczyć zapisane karty.
4. **Nauka**: Klika "Learn" -> Przechodzi przez sesję nauki używając skrótów klawiszowych -> Widzi podsumowanie -> Wraca do biblioteki.
5. **Zarządzanie**: Edytuje treść fiszki, która okazała się zbyt trudna, lub dodaje ręcznie brakujące ogniwo wiedzy.

## 4. Układ i struktura nawigacji

Aplikacja wykorzystuje **układ z górnym menu (navbar) widocznym po zalogowaniu**:
- **Lewy róg**: Logo "10x-cards".
- **Środkowa część**:
    - `Generator` (ikona + tekst) -> `/`
    - `My flashcards` (ikona + tekst) -> `/flashcards`
    - `Learning session` (ikona + tekst) -> `/study`
- **Prawy róg**:
    - Profil użytkownika (Email).
    - `Settings` (ikona) -> `/settings`
    - `Logout` (ikona + tekst).

Nawigacja odbywa się bez przeładowania całej aplikacji (Astro + React Client-side navigation tam, gdzie to możliwe w ramach komponentów, lub standardowe przejścia stron).

## 5. Kluczowe komponenty

- **Flashcard (Shared)**: Bazowy komponent wizualny fiszki z obsługą różnych stanów (podgląd, edycja, nauka).
- **SourceBadge**: Etykieta wizualna określająca pochodzenie danych (AI / AI Edytowana / Ręczna).
- **FeedbackAlert**: Uniwersalny system powiadomień o błędach API z przyciskiem "Retry".
- **ActionConfirmDialog**: Generyczny AlertDialog Shadcn/ui do potwierdzania destrukcyjnych akcji (usuwanie fiszki/konta).
- **SkeletonLoader**: Animowany placeholder wyświetlany podczas oczekiwania na odpowiedź z LLM.
