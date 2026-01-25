import type { FlashcardDto, PaginationDto } from "@/types";

/**
 * Stan dialogu (dodawanie/edycja fiszki)
 */
export interface DialogState {
  type: "none" | "add" | "edit";
  flashcard: FlashcardDto | null;
}

/**
 * Główny stan biblioteki fiszek
 */
export interface FlashcardLibraryState {
  flashcards: FlashcardDto[];
  pagination: PaginationDto | null;
  isLoading: boolean;
  error: string | null;
  dialogState: DialogState;
  flashcardToDelete: FlashcardDto | null;
  isDeleting: boolean;
  isSaving: boolean;
}

/**
 * Dane formularza fiszki
 */
export interface FlashcardFormData {
  front: string;
  back: string;
}

/**
 * Błędy walidacji formularza
 */
export interface FlashcardFormErrors {
  front?: string;
  back?: string;
}
