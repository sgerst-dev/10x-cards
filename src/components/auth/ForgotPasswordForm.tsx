import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "./hooks/useAuth";
import { forgotPasswordSchema } from "@/lib/schemas/auth.schema";
import { ZodError } from "zod";

export function ForgotPasswordForm() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const clearErrors = () => {
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation with Zod
    try {
      const validatedData = forgotPasswordSchema.parse({ email });

      setIsLoading(true);

      await resetPassword(validatedData.email);

      // Always show success message (even for non-existent emails) to prevent enumeration
      setSuccess(true);
      setIsLoading(false);
    } catch (err) {
      if (err instanceof ZodError) {
        setError(err.errors[0].message);
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
            <p className="font-medium">
              Jeśli podany email istnieje w systemie, wysłaliśmy na niego link do resetowania hasła.
            </p>
            <p className="text-sm">Sprawdź swoją skrzynkę pocztową i kliknij w link, aby ustawić nowe hasło.</p>
          </AlertDescription>
        </Alert>

        <Button asChild className="w-full" size="lg" variant="outline">
          <a href="/auth/login">Wróć do logowania</a>
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
        <p className="text-xs text-muted-foreground">Wyślemy Ci link do resetowania hasła na podany adres email</p>
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
        {isLoading ? "Wysyłanie..." : "Wyślij link resetujący"}
      </Button>

      <div className="text-center text-sm text-muted-foreground">
        Pamiętasz hasło?{" "}
        <a href="/auth/login" className="text-primary hover:underline font-medium">
          Zaloguj się
        </a>
      </div>
    </form>
  );
}
