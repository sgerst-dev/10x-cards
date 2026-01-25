# API Endpoint Implementation Plan: Update Flashcard

## 1. Przegląd punktu końcowego

Endpoint umożliwia aktualizację istniejącej flashcardy przez zalogowanego użytkownika. Użytkownik może modyfikować tylko pola `front` i `back` swoich własnych flashcards. Pole `source` pozostaje niezmienione, a `updated_at` jest automatycznie aktualizowane przez trigger bazodanowy.

**Kluczowe cechy:**

- Aktualizacja tylko pól `front` i `back` istniejącej flashcardy
- Użytkownik może edytować tylko swoje własne flashcardy (wymuszane przez RLS)
- Pole `source` pozostaje niezmienione
- Automatyczna aktualizacja `updated_at` przez trigger bazodanowy
- Zachowanie oryginalnych metadanych (`created_at`, `generation_id`)
- Walidacja długości tekstu (250 znaków dla front, 500 dla back)

## 2. Szczegóły żądania

**Metoda HTTP:** PUT

**Struktura URL:** `/api/flashcards/update-flashcard?id={id}`

**Parametry:**

- **Wymagane (Query):**
  - `id` (UUID) - identyfikator flashcardy do aktualizacji
- **Opcjonalne:** Brak

**Request Body:**

```json
{
  "front": "string (max 250 chars, required)",
  "back": "string (max 500 chars, required)"
}
```

**Content-Type:** `application/json`

**Wymagania autentykacji:**

- Użytkownik musi być zalogowany
- Token sesji Supabase w cookies/headers
- Użytkownik może aktualizować tylko swoje flashcardy

## 3. Wykorzystywane typy

### Command Model (Request)

- **`UpdateFlashcardCommand`** (już istnieje w `src/types.ts`)
  - `front: string` - nowy tekst na przedniej stronie fiszki
  - `back: string` - nowy tekst na tylnej stronie fiszki

### Response DTO

- **`UpdateFlashcardResponse`** (już istnieje w `src/types.ts`)
  - Alias dla `FlashcardSlimDto`
  - Zawiera: `id`, `front`, `back`, `source`, `created_at`
  - Nie zawiera: `user_id`, `generation_id`, `updated_at`

### Entity (Database)

- **`FlashcardEntity`** - pełny model z bazy danych
  - Używany wewnętrznie w service
  - Mapowany na DTO przed zwróceniem

### Nowy schemat walidacji

- **`updateFlashcardSchema`** - schemat Zod dla walidacji request body
  - Walidacja `front` (min 1, max 250, trim)
  - Walidacja `back` (min 1, max 500, trim)
  - Analogiczny do `createFlashcardSchema`

### Walidacja parametru URL

- **`updateFlashcardParamsSchema`** - schemat Zod dla walidacji parametru `id`
  - Walidacja UUID

## 4. Szczegóły odpowiedzi

### Sukces (200 OK)

```json
{
  "id": "uuid",
  "front": "string",
  "back": "string",
  "source": "user_created | ai_generated | ai_edited",
  "created_at": "ISO 8601 timestamp"
}
```

**Uwaga:** Pole `updated_at` nie jest zwracane w odpowiedzi (zgodnie z `FlashcardSlimDto`).

### Błędy

**400 Bad Request** - Błędy walidacji:

```json
{
  "error": "Bad Request",
  "message": "Nieprawidłowe dane wejściowe",
  "details": [
    {
      "field": "front",
      "message": "Tekst na przedniej stronie fiszki przekracza maksymalną długość 250 znaków"
    }
  ]
}
```

Przykładowe komunikaty:

- "Nieprawidłowy format ID fiszki" (UUID validation)
- "Tekst na przedniej stronie fiszki jest wymagany"
- "Tekst na przedniej stronie fiszki przekracza maksymalną długość 250 znaków"
- "Tekst na tylnej stronie fiszki jest wymagany"
- "Tekst na tylnej stronie fiszki przekracza maksymalną długość 500 znaków"
- "Nieprawidłowy format JSON w treści żądania"

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

**500 Internal Server Error** - Błąd serwera:

```json
{
  "error": "Internal Server Error",
  "message": "Wystąpił nieoczekiwany błąd"
}
```

## 5. Przepływ danych

### Krok po kroku:

1. **Żądanie HTTP PUT** → `/api/flashcards/update-flashcard?id={id}`
   - Query parameter zawiera `id` flashcardy
   - Body zawiera `front` i `back`

2. **Middleware Astro**
   - Sprawdzenie autentykacji przez `context.locals.supabase`
   - Pobranie `user_id` z sesji

3. **Walidacja parametru URL**
   - Parsowanie `id` z `url.searchParams.get("id")`
   - Walidacja przez Zod schema (`updateFlashcardParamsSchema`)
   - Sprawdzenie czy `id` jest prawidłowym UUID

4. **Walidacja request body**
   - Parsowanie JSON body
   - Walidacja przez Zod schema (`updateFlashcardSchema`)
   - Trim białych znaków z `front` i `back`
   - Sprawdzenie długości (max 250 dla front, max 500 dla back)

