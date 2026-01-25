import type { AuthError } from "@supabase/supabase-js";

/**
 * Auth error codes from Supabase
 * @see https://supabase.com/docs/reference/javascript/auth-error-codes
 */
export enum AuthErrorCode {
  // Sign up errors
  USER_ALREADY_EXISTS = "user_already_exists",
  WEAK_PASSWORD = "weak_password",

  // Sign in errors
  INVALID_CREDENTIALS = "invalid_credentials",
  EMAIL_NOT_CONFIRMED = "email_not_confirmed",

  // Password reset errors
  INVALID_RECOVERY_TOKEN = "invalid_recovery_token",

  // General errors
  NETWORK_ERROR = "network_error",
  UNKNOWN_ERROR = "unknown_error",
}

/**
 * Maps Supabase auth errors to user-friendly Polish messages
 */
export function mapAuthError(error: AuthError | null): string | null {
  if (!error) return null;

  // Map based on error code (most reliable method)
  switch (error.code) {
    case "user_already_exists":
    case "23505": // PostgreSQL unique violation
      return "Ten email jest już zarejestrowany";

    case "weak_password":
      return "Hasło musi zawierać minimum 8 znaków, literę i cyfrę";

    case "invalid_credentials":
      return "Nieprawidłowy email lub hasło";

    case "email_not_confirmed":
      return "Aby się zalogować, musisz najpierw zweryfikować swój adres email. Sprawdź swoją skrzynkę pocztową i kliknij w link weryfikacyjny.";

    case "invalid_recovery_token":
    case "otp_expired":
      return "Link resetujący wygasł. Wygeneruj nowy";

    default:
      // Generic error message for unhandled cases
      return "Wystąpił błąd. Spróbuj ponownie";
  }
}

/**
 * Checks if an auth error is a specific type
 */
export function isAuthErrorType(error: AuthError | null, code: AuthErrorCode): boolean {
  if (!error) return false;

  switch (code) {
    case AuthErrorCode.USER_ALREADY_EXISTS:
      return error.code === "user_already_exists" || error.code === "23505";

    case AuthErrorCode.WEAK_PASSWORD:
      return error.code === "weak_password";

    case AuthErrorCode.INVALID_CREDENTIALS:
      return error.code === "invalid_credentials";

    case AuthErrorCode.EMAIL_NOT_CONFIRMED:
      return error.code === "email_not_confirmed";

    case AuthErrorCode.INVALID_RECOVERY_TOKEN:
      return error.code === "invalid_recovery_token" || error.code === "otp_expired";

    default:
      return false;
  }
}
