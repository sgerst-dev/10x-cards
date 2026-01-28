import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FlashcardForm } from "./FlashcardForm";
import type { FlashcardDto } from "@/types";
import type { FlashcardFormData } from "../types";

interface FlashcardFormDialogProps {
  isOpen: boolean;
  flashcard: FlashcardDto | null;
  onClose: () => void;
  onSave: (data: FlashcardFormData) => Promise<void>;
  isSubmitting: boolean;
}

export function FlashcardFormDialog({ isOpen, flashcard, onClose, onSave, isSubmitting }: FlashcardFormDialogProps) {
  const isEditing = !!flashcard;

  const handleSave = async (data: FlashcardFormData) => {
    await onSave(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edytuj fiszkę" : "Dodaj nową fiszkę"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Wprowadź zmiany w treści fiszki. Kliknij Zapisz, aby zatwierdzić."
              : "Wypełnij pola poniżej, aby utworzyć nową fiszkę. Oba pola są wymagane."}
          </DialogDescription>
        </DialogHeader>
        <FlashcardForm
          initialData={
            flashcard
              ? {
                  front: flashcard.front,
                  back: flashcard.back,
                }
              : undefined
          }
          onSubmit={handleSave}
          onCancel={onClose}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}
