# Specyfikacja techniczna systemu autentykacji - 10x-cards

## 1. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

### 1.1. Struktura stron i nawigacji

#### Strony publiczne (non-auth)

Strony dostępne dla niezalogowanych użytkowników bez wymagania sesji:

- **`/login`** - Strona logowania zawierająca formularz email/hasło oraz link do `/register` i `/forgot-password`
- **`/register`** - Strona rejestracji z formularzem email/hasło oraz linkiem do `/login`
- **`/forgot-password`** - Strona inicjująca proces odzyskiwania hasła poprzez wysłanie linku resetującego na email
- **`/reset-password`** - Strona docelowa po kliknięciu w link z emaila, umożliwiająca ustawienie nowego hasła

#### Strony chronione (auth)

Strony wymagające aktywnej sesji użytkownika, dostępne tylko po zalogowaniu:

- **`/generate`** - Generowanie fiszek (US-003, US-004)
- **`/flashcards`** - Przeglądanie własnej biblioteki fiszek z paginacją (US-005)
- **`/study`** - Sesja nauki z fiszkami (US-009)

### 1.2. Layout i komponenty nawigacyjne

#### Layout główny (Layout.astro)

Rozbudowa istniejącego layoutu o:

- Sprawdzenie stanu sesji użytkownika po stronie serwera podczas renderowania
- Warunkowe wyświetlanie nawigacji w zależności od statusu autentykacji
- Przekazanie danych użytkownika (email, id) do komponentów nawigacyjnych
- Obsługa przekierowania niezalogowanych użytkowników z chronionych stron

#### Komponent Header (nowy)

Górna nawigacja aplikacji z warunkową zawartością:

**Dla użytkowników niezalogowanych:**

- Logo aplikacji w lewym górnym rogu
- Brak dodatkowych elementów nawigacyjnych
- Brak headera na stronach `/login` i `/register` (uproszczony layout)

**Dla użytkowników zalogowanych:**

- Logo aplikacji w lewym górnym rogu (link do `/generate` - strona generatora)
- Menu nawigacyjne z linkami:
  - Generator (`/generate`) - US-003
  - Moje fiszki (`/flashcards`) - US-005
  - Sesja nauki (`/study`) - US-009
- W prawym górnym rogu email użytkownika oraz przycisk 'Wyloguj'

#### Komponent wylogowania

Przycisk wylogowania w headerze z obsługą:

- Akcji wylogowania poprzez wywołanie Supabase Auth signOut i przekierowanie do `/login`

### 1.3. Formularze autentykacji (komponenty React)

#### LoginForm

Odpowiedzialności:

- Wyświetlenie pól email i hasło
- Walidacja client-side (format email, niepuste pola, minimalna długość hasła)
- Wysłanie danych do Supabase Auth poprzez metodę signInWithPassword
- Obsługa stanów: idle, loading, error, success
- Wyświetlanie komunikatów błędów zwróconych przez Supabase (nieprawidłowe dane, niepotwierdzony email)
- Przekierowanie do `/` po udanym logowaniu
- Linki do `/register` i `/forgot-password`

Walidacja:

- Email: format zgodny z RFC 5322
- Hasło: minimum 8 znaków, co najmniej jedna litera i jedna cyfra (zgodnie z US-001)

Komunikaty błędów:

- "Nieprawidłowy email lub hasło" - dla błędów autoryzacji
- "Aby się zalogować, musisz najpierw zweryfikować swój adres email. Sprawdź swoją skrzynkę pocztową i kliknij w link weryfikacyjny." - dla niepotwierdzonych emaili (US-001)
- "Wystąpił błąd. Spróbuj ponownie" - dla pozostałych błędów

#### RegisterForm

Odpowiedzialności:

