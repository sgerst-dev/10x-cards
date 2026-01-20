# Plan implementacji widoku Generatora Fiszek

## 1. Przegląd

Widok ten (dostępny na stronie głównej) umożliwia użytkownikom generowanie propozycji fiszek na podstawie wprowadzonego tekstu przy użyciu modelu LLM. Użytkownik przechodzi przez proces wprowadzania tekstu, generowania, przeglądu (akceptacja/odrzucenie/edycja) oraz zapisu wybranych fiszek do bazy danych.

## 2. Routing widoku

- **Ścieżka:** `/` (Strona główna - `src/pages/index.astro`)
- **Kontekst:** Komponent będzie osadzony jako "React Island" (`client:load`) wewnątrz statycznego layoutu Astro.

## 3. Struktura komponentów

Widok zostanie zbudowany w oparciu o główny kontener zarządzający stanem oraz mniejsze komponenty prezentacyjne.

```text
src/components/flashcard-generator/
├── FlashcardGenerator.tsx (Główny kontener / Smart Component)
├── components/
│   ├── GenerationInput.tsx (Formularz tekstowy z walidacją)
│   ├── ProposalsList.tsx (Lista wygenerowanych fiszek)
│   ├── ProposalCard.tsx (Pojedyncza karta z akcjami)
│   ├── EditProposalDialog.tsx (Modal edycji fiszki)
│   └── SaveActions.tsx (Podsumowanie i przycisk zapisu)
└── hooks/
    └── useFlashcardGenerator.ts (Logika biznesowa i stan)
```

## 4. Szczegóły komponentów

### `FlashcardGenerator` (Główny Kontener)

- **Opis:** Koordynuje cały proces. Zarządza stanem (tekst, propozycje, loading, błędy) i przekazuje dane do komponentów potomnych.
- **Główne elementy:** Wrapper `div` z layoutem (np. flex-col).
- **Interakcje:** Agreguje zdarzenia z dzieci (`onGenerate`, `onSave`, `onUpdateProposal`, etc.).
- **Typy:** Brak propsów wejściowych (chyba że początkowe dane).

### `GenerationInput`

- **Opis:** Pole tekstowe do wprowadzenia notatek.
- **Główne elementy:** `Textarea` (shadcn), `Button` (Generuj), licznik znaków, wyświetlanie błędów walidacji.
- **Obsługiwane interakcje:** Zmiana tekstu, kliknięcie "Generuj".
- **Obsługiwana walidacja:**
  - Długość tekstu: 1000 - 10000 znaków.
  - Wyświetlanie błędu, jeśli tekst jest poza zakresem.
  - Blokada przycisku podczas ładowania (`isLoading`).
- **Propsy:** `value: string`, `onChange: (val: string) => void`, `onGenerate: () => void`, `isLoading: boolean`.

### `ProposalsList`

- **Opis:** Kontener wyświetlający listę kart.
- **Główne elementy:** Grid lub Flex list (responsywny).
- **Propsy:** `proposals: FlashcardProposalViewModel[]`, `onStatusChange`, `onEdit`.

### `ProposalCard`

- **Opis:** Wyświetla przód i tył fiszki oraz przyciski akcji.
- **Główne elementy:** `Card` (shadcn), przyciski (Check/X/Edit lub Toggle).
- **Obsługiwane interakcje:**
  - Przełączenie statusu (Zaakceptuj/Odrzuć).
  - Otwarcie dialogu edycji.
- **Styl:** Karta wyszarzona/przezroczysta, jeśli status = 'rejected'.
- **Propsy:** `proposal: FlashcardProposalViewModel`, `onToggleStatus: (id: string) => void`, `onEdit: (id: string) => void`.

### `EditProposalDialog`

- **Opis:** Modal pozwalający edytować treść fiszki.
- **Główne elementy:** `Dialog` (shadcn), 2x `Input` lub `Textarea` (Front, Back).
- **Obsługiwana walidacja:**
  - Front: max 250 znaków, wymagane.
  - Back: max 500 znaków, wymagane.
- **Propsy:** `isOpen: boolean`, `proposal: FlashcardProposalViewModel`, `onSave: (id: string, front: string, back: string) => void`, `onClose: () => void`.

### `SaveActions`

- **Opis:** Pasek dolny (lub sekcja) z podsumowaniem i głównym przyciskiem zapisu.
- **Główne elementy:** Tekst "Wybrano X z Y", `Button` (Zapisz).
- **Logika:** Przycisk nieaktywny (disabled), jeśli liczba zaakceptowanych fiszek == 0.
- **Propsy:** `totalCount: number`, `acceptedCount: number`, `onSave: () => void`, `isSaving: boolean`.

## 5. Typy

Wykorzystamy istniejące typy z `src/types.ts` oraz rozszerzymy je na potrzeby widoku.

```typescript
// Import z src/types.ts
import type { GenerateFlashcardsProposalsCommand, SaveGeneratedFlashcardsCommand, FlashcardSource } from "@/types";

// ViewModel dla pojedynczej propozycji (stan lokalny)
export interface FlashcardProposalViewModel {
  id: string; // UUID generowane na frontendzie (do kluczy React i identyfikacji)
  front: string;
  back: string;
  status: "accepted" | "rejected";
  isEdited: boolean; // Flaga potrzebna do ustawienia source: 'ai_edited'
}

// Stan hooka
export interface FlashcardsGeneratorState {
  inputText: string;
  generationId: string | null; // ID sesji generowania zwrócone z API
  proposals: FlashcardProposalViewModel[];
  isGenerating: boolean;
  isSaving: boolean;
  error: string | null;
}
```

