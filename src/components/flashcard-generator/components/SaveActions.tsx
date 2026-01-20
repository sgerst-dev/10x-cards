import { Button } from "@/components/ui/button";

interface SaveActionsProps {
  totalCount: number;
  acceptedCount: number;
  onSave: () => void;
  isSaving: boolean;
}

export function SaveActions({ totalCount, acceptedCount, onSave, isSaving }: SaveActionsProps) {
  if (totalCount === 0) {
    return null;
  }

  return (
    <div className="sticky bottom-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex items-center justify-between gap-4 py-4">
        <div className="text-sm">
          <span className="font-medium">Wybrane fiszki:</span>{" "}
          <span className="text-muted-foreground">
            {acceptedCount} z {totalCount}
          </span>
        </div>
        <Button onClick={onSave} disabled={acceptedCount === 0 || isSaving} size="lg">
          {isSaving ? "Zapisywanie..." : `Zapisz wybrane (${acceptedCount})`}
        </Button>
      </div>
    </div>
  );
}
