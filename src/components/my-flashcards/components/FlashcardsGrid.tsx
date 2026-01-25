import type { FlashcardDto } from "@/types";
import { FlashcardLibraryCard } from "./FlashcardLibraryCard";

interface FlashcardsGridProps {
  flashcards: FlashcardDto[];
  onEdit: (flashcard: FlashcardDto) => void;
  onDelete: (flashcard: FlashcardDto) => void;
}

export function FlashcardsGrid({ flashcards, onEdit, onDelete }: FlashcardsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {flashcards.map((flashcard) => (
        <FlashcardLibraryCard
          key={flashcard.id}
          flashcard={flashcard}
          onEdit={(id) => {
            const card = flashcards.find((f) => f.id === id);
            if (card) onEdit(card);
          }}
          onDelete={(id) => {
            const card = flashcards.find((f) => f.id === id);
            if (card) onDelete(card);
          }}
        />
      ))}
    </div>
  );
}
