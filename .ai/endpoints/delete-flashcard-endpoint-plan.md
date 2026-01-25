# API Endpoint Implementation Plan: Delete Flashcard

## 1. Przegląd punktu końcowego

Endpoint umożliwia trwałe usunięcie flashcardy (hard delete) przez zalogowanego użytkownika. Użytkownik może usuwać tylko swoje własne flashcardy, co jest wymuszane przez polityki RLS (Row Level Security) w Supabase. Po pomyślnym usunięciu endpoint zwraca pustą odpowiedź z kodem 200 OK.

**Kluczowe cechy:**

- Trwałe usunięcie flashcardy z bazy danych (hard delete)
- Użytkownik może usuwać tylko swoje własne flashcardy (wymuszane przez RLS)
- Brak możliwości odzyskania usuniętej flashcardy
- Pusta odpowiedź w przypadku sukcesu
- Ochrona przed atakami IDOR (Insecure Direct Object Reference)
- Zwracanie 404 zamiast 403 dla flashcards innych użytkowników (zapobiega ujawnieniu istnienia zasobów)

## 2. Szczegóły żądania

**Metoda HTTP:** DELETE

**Struktura URL:** `/api/flashcards/{id}`

**Parametry:**

- **Wymagane (URL):**
  - `id` (UUID) - identyfikator flashcardy do usunięcia
- **Opcjonalne:** Brak

**Request Body:** Brak (metoda DELETE nie przyjmuje body)

**Content-Type:** Nie dotyczy (brak body)

**Wymagania autentykacji:**

- Użytkownik musi być zalogowany
- Token sesji Supabase w cookies/headers
- Użytkownik może usuwać tylko swoje flashcardy

## 3. Wykorzystywane typy

### Command Model (Request)

- **Brak** - DELETE nie przyjmuje request body, tylko parametr URL

### Response DTO

- **Sukces (200):** Pusta odpowiedź (empty response)
- **Błędy:** Standardowe error responses z `api-responses.ts`
  - `unauthorizedResponse()` - 401
  - `notFoundResponse()` - 404
  - `internalServerErrorResponse()` - 500

### Entity (Database)

- **`FlashcardEntity`** - pełny model z bazy danych
  - Używany wewnętrznie w service do operacji DELETE
  - Nie jest zwracany w odpowiedzi

### Nowy schemat walidacji

- **`deleteFlashcardParamsSchema`** - schemat Zod dla walidacji parametru `id`
  - Walidacja UUID
  - Komunikat błędu: "Nieprawidłowy format ID fiszki"

## 4. Szczegóły odpowiedzi

### Sukces (200 OK)

**Body:** Pusty (empty response)

**Headers:**

```
Content-Type: application/json
Content-Length: 0
```

**Uwaga:** Zgodnie ze specyfikacją, endpoint zwraca pustą odpowiedź. Można użyć `new Response(null, { status: 200 })` lub `createJsonResponse(null, 200)`.

### Błędy

**400 Bad Request** - Błędy walidacji:

```json
{
  "error": "Bad Request",
  "message": "Nieprawidłowe dane wejściowe",
  "details": [
    {
      "field": "id",
      "message": "Nieprawidłowy format ID fiszki"
    }
  ]
}
```

Przykładowe komunikaty:

- "Nieprawidłowy format ID fiszki" (UUID validation)

**401 Unauthorized** - Brak autentykacji:

```json
{
  "error": "Unauthorized",
  "message": "Wymagana prawidłowa autentykacja"
}
```

**404 Not Found** - Flashcard nie istnieje lub nie należy do użytkownika:

```json
{
  "error": "Not Found",
  "message": "Fiszka nie została znaleziona"
}
```

**Uwaga:** Zwracamy 404 zamiast 403 dla flashcards innych użytkowników, aby nie ujawniać istnienia zasobów.

**500 Internal Server Error** - Błąd serwera:

```json
{
  "error": "Internal Server Error",
  "message": "Wystąpił nieoczekiwany błąd"
}
```

## 5. Przepływ danych

### Krok po kroku:

1. **Żądanie HTTP DELETE** → `/api/flashcards/{id}`
   - URL zawiera `id` flashcardy do usunięcia
   - Brak request body

2. **Middleware Astro**
   - Sprawdzenie autentykacji przez `context.locals.supabase`
   - Pobranie `user_id` z sesji

3. **Walidacja parametru URL**
   - Parsowanie `id` z `context.params`
   - Walidacja przez Zod schema (`deleteFlashcardParamsSchema`)
   - Sprawdzenie czy `id` jest prawidłowym UUID

