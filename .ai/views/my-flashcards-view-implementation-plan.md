# Plan implementacji widoku Moje Fiszki

## 1. Przegląd

Widok paginowanej biblioteki fiszek z możliwością przeglądania, dodawania, edycji i usuwania. Każda fiszka wyświetla treść przodu/tyłu oraz badge źródła (AI Generated, AI Edited, User Created). Obsługa stanu pustego z zachętą do działania.

**Routing:** `/my-flashcards` (`src/pages/my-flashcards.astro`)

## 2. Struktura komponentów

```
MyFlashcardsPage (Astro)
└── MyFlashcardsLibrary (React) - główny kontener z hookiem useFlashcardLibrary
    ├── LibraryHeader - nagłówek + przycisk "Dodaj fiszkę"
    ├── EmptyState - stan pusty (warunkowo)
    ├── FlashcardsGrid - siatka kart (warunkowo)
    │   └── FlashcardLibraryCard - karta z badge źródła + akcje (Edit, Delete)
    ├── PaginationControls - numeryczna paginacja
    ├── FlashcardFormDialog - dialog dodawania/edycji
    │   └── FlashcardForm - formularz z walidacją
    └── DeleteFlashcardAlertDialog - potwierdzenie usunięcia
```

## 3. Komponenty - Propsy i Odpowiedzialności

### MyFlashcardsLibrary

**Propsy:** Brak (komponent główny)
**Odpowiedzialność:** Orkiestracja widoku, zarządzanie stanem przez hook `useFlashcardLibrary`, komunikacja z API

### LibraryHeader

**Propsy:** `onAddClick: () => void`
**Elementy:** `h1`, `p`, `Button` "Dodaj fiszkę"

### EmptyState

**Propsy:** `onAddClick: () => void`
**Elementy:** Ikona, nagłówek, opis, przyciski "Generuj fiszki" (link `/`) i "Dodaj ręcznie"

### FlashcardsGrid

**Propsy:** `flashcards: FlashcardDto[]`, `onEdit`, `onDelete`
**Layout:** CSS Grid responsive (1/2/3 kolumny)

### FlashcardLibraryCard

**Propsy:** `flashcard: FlashcardDto`, `onEdit`, `onDelete`
**Elementy:** `Card` z `Badge` źródła, sekcje Przód/Tył (max-height + scroll), przyciski Edit/Delete

### PaginationControls

**Propsy:** `pagination: PaginationDto`, `onPageChange: (page: number) => void`
**Elementy:** Przyciski Poprzednia/Następna (disabled na granicach), numery stron (max 5 + ellipsis)

### FlashcardFormDialog

**Propsy:** `isOpen: boolean`, `flashcard: FlashcardDto | null`, `onClose`, `onSave`
**Elementy:** `Dialog` z `FlashcardForm`, tytuł dynamiczny (Dodaj/Edytuj), przyciski Anuluj/Zapisz

### FlashcardForm

**Propsy:** `initialData?: {front, back}`, `onSubmit`, `isSubmitting: boolean`
**Walidacja:**

- Przód: wymagane, 1-250 znaków (po trim)
- Tył: wymagane, 1-500 znaków (po trim)
  **Elementy:** 2x `Textarea` z licznikami znaków i komunikatami błędów

### DeleteFlashcardAlertDialog

**Propsy:** `isOpen: boolean`, `flashcard: FlashcardDto | null`, `onClose`, `onConfirm`, `isDeleting: boolean`
**Elementy:** `AlertDialog` (Shadcn/ui) z ostrzeżeniem o trwałości, podglądem fiszki, przyciski Anuluj/Usuń

## 4. Typy

### Istniejące (z `src/types.ts`)

`FlashcardDto`, `PaginationDto`, `GetFlashcardsResponse`, `CreateFlashcardCommand`, `CreateFlashcardResponse`, `UpdateFlashcardCommand`, `UpdateFlashcardResponse`, `FlashcardSource`

### Nowe ViewModel