- Wyświetlenie pól email, hasło, powtórz hasło
- Walidacja client-side (format email, zgodność haseł, wymogi bezpieczeństwa hasła)
- Wysłanie danych do Supabase Auth poprzez metodę signUp
- Obsługa stanów: idle, loading, error, success
- Wyświetlanie komunikatów błędów i sukcesu
- Po udanej rejestracji wyświetlenie komunikatu o konieczności weryfikacji emaila (bez automatycznego przekierowania)

Walidacja:

- Email: format zgodny z RFC 5322, unikalność weryfikowana przez Supabase (US-001)
- Hasło: minimum 8 znaków, co najmniej jedna litera, jedna cyfra (US-001 - "minimalne wymogi długości oraz złożoności")
- Powtórz hasło: zgodność z polem hasło

Komunikaty błędów:

- "Ten email jest już zarejestrowany" - dla istniejącego użytkownika (US-001)
- "Hasło musi zawierać minimum 8 znaków, literę i cyfrę" - dla słabego hasła (US-001)
- "Hasła nie są identyczne" - dla niezgodności pól hasło

Komunikat sukcesu:

- "Konto zostało pomyślnie utworzone! Aby móc się zalogować, kliknij w link weryfikacyjny, który wysłaliśmy na Twój adres email."
- Link do `/login` z tekstem "Przejdź do strony logowania"
- Bez automatycznego przekierowania, aby użytkownik mógł przeczytać komunikat

#### ForgotPasswordForm

Odpowiedzialności:

- Wyświetlenie pola email
- Walidacja client-side (format email)
- Wysłanie żądania resetowania hasła poprzez metodę resetPasswordForEmail z Supabase Auth
- Konfiguracja redirectTo wskazującego na `/reset-password`
- Obsługa stanów: idle, loading, success
- Wyświetlanie komunikatu o wysłaniu linku (również dla nieistniejących emaili - zabezpieczenie przed enumeracją)
- Link do `/login`

Walidacja:

- Email: format zgodny z RFC 5322

Komunikat sukcesu:

- "Jeśli podany email istnieje w systemie, wysłaliśmy na niego link do resetowania hasła"

#### ResetPasswordForm

Odpowiedzialności:

- Weryfikacja obecności tokena resetowania w URL (parametr z Supabase)
- Wyświetlenie pól: nowe hasło, powtórz hasło
- Walidacja client-side (wymogi bezpieczeństwa hasła, zgodność pól)
- Wysłanie nowego hasła poprzez metodę updateUser z Supabase Auth
- Obsługa stanów: idle, loading, error, success
- Wyświetlanie komunikatów błędów (wygasły token, błąd walidacji)
- Przekierowanie do `/login` po udanym resetowaniu

Walidacja:

- Nowe hasło: minimum 8 znaków, co najmniej jedna litera, jedna cyfra
- Powtórz hasło: zgodność z polem nowe hasło

Komunikaty błędów:

- "Link resetujący wygasł. Wygeneruj nowy" - dla wygasłego tokena
- "Hasło musi zawierać minimum 8 znaków, literę i cyfrę" - dla słabego hasła
- "Hasła nie są identyczne" - dla niezgodności pól

Komunikat sukcesu:

- "Hasło zostało zmienione. Możesz się teraz zalogować"

### 1.4. Middleware i ochrona tras

#### Middleware Astro (rozbudowa istniejącego)

Aktualny middleware udostępnia klienta Supabase przez `context.locals.supabase`. Rozbudowa:

**Sprawdzanie sesji:**

- Wywołanie `supabase.auth.getSession()` dla każdego żądania
- Zapisanie informacji o sesji w `context.locals.session`
- Zapisanie danych użytkownika w `context.locals.user`

**Ochrona chronionych tras:**

- Sprawdzenie czy ścieżka należy do listy chronionych (`/generate`, `/flashcards`, `/study`)
- Przekierowanie do `/login` jeśli brak sesji i ścieżka jest chroniona
- Dodanie parametru `redirect` z oryginalną ścieżką do URL logowania dla powrotu po uwierzytelnieniu

**Przekierowanie zalogowanych z publicznych stron autentykacji:**