4. **Wywołanie FlashcardService**
   - Inicjalizacja serwisu z `supabase` i `user_id`
   - Wywołanie metody `deleteFlashcard(id)`

5. **Operacja bazodanowa**
   - DELETE z tabeli `flashcards`:
     - Warunek: `id = flashcard_id AND user_id = this.user_id`
   - Sprawdzenie liczby usuniętych wierszy
   - Jeśli brak usuniętych wierszy → rzuć `FlashcardServiceError` z kodem 404

6. **Odpowiedź HTTP 200**
   - Zwrócenie pustej odpowiedzi (empty response)

### Interakcje z bazą danych:

- **Tabela:** `flashcards`
- **Operacja:** DELETE
- **Warunek:** `id = ? AND user_id = ?` (RLS enforcement)
- **Foreign Key constraints:**
  - `user_id` → `auth.users(id)` ON DELETE CASCADE
  - `generation_id` → `generation_sessions(id)` ON DELETE RESTRICT
- **RLS policies:** Automatyczne wymuszenie autoryzacji

## 6. Względy bezpieczeństwa

### Autentykacja

- **Wymaganie:** Użytkownik musi być zalogowany
- **Implementacja:** Sprawdzenie `context.locals.user`
- **Błąd:** 401 Unauthorized jeśli brak sesji

### Autoryzacja

- **IDOR Protection:** Warunek `user_id = this.user_id` w DELETE zapobiega usuwaniu flashcards innych użytkowników
- **RLS (Row Level Security):** Supabase automatycznie wymusza polityki dostępu
- **404 vs 403:** Zwracanie 404 zamiast 403 zapobiega ujawnieniu istnienia zasobów innych użytkowników

### Walidacja danych

**Parametr URL:**

- Walidacja UUID przez Zod schema
- Ochrona przed nieprawidłowymi formatami ID
- Zapobieganie SQL injection (choć Supabase SDK już chroni)

### Ochrona przed nadużyciami

**Trwałe usunięcie:**

- Hard delete - brak możliwości odzyskania
- Rozważyć w przyszłości soft delete (pole `deleted_at`) dla możliwości odzyskania

**Rate limiting:**

- Nie określone w specyfikacji
- Rozważyć w przyszłości (np. max 100 DELETE na godzinę)

**Cascade effects:**

- Usunięcie flashcardy nie wpływa na `generation_sessions` (ON DELETE RESTRICT)
- Usunięcie użytkownika automatycznie usuwa jego flashcardy (ON DELETE CASCADE)

### Wrażliwe dane

- **Brak danych w odpowiedzi:** Pusta odpowiedź nie ujawnia żadnych informacji
- **Dostępne tylko dla właściciela:** RLS policies w Supabase

## 7. Obsługa błędów

### Scenariusze błędów i kody statusu:

| Scenariusz                             | Kod | Obsługa                                                                  |
| -------------------------------------- | --- | ------------------------------------------------------------------------ |
| Brak autentykacji                      | 401 | Sprawdzenie `locals.user` w endpoincie, zwrot `unauthorizedResponse()`   |
| Nieprawidłowy UUID                     | 400 | Zod schema zwróci błąd walidacji parametru URL                           |
| Flashcard nie istnieje                 | 404 | DELETE zwróci 0 wierszy, service rzuca błąd 404                          |
| Flashcard należy do innego użytkownika | 404 | DELETE zwróci 0 wierszy (RLS), service rzuca błąd 404                    |
| Błąd bazy danych                       | 500 | Catch error z Supabase, log error, zwrot `internalServerErrorResponse()` |

### Strategia obsługi błędów:

1. **Walidacja na poziomie endpointu:**
   - Zod schema dla walidacji parametru URL (`deleteFlashcardParamsSchema`)
   - Zwrot 400 z opisowym komunikatem i szczegółami walidacji

2. **Błędy serwisu:**
   - Try-catch w metodzie `deleteFlashcard()`
   - Sprawdzenie liczby usuniętych wierszy (jeśli 0 → 404)
   - Rzucenie `FlashcardServiceError` z kodem 404 dla nie znalezionej flashcardy
   - Rzucenie generic Error dla innych błędów bazodanowych

3. **Błędy endpointu:**
   - Catch błędów z serwisu
   - Sprawdzenie czy błąd to `FlashcardServiceError` z kodem 404
   - Zwrot 404 z `notFoundResponse()` dla błędów 404
   - Zwrot 500 z `internalServerErrorResponse()` dla innych błędów
   - Logowanie pełnych szczegółów błędu do console.error

