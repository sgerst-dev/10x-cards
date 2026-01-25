import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "./hooks/useAuth";
import { registerSchema } from "@/lib/schemas/auth.schema";
import { mapZodErrors } from "@/lib/utils";
import { mapAuthError, isAuthErrorType, AuthErrorCode } from "@/lib/utils/auth-errors";
import { ZodError } from "zod";

export function RegisterForm() {
  const { signUp, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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
      const validatedData = registerSchema.parse({ email, password, confirmPassword });

      setIsLoading(true);

      const { error: signUpError } = await signUp(validatedData.email, validatedData.password);

      if (signUpError) {
        // Map Supabase errors to user-friendly messages
        if (isAuthErrorType(signUpError, AuthErrorCode.WEAK_PASSWORD)) {
          setFieldErrors({ password: mapAuthError(signUpError) || "Hasło jest zbyt słabe" });
        } else {
          setError(mapAuthError(signUpError));
        }
        setIsLoading(false);
        return;
      }

      // Sign out the user immediately after registration
      // This prevents automatic login and redirect to /generate
      await signOut();

      // Successful registration
      setSuccess(true);
      setIsLoading(false);
    } catch (err) {
      if (err instanceof ZodError) {
        setFieldErrors(mapZodErrors(err));
      } else {
        setError("Wystąpił błąd. Spróbuj ponownie");
      }
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertDescription className="space-y-4">
            <p className="font-medium">Konto zostało pomyślnie utworzone! Możesz się teraz zalogować.</p>
          </AlertDescription>
        </Alert>

        <Button asChild className="w-full" size="lg">
          <a href="/auth/login">Przejdź do strony logowania</a>
        </Button>
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
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            clearErrors();
          }}
          disabled={isLoading}
          autoComplete="email"
          required
        />
        {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Hasło</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            clearErrors();
          }}
          disabled={isLoading}
          autoComplete="new-password"
          required
        />
        {fieldErrors.password ? (
          <p className="text-xs text-destructive">{fieldErrors.password}</p>
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
        {isLoading ? "Rejestracja..." : "Zarejestruj się"}
      </Button>

      <div className="text-center text-sm text-muted-foreground">
        Masz już konto?{" "}
        <a href="/auth/login" className="text-primary hover:underline font-medium">
          Zaloguj się
        </a>
      </div>
    </form>
  );
}
