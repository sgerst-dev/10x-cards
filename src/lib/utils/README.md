# Utils - Authentication Error Handling

## Overview

This directory contains utility functions for handling authentication errors in a type-safe and maintainable way.

## Auth Errors (`auth-errors.ts`)

### Problem

Previously, auth errors were handled using string matching with `.includes()`:

```typescript
// ❌ Bad: Fragile, error-prone
if (error.message.includes("User already registered")) {
  setError("Ten email jest już zarejestrowany");
}
```

**Issues with this approach:**

- Breaks if Supabase changes error messages
- No type safety
- Hard to maintain
- Inconsistent across components

### Solution

The new `auth-errors.ts` module provides:

1. **Error code-based detection** - reliable and consistent
2. **Type-safe enum** for error codes
3. **Centralized error mapping**
4. **Generic fallback** for unhandled errors

### Usage

#### Basic Error Mapping

```typescript
import { mapAuthError } from "@/lib/utils/auth-errors";

const { error } = await signIn(email, password);

if (error) {
  setError(mapAuthError(error)); // Returns Polish user-friendly message
}
```

#### Checking Specific Error Types

```typescript
import { isAuthErrorType, AuthErrorCode } from "@/lib/utils/auth-errors";

const { error } = await signUp(email, password);

if (error) {
  if (isAuthErrorType(error, AuthErrorCode.WEAK_PASSWORD)) {
    setFieldErrors({ password: mapAuthError(error) });
  } else {
    setError(mapAuthError(error));
  }
}
```

### Available Error Codes

```typescript
enum AuthErrorCode {
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
```

### API Reference

#### `mapAuthError(error: AuthError | null): string | null`

Maps Supabase auth errors to user-friendly Polish messages.

**Parameters:**

- `error` - Supabase AuthError object or null

**Returns:**

- User-friendly error message in Polish, or null if no error

**Example:**

```typescript
const errorMessage = mapAuthError(signUpError);
// Returns: "Ten email jest już zarejestrowany"
```

#### `isAuthErrorType(error: AuthError | null, code: AuthErrorCode): boolean`

Checks if an auth error matches a specific error type.

**Parameters:**

- `error` - Supabase AuthError object or null
- `code` - AuthErrorCode enum value to check against

**Returns:**

- `true` if error matches the specified type, `false` otherwise

**Example:**

```typescript
if (isAuthErrorType(error, AuthErrorCode.USER_ALREADY_EXISTS)) {
  // Handle duplicate user error
}
```

### Error Detection Strategy

The module uses error codes exclusively:

1. **Error Code Detection**
   - Uses Supabase error codes (e.g., `invalid_credentials`, `user_already_exists`)
   - Includes PostgreSQL error codes (e.g., `23505` for unique violation)
   - Returns generic error message for unhandled codes

**Why no message-based fallback?**

- Supabase always provides error codes
- Error codes are stable and reliable
- Message-based detection is fragile and unnecessary
- Simpler code is easier to maintain

### Extending the Module

To add a new error type:

1. Add the error code to `AuthErrorCode` enum
2. Add mapping in `mapAuthError()` switch statement
3. Add logic to `isAuthErrorType()` if needed

**Example:**

```typescript
// 1. Add to enum
enum AuthErrorCode {
  // ...
  RATE_LIMIT_EXCEEDED = "rate_limit_exceeded",
}

// 2. Add to mapAuthError
case "rate_limit_exceeded":
  return "Zbyt wiele prób. Spróbuj ponownie za chwilę";

// 3. Add to isAuthErrorType (if needed)
case AuthErrorCode.RATE_LIMIT_EXCEEDED:
  return error.code === "rate_limit_exceeded";
```

### Benefits

✅ **Type-safe**: Uses TypeScript enums and types  
✅ **Maintainable**: Centralized error handling logic  
✅ **Reliable**: Relies exclusively on stable error codes  
✅ **Simple**: No complex fallback logic  
✅ **Consistent**: Same error handling across all auth components  
✅ **User-friendly**: Polish error messages for better UX

### Migration Guide

**Before:**

```typescript
if (error.message.includes("User already registered")) {
  setError("Ten email jest już zarejestrowany");
} else if (error.message.includes("Invalid login credentials")) {
  setError("Nieprawidłowy email lub hasło");
} else {
  setError("Wystąpił błąd");
}
```

**After:**

```typescript
import { mapAuthError } from "@/lib/utils/auth-errors";

if (error) {
  setError(mapAuthError(error));
}
```

### Testing

To test error handling:

1. **User already exists**: Try registering with existing email
2. **Weak password**: Use password like "123"
3. **Invalid credentials**: Use wrong email/password
4. **Email not confirmed**: Register but don't confirm email
5. **Expired token**: Use old password reset link

### References

- [Supabase Auth Error Codes](https://supabase.com/docs/reference/javascript/auth-error-codes)
- [PostgreSQL Error Codes](https://www.postgresql.org/docs/current/errcodes-appendix.html)