- Sprawdzenie czy ścieżka to `/login` lub `/register`
- Przekierowanie do `/generate` jeśli użytkownik jest zalogowany

**Obsługa strony głównej `/`:**

- Strona przekierowująca - nie renderuje żadnej zawartości
- Przekierowanie w zależności od stanu sesji:
  - Niezalogowani: przekierowanie do `/login`
  - Zalogowani: przekierowanie do `/generate` (strona generatora fiszek)

### 1.6. Obsługa stanu sesji w komponentach client-side

#### useAuth Hook (nowy)

Niestandardowy hook React do zarządzania stanem autentykacji w komponentach:

Odpowiedzialności:

- Inicjalizacja klienta Supabase (client-side)
- Nasłuchiwanie zmian stanu autentykacji poprzez `onAuthStateChange`
- Przechowywanie aktualnej sesji i danych użytkownika w stanie
- Udostępnienie metod: `signOut`, `signIn`, `signUp`, `resetPassword`
- Automatyczne przekierowanie do odpowiednich stron po zmianie stanu

Wartości zwracane:

- `user` - obiekt użytkownika lub null
- `session` - obiekt sesji lub null
- `loading` - stan ładowania (true podczas inicjalizacji)
- `signOut` - funkcja wylogowania
- `signIn` - funkcja logowania
- `signUp` - funkcja rejestracji
- `resetPassword` - funkcja resetowania hasła

#### Aktualizacja istniejących komponentów

Komponenty wymagające dostępu do danych użytkownika:

**FlashcardGenerator:**

- Renderowany na chronionej stronie `/generate`
- Pobranie user_id z hooka useAuth do przekazania w requestach API (US-003)
- Middleware chroni trasę - komponent renderuje się tylko gdy sesja istnieje

**Pozostałe komponenty fiszek:**

- Wykorzystanie user_id z useAuth w operacjach CRUD na fiszkach
- Zabezpieczenie przed próbą wykonania akcji bez autentykacji

### 1.7. Scenariusze UX

#### Scenariusz 1: Pierwszy użytkownik (rejestracja)

1. Użytkownik odwiedza `/` bez sesji
2. Middleware przekierowuje do `/login`
3. Na stronie logowania użytkownik klika link "Zarejestruj się" → przekierowanie do `/register`
4. Wypełnia formularz rejestracji (email, hasło, powtórz hasło) i wysyła (US-001)
5. Supabase tworzy konto i wysyła email weryfikacyjny
6. Użytkownik otrzymuje komunikat sukcesu: "Konto zostało pomyślnie utworzone! Aby móc się zalogować, kliknij w link weryfikacyjny, który wysłaliśmy na Twój adres email." (US-001)
7. Użytkownik sprawdza swoją skrzynkę pocztową i klika w link weryfikacyjny
8. Po kliknięciu w link użytkownik jest przekierowywany do `/login` z potwierdzeniem weryfikacji emaila
9. Użytkownik loguje się używając nowo utworzonych danych (US-002)
10. Po zalogowaniu jest przekierowywany do `/generate` (strona generatora fiszek)

#### Scenariusz 2: Powracający użytkownik (logowanie)

1. Użytkownik odwiedza `/login` (US-002)
2. Wypełnia formularz (email, hasło) i wysyła
3. Supabase Auth weryfikuje dane i tworzy sesję
4. LoginForm przekierowuje do `/generate` (lub URL z parametru redirect jeśli istnieje) - strona generatora (US-002)
5. Sesja jest przechowywana w cookie i localStorage przez Supabase
6. Przy kolejnych wizytach middleware automatycznie weryfikuje sesję (US-002 - "Sesja użytkownika jest utrzymywana po odświeżeniu strony")

#### Scenariusz 3: Zapomnianie hasła

1. Użytkownik na `/login` klika "Zapomniałeś hasła?"
2. Przechodzi do `/forgot-password`
3. Podaje email i wysyła formularz
4. Otrzymuje komunikat o wysłaniu linku
5. Klika link w emailu (otwarcie `/reset-password` z tokenem)
6. Ustawia nowe hasło
7. Otrzymuje potwierdzenie i przekierowanie do `/login`

