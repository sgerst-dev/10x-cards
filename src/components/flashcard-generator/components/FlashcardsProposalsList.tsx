import type { FlashcardProposalViewModel } from "../types";
import { FlashcardProposalCard } from "./FlashcardProposalCard";

interface FlashcardsProposalsListProps {
  proposals: FlashcardProposalViewModel[];
  onStatusChange: (id: string) => void;
  onEdit: (id: string) => void;
}

export function FlashcardsProposalsList({ proposals, onStatusChange, onEdit }: FlashcardsProposalsListProps) {
  if (proposals.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Wygenerowane propozycje fiszek({proposals.length})</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list" aria-label="Lista propozycji fiszek">
        {proposals.map((proposal) => (
          <FlashcardProposalCard
            key={proposal.id}
            proposal={proposal}
            onToggleStatus={onStatusChange}
            onEdit={onEdit}
          />
        ))}
      </div>
    </div>
  );
}
