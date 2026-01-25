import { useState, useCallback } from "react";
import { Button } from "./ui/button";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  userEmail: string | null;
  currentPath?: string;
}

export function Header({ userEmail, currentPath = "/" }: HeaderProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <a href="/" className="text-xl font-bold hover:opacity-80 transition-opacity">
            10x Cards
          </a>
          {userEmail && (
            <nav className="flex items-center gap-1">
              <a
                href="/"
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                  currentPath === "/" ? "bg-accent text-accent-foreground" : ""
                }`}
                aria-current={currentPath === "/" ? "page" : undefined}
              >
                Generator fiszek
              </a>
              <a
                href="/my-flashcards"
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
    </header>
  );
}
