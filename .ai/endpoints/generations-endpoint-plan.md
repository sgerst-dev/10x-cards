# API Endpoint Implementation Plan: Generowanie propozycji fiszek

## 1. Przegląd endpointa

- **Cel**: Z udokumentowanego tekstu (1000-10000 znaków) wygenerować wstępne propozycje fiszek z pomocą LLM, zapisując jedynie sesję generowania (hash źródła, statystyki) i zwracając propozycje w trybie „preview”.
- **Zakres**: Endpoint nie zapisuje fiszek ani propozycji w bazie (jest to jedynie podgląd), ale musi rejestrować `generation_session` i błędy w tabelach zgodnych z zasadami RLS oraz obsługiwać integrację z OpenRouter.ai.

## 2. Szczegóły żądania

- **Metoda HTTP**: `POST`
- **Ścieżka**: `/api/flashcards/generate-proposals`
- **Parametry**:
  - Wymagane:
    - `source_text` (ciąg 1000-10000 znaków, UTF-8) – treść źródłowa do przesłania do modelu.
  - Opcjonalne: brak dodatkowych parametrów w specyfikacji.
- **Body**: JSON o strukturze zgodnej z `GenerateFlashcardsProposalsCommand`.
- **Wykorzystywane typy wejściowe**:
  - `GenerateFlashcardsProposalsCommand` – walidowane schematem Zod z `.min(1000)` i `.max(10000)` oraz sanityzacją długości.
  - Hashowanie tekstu do `source_text_hash` w `generation_sessions` (użycie `GenerationSessionEntity` do odczytu typów kolumn).

## 3. Szczegóły odpowiedzi

- **Kody statusu**:
- - 200 OK – powodzenie z propozycjami (`GenerateFlashcardsProposalsResponse`).
- - 400 Bad Request – walidacja długości tekstu lub brak tokenu.
- - 401 Unauthorized – brak autoryzacji Supabase.
- - 409 Conflict – identyczne zapytanie tego samego użytkownika wygenerowano w ciągu ostatniej godziny.
- - 429 Too Many Requests – przekroczenie limitu OpenRouter.
- - 502 Bad Gateway – niepowodzenie OpenRouter (zalogowane w `generation_errors`).
- - 500 Internal Server Error – niespodziewany błąd backendu (zalogowane w `generation_errors`).
- **Struktura odpowiedzi**: `generation_id`, `generated_count` oraz tablica `flashcards_proposals` zawierająca `front`, `back`, `source = "ai_generated"`, zgodna z `GenerateFlashcardsProposalsResponse` i `FlashcardProposalDto`.
- **Wykorzystywane typy wyjściowe**: `GenerateFlashcardsProposalsResponse`, `FlashcardProposalDto`, `GenerationSessionEntity` dla `generation_id` oraz `generated_count`.

## 4. Przepływ danych

1. Middleware Astro zapewnia `context.locals.supabase` z sesją oceny tokena i identyfikatorem użytkownika (wymagane RLS).
2. API waliduje dane wejściowe schematem Zod (`GenerateFlashcardsProposalsCommand`) i przetwarza długość tekstu.
3. Przygotowanie hash SHA-256 dla `source_text` (np. `crypto.createHash`) oraz obliczenie długości (`source_text_length`), które będą użyte przy zapisie i deduplikacji.
4. Weryfikacja duplikatu: zapytanie do `generation_sessions` szukające wpisu z tym samym `user_id`, `source_text_hash`, utworzonego w ciągu ostatniej godziny. Jeśli rekord istnieje, zwrócić `409 Conflict` z informacją o ograniczeniu.
5. Wstawienie rekordu `generation_sessions` z `user_id`, `model` (np. `openrouter/{modelName}` z env), `source_text_hash`, `source_text_length`, wstępnie `generated_count = 0` (zaktualizowane po otrzymaniu odpowiedzi).
6. Wywołanie OpenRouter.ai z kluczem API (env) i przekazanie `source_text`, odebranie surowych propozycji (parsowanie front/back, weryfikacja długości).
7. Aktualizacja `generation_sessions.generated_count` na podstawie liczby zaakceptowanych propozycji w serwisie.
8. Zwrócenie danych do klienta bez zapisu fiszek; propozycje pochodzą z `FlashcardProposalDto`.
9. W przypadku błędu OpenRouter wpis do `generation_errors` z kodem i wiadomością (uwzględniając `user_id`, `model`, `source_text_hash`, `source_text_length`) i przekazanie odpowiedniego kodu statusu.

## 5. Względy bezpieczeństwa

- Wymuszona autoryzacja Supabase (401 przy braku sesji). Upewnić się, że `context.locals.supabase.auth.getSession()` lub kompatybilna funkcja zwraca `user.id`.
- Stosowanie RLS: wszystkie insert/insert do `generation_sessions` i `generation_errors` wykonane przez Supabase z `user_id` ze sprawdzonego tokena.

-## 6. Obsługa błędów

- **400**: walidacja Zod wykrywa `source_text` o niewłaściwej długości lub brak `source_text`; odpowiedź zawiera info o walidacji.
- **401**: brak poprawnej sesji Supabase (żądanie nie autoryzowane); blokujemy dostęp do bazy.
- **409**: identyczne zapytanie tego samego użytkownika wygenerowano w ciągu ostatniej godziny; endpoint oddaje komunikat o ograniczeniu.
- **429**: OpenRouter zgłasza limit; przekazujemy dalej ten kod i opis, rejestrując incydent w `generation_errors`.
- **502**: OpenRouter zwraca błąd serwera; dodatkowo tworzymy wpis w `generation_errors` z `error_code` i `error_message`.
- Każdy zapis błędu AI powinien zawierać `model`, `source_text_hash`, `source_text_length` oraz `generated_count` (jeśli było). Pozwala to wykrywać duplikaty i analizy.

## 7. Rozważania dotyczące wydajności

- Przy dużym ruchu rozważyć deduplikację hashów (możliwość cache’owania sesji i odsyłania wcześniej wygenerowanych propozycji dla tego samego `source_text_hash`).

## 8. Kroki implementacji

1. Ustalić konfigurację: dodać env `OPEN_ROUTER_API_KEY`, `OPEN_ROUTER_MODEL`, udokumentować w `.env.example` i `src/env.d.ts`.
2. Stworzyć schemat Zod (`src/lib/schemas/generate_flashcards_proposals.ts`) do walidacji `GenerateFlashcardsProposalsCommand`.
3. Napisać serwis (np. `src/lib/services/flashcard-generation-service.ts`), który:
   - sprawdza w bazie `generation_sessions` dla `user_id` i `source_text_hash`, czy nie ma wpisu z ostatniej godziny; w przypadku duplikatu zwraca dedykowany `409 Conflict`
   - tworzy hash źródła i zapisuje `generation_sessions`,
   - wykonuje request do OpenRouter (z timeoutem 30s bez retry). Na aktualnym etapie zamiast wołania OpenRouter niech zwraca mock odpowiedzi,
   - mapuje odpowiedź do `FlashcardProposalDto`,
   - aktualizuje `generated_count`,
   - loguje błędy w `generation_errors`, gdy takie wystąpią podczas generowania (z `model`, `source_text_hash`, `source_text_length`).
4. Zaimplementować endpoint w `src/pages/api/flashcards/generate-proposals.ts`, korzystając z `context.locals.supabase`:
   - pobrać `user`, zwalidować (401 w przeciwnym razie),
   - wywołać serwis `flashcard-generation-service.ts` z `source_text`,
   - zwrócić `GenerateFlashcardsProposalsResponse`.
