# API Endpoint Implementation Plan: Save Generated Flashcards

## 1. Przegląd punktu końcowego

Endpoint służy do zapisywania wybranych i opcjonalnie edytowanych flashcards wygenerowanych przez AI w poprzednim kroku. Użytkownik może wybrać dowolną liczbę propozycji z sesji generowania i zapisać je jako własne flashcards (z możliwością wcześniejszej edycji treści).

**Główne funkcje**:

- Zapisanie wybranych flashcards do bazy danych z referencją do generation_session
- Aktualizacja statystyk sesji generowania (accepted_count, accepted_edited_count)
- Walidacja własności sesji generowania przez użytkownika
- Walidacja spójności danych (limity znaków, poprawne źródło, constraint CHECK)

## 2. Szczegóły żądania

- **Metoda HTTP**: POST
- **Struktura URL**: `/api/flashcards/save-generated-flashcards`
- **Content-Type**: application/json
- **Autentykacja**: Wymagana (Supabase Auth via middleware)

### Parametry żądania:

**Request Body (JSON)**:

- `generation_id` (UUID, wymagane) - identyfikator sesji generowania
- `flashcards` (array, wymagane, min 1 element) - tablica flashcards do zapisania:
  - `front` (string, wymagane, max 250 chars) - przód fiszki
  - `back` (string, wymagane, max 500 chars) - tył fiszki
  - `source` (enum, wymagane) - źródło: 'ai_generated' w przypadku jeśli przód ani tył fiszki zaproponowany przez LLM nie został zmodyfikowany lub 'ai_edited' w przeciwnym wypadku

## 3. Wykorzystywane typy

**Command Model** (request body):

- `SaveGeneratedFlashcardsCommand` - główny model żądania
- `GeneratedFlashcardToSaveDto` - model pojedynczego flashcarda w tablicy

**Response DTOs**:

- `SaveGeneratedFlashcardsResponse` - główna odpowiedź
- `FlashcardDto` - model pojedynczego flashcarda w odpowiedzi (bez user_id i generation_id)

**Entity Types** (do operacji bazodanowych):

- `FlashcardEntity` - typ tabeli flashcards
- `GenerationSessionEntity` - typ tabeli generation_sessions

Wszystkie typy już istnieją w `src/types.ts`.

## 4. Szczegóły odpowiedzi

### Sukces (201 Created):

```json
{
  "flashcards": [
    {
      "id": "uuid",
      "front": "string",
      "back": "string",
      "source": "ai_generated" | "ai_edited",
      "created_at": "ISO 8601 timestamp",
      "updated_at": "ISO 8601 timestamp"
    }
  ]
}
```

### Błędy:

- **400 Bad Request**: niepoprawne dane wejściowe, naruszenie walidacji
- **401 Unauthorized**: brak autentykacji użytkownika
- **404 Not Found**: generation_session nie istnieje lub nie należy do użytkownika
- **500 Internal Server Error**: błąd serwera lub bazy danych

## 5. Przepływ danych

1. **Walidacja wejścia** (Zod schema):
   - Sprawdzenie struktury request body
   - Walidacja generation_id jako UUID
   - Walidacja tablicy flashcards (niepusta, struktura elementów)
   - Walidacja długości front (max 250) i back (max 500)
   - Walidacja source (tylko 'ai_generated' lub 'ai_edited')

2. **Autentykacja i autoryzacja**:
   - Pobranie user_id z Supabase auth (context.locals.supabase)
   - Sprawdzenie czy użytkownik jest zalogowany

3. **Weryfikacja generation_session** (via Service):
   - Sprawdzenie czy generation_session o podanym ID istnieje
   - Sprawdzenie czy generation_session należy do zalogowanego użytkownika
   - Pobranie generated_count z sesji (do walidacji constraint)

4. **Zapisanie flashcards** (transakcja bazodanowa):
   - Wstawienie wszystkich flashcards do tabeli `flashcards` z:
     - user_id (z auth)
     - generation_id (z request)
     - front, back, source (z request)
     - created_at, updated_at (automatycznie przez bazę)
   - Obliczenie accepted_count i accepted_edited_count:
     - accepted_count = liczba flashcards z source='ai_generated'
     - accepted_edited_count = liczba flashcards z source='ai_edited'

5. **Aktualizacja generation_session**:
   - Ustawienie accepted_count i accepted_edited_count w generation_session

6. **Zwrócenie odpowiedzi**:
   - Pobranie zapisanych flashcards z bazy (z id, timestamps)
   - Mapowanie na FlashcardDto (bez user_id i generation_id)
   - Zwrócenie jako SaveGeneratedFlashcardsResponse

## 6. Względy bezpieczeństwa

### Autentykacja:

- Wymóg zalogowanego użytkownika (sprawdzenie w middleware lub na początku endpointu)
- Użycie Supabase Auth do pobrania user_id z sesji

### Autoryzacja:

- Weryfikacja własności generation_session przez user_id
- Użycie RLS (Row Level Security)

### Walidacja danych:

