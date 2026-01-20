import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { FlashcardProposalViewModel } from "../types";

interface FlashcardProposalCardProps {
  proposal: FlashcardProposalViewModel;
  onToggleStatus: (id: string) => void;
  onEdit: (id: string) => void;
}

export function FlashcardProposalCard({ proposal, onToggleStatus, onEdit }: FlashcardProposalCardProps) {
  const isRejected = proposal.status === "rejected";

  return (
    <Card className={`transition-all ${isRejected ? "opacity-40 bg-muted/50" : "hover:shadow-md"}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-1">
            <h3 className="text-sm font-medium text-muted-foreground">Przód</h3>
            <p className="text-base font-semibold">{proposal.front}</p>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(proposal.id)}
              disabled={isRejected}
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
              variant={isRejected ? "outline" : "ghost"}
              size="icon"
              onClick={() => onToggleStatus(proposal.id)}
              aria-label={isRejected ? "Zaakceptuj fiszkę" : "Odrzuć fiszkę"}
            >
              {isRejected ? (
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
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-muted-foreground">Tył</h3>
          <p className="text-sm">{proposal.back}</p>
        </div>
        {proposal.isEdited && (
          <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
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
        )}
      </CardContent>
    </Card>
  );
}
