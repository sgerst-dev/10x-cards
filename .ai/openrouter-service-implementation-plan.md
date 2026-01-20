# Plan implementacji usługi OpenRouterService

Ten dokument zawiera szczegółowy plan wdrożenia usługi `OpenRouterService`, przeznaczonej do interakcji z API OpenRouter. Usługa ta umożliwi korzystanie z modeli LLM (np. Llama, GPT, Claude) w celu generowania treści, ze szczególnym uwzględnieniem ustrukturyzowanych danych JSON.

## 1. Opis usługi

`OpenRouterService` to centralny punkt komunikacji z API OpenRouter w architekturze backendowej aplikacji. Usługa ma na celu izolację logiki wywołań API, zarządzanie nagłówkami specyficznymi dla OpenRouter oraz zapewnienie mechanizmu gwarantującego otrzymanie odpowiedzi w formacie JSON zgodnym ze zdefiniowanym schematem.

## 2. Publiczne metody i pola

### Metoda `chatCompletion<T>`

Podstawowa metoda do komunikacji z modelami.

- **Argumenty:** Obiekt `ChatCompletionParams` zawierający:
  - `messages`: Tablica komunikatów (system, user, assistant).
  - `response_format`: Opcjonalny schemat JSON.
  - `model`: Nazwa modelu.
  - `temperature`, `max_tokens`, `top_p`: Parametry kontrolujące generowanie.
- **Zwraca:** `Promise<T | string>` – obiekt typu `T` (jeśli użyto `response_format`) lub czysty tekst.

### Zalecany Komunikat Systemowy (System Prompt)

Aby uzyskać najlepsze rezultaty w generowaniu fiszek, należy użyć poniższego komunikatu systemowego:

```markdown
Jesteś ekspertem w dziedzinie edukacji i twórcą profesjonalnych materiałów dydaktycznych, specjalizującym się w technice aktywnego przypominania (Active Recall).

Twoim zadaniem jest analiza tekstu źródłowego i przekształcenie go w zestaw wysokiej jakości fiszek.

### Zasady tworzenia fiszek:

1. Zasada atomowości: Każda fiszka musi dotyczyć tylko jednej, konkretnej informacji.
2. Precyzja i klarowność: Formułuj pytania (front) w sposób jednoznaczny. Odpowiedzi (back) powinny być krótkie i konkretne.
3. Kontekst: Jeśli termin jest specyficzny dla danej dziedziny, uwzględnij to w pytaniu.
4. Język: Używaj tego samego języka, w którym napisany jest tekst źródłowy.
5. Brak zbędnych treści: Nie dodawaj wstępów. Zwracaj wyłącznie dane zgodne ze schematem JSON.
```

### Przykład konfiguracji elementów zapytania:

1.  **Komunikat systemowy (System Message):** Wykorzystaj powyższy tekst z `role: 'system'`.
2.  **Komunikat użytkownika (User Message):**
    ```typescript
    { role: 'user', content: `Wygeneruj fiszki na podstawie poniższego tekstu:\n\n${source_text}` }
    ```
3.  **Ustrukturyzowana odpowiedź (Structured Output):**
    Wykorzystanie `response_format` zgodnie ze wzorem OpenRouter
4.  **Nazwa modelu:**.
5.  **Parametry modelu:** `temperature`, `max_tokens`.

## 3. Obsługa błędów

Usługa musi identyfikować i reagować na następujące scenariusze:

1.  **Błąd Konfiguracji (400/Missing Env):** Brak klucza API lub niepoprawne parametry początkowe.
2.  **Błąd Autoryzacji (401):** Nieprawidłowy lub wygasły klucz API.
3.  **Przekroczenie Limitów / Brak Środków (429/402):** Zbyt duża częstotliwość zapytań lub brak kredytów na koncie OpenRouter.
4.  **Błąd Modelu (500/503):** Problemy po stronie dostawcy modelu lub OpenRouter.
5.  **Błąd Parsowania JSON:** Odpowiedź modelu nie jest poprawnym formatem JSON (nawet przy `strict: true` warto mieć ten bezpiecznik).
6.  **Błąd Walidacji Schematu:** Odpowiedź jest poprawnym JSONem, ale nie spełnia wymagań `json_schema`.

## 4. Kwestie bezpieczeństwa

- **Izolacja Kluczy:** Klucze API OpenRouter muszą być dostępne wyłącznie w środowisku serwerowym. Nie mogą trafić do bundle'a frontendowego.
- **Limity Kosztów:** Zawsze ustawiaj `max_tokens`, aby zapobiec nadmiarowemu zużyciu środków przy błędnych pętlach modelu.
- **Walidacja Danych:** Wyniki z LLM powinny być traktowane jako dane niezaufane i walidowane (np. przez Zod) przed zapisem do bazy danych.

## 5. Plan wdrożenia krok po kroku

### Krok 1: Przygotowanie środowiska

- Dodaj `OPENROUTER_API_KEY` do pliku `.env`.
- Zainstaluj opcjonalne zależności do walidacji JSON (np. `zod`), jeśli nie są jeszcze obecne.

### Krok 2: Implementacja klas błędów

Stwórz dedykowane klasy błędów dziedziczące po `Error`, aby ułatwić debugowanie.

### Krok 3: Budowa szkieletu usługi

Stwórz plik `src/lib/services/openrouter.service.ts`. Zaimplementuj konstruktor i mechanizm pobierania nagłówków.

### Krok 4: Implementacja logiki wysyłania żądań

- Użyj natywnego `fetch` (zgodnie ze stackiem Astro).
- Zaimplementuj metodę `chatCompletion`.
- Dodaj obsługę przekazywania `response_format`.

### Krok 5: Parsowanie i walidacja odpowiedzi

- Zaimplementuj logikę wyciągania treści z odpowiedzi API (`choices[0].message.content`).
- Jeśli żądano formatu JSON, dodaj `JSON.parse` z obsługą błędów.

### Krok 6: Integracja z usługami dziedzinowymi

- Zaktualizuj `FlashcardGenerationService`, aby korzystał z `OpenRouterService` zamiast danych mockowych.
