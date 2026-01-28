import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type { FlashcardLibraryState, FlashcardFormData } from "../types";
import type {
  FlashcardDto,
  GetFlashcardsResponse,
  CreateFlashcardCommand,
  CreateFlashcardResponse,
  UpdateFlashcardCommand,
  UpdateFlashcardResponse,
} from "@/types";

interface UseFlashcardLibraryReturn extends FlashcardLibraryState {
  openAddDialog: () => void;
  openEditDialog: (flashcard: FlashcardDto) => void;
  closeDialog: () => void;
  openDeleteDialog: (flashcard: FlashcardDto) => void;
  closeDeleteDialog: () => void;
  createFlashcard: (data: FlashcardFormData) => Promise<void>;
  updateFlashcard: (id: string, data: FlashcardFormData) => Promise<void>;
  deleteFlashcard: (id: string) => Promise<void>;
  changePage: (page: number) => void;
  changeItemsPerPage: (limit: number) => void;
  itemsPerPage: number;
}

const initialState: FlashcardLibraryState = {
  flashcards: [],
  pagination: null,
  isLoading: false,
  error: null,
  dialogState: { type: "none", flashcard: null },
  flashcardToDelete: null,
  isDeleting: false,
  isSaving: false,
};

const ALLOWED_PAGE_SIZES = [15, 30, 45, 60];
const DEFAULT_PAGE_SIZE = 15;

function validateAndGetPageSize(limitParam: string | null): number {
  if (!limitParam) return DEFAULT_PAGE_SIZE;
  const limit = parseInt(limitParam, 10);
  if (isNaN(limit) || !ALLOWED_PAGE_SIZES.includes(limit)) {
    return DEFAULT_PAGE_SIZE;
  }
  return limit;
}

function validateAndGetPage(pageParam: string | null): number {
  if (!pageParam) return 1;
  const page = parseInt(pageParam, 10);
  if (isNaN(page) || page < 1) {
    return 1;
  }
  return page;
}

