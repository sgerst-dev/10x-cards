import { z } from "zod";

/**
 * Schemat walidacji dla emaila
 */
const emailSchema = z.string().email("Nieprawidłowy format adresu email").trim().toLowerCase();

/**
 * Schemat walidacji dla hasła
 */
const passwordSchema = z
  .string()
  .min(8, "Hasło musi zawierać minimum 8 znaków")
  .regex(/[a-zA-Z]/, "Hasło musi zawierać co najmniej jedną literę")
  .regex(/\d/, "Hasło musi zawierać co najmniej jedną cyfrę");

/**
 * Schemat walidacji dla hasła przy logowaniu (mniej restrykcyjny)
 */
const loginPasswordSchema = z.string().min(1, "Hasło jest wymagane");

/**
 * Schemat walidacji dla formularza logowania
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Schemat walidacji dla formularza rejestracji
 */
export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są identyczne",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Schemat walidacji dla formularza przypomnienia hasła
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

/**
 * Schemat walidacji dla formularza resetowania hasła
 */
export const resetPasswordSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Hasła nie są identyczne",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