#### Scenariusz 4: Automatyczne odświeżanie sesji

1. Użytkownik zalogowany pozostaje nieaktywny
2. Supabase automatycznie odświeża token przed wygaśnięciem (domyślnie 60 min przed)
3. Sesja pozostaje aktywna
4. Po całkowitym wygaśnięciu (brak odświeżenia) middleware przekierowuje do `/login`

## 2. LOGIKA BACKENDOWA

### 2.1. Endpointy API autentykacji

Większość logiki autentykacji realizowana jest po stronie klienta przez Supabase Auth SDK. Nie ma potrzeby tworzenia dodatkowych endpointów server-side dla autentykacji w MVP.

#### Aktualizacja istniejących endpointów fiszek

Wszystkie istniejące endpointy wymagają dodania warstwy autoryzacji:

**POST `/api/flashcards/generate-flashcards-proposals`** (US-003)

- Dodanie weryfikacji sesji
- Pobranie user_id z sesji zamiast opcjonalnego parametru
- Modyfikacja zapisywania generation_sessions z user_id

**POST `/api/flashcards/save-generated-flashcards`** (US-004)

- Dodanie weryfikacji sesji
- Pobranie user_id z sesji
- Walidacja czy generation_id należy do użytkownika

**Uwaga:** Endpointy CRUD dla pozostałych operacji na fiszkach (US-005 do US-009) zostaną dodane w osobnej specyfikacji.

### 2.2. Walidacja danych wejściowych

#### Aktualizacja istniejących schematów

Modyfikacja schematów w `src/lib/schemas/`:

**generate-flashcards-proposals.schema.ts:**

- Usunięcie opcjonalnego userId z schematy wejściowego (pobierany z sesji)

**save-generated-flashcards.schema.ts:**

- Usunięcie opcjonalnego userId z schematy wejściowego (pobierany z sesji)

### 2.3. Middleware dla endpointów API

#### AuthMiddleware (nowy moduł)

Funkcja walidująca sesję dla chronionych endpointów API:

Odpowiedzialności:

- Pobranie tokena JWT z headera Authorization
- Weryfikacja tokena poprzez `supabase.auth.getUser(token)`
- Zwrócenie danych użytkownika w przypadku sukcesu
- Rzucenie wyjątku UnauthorizedError w przypadku błędu

Wykorzystanie:

- Import w każdym chronionym endpoincie API
- Wywołanie na początku handlera
- Pobranie user_id do dalszej logiki biznesowej

### 2.4. Rendering server-side

#### Aktualizacja konfiguracji Astro

Obecna konfiguracja `astro.config.mjs` ustawia `output: "server"` - wszystkie strony renderowane są domyślnie po stronie serwera. Ta konfiguracja jest optymalna dla implementacji autentykacji.

#### Strony z server-side rendering

**Wszystkie strony publiczne (`/login`, `/register`, `/forgot-password`, `/reset-password`):**

- Renderowanie formularzy po stronie serwera
- Sprawdzenie sesji w middleware i ewentualne przekierowanie zalogowanych użytkowników
- Przekazanie parametrów URL (redirect, token) do komponentów React poprzez props

**Wszystkie chronione strony (`/generate`, `/flashcards`, `/study`):**

- Renderowanie po stronie serwera z weryfikacją sesji w middleware
- Przekierowanie niezalogowanych do `/login`
- Przekazanie danych użytkownika do layoutu i komponentów
- Wstępne pobranie danych (np. lista fiszek) po stronie serwera dla lepszej wydajności

**Strona główna `/` (przekierowanie):**

- Nie renderuje żadnej zawartości
- Middleware wykonuje przekierowanie:
  - **Dla niezalogowanych**: przekierowanie do `/login`
  - **Dla zalogowanych**: przekierowanie do `/generate`

