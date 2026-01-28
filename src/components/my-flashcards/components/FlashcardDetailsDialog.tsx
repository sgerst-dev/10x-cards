import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Bot, User } from "lucide-react";
import type { FlashcardDto, FlashcardSource } from "@/types";

interface FlashcardDetailsDialogProps {
  flashcard: FlashcardDto | null;
  isOpen: boolean;
  onClose: () => void;
}

const sourceLabels: Record<FlashcardSource, string> = {
  ai_generated: "AI Generated",
  ai_edited: "AI Edited",
  user_created: "User Created",
};

const getSourceIcon = (source: FlashcardSource) => {
  if (source === "ai_generated" || source === "ai_edited") {
    return <Bot className="h-4 w-4" />;
  }
  return <User className="h-4 w-4" />;
};

export function FlashcardDetailsDialog({ flashcard, isOpen, onClose }: FlashcardDetailsDialogProps) {
  if (!flashcard) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Szczegóły fiszki
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center text-muted-foreground">{getSourceIcon(flashcard.source)}</div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{sourceLabels[flashcard.source]}</p>
              </TooltipContent>
            </Tooltip>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Przód</h3>
            <div className="rounded-md bg-muted/50 p-4">
              <p className="whitespace-pre-wrap text-sm font-semibold">{flashcard.front}</p>
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Tył</h3>
            <div className="rounded-md bg-muted/50 p-4">
              <p className="whitespace-pre-wrap text-sm">{flashcard.back}</p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Utworzono:{" "}
            {new Date(flashcard.created_at).toLocaleDateString("pl-PL", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
