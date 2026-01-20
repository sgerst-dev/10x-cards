# Dokument wymagań produktu (PRD) - 10x-cards

## 1. Przegląd produktu

10x-cards to aplikacja webowa wspierająca proces uczenia się poprzez inteligentne generowanie fiszek. System wykorzystuje model LLM do automatycznego tworzenia materiałów edukacyjnych z dostarczonego tekstu, eliminując czasochłonny proces ręcznego przygotowywania pomocy naukowych. Produkt umożliwia użytkownikom nie tylko generowanie, ale również ręczną edycję, zarządzanie kolekcją oraz naukę w oparciu o uproszczony model powtórek.

## 2. Problem użytkownika

Użytkownicy chcący uczyć się efektywnie metodą spaced repetition napotykają na barierę wejścia w postaci konieczności ręcznego tworzenia bazy fiszek. Proces ten jest żmudny, powtarzalny i zajmuje często więcej czasu niż sama nauka. Istniejące rozwiązania są albo zbyt skomplikowane (wymagają nauki obsługi, jak Anki), albo nie oferują wystarczającego wsparcia w automatyzacji tworzenia treści z notatek czy artykułów. Użytkownik potrzebuje narzędzia, które zamieni surowy tekst w gotowy do nauki zestaw pytań i odpowiedzi w kilka sekund, zachowując przy tym pełną kontrolę nad ostatecznym kształtem materiału.

## 3. Wymagania funkcjonalne

### 3.1. Uwierzytelnianie i zarządzanie kontem

- System umożliwia rejestrację i logowanie za pomocą adresu email i hasła.
- Użytkownik może trwale usunąć swoje konto wraz ze wszystkimi powiązanymi danymi.

### 3.2. Generowanie fiszek z użyciem AI

- Interfejs posiada pole tekstowe do wklejenia materiału źródłowego o długości od 1000 do 10000 znaków.
- System prezentuje wygenerowane propozycje przed ich zapisaniem.
- Użytkownik może edytować treść każdej propozycji (przód i tył) bezpośrednio w widoku podglądu.
- Użytkownik może odrzucić wybrane propozycje, których nie chce zapisywać.
- Do bazy danych zapisywane są tylko nieodrzucone fiszki.

### 3.3. Zarządzanie biblioteką fiszek

- Widok "Moje fiszki" prezentuje listę zapisanych elementów z podziałem na strony (paginacja).
- Użytkownik może ręcznie dodać nową fiszkę, wpisując przód i tył.
- Istniejące fiszki można edytować w dedykowanym oknie dialogowym.

### 3.4. Nauka i powtórki

- Użytkownik może rozpocząć sesję nauki z puli dostępnych fiszek.
- Interfejs nauki wyświetla najpierw front (pytanie), a po odsłonięciu tył (odpowiedź).

## 4. Granice produktu

### Poza zakresem MVP

- Aplikacje mobilne (iOS/Android).
- Import plików (PDF, DOCX, obrazy).
- Zaawansowane algorytmy powtórek (SM-2, FSRS).
- Współdzielenie zestawów fiszek z innymi użytkownikami.
- Publiczne biblioteki fiszek.
- Integracje z systemami zewnętrznymi (API, LMS).
- Panel analityczny (Dashboard) z wykresami postępów.

## 5. Historyjki użytkowników

ID: US-001
Tytuł: Rejestracja w systemie
Opis: Jako nowy użytkownik chcę utworzyć konto podając email i hasło, aby móc rozpocząć tworzenie własnej bazy fiszek.
Kryteria akceptacji:

- Formularz waliduje poprawność formatu email.
- Hasło musi spełniać minimalne wymogi długości.
- Po udanej rejestracji użytkownik może zalogować się do systemu.
- Próba rejestracji na istniejący email wyświetla odpowiedni błąd.

ID: US-002
Tytuł: Logowanie do aplikacji
Opis: Jako zarejestrowany użytkownik chcę się zalogować, aby uzyskać dostęp do moich zapisanych fiszek.
Kryteria akceptacji:

- Po wprowadzeniu poprawnych danych, użytkownik jest przekierowany do strony głównej.
- W przypadku wprowadzenia błędnych danych, wyświetlany jest komunikat o błędzie.
- Sesja użytkownika jest utrzymywana po odświeżeniu strony.

ID: US-003
Tytuł: Usuwanie konta
Opis: Jako użytkownik chcę mieć możliwość całkowitego usunięcia mojego konta i danych, aby zrezygnować z korzystania z usługi.
Kryteria akceptacji:

