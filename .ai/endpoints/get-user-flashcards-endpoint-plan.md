# API Endpoint Implementation Plan: Get User's Flashcards

## 1. Przegląd punktu końcowego

Endpoint służy do pobierania paginowanej listy flashcards należących do zalogowanego użytkownika. Flashcards są sortowane od najnowszych (created_at DESC) i zwracane wraz z metadanymi paginacji.

**Główne funkcje**:

- Pobieranie flashcards użytkownika z paginacją
- Sortowanie po dacie utworzenia (najnowsze pierwsze)
- Walidacja parametrów paginacji (page >= 1, limit 1-100)
- RLS enforcement - użytkownik widzi tylko swoje flashcards

## 2. Szczegóły żądania

- **Metoda HTTP**: GET
- **Struktura URL**: `/api/flashcards?page={page}&limit={limit}`
- **Content-Type**: application/json
- **Autentykacja**: Wymagana (Supabase Auth via middleware)

### Parametry żądania:

**Query Parameters** (wszystkie opcjonalne):

- `page` (number, opcjonalne, default: 1, min: 1) - numer strony
- `limit` (number, opcjonalne, default: 20, min: 1, max: 100) - liczba elementów na stronę

## 3. Wykorzystywane typy

**Query Model**:

- `GetFlashcardsQuery` - model query parameters (page, limit)

**Response DTOs**:

- `GetFlashcardsResponse` - główna odpowiedź (flashcards + pagination)
- `FlashcardDto` - model pojedynczego flashcarda (bez user_id i generation_id)
- `PaginationDto` - metadane paginacji (current_page, total_pages, total_items, limit)

**Entity Types** (do operacji bazodanowych):

- `FlashcardEntity` - typ tabeli flashcards

Wszystkie typy już istnieją w `src/types.ts`.

## 4. Szczegóły odpowiedzi

### Sukces (200 OK):

```json
{
  "flashcards": [
    {
      "id": "uuid",
      "front": "string",
      "back": "string",
      "source": "ai_generated" | "ai_edited" | "user_created",
      "created_at": "ISO 8601 timestamp",
      "updated_at": "ISO 8601 timestamp"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_items": 100,
    "limit": 20
  }
}
```

### Błędy:

- **400 Bad Request**: niepoprawne parametry paginacji (page < 1, limit < 1 lub > 100)
- **401 Unauthorized**: brak autentykacji użytkownika
- **500 Internal Server Error**: błąd serwera lub bazy danych

## 5. Przepływ danych

1. **Walidacja wejścia** (Zod schema):
   - Parsowanie query parameters (page, limit)
   - Walidacja page >= 1
   - Walidacja limit >= 1 i <= 100
   - Ustawienie wartości domyślnych (page=1, limit=20)

2. **Autentykacja i autoryzacja**:
   - Pobranie user_id z Supabase auth (context.locals.supabase)
   - Sprawdzenie czy użytkownik jest zalogowany

3. **Pobranie flashcards** (via Service):
   - Wywołanie `getUserFlashcards(user_id, page, limit)` z FlashcardService
   - Obliczenie offset = (page - 1) \* limit
   - Query do bazy:
     - Filtrowanie po user_id (RLS enforcement)
     - Sortowanie po created_at DESC
     - Limit i offset dla paginacji
   - Pobranie total_items (count) dla metadanych paginacji

4. **Przygotowanie odpowiedzi**:
   - Obliczenie total_pages = ceil(total_items / limit)
   - Mapowanie flashcards na FlashcardDto (bez user_id i generation_id)
   - Utworzenie PaginationDto
   - Zwrócenie GetFlashcardsResponse

## 6. Względy bezpieczeństwa

### Autentykacja:

- Wymóg zalogowanego użytkownika (sprawdzenie w middleware lub na początku endpointu)
- Użycie Supabase Auth do pobrania user_id z sesji

### Autoryzacja:

- RLS (Row Level Security) w Supabase - użytkownik widzi tylko swoje flashcards
- Automatyczne filtrowanie po user_id przez RLS policy