5. **Wywołanie FlashcardService**
   - Inicjalizacja serwisu z `supabase` i `user_id`
   - Wywołanie metody `updateFlashcard(id, command)`

6. **Operacja bazodanowa**
   - UPDATE tabeli `flashcards`:
     - Warunek: `id = flashcard_id AND user_id = this.user_id`
     - Aktualizacja: `front`, `back`
     - `updated_at` - automatycznie przez trigger
   - SELECT zaktualizowanego rekordu (bez `updated_at`)
   - Jeśli brak zwróconych wierszy → rzuć błąd 404

7. **Mapowanie Entity → DTO**
   - Usunięcie `user_id`, `generation_id`, `updated_at`
   - Zwrócenie `FlashcardSlimDto`

8. **Odpowiedź HTTP 200**
   - Zwrócenie `UpdateFlashcardResponse` jako JSON

### Interakcje z bazą danych:

- **Tabela:** `flashcards`
- **Operacja:** UPDATE
- **Warunek:** `id = ? AND user_id = ?` (RLS enforcement)
- **Aktualizowane pola:** `front`, `back`
- **Trigger:** Automatyczna aktualizacja `updated_at` przy UPDATE
- **Foreign Key:** `user_id` → `auth.users(id)` (CASCADE on delete)

## 6. Względy bezpieczeństwa

### Autentykacja

- **Wymaganie:** Użytkownik musi być zalogowany
- **Implementacja:** Sprawdzenie `context.locals.user`
- **Błąd:** 401 Unauthorized jeśli brak sesji

### Autoryzacja

- **IDOR Protection:** Warunek `user_id = this.user_id` w UPDATE zapobiega edycji flashcards innych użytkowników
- **RLS (Row Level Security):** Supabase automatycznie wymusza polityki dostępu
- **404 vs 403:** Zwracanie 404 zamiast 403 zapobiega ujawnieniu istnienia zasobów innych użytkowników

### Walidacja danych

**Parametr URL:**

- Walidacja UUID przez Zod schema
- Ochrona przed nieprawidłowymi formatami ID

**Request body:**

- Zod schema: Walidacja typu, długości i wymagalności pól
- Trim: Usunięcie białych znaków z początku i końca
- Sanityzacja: Supabase SDK chroni przed SQL injection
- XSS: Frontend odpowiedzialny za escape przy renderowaniu

### Ochrona przed nadużyciami

**Limity długości:**

- 250 znaków (front)
- 500 znaków (back)

**Mass Assignment Protection:**

- Explicit UPDATE tylko dla `front` i `back`
- Brak możliwości modyfikacji `source`, `user_id`, `generation_id`, `created_at`

**Rate limiting:**

- Nie określone w specyfikacji
- Rozważyć w przyszłości

### Wrażliwe dane

- **Ukryte w response:** `user_id`, `generation_id`, `updated_at`
- **Dostępne tylko dla właściciela:** RLS policies w Supabase

## 7. Obsługa błędów

### Scenariusze błędów i kody statusu:

| Scenariusz                             | Kod | Obsługa                                                                  |
| -------------------------------------- | --- | ------------------------------------------------------------------------ |
| Brak autentykacji                      | 401 | Sprawdzenie `locals.user` w endpoincie, zwrot `unauthorizedResponse()`   |
| Nieprawidłowy UUID                     | 400 | Zod schema zwróci błąd walidacji parametru URL                           |
| Brak `front`                           | 400 | Zod schema zwróci błąd walidacji body                                    |
| Brak `back`                            | 400 | Zod schema zwróci błąd walidacji body                                    |
| `front` > 250 znaków                   | 400 | Zod schema zwróci błąd walidacji body                                    |
| `back` > 500 znaków                    | 400 | Zod schema zwróci błąd walidacji body                                    |
| Nieprawidłowy JSON                     | 400 | `parseJsonBody()` zwróci błąd                                            |
| Flashcard nie istnieje                 | 404 | Service rzuca `FlashcardServiceError` z kodem 404                        |
| Flashcard należy do innego użytkownika | 404 | UPDATE zwróci 0 wierszy, service rzuca błąd 404                          |
| Błąd bazy danych                       | 500 | Catch error z Supabase, log error, zwrot `internalServerErrorResponse()` |

### Strategia obsługi błędów:

1. **Walidacja na poziomie endpointu:**
   - Try-catch dla parsowania JSON (`parseJsonBody()`)
   - Zod schema dla walidacji parametru URL (`updateFlashcardParamsSchema`)
   - Zod schema dla walidacji body (`updateFlashcardSchema`)
   - Zwrot 400 z opisowym komunikatem i szczegółami walidacji

2. **Błędy serwisu:**
   - Try-catch w metodzie `updateFlashcard()`
   - Sprawdzenie czy UPDATE zwrócił wiersze (jeśli nie → 404)
   - Rzucenie `FlashcardServiceError` z kodem 404 dla nie znalezionej flashcardy
   - Rzucenie generic Error dla innych błędów bazodanowych