4. **Komunikaty dla użytkownika:**
   - 400: "Nieprawidłowy format ID fiszki"
   - 401: "Wymagana prawidłowa autentykacja"
   - 404: "Fiszka nie została znaleziona"
   - 500: "Wystąpił nieoczekiwany błąd" (bez szczegółów technicznych)

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła:

1. **Operacja bazodanowa:**
   - DELETE to szybka operacja
   - Index na `user_id` przyspiesza RLS checks
   - Index na `id` (Primary Key) przyspiesza wyszukiwanie
   - Brak złożonych JOIN'ów

2. **Walidacja:**
   - Zod schema - minimalne opóźnienie
   - UUID validation - szybka operacja regex

3. **Autentykacja:**
   - Sprawdzenie sesji przez Supabase SDK
   - Cache sesji po stronie Supabase

### Strategie optymalizacji:

1. **Baza danych:**
   - Index na `id` (Primary Key) - już istnieje
   - Index na `user_id` (Foreign Key) - już istnieje
   - RLS policies - optymalizowane przez Supabase
   - Brak potrzeby SELECT po DELETE (empty response)

2. **Endpoint:**
   - Brak niepotrzebnych SELECT'ów
   - Minimalne przetwarzanie (tylko walidacja UUID)
   - Pusta odpowiedź (brak serializacji JSON)

3. **Caching:**
   - Nie dotyczy (DELETE endpoint, zawsze modyfikuje zasób)
   - Cache dla sesji użytkownika (Supabase)
   - Invalidacja cache po stronie frontendu po udanym usunięciu

4. **Monitoring:**
   - Logowanie czasu wykonania operacji bazodanowej
   - Monitoring liczby błędów 404 (może wskazywać na ataki IDOR)
   - Monitoring liczby błędów 500
   - Tracking liczby usuniętych flashcards (analytics)

### Oczekiwana wydajność:

- **Czas odpowiedzi:** < 150ms (typowo)
- **Throughput:** Ograniczony przez Supabase (zależny od planu)
- **Skalowalność:** Bardzo dobra (prosta operacja DELETE z indeksami)

## 9. Etapy wdrożenia

### 1. Weryfikacja schematu bazy danych

- **Cel:** Upewnienie się, że struktura tabeli `flashcards` wspiera operację DELETE
- **Operacje:**
  - Zweryfikować polityki RLS dla operacji DELETE
  - Zweryfikować indeksy na `id` (Primary Key) i `user_id` (Foreign Key)
  - Zweryfikować foreign key constraints (ON DELETE CASCADE/RESTRICT)
- **Lokalizacja:** `supabase/migrations/20260117140000_initial_schema.sql`

### 2. Utworzenie schematu walidacji Zod

- **Plik:** `src/lib/schemas/delete-flashcard.schema.ts`
- **Implementacja:**
  - Schemat `deleteFlashcardParamsSchema` z walidacją UUID dla parametru `id`
  - Komunikat błędu: "Nieprawidłowy format ID fiszki"
  - Export typu `DeleteFlashcardParams`
- **Wzorować na:** `update-flashcard.schema.ts` (parametr URL)

### 3. Rozszerzenie FlashcardService

- **Plik:** `src/lib/services/flashcard.service.ts`
- **Implementacja:**
  - Dodać metodę `deleteFlashcard(flashcard_id: string): Promise<void>`
  - DELETE z `flashcards` z warunkiem `id = flashcard_id AND user_id = this.user_id`
  - Sprawdzenie liczby usuniętych wierszy (`.count` lub sprawdzenie zwróconego rekordu)
  - Jeśli brak usuniętych wierszy → rzuć `FlashcardServiceError` z kodem 404
  - Obsługa błędów z Supabase

### 4. Utworzenie endpointu API

- **Plik:** `src/pages/api/flashcards/delete-flashcard.ts`
- **Implementacja:**
  - Export `export const prerender = false`
  - Handler `DELETE` ze sprawdzeniem autentykacji (`locals.user`)
  - Pobranie `id` z `context.params.id`
  - Walidacja `id` przez `deleteFlashcardParamsSchema`
  - Inicjalizacja `FlashcardService`
  - Wywołanie `deleteFlashcard(id)`
  - Zwrot 200 z pustą odpowiedzią (`new Response(null, { status: 200 })`)
  - Obsługa błędów (400, 401, 404, 500)
  - Catch `FlashcardServiceError` i zwrot odpowiedniego kodu statusu
- **Wzorować na:** `src/pages/api/flashcards.ts` (POST handler)