### 2.5. Obsługa wyjątków

#### Typy błędów autentykacji

**UnauthorizedError:**

- Kod: 401
- Scenariusz: Brak sesji, nieprawidłowy token, wygasła sesja
- Odpowiedź: Przekierowanie do `/login` (middleware) lub JSON error (API)

**ForbiddenError:**

- Kod: 403
- Scenariusz: Próba dostępu do zasobów innego użytkownika
- Odpowiedź: Przekierowanie na stronę główną

**ValidationError:**

- Kod: 400
- Scenariusz: Niepoprawne dane wejściowe w formularzach
- Odpowiedź: `{ "error": "Nieprawidłowe dane", "details": {...} }`

**ConflictError:**

- Kod: 409
- Scenariusz: Próba rejestracji na istniejący email
- Odpowiedź: `{ "error": "Konto już istnieje." }`

#### Centralna obsługa błędów w API

Wrapper dla handlerów endpointów obsługujący standardowe błędy:

Odpowiedzialności:

- Przechwycenie wyjątków z handlerów
- Mapowanie wyjątków na odpowiednie kody HTTP i komunikaty
- Logowanie błędów server-side
- Zwracanie sformatowanych odpowiedzi JSON
- Ukrywanie szczegółów technicznych przed użytkownikiem

### 2.6. Modele danych

#### Rozszerzenie istniejących tabel

**Tabela `flashcards`:**

- Kolumna `user_id` już istnieje - wymaga dodania NOT NULL constraint
- Indeks na user_id dla wydajności zapytań

**Tabela `generation_sessions`:**

- Kolumna `user_id` już istnieje - wymaga dodania NOT NULL constraint
- Indeks na user_id

**Tabela `generation_errors`:**

- Kolumna `user_id` już istnieje - wymaga dodania NOT NULL constraint

#### Tabela użytkowników

Zarządzana przez Supabase Auth - tabela `auth.users`:

- id (UUID, PK)
- email (text, unique)
- encrypted_password (text)
- email_confirmed_at (timestamp)
- created_at (timestamp)
- updated_at (timestamp)
- last_sign_in_at (timestamp)

Brak konieczności tworzenia własnej tabeli profili w MVP - dane podstawowe w auth.users są wystarczające.

## 3. SYSTEM AUTENTYKACJI

### 3.1. Integracja Supabase Auth z Astro

#### Konfiguracja Supabase

Wykorzystanie istniejącego klienta Supabase z `src/db/supabase.client.ts`:

**Client-side:**

- Jeden wspólny klient dla całej aplikacji
- Automatyczne zarządzanie tokenami i odświeżaniem sesji
- Przechowywanie sesji w localStorage (domyślnie)

**Server-side:**

- Wykorzystanie tego samego klienta w middleware Astro
- Weryfikacja sesji poprzez cookies

#### Konfiguracja w Supabase Dashboard

**Authentication Settings:**

- Enable Email Auth: true
- Email confirmation: true (wymagane potwierdzenie emaila przed możliwością logowania zgodnie z US-001)
- Secure password: minimum 8 znaków, co najmniej jedna litera i jedna cyfra
- Session timeout: 3600 sekund (1 godzina)
- Refresh token rotation: enabled

**Email Templates:**
Kustomizacja szablonów emaili:

- Confirmation Email - email weryfikacyjny po rejestracji z linkiem potwierdzającym adres email (US-001)
- Reset Password Email - email z linkiem do resetowania hasła
- Magic Link Email - opcjonalnie dla przyszłych rozszerzeń

**URL Configuration:**

- Site URL: URL produkcyjny aplikacji
- Redirect URLs: whitelista dozwolonych URL przekierowań (`/login` dla potwierdzenia emaila, `/reset-password` dla resetowania hasła)

#### Środowiskowe zmienne konfiguracyjne

Istniejące zmienne w `.env`:

- SUPABASE_URL - URL instancji Supabase
- SUPABASE_KEY - Anon/public key