3. **Błędy endpointu:**
   - Catch błędów z serwisu
   - Sprawdzenie czy błąd to `FlashcardServiceError` z kodem 404
   - Zwrot 404 z `notFoundResponse()` dla błędów 404
   - Zwrot 500 z `internalServerErrorResponse()` dla innych błędów
   - Logowanie pełnych szczegółów błędu do console.error

4. **Komunikaty dla użytkownika:**
   - 400: Konkretny komunikat walidacji z listą błędów
   - 401: "Wymagana prawidłowa autentykacja"
   - 404: "Fiszka nie została znaleziona"
   - 500: "Wystąpił nieoczekiwany błąd" (bez szczegółów technicznych)

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła:

1. **Operacja bazodanowa:**
   - UPDATE to szybka operacja
   - Index na `user_id` przyspiesza RLS checks
   - Index na `id` (Primary Key) przyspiesza wyszukiwanie
   - Brak złożonych JOIN'ów

2. **Walidacja:**
   - Zod schema - minimalne opóźnienie
   - Trim() - O(n) dla długości stringa (max 500 znaków)
   - UUID validation - szybka operacja regex

3. **Autentykacja:**
   - Sprawdzenie sesji przez Supabase SDK
   - Cache sesji po stronie Supabase

### Strategie optymalizacji:

1. **Baza danych:**
   - Index na `id` (Primary Key) - już istnieje
   - Index na `user_id` (Foreign Key) - już istnieje
   - Trigger dla `updated_at` - wykonywany na poziomie bazy (szybki)
   - RLS policies - optymalizowane przez Supabase

2. **Endpoint:**
   - Brak niepotrzebnych SELECT'ów
   - Zwracanie tylko zaktualizowanego rekordu
   - Minimalne mapowanie (usunięcie 3 pól)

3. **Caching:**
   - Nie dotyczy (PUT endpoint, zawsze modyfikuje zasób)
   - Cache dla sesji użytkownika (Supabase)
   - Invalidacja cache po stronie frontendu po udanej aktualizacji

4. **Monitoring:**
   - Logowanie czasu wykonania operacji bazodanowej
   - Monitoring liczby błędów 404 (może wskazywać na ataki IDOR)
   - Monitoring liczby błędów 500

### Oczekiwana wydajność:

- **Czas odpowiedzi:** < 200ms (typowo)
- **Throughput:** Ograniczony przez Supabase (zależny od planu)
- **Skalowalność:** Dobra (prosta operacja UPDATE z indeksami)

## 9. Etapy wdrożenia

### 1. Weryfikacja schematu bazy danych

- **Cel:** Upewnienie się, że struktura tabeli `flashcards` wspiera operację UPDATE
- **Operacje:**
  - Zweryfikować istnienie triggera dla automatycznej aktualizacji `updated_at`
  - Zweryfikować polityki RLS dla operacji UPDATE
  - Zweryfikować indeksy na `id` (Primary Key) i `user_id` (Foreign Key)
- **Lokalizacja:** `supabase/migrations/20260117140000_initial_schema.sql`

### 2. Utworzenie schematu walidacji Zod

- **Plik:** `src/lib/schemas/update-flashcard.schema.ts`
- **Implementacja:**
  - Schemat `updateFlashcardSchema` z walidacją front (min 1, max 250, trim)
  - Walidacja back (min 1, max 500, trim)
  - Schemat `updateFlashcardParamsSchema` z walidacją UUID dla parametru `id`
  - Export typów `UpdateFlashcardInput` i `UpdateFlashcardParams`
- **Wzorować na:** `create-flashcard.schema.ts`

### 3. Rozszerzenie FlashcardService

- **Plik:** `src/lib/services/flashcard.service.ts`
- **Implementacja:**
  - Dodać metodę `updateFlashcard(flashcard_id: string, command: UpdateFlashcardCommand): Promise<UpdateFlashcardResponse>`
  - UPDATE w `flashcards` z warunkiem `id = flashcard_id AND user_id = this.user_id`
  - Aktualizacja tylko pól `front` i `back`
  - SELECT zaktualizowanego rekordu (bez `updated_at`)
  - Sprawdzenie czy UPDATE zwrócił wiersze (jeśli nie → rzuć `FlashcardServiceError` z kodem 404)
  - Mapowanie na `FlashcardSlimDto` (bez `user_id`, `generation_id`, `updated_at`)
  - Obsługa błędów z Supabase

### 4. Utworzenie endpointu API

- **Plik:** `src/pages/api/flashcards/update-flashcard.ts`
  - Export `export const prerender = false`
  - Handler `PUT` ze sprawdzeniem autentykacji (`locals.user`)
  - Pobranie `id` z `url.searchParams.get("id")`
  - Walidacja `id` przez `updateFlashcardParamsSchema`
  - Parsowanie i walidacja body przez `updateFlashcardSchema`
  - Inicjalizacja `FlashcardService`
  - Wywołanie `updateFlashcard(id, command)`
  - Zwrot 200 z `UpdateFlashcardResponse`
  - Obsługa błędów (400, 401, 404, 500)
  - Catch `FlashcardServiceError` i zwrot odpowiedniego kodu statusu
