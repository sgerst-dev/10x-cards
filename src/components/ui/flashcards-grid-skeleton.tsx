import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface FlashcardsGridSkeletonProps {
  count?: number;
  showHeader?: boolean;
}

/**
 * Uniwersalny skeleton loader dla siatki fiszek.
 * Używany w widokach: Generator Fiszek i Moje Fiszki.
 */
export function FlashcardsGridSkeleton({ count = 6, showHeader = false }: FlashcardsGridSkeletonProps) {
  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-64" />
        </div>
      )}
      <div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        role="list"
        aria-label="Ładowanie fiszek"
        aria-busy="true"
      >
        {Array.from({ length: count }).map((_, index) => (
          <Card key={index} className="flex h-full flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-5 w-full" />
                </div>
                <div className="flex gap-1">
                  <Skeleton className="h-9 w-9" />
                  <Skeleton className="h-9 w-9" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-4 pt-0">
              <div className="space-y-2">
                <Skeleton className="h-4 w-12" />
                <div className="space-y-2 rounded-md bg-muted/50 p-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-12" />
                <div className="space-y-2 rounded-md bg-muted/50 p-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
