# API Endpoint Implementation Plan: Create Flashcard

## 1. Przegląd punktu końcowego

Endpoint umożliwia ręczne utworzenie pojedynczej flashcardy przez zalogowanego użytkownika. Flashcard jest zapisywana w bazie danych ze źródłem `user_created` i automatycznie przypisywana do użytkownika wykonującego żądanie.

**Kluczowe cechy:**

- Ręczne tworzenie pojedynczej flashcardy
- Automatyczne przypisanie do zalogowanego użytkownika
- Źródło flashcardy: `user_created`
- Brak powiązania z sesją generacji AI (`generation_id = NULL`)
- Automatyczne timestampy (`created_at`, `updated_at`)

## 2. Szczegóły żądania

**Metoda HTTP:** POST

**Struktura URL:** `/api/flashcards`

**Parametry:**

- **Wymagane:** Brak parametrów URL ani query
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

## 3. Wykorzystywane typy

### Command Model (Request)

- **`CreateFlashcardCommand`** (już istnieje w `src/types.ts`)
  - `front: string` - tekst na przedniej stronie fiszki
  - `back: string` - tekst na tylnej stronie fiszki

### Response DTO

- **`CreateFlashcardResponse`** (już istnieje w `src/types.ts`)
  - Alias dla `FlashcardDto`
  - Zawiera: `id`, `front`, `back`, `source`, `created_at`, `updated_at`
  - Nie zawiera wrażliwych danych: `user_id`, `generation_id`

### Entity (Database)

- **`FlashcardEntity`** - pełny model z bazy danych
  - Używany wewnętrznie w service
  - Mapowany na DTO przed zwróceniem

## 4. Szczegóły odpowiedzi

### Sukces (201 Created)

```json
{
  "id": "uuid",
  "front": "string",
  "back": "string",
  "source": "user_created",
  "created_at": "ISO 8601 timestamp",
  "updated_at": "ISO 8601 timestamp"
}
```

### Błędy

**400 Bad Request** - Błędy walidacji:

```json
{
  "error": "Validation error message"
}
```

Przykładowe komunikaty:

- "Tekst na przedniej stronie fiszki jest wymagany"
- "Tekst na przedniej stronie fiszki przekracza maksymalną długość 250 znaków"
- "Tekst na tylnej stronie fiszki jest wymagany"
- "Tekst na tylnej stronie fiszki przekracza maksymalną długość 500 znaków"

**401 Unauthorized** - Brak autentykacji:

