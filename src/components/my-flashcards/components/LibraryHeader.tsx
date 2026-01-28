import { Button } from "@/components/ui/button";

interface LibraryHeaderProps {
  onAddClick: () => void;
}

export function LibraryHeader({ onAddClick }: LibraryHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-4">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Moje Fiszki</h1>
        <p className="text-muted-foreground">Przeglądaj, edytuj i zarządzaj swoją kolekcją fiszek</p>
      </div>
      <Button onClick={onAddClick} data-testid="add-flashcard-button">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-2 h-4 w-4"
        >
          <path d="M5 12h14" />
          <path d="M12 5v14" />
        </svg>
        Dodaj fiszkę
      </Button>
    </header>
  );
}
