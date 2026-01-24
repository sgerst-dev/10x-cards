import { useState, useCallback } from "react";
import { Button } from "./ui/button";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  userEmail: string | null;
}

export function Header({ userEmail }: HeaderProps) {
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
          <a href={userEmail ? "/generate" : "/"} className="text-xl font-bold hover:opacity-80 transition-opacity">
            10x Cards
          </a>
          {userEmail && (
            <nav className="flex gap-4">
              <a href="/generate" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Generuj fiszki
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