```json
{
  "error": "Unauthorized",
  "message": "Wymagana prawidłowa autentykacja"
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

1. **Żądanie HTTP POST** → `/api/flashcards`
   - Body zawiera `front` i `back`

2. **Middleware Astro**
   - Sprawdzenie autentykacji przez `context.locals.supabase`
   - Pobranie `user_id` z sesji

3. **Walidacja danych wejściowych**
   - Parsowanie JSON body
   - Walidacja przez Zod schema (`createFlashcardSchema`)
   - Trim białych znaków z `front` i `back`
   - Sprawdzenie długości (max 250 dla front, max 500 dla back)

4. **Wywołanie FlashcardService**
   - Inicjalizacja serwisu z `supabase` i `user_id`
   - Wywołanie metody `createFlashcard(command)`

5. **Operacja bazodanowa**
   - INSERT do tabeli `flashcards`:
     - `user_id` - z konstruktora serwisu
     - `front`, `back` - z command
     - `source` - 'user_created'
     - `generation_id` - NULL
     - `created_at`, `updated_at` - automatycznie przez bazę
   - SELECT zwróconego rekordu

6. **Mapowanie Entity → DTO**
   - Usunięcie `user_id` i `generation_id`
   - Zwrócenie `FlashcardDto`

7. **Odpowiedź HTTP 201**
   - Zwrócenie `CreateFlashcardResponse` jako JSON

### Interakcje z bazą danych:

- **Tabela:** `flashcards`
- **Operacja:** INSERT
- **Constraint CHECK:** Automatycznie spełniony (`source = 'user_created' AND generation_id IS NULL`)
- **Foreign Key:** `user_id` → `auth.users(id)` (CASCADE on delete)
- **Trigger:** Automatyczna aktualizacja `updated_at` przy UPDATE (nie dotyczy INSERT)

## 6. Względy bezpieczeństwa

### Autentykacja

- **Wymaganie:** Użytkownik musi być zalogowany
- **Implementacja:** Sprawdzenie `context.locals.supabase.auth.getUser()`
- **Błąd:** 401 Unauthorized jeśli brak sesji

### Autoryzacja

- **Automatyczne przypisanie:** Flashcard przypisywana do `user_id` z sesji
- **Ochrona:** Użytkownik nie może tworzyć flashcards dla innych użytkowników
- **RLS (Row Level Security):** Supabase automatycznie wymusza polityki dostępu

### Walidacja danych

- **Zod schema:** Walidacja typu, długości i wymagalności pól
- **Trim:** Usunięcie białych znaków z początku i końca
- **Sanityzacja:** Supabase SDK chroni przed SQL injection
- **XSS:** Frontend odpowiedzialny za escape przy renderowaniu

### Ochrona przed nadużyciami

- **Limity długości:** 250 znaków (front), 500 znaków (back)
- **Rate limiting:** Nie określone w specyfikacji, rozważyć w przyszłości
- **Constraint CHECK:** Baza danych wymusza poprawność `source` i `generation_id`

### Wrażliwe dane

- **Ukryte w response:** `user_id`, `generation_id`
- **Dostępne tylko dla właściciela:** RLS policies w Supabase

## 7. Obsługa błędów

### Scenariusze błędów i kody statusu:

| Scenariusz            | Kod | Obsługa                                                    |
| --------------------- | --- | ---------------------------------------------------------- |
| Brak autentykacji     | 401 | Sprawdzenie `getUser()` w endpoincie, zwrot error response |
| Brak `front`          | 400 | Zod schema zwróci błąd walidacji                           |
| Brak `back`           | 400 | Zod schema zwróci błąd walidacji                           |
| `front` > 250 znaków  | 400 | Zod schema zwróci błąd walidacji                           |
| `back` > 500 znaków   | 400 | Zod schema zwróci błąd walidacji                           |
| Nieprawidłowy JSON    | 400 | Catch error podczas parsowania body                        |
| Błąd bazy danych      | 500 | Catch error z Supabase, log error, zwrot generic message   |
| Naruszenie constraint | 500 | Nie powinno wystąpić (logika zapewnia zgodność)            |

### Strategia obsługi błędów:

1. **Walidacja na poziomie endpointu:**
   - Try-catch dla parsowania JSON
   - Zod schema dla walidacji struktury i wartości
   - Zwrot 400 z opisowym komunikatem

2. **Błędy serwisu:**
   - Try-catch w metodzie `createFlashcard()`
   - Logowanie błędów do console.error
   - Rzucenie błędu z opisem dla endpointu

3. **Błędy endpointu:**
   - Catch błędów z serwisu
   - Zwrot 500 z generic message (bez szczegółów technicznych)
   - Logowanie pełnych szczegółów błędu

4. **Komunikaty dla użytkownika:**
   - 400: Konkretny komunikat walidacji
   - 401: "Unauthorized"
   - 500: "Internal server error" (bez szczegółów)

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła:

1. **Operacja bazodanowa:**
   - INSERT to szybka operacja
   - Index na `user_id` przyspiesza RLS checks
   - Brak złożonych JOIN'ów

2. **Walidacja:**
   - Zod schema - minimalne opóźnienie
   - Trim() - O(n) dla długości stringa (max 500 znaków)

3. **Autentykacja:**
   - Sprawdzenie sesji przez Supabase SDK
   - Cache sesji po stronie Supabase

### Strategie optymalizacji:

1. **Baza danych:**
   - Index na `user_id` (już istnieje dla FK)
   - Index na `created_at` dla sortowania w listach
   - Constraint CHECK wykonywany na poziomie bazy (szybki)

2. **Endpoint:**
   - Brak niepotrzebnych SELECT'ów
   - Zwracanie tylko utworzonego rekordu
   - Minimalne mapowanie (usunięcie 2 pól)

3. **Caching:**
   - Nie dotyczy (POST endpoint, zawsze tworzy nowy zasób)
   - Cache dla sesji użytkownika (Supabase)

4. **Monitoring:**
   - Logowanie czasu wykonania operacji bazodanowej
   - Monitoring liczby błędów 500

### Oczekiwana wydajność:

- **Czas odpowiedzi:** < 200ms (typowo)
- **Throughput:** Ograniczony przez Supabase (zależny od planu)
- **Skalowalność:** Dobra (prosta operacja INSERT)

## 9. Etapy wdrożenia

### 1. Migracja bazy danych 

- **Cel:** Zapewnienie optymalnej wydajności dla operacji INSERT i SELECT
- **Operacje:**
  - Zweryfikować istnienie złożonego indeksu `idx_flashcards_user_created` na `(user_id, created_at DESC)` w tabeli `flashcards`
  - Zweryfikować trigger dla automatycznej aktualizacji `updated_at`
  - Zweryfikować constraint CHECK dla `source` i `generation_id`
  - Zweryfikować polityki RLS dla tabeli `flashcards`
- **Uzasadnienie:**
  - Indeks `(user_id, created_at DESC)` przyspiesza operacje RLS podczas INSERT
  - Indeks wspiera również paginowane zapytania GET (sortowanie po `created_at`)
  - Bez indeksu, każdy INSERT wymaga pełnego skanowania tabeli dla sprawdzenia RLS
- **Lokalizacja:** `supabase/migrations/20260117140000_initial_schema.sql`

### 2. Utworzenie schematu walidacji Zod 

- **Plik:** `src/lib/schemas/create-flashcard.schema.ts`
- **Implementacja:**
  - Schemat `createFlashcardSchema` z walidacją front (min 1, max 250, trim)
  - Walidacja back (min 1, max 500, trim)
  - Export typu `CreateFlashcardInput`
- **Wzorowano na:** `save-generated-flashcards.schema.ts`

### 3. Rozszerzenie FlashcardService 

- **Plik:** `src/lib/services/flashcard.service.ts`
- **Implementacja:**
  - Dodać metodę `createFlashcard(command: CreateFlashcardCommand): Promise<CreateFlashcardResponse>`
  - INSERT do `flashcards` z `user_id`, `front`, `back`, `source: 'user_created'`, `generation_id: null`
  - SELECT zwróconego rekordu (z `id`, `created_at`, `updated_at`)
  - Mapowanie na `FlashcardDto` (bez `user_id` i `generation_id`)
  - Obsługa błędów z Supabase

### 4. Utworzenie endpointu API

- **Plik:** `src/pages/api/flashcards/create-flashcard.ts`
- **Implementacja:**
  - Export `export const prerender = false`
  - Handler `POST` ze sprawdzeniem autentykacji (`locals.user`)
  - Parsowanie i walidacja body przez `createFlashcardSchema`
  - Inicjalizacja `FlashcardService`
  - Wywołanie `createFlashcard()`
  - Zwrot 201 z `CreateFlashcardResponse`
  - Obsługa błędów (400, 401, 500)