### 3.2. Flow rejestracji (US-001)

1. **Inicjalizacja:**
   - Użytkownik wypełnia RegisterForm (email, hasło, powtórz hasło)
   - Walidacja client-side przed wysłaniem (format email, hasło min 8 znaków + litera + cyfra, zgodność haseł)

2. **Wysłanie requestu:**
   - Wywołanie `supabase.auth.signUp({ email, password, options: { emailRedirectTo: '/login' } })`
   - Supabase tworzy użytkownika w auth.users z email_confirmed_at = null
   - Supabase wysyła email weryfikacyjny z linkiem potwierdzającym

3. **Potwierdzenie sukcesu:**
   - RegisterForm wyświetla komunikat: "Konto zostało pomyślnie utworzone! Aby móc się zalogować, kliknij w link weryfikacyjny, który wysłaliśmy na Twój adres email." (US-001)
   - Wyświetlenie linku do `/login` z tekstem "Przejdź do strony logowania"
   - Brak automatycznego przekierowania, aby użytkownik mógł przeczytać komunikat

4. **Weryfikacja emaila:**
   - Użytkownik sprawdza skrzynkę pocztową i klika w link weryfikacyjny
   - Link prowadzi do Supabase, który ustawia email_confirmed_at na aktualny timestamp
   - Użytkownik jest przekierowywany do `/login` (zgodnie z emailRedirectTo)

5. **Logowanie po weryfikacji:**
   - Użytkownik loguje się używając nowo utworzonych danych (US-002)
   - Supabase weryfikuje, że email_confirmed_at nie jest null przed utworzeniem sesji

### 3.3. Flow logowania

1. **Inicjalizacja:**
   - Użytkownik wypełnia LoginForm (email, hasło)
   - Walidacja client-side

2. **Wysłanie requestu:**
   - Wywołanie `supabase.auth.signInWithPassword({ email, password })`
   - Supabase weryfikuje credentials w auth.users

3. **Weryfikacja:**
   - Sprawdzenie encrypted_password
   - Sprawdzenie czy email_confirmed_at nie jest null
   - Sprawdzenie czy konto nie jest zablokowane

4. **Utworzenie sesji:**
   - Supabase generuje access_token (JWT) i refresh_token
   - Tokeny są zapisywane w localStorage (client-side)
   - Session cookie jest ustawiane dla komunikacji server-side

5. **Przekierowanie:**
   - LoginForm wykonuje redirect do `/` lub URL z parametru redirect
   - Middleware weryfikuje sesję i przepuszcza do chronionej strony

6. **Odświeżanie sesji:**
   - Supabase automatycznie odświeża access_token przed wygaśnięciem
   - Wykorzystanie refresh_token do pobrania nowego access_token

### 3.4. Flow wylogowania

1. **Inicjalizacja:**
   - Użytkownik klika "Wyloguj" w UserMenu
   - Wywołanie `useAuth().signOut()`

2. **Czyszczenie sesji:**
   - Wywołanie `supabase.auth.signOut()`
   - Usunięcie tokenów z localStorage
   - Wyczyszczenie session cookies

3. **Przekierowanie:**
   - Client-side redirect do `/login`
   - Middleware blokuje dostęp do chronionych stron

### 3.5. Flow odzyskiwania hasła

1. **Inicjalizacja resetowania:**
   - Użytkownik wypełnia ForgotPasswordForm (email)
   - Wywołanie `supabase.auth.resetPasswordForEmail(email, { redirectTo: '/reset-password' })`

2. **Wysłanie emaila:**
   - Supabase generuje token resetowania
   - Wysłanie emaila z linkiem zawierającym token
   - Link prowadzi do `/reset-password?token=...&type=recovery`

3. **Weryfikacja tokena:**
   - Użytkownik klika link w emailu
   - Supabase automatycznie weryfikuje token i tworzy tymczasową sesję
   - ResetPasswordForm sprawdza obecność parametrów w URL

