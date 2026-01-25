import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Bot, User } from "lucide-react";
import type { FlashcardDto, FlashcardSource } from "@/types";

interface FlashcardLibraryCardProps {
  flashcard: FlashcardDto;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const sourceLabels: Record<FlashcardSource, string> = {
  ai_generated: "AI Generated",
  ai_edited: "AI Edited",
  user_created: "User Created",
};

const getSourceIcon = (source: FlashcardSource) => {
  // AI-generated or AI-edited flashcards get Robot icon
  if (source === "ai_generated" || source === "ai_edited") {
    return <Bot className="h-4 w-4" />;
  }
  // User-created flashcards get Person icon
  return <User className="h-4 w-4" />;
};

export function FlashcardLibraryCard({ flashcard, onEdit, onDelete }: FlashcardLibraryCardProps) {
  return (
    <Card className="flex h-full flex-col transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center text-muted-foreground">
                {getSourceIcon(flashcard.source)}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{sourceLabels[flashcard.source]}</p>
            </TooltipContent>
          </Tooltip>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(flashcard.id)}
              aria-label="Edytuj fiszkę"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(flashcard.id)}
              aria-label="Usuń fiszkę"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 pt-0">
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-muted-foreground">Przód</h3>
          <div className="max-h-24 overflow-y-auto rounded-md bg-muted/50 p-3">
            <p className="text-sm font-semibold">{flashcard.front}</p>
          </div>
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-muted-foreground">Tył</h3>
          <div className="max-h-24 overflow-y-auto rounded-md bg-muted/50 p-3">
            <p className="text-sm">{flashcard.back}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