- Zod schema do walidacji struktury i typów
- Limity długości (front 250, back 500) - ochrona przed przepełnieniem
- Walidacja enum source (tylko ai_generated/ai_edited)
- Walidacja generation_id jako UUID

### Zabezpieczenia bazodanowe:

- Użycie prepared statements przez Supabase SDK (automatyczne zabezpieczenie przed SQL injection)
- Foreign key constraint (generation_id → generation_sessions.id)
- ON DELETE RESTRICT dla generation_sessions (nie można usunąć sesji z zapisanymi flashcards)

## 7. Obsługa błędów

### 401 Unauthorized:

- Brak user_id w context.locals (użytkownik niezalogowany)
- Komunikat: "Authentication required"

### 404 Not Found:

- Generation_session o podanym ID nie istnieje
- Generation_session nie należy do zalogowanego użytkownika
- Komunikat: "Generation session not found"

### 400 Bad Request:

- **Niepoprawna struktura**: brak generation_id, pusta tablica flashcards
  - Komunikat: zwracany przez Zod (szczegółowe informacje o błędach walidacji)
- **Przekroczenie limitów**: front > 250 lub back > 500 znaków
  - Komunikat: "Front text exceeds maximum length of 250 characters" / "Back text exceeds maximum length of 500 characters"
- **Niepoprawne źródło**: source nie jest 'ai_generated' ani 'ai_edited'
  - Komunikat: zwracany przez Zod

### 500 Internal Server Error:

- Błąd komunikacji z bazą danych
- Nieprzewidziany błąd serwera
- Komunikat: "Internal server error" (szczegóły tylko w logach serwera)

### Strategia obsługi:

- Użycie try-catch w endpoint handlerze
- Zwracanie spójnych JSON error responses (via helper z api-responses.ts)
- Logowanie błędów 500 do konsoli serwera (nie do generation_errors - to tylko dla błędów AI)
- Walidacja Zod zwraca szczegółowe komunikaty o błędach

## 8. Rozważania dotyczące wydajności

### Strategie optymalizacji:

- **Bulk insert**: użycie `.insert()` z tablicą flashcards (jedno zapytanie zamiast wielu)
- **Transakcja bazodanowa**: grupowanie insert + update w jednej transakcji (atomowość i wydajność)
- **Indeksy bazodanowe**:
  - Index na generation_sessions.user_id (do weryfikacji własności)
  - Index na flashcards.generation_id (do zapytań o flashcards z sesji)
  - Index na flashcards.user_id (do zapytań o flashcards użytkownika)
- **Brak nadmiarowych zapytań**: pobranie zapisanych flashcards bezpośrednio z insert query (`.select()` po `.insert()`)

## 9. Etapy wdrożenia

### Krok 1: Przygotowanie Zod schema

- Utworzenie schema walidacji w `src/lib/schemas/save-generated-flashcards.schema.ts`
- Walidacja generation_id (UUID)
- Walidacja tablicy flashcards (min 1 element)
- Walidacja każdego flashcarda (front max 250, back max 500, source enum)

### Krok 2: Utworzenie/rozszerzenie Service

- Opcja A: rozszerzenie istniejącego `FlashcardGenerationService`
- Opcja B: utworzenie nowego `FlashcardService` w `src/lib/services/flashcard-service.ts`
- Metody do implementacji:
  - `verifyGenerationSessionOwnership(generation_id, user_id)` - weryfikacja własności sesji
  - `saveGeneratedFlashcards(generation_id, flashcards, user_id)` - zapis flashcards i aktualizacja sesji
  - Obliczanie accepted_count i accepted_edited_count
  - Walidacja constraint przed zapisem

### Krok 3: Implementacja endpointa

- Utworzenie pliku `src/pages/api/flashcards/save-generated-flashcards.ts`
- Dodanie `export const prerender = false`
- Implementacja handlera POST:
  - Aktualnie użyj id użytkownika takiego samego jak w pliku ``. Odczytywanie użytkownika z supabase zostanie zaimplementowane później.
  - Parsowanie i walidacja request body (Zod)
  - Wywołanie metod Service
  - Obsługa błędów i zwracanie odpowiedzi
- Użycie helperów z `api-responses.ts` do zwracania odpowiedzi

### Krok 4: Obsługa błędów

- Implementacja try-catch dla każdego typu błędu
- Mapowanie błędów Service na odpowiednie kody HTTP
- Użycie error response helpers
- Logowanie błędów serwera

### Krok 5: Testowanie

- Stworzenie skryptów Powershell w `src/pages/api/flashcards/tests` do serwisu pod adresem: `localhost:3000`:
  - Poprawne zapisanie flashcards
  - Brak autentykacji (401)
  - Niepoprawny generation_id (404)
  - Nie-własna generation_session (404)
  - Niepoprawne dane (400) - różne scenariusze walidacji
  - Naruszenie constraint (400)

### Krok 6: Dokumentacja

- Aktualizacja `src/pages/api/flashcards/README.md`
- Dodanie przykładów request/response
- Dokumentacja error codes i komunikatów

### Krok 7: Code review i linting

- Uruchomienie lintera
- Naprawa błędów lintingu