**FlashcardLibraryState:**
`flashcards: FlashcardDto[]`, `pagination: PaginationDto | null`, `isLoading: boolean`, `error: string | null`, `dialogState: DialogState`, `flashcardToDelete: FlashcardDto | null`, `isDeleting: boolean`, `isSaving: boolean`

**DialogState:**
`type: 'none' | 'add' | 'edit'`, `flashcard: FlashcardDto | null`

**FlashcardFormData:**
`front: string`, `back: string`

**FlashcardFormErrors:**
`front?: string`, `back?: string`

## 5. Zarządzanie stanem

### Custom Hook: `useFlashcardLibrary`

- Pobieranie fiszek (GET /api/flashcards) przy renderze i zmianie strony
- Paginacja z synchronizacją URL query params
- Zarządzanie dialogami (dodawanie, edycja, usuwanie)
- Operacje CRUD: POST, PUT, DELETE z optymistycznymi aktualizacjami UI
- Obsługa błędów i komunikaty toast
- Rollback przy błędach

### Stan lokalny

- **FlashcardForm:** pola formularza, błędy walidacji, touched fields
- **PaginationControls, FlashcardLibraryCard:** brak (fully controlled/prezentacyjne)

## 6. Integracja API

### GET /api/flashcards?page={page}&limit={limit}

**Request:** `GetFlashcardsQuery` (page: 1, limit: 20 domyślnie)
**Response:** `GetFlashcardsResponse` (flashcards, pagination)
**Wywołanie:** Przy renderze i zmianie strony
**Błędy:** 401 → redirect, 400 → Alert, 500 → Alert

### POST /api/flashcards

**Request:** `CreateFlashcardCommand` (front: 1-250, back: 1-500 znaków)
**Response:** `CreateFlashcardResponse` (FlashcardDto)
**Sukces:** Dodanie do listy, zamknięcie dialogu, toast, aktualizacja paginacji
**Błędy:** 400 → błędy w formularzu, 401 → redirect, 500 → toast

### PUT /api/flashcards/{id}

**Request:** `UpdateFlashcardCommand` (front: 1-250, back: 1-500 znaków)
**Response:** `UpdateFlashcardResponse` (FlashcardSlimDto)
**Sukces:** Merge w liście, zamknięcie dialogu, toast
**Błędy:** 400 → błędy w formularzu, 404 → toast + usunięcie z listy, 401 → redirect, 500 → toast

### DELETE /api/flashcards/delete-flashcard?id={id}

**Request:** Query param `id` (UUID)
**Response:** 200 bez body
**Sukces:** Usunięcie z listy, zamknięcie dialogu, toast, aktualizacja paginacji, przejście do poprzedniej strony jeśli usunięto ostatnią na stronie > 1
**Błędy:** 404 → toast + usunięcie z listy, 401 → redirect, 500 → toast

## 7. Interakcje użytkownika

### Przeglądanie listy

Wejście na `/my-flashcards` → GET request → skeleton loader → grid fiszek lub EmptyState → paginacja (jeśli total_pages > 1)

### Nawigacja paginacji

Klik przycisku → aktualizacja URL `?page={new_page}` → GET request → skeleton loader → aktualizacja listy → scroll do góry

### Dodawanie fiszki

Klik "Dodaj fiszkę" → dialog z pustym formularzem → wypełnienie pól → walidacja onChange → klik "Zapisz" → POST request → sukces: zamknięcie, toast, dodanie do listy

### Edycja fiszki

Klik ikony edycji → dialog z wypełnionym formularzem → modyfikacja → walidacja → klik "Zapisz" → PUT request → sukces: zamknięcie, toast, aktualizacja w liście

### Usuwanie fiszki

Klik ikony usunięcia → AlertDialog z podglądem → klik "Usuń" → DELETE request → sukces: zamknięcie, toast, usunięcie z listy, przejście do poprzedniej strony (jeśli usunięto ostatnią na stronie > 1)

### Anulowanie

Klik "Anuluj"/X/Escape/overlay → zamknięcie dialogu → reset formularza → brak wywołań API

## 8. Warunki i walidacja

### Walidacja formularza