4. **Ustawienie nowego hasła:**
   - Użytkownik wypełnia ResetPasswordForm (nowe hasło, powtórz hasło)
   - Wywołanie `supabase.auth.updateUser({ password: newPassword })`
   - Supabase aktualizuje encrypted_password

5. **Zakończenie:**
   - Wylogowanie użytkownika (unieważnienie tymczasowej sesji)
   - Przekierowanie do `/login` z komunikatem sukcesu

### 3.7. Bezpieczeństwo

#### JWT i autoryzacja

**Access Token:**

- Format: JWT podpisany kluczem Supabase
- Czas życia: 1 godzina (konfigurowalny)
- Zawartość: user_id, email, role, exp, iat
- Przesyłany w headerze Authorization: Bearer {token}

**Refresh Token:**

- Generowany przy logowaniu
- Czas życia: 30 dni (domyślnie)
- Wykorzystywany do odświeżania access_token
- Przechowywany w localStorage (opcjonalnie httpOnly cookie)

**Weryfikacja:**

- Server-side weryfikacja podpisu JWT
- Sprawdzenie expiration time
- Sprawdzenie czy użytkownik nadal istnieje (zapobieganie wykorzystaniu tokenów usuniętych użytkowników)

#### CSRF Protection

- Supabase wykorzystuje httpOnly cookies dla refresh token (opcjonalnie)
- Access token przesyłany w Authorization header nie podlega CSRF
- Middleware Astro sprawdza origin headers

#### Rate Limiting

Konfiguracja w Supabase Dashboard:

- Login attempts: maksymalnie 5 prób na minutę z jednego IP
- Registration: maksymalnie 3 rejestracje na godzinę z jednego IP
- Password reset: maksymalnie 1 request na 5 minut dla email

#### XSS Prevention

- Automatyczne escapowanie w React
- Content Security Policy headers w Astro config
- Walidacja wszystkich inputów

#### Secure Password Storage

- Supabase wykorzystuje bcrypt do hashowania haseł
- Salt generowany automatycznie dla każdego hasła
- Hasło nigdy nie jest przechowywane w plain text

#### HTTPS Only

- Wymuszenie HTTPS w produkcji
- Secure flag dla cookies
- HSTS headers

### 3.8. Session Management

#### Przechowywanie sesji

**Client-side:**

- localStorage: access_token, refresh_token, user metadata
- Automatyczne zarządzanie przez Supabase SDK
- Synchronizacja między kartami przeglądarki

**Server-side:**

- Cookie: sb-{project-ref}-auth-token (httpOnly, secure, sameSite)
- Weryfikacja w middleware dla każdego requestu
- Dostęp przez `supabase.auth.getSession()`

#### Cykl życia sesji

**Utworzenie:**

- Po udanym logowaniu lub rejestracji (jeśli autoConfirm włączony)
- Generowanie access_token i refresh_token

**Weryfikacja:**

- Każdy request do chronionych stron
- Middleware sprawdza ważność access_token
- Automatyczne odświeżanie jeśli token wygasł ale refresh_token jest ważny

**Odświeżanie:**

- Automatyczne 5 minut przed wygaśnięciem access_token
- Wymiana refresh_token na nowy access_token
- Rotacja refresh_token (opcjonalnie)

**Wygaśnięcie:**

- Po upływie czasu życia refresh_token bez aktywności
- Wylogowanie i przekierowanie do `/login`

**Unieważnienie:**

- Ręczne wylogowanie (`signOut()`)
- Usunięcie konta
- Zmiana hasła (opcjonalnie unieważnia wszystkie sesje)

#### Równoczesne sesje

- Supabase domyślnie pozwala na wiele równoczesnych sesji z różnych urządzeń
- Każde urządzenie ma własny refresh_token
- Zmiana hasła może opcjonalnie unieważnić wszystkie sesje (konfiguracja)

### 3.9. Error Handling w autentykacji

#### Błędy Supabase Auth

**invalid_credentials:**