### Walidacja danych:

- Zod schema do walidacji query parameters
- Walidacja page >= 1 (ochrona przed nieprawidłowymi wartościami)
- Walidacja limit w zakresie 1-100 (ochrona przed DoS przez zbyt duże limity)

### Zabezpieczenia bazodanowe:

- Użycie prepared statements przez Supabase SDK (automatyczne zabezpieczenie przed SQL injection)
- RLS policy na tabeli flashcards (automatyczne filtrowanie po user_id)

## 7. Obsługa błędów

### 401 Unauthorized:

- Brak user_id w context.locals (użytkownik niezalogowany)
- Komunikat: "Wymagana autentykacja"

### 400 Bad Request:

- **Niepoprawna wartość page**: page < 1
  - Komunikat: "Numer strony musi być większy lub równy 1"
- **Niepoprawna wartość limit**: limit < 1 lub limit > 100
  - Komunikat: "Limit musi być w zakresie od 1 do 100"
- **Niepoprawny typ**: page lub limit nie są liczbami
  - Komunikat: zwracany przez Zod (szczegółowe informacje o błędach walidacji)

### 500 Internal Server Error:

- Błąd komunikacji z bazą danych
- Nieprzewidziany błąd serwera
- Komunikat: "Błąd serwera" (szczegóły tylko w logach serwera)

### Strategia obsługi:

- Użycie try-catch w endpoint handlerze
- Zwracanie spójnych JSON error responses (via helper z api-responses.ts)
- Logowanie błędów 500 do konsoli serwera
- Walidacja Zod zwraca szczegółowe komunikaty o błędach

## 8. Rozważania dotyczące wydajności

### Strategie optymalizacji:

- **Indeksy bazodanowe**:
  - Index na flashcards.user_id (do filtrowania po użytkowniku)
  - Index na flashcards.created_at (do sortowania)
  - Composite index (user_id, created_at DESC) dla optymalnej wydajności
- **Limit maksymalny**: 100 elementów na stronę (ochrona przed przeciążeniem)
- **Efektywne zapytanie**: jedno zapytanie do bazy z count i select
- **RLS caching**: Supabase cache'uje RLS policies dla lepszej wydajności

### Potencjalne wąskie gardła:

- Duża liczba flashcards użytkownika (rozwiązane przez paginację)
- Brak indeksów na created_at (należy dodać w migracji)

## 9. Etapy wdrożenia

### Krok 1: Przygotowanie Zod schema

- Utworzenie schema walidacji w `src/lib/schemas/get-flashcards.schema.ts`
- Walidacja page (opcjonalne, number, >= 1, default 1)
- Walidacja limit (opcjonalne, number, >= 1, <= 100, default 20)

### Krok 2: Rozszerzenie FlashcardService

- Dodanie metody `getUserFlashcards(user_id, page, limit)` w `src/lib/services/flashcard.service.ts`
- Implementacja:
  - Obliczenie offset = (page - 1) \* limit
  - Query do bazy: select z filtrowaniem (user_id), sortowaniem (created_at DESC), limit i offset
  - Pobranie total_items (count)
  - Obliczenie total_pages = ceil(total_items / limit)
  - Zwrócenie flashcards i metadanych paginacji

### Krok 3: Implementacja endpointa

- Utworzenie pliku `src/pages/api/flashcards/get-user-flashcards.ts`
- Dodanie `export const prerender = false`
- Implementacja handlera GET:
  - Parsowanie i walidacja query parameters (Zod)
  - Wywołanie metody Service
  - Obsługa błędów i zwracanie odpowiedzi
- Użycie helperów z `api-responses.ts` do zwracania odpowiedzi

### Krok 4: Obsługa błędów

- Implementacja try-catch dla każdego typu błędu
- Mapowanie błędów Service na odpowiednie kody HTTP
- Użycie error response helpers
- Logowanie błędów serwera

### Krok 5: Code review i linting

- Uruchomienie lintera
- Naprawa błędów lintingu
