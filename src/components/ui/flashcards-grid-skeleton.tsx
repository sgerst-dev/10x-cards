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
          <Card key={index}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  {/* Front text - pytanie (może być wieloliniowe) */}
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-4/5 mt-1" />
                </div>
                <div className="flex gap-1">
                  <Skeleton className="h-9 w-9 rounded-md" />
                  <Skeleton className="h-9 w-9 rounded-md" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {/* Back text - odpowiedź (może być wieloliniowa) */}
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12 mt-1" />
              <Skeleton className="h-4 w-3/4 mt-1" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
