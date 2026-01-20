import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { FlashcardProposalViewModel } from "../types";

interface EditFlashcardProposalDialogProps {
  isOpen: boolean;
  proposal: FlashcardProposalViewModel | null;
  onSave: (id: string, front: string, back: string) => void;
  onClose: () => void;
}

const MAX_FRONT_LENGTH = 250;
const MAX_BACK_LENGTH = 500;

export function EditFlashcardProposalDialog({ isOpen, proposal, onSave, onClose }: EditFlashcardProposalDialogProps) {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [errors, setErrors] = useState({ front: "", back: "" });

  useEffect(() => {
    if (proposal) {
      setFront(proposal.front);
      setBack(proposal.back);
      setErrors({ front: "", back: "" });
    }
  }, [proposal]);

  const validateFront = (value: string) => {
    if (!value.trim()) {
      return "Pole przód jest wymagane";
    }
    if (value.length > MAX_FRONT_LENGTH) {
      return `Maksymalna długość to ${MAX_FRONT_LENGTH} znaków`;
    }
    return "";
  };

  const validateBack = (value: string) => {
    if (!value.trim()) {
      return "Pole tył jest wymagane";
    }
    if (value.length > MAX_BACK_LENGTH) {
      return `Maksymalna długość to ${MAX_BACK_LENGTH} znaków`;
    }
    return "";
  };

  const handleFrontChange = (value: string) => {
    setFront(value);
    const error = validateFront(value);
    setErrors((prev) => ({ ...prev, front: error }));
  };

  const handleBackChange = (value: string) => {
    setBack(value);
    const error = validateBack(value);
    setErrors((prev) => ({ ...prev, back: error }));
  };

  const handleSave = () => {
    const frontError = validateFront(front);
    const backError = validateBack(back);

    if (frontError || backError) {
      setErrors({ front: frontError, back: backError });
      return;
    }

    if (proposal) {
      onSave(proposal.id, front, back);
      onClose();
    }
  };

  if (!proposal) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Edytuj fiszkę</DialogTitle>
          <DialogDescription>
            Wprowadź zmiany w treści fiszki. Kliknij zapisz, aby zaakceptować zmiany.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="edit-front" className="text-sm font-medium">
                Przód
              </label>
              <span className={`text-xs ${front.length > MAX_FRONT_LENGTH ? "text-red-600" : "text-muted-foreground"}`}>
                {front.length} / {MAX_FRONT_LENGTH}
              </span>
            </div>
            <Textarea
              id="edit-front"
              value={front}
              onChange={(e) => handleFrontChange(e.target.value)}
              className="resize-none"
              rows={3}
              aria-describedby={errors.front ? "front-error" : undefined}
              aria-invalid={!!errors.front}
            />
            {errors.front && (
              <p id="front-error" className="text-sm text-red-600">
                {errors.front}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="edit-back" className="text-sm font-medium">
                Tył
              </label>
              <span className={`text-xs ${back.length > MAX_BACK_LENGTH ? "text-red-600" : "text-muted-foreground"}`}>
                {back.length} / {MAX_BACK_LENGTH}
              </span>
            </div>
            <Textarea
              id="edit-back"
              value={back}
              onChange={(e) => handleBackChange(e.target.value)}
              className="resize-none"
              rows={4}
              aria-describedby={errors.back ? "back-error" : undefined}
              aria-invalid={!!errors.back}
            />
            {errors.back && (
              <p id="back-error" className="text-sm text-red-600">
                {errors.back}
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Anuluj
          </Button>
          <Button onClick={handleSave}>Zapisz zmiany</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