## 6. Zarządzanie stanem

Rekomendowane użycie custom hooka `useFlashcardGenerator`:

- **Stan:** `useState` lub `useReducer` (dla bardziej złożonej logiki aktualizacji listy).
- **Akcje:**
  - `generateProposals(text)`: Wywołuje API, przetwarza odpowiedź (dodaje ID, ustawia domyślny status).
  - `toggleProposalStatus(id)`: Zmienia status 'accepted' <-> 'rejected'.
  - `updateProposal(id, newFront, newBack)`: Aktualizuje treść i ustawia flagę `isEdited = true`.
  - `saveSelected()`: Filtruje zaakceptowane, mapuje na format API, wysyła żądanie.

## 7. Integracja API

### 1. Generowanie propozycji

- **Endpoint:** `POST /api/flashcards/generate-proposals`
- **Body:** `{ source_text: string }`
- **Typ odpowiedzi:** `GenerateFlashcardsProposalsResponse`
- **Obsługa:** Po sukcesie, zapisz `generation_id` i zmapuj `flashcards_proposals` na `FlashcardProposalViewModel[]`.

### 2. Zapisywanie fiszek

- **Endpoint:** `POST /api/flashcards/save-generated-flashcards`
- **Body:** `SaveGeneratedFlashcardsCommand`
  ```typescript
  {
    generation_id: string;
    flashcards: Array<{
      front: string;
      back: string;
      source: "ai_generated" | "ai_edited"; // Ustawiane na podstawie flagi isEdited
    }>;
  }
  ```
- **Obsługa:** Po sukcesie wyświetl Toast i wyczyść stan (lub przekieruj do listy fiszek).

## 8. Interakcje użytkownika

1. **Wprowadzenie tekstu:** Użytkownik wpisuje/wkleja tekst. Walidacja na żywo (licznik znaków).
2. **Generowanie:** Kliknięcie "Generuj". Spinner ładowania. Blokada edycji tekstu.
3. **Wyświetlenie wyników:** Lista kart pojawia się pod formularzem.
4. **Odrzucanie:** Kliknięcie "Odrzuć" (ikona X) wyszarza kartę.
5. **Edycja:** Kliknięcie "Edytuj" otwiera modal. Zmiana treści aktualizuje kartę w widoku.
6. **Zapis:** Kliknięcie "Zapisz wybrane". Jeśli sukces -> komunikat i reset widoku.

## 9. Warunki i walidacja

| Obszar         | Warunek                  | Efekt w UI                                           |
| -------------- | ------------------------ | ---------------------------------------------------- |
| Input Tekstowy | < 1000 znaków            | Przycisk "Generuj" zablokowany, komunikat błędu/info |
| Input Tekstowy | > 10000 znaków           | Przycisk "Generuj" zablokowany, czerwony licznik     |
| Edycja Front   | Pusty lub > 250 znaków   | Blokada zapisu w modalu, error message               |
| Edycja Back    | Pusty lub > 500 znaków   | Blokada zapisu w modalu, error message               |
| Zapis Globalny | 0 zaakceptowanych fiszek | Przycisk "Zapisz" zablokowany (disabled)             |

## 10. Obsługa błędów

- **API Generowania (4xx/5xx):** Wyświetlenie `Alert` (shadcn) nad listą. Przycisk "Generuj" odblokowuje się.
- **API Zapisu (4xx/5xx):** Toast z błędem ("Nie udało się zapisać fiszek"). Stan nie jest czyszczony, aby użytkownik nie stracił pracy.
- **Błędy walidacji:** Wyświetlane inline pod polami formularzy.

## 11. Kroki implementacji

1.  **Przygotowanie typów:** Utwórz plik z typami ViewModel lub dodaj je w komponencie.
2.  **Mock UI:** Zbuduj statyczny widok z przykładowymi danymi (Input + Lista Kart), używając komponentów Shadcn UI.
3.  **Implementacja Inputu:** Dodaj walidację długości tekstu i stan formularza.
4.  **Integracja API Generowania:**
    - Utwórz funkcję fetchującą do `/api/flashcards/generate-proposals`.
    - Podepnij pod przycisk "Generuj".
    - Obsłuż mapowanie odpowiedzi na ViewModel (dodanie UUID).
5.  **Zarządzanie listą (Interakcje):**
    - Zaimplementuj usuwanie/odrzucanie (zmiana stanu).
    - Zaimplementuj modal edycji i aktualizację stanu pojedynczej fiszki.
6.  **Integracja API Zapisu:**
    - Implementacja logiki zbierającej dane (filtrowanie `accepted`, mapowanie `source`).
    - Utwórz funkcję fetchującą do `/api/flashcards/save-generated-flashcards`.
7.  **UX & Polish:**
    - Dodaj Toasty (sukces/błąd).
    - Dodaj stany loading - Skeleton na liście i spinner na przycisku generate.
