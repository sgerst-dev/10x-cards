import type { FlashcardDto } from "@/types";
import { FlashcardCard, type FlashcardCardAction } from "@/components/shared/FlashcardCard";
import { getSourceIcon, sourceLabels } from "./flashcardIconUtils";

interface FlashcardLibraryCardProps {
  flashcard: FlashcardDto;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("pl-PL", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export function FlashcardLibraryCard({ flashcard, onEdit, onDelete }: FlashcardLibraryCardProps) {
  const actions: FlashcardCardAction[] = [
    {
      icon: (
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
      ),
      onClick: () => onEdit(flashcard.id),
      ariaLabel: "Edytuj fiszkę",
    },
    {
      icon: (
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
      ),
      onClick: () => onDelete(flashcard.id),
      ariaLabel: "Usuń fiszkę",
    },
  ];

  return (
    <FlashcardCard
      front={flashcard.front}
      back={flashcard.back}
      actions={actions}
      icon={getSourceIcon(flashcard.source)}
      iconTooltip={sourceLabels[flashcard.source]}
      footer={`Utworzono: ${formatDate(flashcard.created_at)}`}
    />
  );
}
