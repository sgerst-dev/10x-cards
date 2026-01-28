import { Card, CardContent } from "@/components/ui/card";

export function EmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 rounded-full bg-muted p-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-10 w-10 text-muted-foreground"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M7 7h10" />
            <path d="M7 12h10" />
            <path d="M7 17h10" />
          </svg>
        </div>
        <h2 className="mb-2 text-xl font-semibold">Brak fiszek</h2>
        <p className="mb-6 max-w-md text-muted-foreground">
          Nie masz jeszcze żadnych fiszek. Zacznij od wygenerowania ich za pomocą generatora lub dodaj ręcznie.
        </p>
      </CardContent>
    </Card>
  );
}