- Opcja dostępna w ustawieniach profilu.
- Wymagane dodatkowe potwierdzenie w oknie dialogowym.
- Usunięcie jest nieodwracalne i kasuje wszystkie fiszki oraz historię użytkownika z bazy danych.

ID: US-004
Tytuł: Generowanie fiszek za pomocą modelu LLM
Opis: Jako użytkownik chcę wkleić fragment notatek do pola tekstowego, aby LLM mógł na ich podstawie wygenerować fiszki.
Kryteria akceptacji:

- Na stronie głównej znajduje się pole tekstowe.
- Przycisk generowania jest nieaktywny, jeśli tekst jest krótszy niż 1000 lub dłuższy niż 10000 znaków.
- Po kliknięciu przycisku generowania, przycisk generowania staje się nieaktywny, a aplikacja komunikuje się z API modelu LLM i wyświetla listę wygenerowanych propozycji fiszek do akceptacji/edycji/odrzucenia przez użytkownika.
- W przypadku problemów z API lub braku odpowiedzi modelu użytkownik zobaczy stosowny komunikat o błędzie.

ID: US-005
Tytuł: Przegląd wygenerowanych fiszek
Opis: Jako użytkownik chcę zobaczyć wygenerowane fiszki, a następnie mieć możliwość edycji/odrzucenia/zaakceptowania wygenerowanych fiszek.
Kryteria akceptacji:

- Wyświetlana jest lista wygenerowanych fiszek przez LLM. 
- Domyślnie wszystkie zaproponowane fiszki są oznaczone jako zaakceptowane do zapisu.
- Użytkownik ma możliwość odrzucenia fiszki przez naciśnięcie ikonki odrzucenia na karcie.
- Użytkownik ma możliwość edycji zaproponowanej fiszki przez naciśnięcie ikonki edycji na karcie. Po naciśnięciu przycisku edycji wyświetlany jest dialog, w którym użytkownik może edytować każdą zaproponowaną fiszkę (`front` oraz `back`).
- Gdy żadna z fiszek nie została wybrana do akceptacji, przycisk `Zapisz` jest nieaktywny.
- Naciśnięcie przycisku `Zapisz`, zapisuje wybrane fiszki w bazie danych użytkownika.

ID: US-006
Tytuł: Przeglądanie własnej kolekcji fiszek
Opis: Jako użytkownik chcę widzieć listę wszystkich moich fiszek, aby mieć wgląd w to, czego się uczę.
Kryteria akceptacji:

- Lista wyświetla posortowane fiszki - od najnowszych oraz podzielona na strony.
- Widok zawiera fragment treści przodu i tyłu dla każdej fiszki.

ID: US-007
Tytuł: Ręczne dodawanie fiszki
Opis: Jako użytkownik chcę dodać fiszkę manualnie, aby uzupełnić braki w materiale wygenerowanym przez AI.
Kryteria akceptacji:

- Dostępny formularz z pustymi polami Przód i Tył fiszki.
- Po kliknięciu zapisz, fiszka zostaje zapisana w bazie danych.

ID: US-008
Tytuł: Edycja zapisanej fiszki
Opis: Jako użytkownik chcę zmienić treść fiszki, która jest już w bazie, aby poprawić błędy zauważone później.
Kryteria akceptacji:

- Akcja edycji otwiera okno z obecną treścią fiszki.
- Użytkownik może zmienić treść widoczną na przodzie i tyle fiszki.
- Zapisanie zmian aktualizuje rekord w bazie danych.

ID: US-009
Tytuł: Usuwanie fiszki
Opis: Jako użytkownik chcę usunąć niepotrzebną fiszkę, aby utrzymać porządek w materiałach.
Kryteria akceptacji:

- Ikona usuwania jest dostępna przy każdej fiszce.
- System pyta o potwierdzenie przed usunięciem.
- Usunięcie jest trwałe.

ID: US-010
Tytuł: Sesja nauki
Opis: Jako użytkownik chcę uruchomić tryb sprawdzania wiedzy, aby uczyć się z moich fiszek.
Kryteria akceptacji:

- Użytkownik widzi przód fiszki (pytanie).
- Po kliknięciu użytkownik widzi tył fiszki (odpowiedź).
- Użytkownik może przejść do następnej fiszki.

## 6. Metryki sukcesu

### Wskaźnik wygenerowanych fiszek przez LLM

- Cel: Powyżej 80%
- Definicja: Odsetek fiszek w bazie danych, które powstały w wyniku generowania przez AI (zarówno te bez zmian, jak i edytowane), w stosunku do wszystkich fiszek (w tym dodanych ręcznie).
- Sposób pomiaru: Zliczanie rekordów w bazie danych z podziałem na typ źródła (ai-generated/ai-edited vs user-generated).
