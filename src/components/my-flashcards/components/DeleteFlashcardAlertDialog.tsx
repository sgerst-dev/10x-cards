import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { FlashcardDto } from "@/types";

interface DeleteFlashcardAlertDialogProps {
  isOpen: boolean;
  flashcard: FlashcardDto | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export function DeleteFlashcardAlertDialog({
  isOpen,
  flashcard,
  onClose,
  onConfirm,
  isDeleting,
}: DeleteFlashcardAlertDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Czy na pewno chcesz usunąć tę fiszkę?</AlertDialogTitle>
          <AlertDialogDescription>
            Ta operacja jest nieodwracalna. Fiszka zostanie trwale usunięta z Twojej kolekcji.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {flashcard && (
          <div className="my-4 space-y-3 rounded-lg border bg-muted/50 p-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Przód</p>
              <p className="text-sm font-semibold">{flashcard.front}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Tył</p>
              <p className="text-sm">{flashcard.back}</p>
            </div>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Anuluj</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Usuwanie..." : "Usuń"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
