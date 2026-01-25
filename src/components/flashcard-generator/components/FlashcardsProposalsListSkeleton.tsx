import { FlashcardsGridSkeleton } from "@/components/ui/flashcards-grid-skeleton";

interface FlashcardsProposalsListSkeletonProps {
  count?: number;
}

export function FlashcardsProposalsListSkeleton({ count = 9 }: FlashcardsProposalsListSkeletonProps) {
  return <FlashcardsGridSkeleton count={count} showHeader={true} />;
}
