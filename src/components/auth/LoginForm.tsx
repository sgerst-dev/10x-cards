import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "./hooks/useAuth";
import { loginSchema } from "@/lib/schemas/auth.schema";
import { mapZodErrors } from "@/lib/utils";
import { mapAuthError } from "@/lib/utils/auth-errors";
import { ZodError } from "zod";

interface LoginFormProps {
  redirectTo?: string;
}

export function LoginForm({ redirectTo = "/" }: LoginFormProps) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

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
      const validatedData = loginSchema.parse({ email, password });

      setIsLoading(true);

      const { error: signInError } = await signIn(validatedData.email, validatedData.password);

      if (signInError) {
        // Map Supabase errors to user-friendly messages
        setError(mapAuthError(signInError));
        setIsLoading(false);
        return;
      }

      // Successful login - redirect
      window.location.href = redirectTo;
    } catch (err) {
      if (err instanceof ZodError) {
        setFieldErrors(mapZodErrors(err));
      } else {
        setError("Wystąpił błąd. Spróbuj ponownie");
      }
      setIsLoading(false);
    }
  };

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
          autoComplete="current-password"
          required
        />
        {fieldErrors.password && <p className="text-xs text-destructive">{fieldErrors.password}</p>}
      </div>

      <div className="flex items-center justify-end">
        <a href="/auth/forgot-password" className="text-sm text-primary hover:underline">
          Zapomniałeś hasła?
        </a>
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
        {isLoading ? "Logowanie..." : "Zaloguj się"}
      </Button>

      <div className="text-center text-sm text-muted-foreground">
        Nie masz konta?{" "}
        <a href="/auth/register" className="text-primary hover:underline font-medium">
          Zarejestruj się
        </a>
      </div>
    </form>
  );
}
