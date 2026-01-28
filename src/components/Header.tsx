import { useState, useCallback, useEffect } from "react";
import { Button } from "./ui/button";
import { ThemeToggle } from "./ThemeToggle";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface HeaderProps {
  userEmail: string | null;
  currentPath?: string;
}

export function Header({ userEmail, currentPath = "/" }: HeaderProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigationUrl, setPendingNavigationUrl] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Listen for unsaved changes events from FlashcardGenerator
  useEffect(() => {
    const handleUnsavedChanges = (event: Event) => {
      const customEvent = event as CustomEvent<{ hasUnsavedChanges: boolean }>;
      setHasUnsavedChanges(customEvent.detail.hasUnsavedChanges);
    };

    window.addEventListener("unsavedChanges", handleUnsavedChanges);
    return () => window.removeEventListener("unsavedChanges", handleUnsavedChanges);
  }, []);

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      // Redirect to login page after successful logout
      window.location.href = "/auth/login";
    } catch {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut]);

  const handleNavigationClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      if (hasUnsavedChanges && currentPath !== href) {
        e.preventDefault();
        setPendingNavigationUrl(href);
        setShowUnsavedDialog(true);
      }
    },
    [hasUnsavedChanges, currentPath]
  );

  const handleConfirmNavigation = useCallback(() => {
    if (pendingNavigationUrl) {
      // Emit event to clear unsaved changes state before navigation
      const event = new CustomEvent("clearUnsavedChanges");
      window.dispatchEvent(event);

      // Small delay to ensure the event is processed
      setTimeout(() => {
        window.location.href = pendingNavigationUrl;
      }, 0);
    }
  }, [pendingNavigationUrl]);

  const handleCancelNavigation = useCallback(() => {
    setShowUnsavedDialog(false);
    setPendingNavigationUrl(null);
  }, []);

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <a
            href="/"
            onClick={(e) => handleNavigationClick(e, "/")}
            className="text-xl font-bold hover:opacity-80 transition-opacity"
          >
            10x Cards
          </a>
          {userEmail && (
            <nav className="flex items-center gap-1">
              <a
                href="/"
                onClick={(e) => handleNavigationClick(e, "/")}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                  currentPath === "/" ? "bg-accent text-accent-foreground" : ""
                }`}
                aria-current={currentPath === "/" ? "page" : undefined}
              >
                Generator fiszek
              </a>
              <a
                href="/my-flashcards"
                onClick={(e) => handleNavigationClick(e, "/my-flashcards")}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                  currentPath === "/my-flashcards" ? "bg-accent text-accent-foreground" : ""
                }`}
                aria-current={currentPath === "/my-flashcards" ? "page" : undefined}
              >
                Moje fiszki
              </a>
            </nav>
          )}
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {userEmail && (
            <>
              <span className="text-sm text-muted-foreground">{userEmail}</span>
              <Button variant="outline" size="sm" onClick={handleLogout} disabled={isLoggingOut}>
                {isLoggingOut ? "Wylogowywanie..." : "Wyloguj"}
              </Button>
            </>
          )}
        </div>
      </div>

      <AlertDialog open={showUnsavedDialog} onOpenChange={(open) => !open && handleCancelNavigation()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Niezapisane fiszki</AlertDialogTitle>
            <AlertDialogDescription>
              Masz niezapisane fiszki. Czy na pewno chcesz przejść do innej strony? Wszystkie niezapisane zmiany zostaną
              utracone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelNavigation}>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmNavigation}>Kontynuuj bez zapisywania</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}
