import type { FlashcardProposalViewModel } from "../types";
import { FlashcardCard, type FlashcardCardAction } from "@/components/shared/FlashcardCard";

interface FlashcardProposalCardProps {
  proposal: FlashcardProposalViewModel;
  onToggleStatus: (id: string) => void;
  onEdit: (id: string) => void;
}

export function FlashcardProposalCard({ proposal, onToggleStatus, onEdit }: FlashcardProposalCardProps) {
  const isRejected = proposal.status === "rejected";

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
      onClick: () => onEdit(proposal.id),
      ariaLabel: "Edytuj fiszkę",
      disabled: isRejected,
    },
    {
      icon: isRejected ? (
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
          <path d="M20 6 9 17l-5-5" />
        </svg>
      ) : (
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
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      ),
      onClick: () => onToggleStatus(proposal.id),
      ariaLabel: isRejected ? "Zaakceptuj fiszkę" : "Odrzuć fiszkę",
      variant: isRejected ? "outline" : "ghost",
    },
  ];

  const badge = proposal.isEdited ? (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-3 w-3"
      >
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      </svg>
      Edytowane
    </div>
  ) : undefined;

  return (
    <FlashcardCard
      front={proposal.front}
      back={proposal.back}
      actions={actions}
      badge={badge}
      className={isRejected ? "opacity-40 bg-muted/50" : ""}
    />
  );
}