export function useFlashcardLibrary(): UseFlashcardLibraryReturn {
  const [state, setState] = useState<FlashcardLibraryState>(initialState);
  const [currentPage, setCurrentPage] = useState(() => {
    // Initialize page from URL on mount with validation
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      const pageParam = url.searchParams.get("page");
      return validateAndGetPage(pageParam);
    }
    return 1;
  });
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    // Initialize items per page from URL on mount with validation
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      const limitParam = url.searchParams.get("limit");
      return validateAndGetPageSize(limitParam);
    }
    return DEFAULT_PAGE_SIZE;
  });

  // Validate and fix URL parameters on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      const pageParam = url.searchParams.get("page");
      const limitParam = url.searchParams.get("limit");

      const validatedPage = validateAndGetPage(pageParam);
      const validatedLimit = validateAndGetPageSize(limitParam);

      // Check if URL parameters are invalid and need correction
      const needsPageCorrection = pageParam !== null && validatedPage.toString() !== pageParam;
      const needsLimitCorrection = limitParam !== null && validatedLimit.toString() !== limitParam;

      if (needsPageCorrection || needsLimitCorrection) {
        // Redirect to corrected URL
        url.searchParams.set("page", validatedPage.toString());
        url.searchParams.set("limit", validatedLimit.toString());
        window.location.href = url.toString();
      }
    }
  }, []);

  // Fetch flashcards
  useEffect(() => {
    let isCancelled = false;

    const fetchFlashcards = async () => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch(`/api/flashcards/get-user-flashcards?page=${currentPage}&limit=${itemsPerPage}`);

        if (isCancelled) return;

        if (response.status === 401) {
          window.location.href = `/auth/login?redirect=/my-flashcards`;
          return;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        const data: GetFlashcardsResponse = await response.json();

        if (isCancelled) return;

        // Check if current page exceeds total pages
        if (data.pagination.current_page > data.pagination.total_pages && data.pagination.total_pages > 0) {
          // Redirect to last valid page
          const url = new URL(window.location.href);
          url.searchParams.set("page", data.pagination.total_pages.toString());
          window.location.href = url.toString();
          return;
        }

        setState((prev) => ({
          ...prev,
          flashcards: data.flashcards,
          pagination: data.pagination,
          isLoading: false,
        }));
      } catch (error) {
        if (isCancelled) return;

        const errorMessage = error instanceof Error ? error.message : "Nie udało się pobrać fiszek. Spróbuj ponownie.";
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
      }
    };

    fetchFlashcards();

    return () => {
      isCancelled = true;
    };
  }, [currentPage, itemsPerPage]);

  // Dialog management
  const openAddDialog = useCallback(() => {
    setState((prev) => ({
      ...prev,
      dialogState: { type: "add", flashcard: null },
    }));
  }, []);

  const openEditDialog = useCallback((flashcard: FlashcardDto) => {
    setState((prev) => ({
      ...prev,
      dialogState: { type: "edit", flashcard },
    }));
  }, []);

  const closeDialog = useCallback(() => {
    setState((prev) => ({
      ...prev,
      dialogState: { type: "none", flashcard: null },
    }));
  }, []);

  const openDeleteDialog = useCallback((flashcard: FlashcardDto) => {
    setState((prev) => ({
      ...prev,
      flashcardToDelete: flashcard,
    }));
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setState((prev) => ({
      ...prev,
      flashcardToDelete: null,
    }));
  }, []);

  // Create flashcard
  const createFlashcard = useCallback(async (data: FlashcardFormData) => {
    setState((prev) => ({ ...prev, isSaving: true, error: null }));

    try {
      const command: CreateFlashcardCommand = {
        front: data.front.trim(),
        back: data.back.trim(),
      };

      const response = await fetch("/api/flashcards/create-flashcard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      if (response.status === 401) {
        window.location.href = `/auth/login?redirect=/my-flashcards`;
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const newFlashcard: CreateFlashcardResponse = await response.json();

      // Add to list
      setState((prev) => ({
        ...prev,
        flashcards: [newFlashcard, ...prev.flashcards],
        isSaving: false,
        dialogState: { type: "none", flashcard: null },
        pagination: prev.pagination
          ? {
              ...prev.pagination,
              total_items: prev.pagination.total_items + 1,
            }
          : null,
      }));

      toast.success("Fiszka została dodana pomyślnie!");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Nie udało się dodać fiszki. Spróbuj ponownie.";
      setState((prev) => ({
        ...prev,
        isSaving: false,
      }));
      toast.error("Nie udało się dodać fiszki", {
        description: errorMessage,
      });
      throw error;
    }
  }, []);

  // Update flashcard
  const updateFlashcard = useCallback(async (id: string, data: FlashcardFormData) => {
    setState((prev) => ({ ...prev, isSaving: true, error: null }));

    try {
      const command: UpdateFlashcardCommand = {
        front: data.front.trim(),
        back: data.back.trim(),
      };

      const response = await fetch(`/api/flashcards/update-flashcard?id=${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      if (response.status === 401) {
        window.location.href = `/auth/login?redirect=/my-flashcards`;
        return;
      }

      if (response.status === 404) {
        // Remove from list
        setState((prev) => ({
          ...prev,
          flashcards: prev.flashcards.filter((f) => f.id !== id),
          isSaving: false,
          dialogState: { type: "none", flashcard: null },
        }));
        toast.error("Fiszka nie została znaleziona");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const updatedFlashcard: UpdateFlashcardResponse = await response.json();

      // Update in list
      setState((prev) => ({
        ...prev,
        flashcards: prev.flashcards.map((f) =>
          f.id === id
            ? {
                ...f,
                front: updatedFlashcard.front,
                back: updatedFlashcard.back,
                source: updatedFlashcard.source,
              }
            : f
        ),
        isSaving: false,
        dialogState: { type: "none", flashcard: null },
      }));

      toast.success("Fiszka została zaktualizowana pomyślnie!");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Nie udało się zaktualizować fiszki. Spróbuj ponownie.";
      setState((prev) => ({
        ...prev,
        isSaving: false,
      }));
      toast.error("Nie udało się zaktualizować fiszki", {
        description: errorMessage,
      });
      throw error;
    }
  }, []);

  // Delete flashcard
  const deleteFlashcard = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, isDeleting: true }));

    try {
      const response = await fetch(`/api/flashcards/delete-flashcard?id=${id}`, {
        method: "DELETE",
      });

      if (response.status === 401) {
        window.location.href = `/auth/login?redirect=/my-flashcards`;
        return;
      }

      if (response.status === 404) {
        // Remove from list anyway
        setState((prev) => ({
          ...prev,
          flashcards: prev.flashcards.filter((f) => f.id !== id),
          isDeleting: false,
          flashcardToDelete: null,
        }));
        toast.error("Fiszka została już usunięta");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Remove from list
      setState((prev) => {
        const newFlashcards = prev.flashcards.filter((f) => f.id !== id);
        const newTotalItems = prev.pagination ? prev.pagination.total_items - 1 : 0;

        // Check if we need to go to previous page
        const shouldGoToPrevPage = newFlashcards.length === 0 && prev.pagination && prev.pagination.current_page > 1;

        if (shouldGoToPrevPage) {
          setCurrentPage((p) => p - 1);
          // Handle possible null pagination for type safety
          const prevPage =
            prev.pagination && typeof prev.pagination.current_page === "number"
              ? Math.max(1, prev.pagination.current_page - 1)
              : 1;
          const url = new URL(window.location.href);
          url.searchParams.set("page", String(prevPage));
          window.history.pushState({}, "", url);
        }

        return {
          ...prev,
          flashcards: newFlashcards,
          isDeleting: false,
          flashcardToDelete: null,
          pagination: prev.pagination
            ? {
                ...prev.pagination,
                total_items: newTotalItems,
              }
            : null,
        };
      });

      toast.success("Fiszka została usunięta pomyślnie!");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Nie udało się usunąć fiszki. Spróbuj ponownie.";
      setState((prev) => ({
        ...prev,
        isDeleting: false,
      }));
      toast.error("Nie udało się usunąć fiszki", {
        description: errorMessage,
      });
      throw error;
    }
  }, []);

  // Change page
  const changePage = useCallback((page: number) => {
    setCurrentPage(page);
    const url = new URL(window.location.href);
    url.searchParams.set("page", String(page));
    window.history.pushState({}, "", url);
  }, []);

  // Change items per page
  const changeItemsPerPage = useCallback((limit: number) => {
    setItemsPerPage(limit);
    setCurrentPage(1); // Reset to first page when changing items per page
    const url = new URL(window.location.href);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("page", "1");
    window.history.pushState({}, "", url);
  }, []);

  return {
    ...state,
    openAddDialog,
    openEditDialog,
    closeDialog,
    openDeleteDialog,
    closeDeleteDialog,
    createFlashcard,
    updateFlashcard,
    deleteFlashcard,
    changePage,
    changeItemsPerPage,
    itemsPerPage,
  };
}