- Kod Supabase: 400
- Scenariusz: Nieprawidłowy email lub hasło
- Komunikat użytkownika: "Nieprawidłowy email lub hasło"

**email_not_confirmed:**

- Kod Supabase: 400
- Scenariusz: Próba logowania przed potwierdzeniem emaila (US-001)
- Komunikat: "Aby się zalogować, musisz najpierw zweryfikować swój adres email. Sprawdź swoją skrzynkę pocztową i kliknij w link weryfikacyjny."

**user_already_registered:**

- Kod Supabase: 422
- Scenariusz: Rejestracja na istniejący email
- Komunikat: "Konto już istnieje"

**weak_password:**

- Kod Supabase: 422
- Scenariusz: Hasło nie spełnia wymogów
- Komunikat: "Hasło musi zawierać minimum 8 znaków, literę i cyfrę."

**invalid_reset_token:**

- Kod Supabase: 422
- Scenariusz: Wygasły lub nieprawidłowy token resetowania
- Komunikat: "Link resetujący wygasł. Wygeneruj nowy."

**rate_limit_exceeded:**

- Kod Supabase: 429
- Scenariusz: Przekroczenie limitu prób
- Komunikat: "Zbyt wiele prób logowania. Spróbuj ponownie za chwilę."

#### Obsługa błędów w komponentach

Wzorzec obsługi w formularzach:

1. Przechwycenie błędu z Supabase SDK
2. Parsowanie kodu błędu i message
3. Mapowanie na przyjazny komunikat w języku polskim
4. Wyświetlenie w interfejsie (alert, toast, inline message)
5. Logowanie szczegółów po stronie klienta (console.error w dev)

#### Graceful degradation

**Brak połączenia z siecią:**

- Wykrycie offline przez navigator.onLine
- Wyświetlenie komunikatu o braku połączenia
- Wyłączenie przycisków submit
- Retry po powrocie online

**Timeout requestów:**

- Ustawienie timeout dla wywołań Supabase (30 sekund)
- Wyświetlenie komunikatu o przekroczeniu czasu
- Umożliwienie retry

**Błędy serwera (500):**

- Ogólny komunikat "Wystąpił błąd. Spróbuj ponownie"
- Ukrycie szczegółów technicznych
- Logowanie pełnych detali server-side

### 3.10. Migracja bazy danych

#### Skrypty migracyjne SQL

**Migration 001: Add auth constraints to flashcards**

- Dodanie NOT NULL constraint do flashcards.user_id
- Utworzenie indeksu na user_id dla wydajności

**Migration 002: Add auth constraints to generation_sessions**

- Dodanie NOT NULL constraint do generation_sessions.user_id
- Utworzenie indeksu na user_id

**Migration 003: Add auth constraints to generation_errors**

- Dodanie NOT NULL constraint do generation_errors.user_id

#### Proces migracji

1. Wykonanie migracji w transakcji
2. Aktualizacja database.types.ts przez CLI Supabase

---

## Podsumowanie

Specyfikacja przedstawia kompletną architekturę systemu autentykacji wykorzystującą Supabase Auth w połączeniu z Astro i React. Kluczowe elementy to:

- **Frontend**: Podział na strony publiczne i chronione, formularze autentykacji jako komponenty React, middleware do ochrony tras
- **Backend**: Endpointy API z weryfikacją sesji, walidacja danych, obsługa usuwania konta
- **Autentykacja**: Pełna integracja Supabase Auth obejmująca rejestrację, logowanie, odzyskiwanie hasła, wylogowanie i usuwanie konta
- **Bezpieczeństwo**: JWT, CSRF protection, rate limiting, secure password storage
- **UX**: Szczegółowe scenariusze użytkownika, walidacja formularzy, przyjazne komunikaty błędów

Architektura jest zgodna z istniejącym stackiem technologicznym (Astro 5, React 19, TypeScript 5, Supabase) i nie narusza działania obecnych funkcjonalności aplikacji (generator fiszek US-004, US-005).
