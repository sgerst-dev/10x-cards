# Cache dla generowania fiszek

## Przegląd

System cache'uje wygenerowane propozycje fiszek w bazie danych, aby dla identycznego tekstu źródłowego zwracać te same fiszki bez ponownego wywoływania modelu AI. To rozwiązanie znacząco redukuje:
- Koszty wywołań API do OpenRouter
- Czas odpowiedzi dla użytkownika
- Obciążenie systemu

## Implementacja

### 1. Zmiany w bazie danych

**Migracja**: `20260125100000_add_generated_proposals.sql`

Dodano:
- Kolumnę `generated_proposals` (JSONB) w tabeli `generation_sessions` do przechowywania wygenerowanych propozycji
- Indeks `idx_generation_sessions_user_hash` na `(user_id, source_text_hash)` dla szybkiego wyszukiwania cache
- Kolumnę `generation_id` w tabeli `generation_errors` dla lepszego śledzenia błędów

### 2. Zmiany w serwisie

**Plik**: `src/lib/services/flashcard-generation.service.ts`

Przepływ działania:

1. **Obliczenie hash**: SHA-256 z tekstu źródłowego (`source_text`)
2. **Sprawdzenie cache**: Wyszukanie w `generation_sessions` wpisu dla:
   - `user_id` = ID aktualnego użytkownika
   - `source_text_hash` = obliczony hash
   - `generated_proposals IS NOT NULL` = cache istnieje
3. **Zwrócenie z cache**: Jeśli znaleziono, zwróć zapisane propozycje
4. **Generowanie nowych**: Jeśli brak cache:
   - Utwórz nową sesję w `generation_sessions`
   - Wywołaj OpenRouter AI
   - Zapisz propozycje w `generated_proposals`
   - Zwróć wygenerowane propozycje

### 3. Struktura danych cache

Kolumna `generated_proposals` przechowuje tablicę JSON z obiektami:

```json
[
  {
    "front": "Pytanie na fiszce",
    "back": "Odpowiedź na fiszce",
    "source": "ai_generated"
  }
]
```

## Korzyści

1. **Oszczędność kosztów**: Identyczne zapytania nie generują dodatkowych kosztów API
2. **Szybsza odpowiedź**: Cache zwraca wyniki natychmiast, bez oczekiwania na AI
3. **Spójność**: Ten sam tekst zawsze generuje te same fiszki dla danego użytkownika
4. **Audyt**: Pełna historia generowania jest zachowana w bazie danych

## Zachowanie użytkownika

- Użytkownik wkleja ten sam tekst co wcześniej → otrzymuje identyczne fiszki
- Użytkownik zmienia nawet jeden znak w tekście → generowane są nowe fiszki
- Cache jest per-użytkownik: dwóch użytkowników może mieć różne fiszki dla tego samego tekstu

## Uwagi techniczne

- Hash SHA-256 zapewnia unikalność przy minimalnym ryzyku kolizji
- Indeks bazy danych zapewnia O(log n) czas wyszukiwania
- JSONB w PostgreSQL pozwala na efektywne przechowywanie i odczyt strukturalnych danych
- Brak automatycznego czyszczenia cache (można dodać w przyszłości TTL)
