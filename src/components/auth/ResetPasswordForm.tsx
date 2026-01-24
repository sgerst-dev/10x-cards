import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "./hooks/useAuth";
import { resetPasswordSchema } from "@/lib/schemas/auth.schema";
import { mapZodErrors } from "@/lib/utils";
import { mapAuthError } from "@/lib/utils/auth-errors";
import { ZodError } from "zod";

export function ResetPasswordForm() {
  const { updatePassword } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hasValidToken, setHasValidToken] = useState(false);

  useEffect(() => {
    // Check if we have a valid recovery token in the URL
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get("type");
    const accessToken = hashParams.get("access_token");

    if (type === "recovery" && accessToken) {
      setHasValidToken(true);
    } else {
      setError("Link resetujący wygasł lub jest nieprawidłowy. Wygeneruj nowy.");
    }
  }, []);

  const clearErrors = () => {
    setError(null);
    setFieldErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    // Client-side validation with Zod
    try {
      const validatedData = resetPasswordSchema.parse({ newPassword, confirmPassword });

      setIsLoading(true);

      const { error: updateError } = await updatePassword(validatedData.newPassword);

      if (updateError) {
        setError(mapAuthError(updateError));
        setIsLoading(false);
        return;
      }

      // Successful password reset
      setSuccess(true);
      setIsLoading(false);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = "/auth/login";
      }, 2000);
    } catch (err) {
      if (err instanceof ZodError) {
        setFieldErrors(mapZodErrors(err));
      } else {
        setError("Wystąpił błąd. Spróbuj ponownie");
      }
      setIsLoading(false);
    }
  };

  if (!hasValidToken && error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>

        <Button asChild className="w-full" size="lg" variant="outline">
          <a href="/auth/forgot-password">Wyślij nowy link resetujący</a>
        </Button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertDescription className="space-y-4">
            <p className="font-medium">Hasło zostało zmienione. Możesz się teraz zalogować.</p>
            <p className="text-sm">Za chwilę zostaniesz przekierowany do strony logowania...</p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="newPassword">Nowe hasło</Label>
        <Input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value);
            clearErrors();
          }}
          disabled={isLoading}
          autoComplete="new-password"
          required
        />
        {fieldErrors.newPassword ? (
          <p className="text-xs text-destructive">{fieldErrors.newPassword}</p>
        ) : (
          <p className="text-xs text-muted-foreground">Minimum 8 znaków, co najmniej jedna litera i jedna cyfra</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Powtórz hasło</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            clearErrors();
          }}
          disabled={isLoading}
          autoComplete="new-password"
          required
        />
        {fieldErrors.confirmPassword && <p className="text-xs text-destructive">{fieldErrors.confirmPassword}</p>}
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
        {isLoading ? "Resetowanie..." : "Ustaw nowe hasło"}
      </Button>
    </form>
  );
}
