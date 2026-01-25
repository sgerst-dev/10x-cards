import { Alert, AlertDescription } from "@/components/ui/alert";
import { useFlashcardLibrary } from "./hooks/useFlashcardLibrary";
import { LibraryHeader } from "./components/LibraryHeader";
import { EmptyState } from "./components/EmptyState";
import { FlashcardsGrid } from "./components/FlashcardsGrid";
import { PaginationControls } from "./components/PaginationControls";
import { FlashcardFormDialog } from "./components/FlashcardFormDialog";
import { DeleteFlashcardAlertDialog } from "./components/DeleteFlashcardAlertDialog";
import type { FlashcardFormData } from "./types";

export function MyFlashcardsLibrary() {
  const {
    flashcards,
    pagination,
    isLoading,
    error,
    dialogState,
    flashcardToDelete,
    isDeleting,
    isSaving,
    openAddDialog,
    openEditDialog,
    closeDialog,
    openDeleteDialog,
    closeDeleteDialog,
    createFlashcard,
    updateFlashcard,
    deleteFlashcard,
    changePage,
  } = useFlashcardLibrary();

  const handleSaveFlashcard = async (data: FlashcardFormData) => {
    if (dialogState.type === "edit" && dialogState.flashcard) {
      await updateFlashcard(dialogState.flashcard.id, data);
    } else {
      await createFlashcard(data);
    }
  };

  const handleDeleteFlashcard = async () => {
    if (flashcardToDelete) {
      await deleteFlashcard(flashcardToDelete.id);
    }
  };

  return (
    <div className="container mx-auto max-w-7xl space-y-8 py-8">
      <LibraryHeader onAddClick={openAddDialog} />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {flashcards.length === 0 && !isLoading ? (
        <EmptyState onAddClick={openAddDialog} />
      ) : (
        <>
          <FlashcardsGrid flashcards={flashcards} onEdit={openEditDialog} onDelete={openDeleteDialog} />

          {pagination && pagination.total_pages > 1 && (
            <PaginationControls pagination={pagination} onPageChange={changePage} />
          )}
        </>
      )}

      <FlashcardFormDialog
        isOpen={dialogState.type !== "none"}
        flashcard={dialogState.flashcard}
        onClose={closeDialog}
        onSave={handleSaveFlashcard}
        isSubmitting={isSaving}
      />

      <DeleteFlashcardAlertDialog
        isOpen={!!flashcardToDelete}
        flashcard={flashcardToDelete}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteFlashcard}
        isDeleting={isDeleting}
      />
    </div>
  );
}