**Przód:** wymagane (trim >= 1), max 250 znaków → błąd: "Tekst na przedniej stronie fiszki jest wymagany/przekracza maksymalną długość 250 znaków" → przycisk "Zapisz" disabled, licznik czerwony
**Tył:** wymagane (trim >= 1), max 500 znaków → błąd: "Tekst na tylnej stronie fiszki jest wymagany/przekracza maksymalną długość 500 znaków" → przycisk "Zapisz" disabled, licznik czerwony
**Timing:** onChange i onBlur, wyświetlanie po touched

### Warunki wyświetlania

- **EmptyState:** `flashcards.length === 0 && !isLoading`
- **FlashcardsGrid:** `flashcards.length > 0`
- **PaginationControls:** `pagination.total_pages > 1`
- **Skeleton Loader:** `isLoading === true`
- **Przycisk "Poprzednia":** disabled gdy `current_page === 1`
- **Przycisk "Następna":** disabled gdy `current_page === total_pages`

### Warunki API

- **Autentykacja:** Middleware sprawdza `locals.user` → redirect do `/auth/login`
- **Własność fiszki:** Backend weryfikuje `user_id` → 404 jeśli nie należy do użytkownika
- **Parametry paginacji:** page >= 1, limit 1-100 (Zod schema) → 400 Bad Request

## 9. Obsługa błędów

### Błędy API

**GET:**

- 401 → redirect `/auth/login?redirect=/my-flashcards`
- 400 → Alert + reset do page=1
- 500 → Alert "Nie udało się pobrać fiszek"
- Network → Alert "Brak połączenia"

**POST:**

- 400 → błędy walidacji w formularzu
- 401 → redirect do logowania
- 500 → toast "Nie udało się dodać fiszki"

**PUT:**

- 400 → błędy walidacji w formularzu
- 404 → toast "Fiszka nie została znaleziona" + usunięcie z listy + zamknięcie dialogu
- 401 → redirect do logowania
- 500 → toast "Nie udało się zaktualizować fiszki"

**DELETE:**

- 404 → toast "Fiszka została już usunięta" + usunięcie z listy + zamknięcie dialogu
- 401 → redirect do logowania
- 500 → toast "Nie udało się usunąć fiszki"

### Przypadki brzegowe

- **Pusta lista:** EmptyState z zachętą
- **Usunięcie ostatniej na stronie > 1:** przejście do poprzedniej strony
- **Długie teksty:** max-height + scroll + gradient fade
- **Wolne połączenie:** skeleton loaders, timeout 30s
- **Równoczesna edycja/usunięcie:** 404 → usunięcie z listy + toast
- **Błąd parsowania JSON:** try-catch → ogólny komunikat błędu

## 10. Kroki implementacji

1. **Przygotowanie:** Typy ViewModel, struktura katalogów, dodanie AlertDialog (Shadcn/ui)

2. **Hook `useFlashcardLibrary`:** Pobieranie fiszek, zarządzanie dialogami, CRUD, synchronizacja URL, obsługa błędów

3. **Komponenty prezentacyjne:** LibraryHeader, EmptyState, FlashcardLibraryCard (z badge źródła), FlashcardsGrid, PaginationControls

4. **Formularz:** FlashcardForm z walidacją (Zod/manualna), liczniki znaków, błędy walidacji

5. **Dialogi:** FlashcardFormDialog (dodawanie/edycja), DeleteFlashcardAlertDialog, obsługa stanów ładowania

6. **Główny komponent:** MyFlashcardsLibrary - integracja podkomponentów, hook, skeleton loaders, Alert błędów

7. **Strona Astro:** `src/pages/my-flashcards.astro`, Layout, osadzenie komponentu (`client:load`), meta tagi

8. **Stylowanie:** Responsywna siatka (1/2/3 kolumny), karty z max-height + scroll, badge'y źródła (kolory), paginacja, dark mode

9. **Finalizacja:** Optymalizacja (memoizacja), skeleton loaders, animacje (opcjonalnie), dostępność (ARIA, keyboard), refaktoryzacja, dokumentacja (JSDoc)

10. **Modyfikacja navbar:** Dodanie odnośnika do strony do navbara ('Moje fiszki')
